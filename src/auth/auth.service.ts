import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Like, Repository } from 'typeorm';
import { SignInDto } from './dto/signIn.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { v4 as uuidv4 } from 'uuid';
import { CookieOptions, Request, Response } from 'express';
import { AuthProvider, AuthUser } from 'src/core/types/global.types';
import { Account } from 'src/accounts/entities/account.entity';
import { User } from 'src/users/entities/user.entity';
import { AccountsRepository } from 'src/accounts/repository/account.repository';
import crypto from 'crypto'
import { PasswordChangeRequest } from './entities/password-change-request.entity';
import { MailService } from 'src/mail/mail.service';
import { EmailVerificationPending } from './entities/email-verification-pending.entity';
import { AuthRepository } from './repository/auth.repository';
import { EmailVerificationDto } from './dto/email-verification.dto';
import { ChangePasswordDto } from './dto/changePassword.dto';
import { generateOtp } from 'src/core/utils/generateOPT';
import { UsersRepository } from 'src/users/repository/users.repository';
import { Credentials, OAuth2Client } from 'google-auth-library';
import { GoogleOAuthDto } from './dto/googleOAuth.dto';
import { Image } from 'src/images/entities/image.entity';
import { ImagesService } from 'src/images/images.service';
require('dotenv').config();

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Account) private accountsRepo: Repository<Account>,
    @InjectRepository(User) private usersRepo: Repository<User>,
    private jwtService: JwtService,
    private userRepository: UsersRepository,
    private accountRepository: AccountsRepository,
    private authRepository: AuthRepository,
    @InjectRepository(PasswordChangeRequest) private passwordChangeRequestRepo: Repository<PasswordChangeRequest>,
    @InjectRepository(EmailVerificationPending) private emailVerificationPendingRepo: Repository<EmailVerificationPending>,
    private readonly mailService: MailService,
    private readonly imagesService: ImagesService,
  ) { }

  private readonly clientId = process.env.GOOGLE_CLIENT_ID;
  private readonly clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  private readonly redirectUri = process.env.GOOGLE_REDIRECT_URI
  private readonly oAuth2Client = new OAuth2Client(this.clientId, this.clientSecret, this.redirectUri);

  async signIn(signInDto: SignInDto, req: Request, res: Response, cookieOptions: CookieOptions) {
    const refresh_token = req.cookies?.refresh_token;

    const foundAccount = await this.accountsRepo.findOne({
      where: {
        email: signInDto.email,
        isVerified: true,
      },
      relations: {
        user: true,
      }
    });

    if (!foundAccount)
      throw new UnauthorizedException(
        'This email is not registered or unverified',
      );

    const isPasswordValid = await bcrypt.compare(
      signInDto.password,
      foundAccount.password,
    );

    if (!isPasswordValid) throw new BadRequestException('Invalid password');

    const payload: AuthUser = {
      email: foundAccount.email,
      accountId: foundAccount.id,
      userId: foundAccount.user.id,
      name: foundAccount.firstName + ' ' + foundAccount.lastName,
      role: foundAccount.role,
    };

    const access_token = await this.createAccessToken(payload);
    const new_refresh_token = await this.createRefreshToken(payload);

    const newRefreshTokenArray = !refresh_token ? (foundAccount.refresh_token ?? []) : (foundAccount?.refresh_token?.filter((rt) => rt !== refresh_token) ?? [])
    if (refresh_token) res.clearCookie('refresh_token', cookieOptions); // CLEAR COOKIE, BCZ A NEW ONE IS TO BE GENERATED

    foundAccount.refresh_token = [...newRefreshTokenArray, new_refresh_token];

    await this.accountsRepo.save(foundAccount);

    return { access_token, new_refresh_token, payload };
  }

  async googleOAuthLogin(googleOAuthDto: GoogleOAuthDto, req: Request, res: Response, cookieOptions: CookieOptions) {
    const refresh_token = req.cookies?.refresh_token;
    if (refresh_token) res.clearCookie('refresh_token', cookieOptions); // CLEAR COOKIE, BCZ A NEW ONE IS TO BE GENERATED

    const { code } = googleOAuthDto;

    const { tokens } = await this.oAuth2Client.getToken(code); // exchange code for tokens

    const { email, family_name, given_name, picture, email_verified } = await this.getGoogleUser(tokens);
    if (!email_verified) throw new BadRequestException('Email not verified');

    // SEARCH FOR THE ACCOUNT IN DB
    const foundAccount = await this.accountsRepo.findOne({
      where: { email },
      relations: { user: true }
    });
    let payload: AuthUser;
    let access_token: string;
    let new_refresh_token: string;

    // IF NOT FOUND, CREATE A NEW ACCOUNT
    if (!foundAccount) {
      const newAccount = this.accountsRepo.create({
        email,
        firstName: given_name,
        lastName: family_name ?? '',
        provider: AuthProvider.GOOGLE,
        isVerified: email_verified,
        password: null,
      })

      const savedAccount = await this.accountRepository.insert(newAccount);

      // save image in db
      const image = picture ? await this.imagesService.saveImageFromUrl(picture) : null;

      const newUser = this.usersRepo.create({
        account: savedAccount,
        profileImage: image,
      })

      const savedUser = await this.userRepository.createUser(newUser);

      payload = {
        email: savedAccount.email,
        accountId: savedAccount.id,
        userId: savedUser.id,
        name: savedAccount.firstName,
        role: savedAccount.role,
      }

      // GENERATE TOKENS WITH ABOVE PAYLOAD
      access_token = await this.createAccessToken(payload);
      new_refresh_token = await this.createRefreshToken(payload);

      savedAccount.refresh_token = [new_refresh_token];
      await this.accountRepository.insert(savedAccount);

    } else {
      payload = {
        email: foundAccount.email,
        userId: foundAccount.user.id,
        accountId: foundAccount.id,
        name: foundAccount.firstName + ' ' + foundAccount.lastName,
        role: foundAccount.role,
      }

      // GENERATE TOKENS WITH ABOVE PAYLOAD
      access_token = await this.createAccessToken(payload);
      new_refresh_token = await this.createRefreshToken(payload);

      const newRefreshTokenArray = !refresh_token ? (foundAccount.refresh_token ?? []) : (foundAccount?.refresh_token?.filter((rt) => rt !== refresh_token) ?? [])

      foundAccount.refresh_token = [...newRefreshTokenArray, new_refresh_token];

      await this.accountRepository.insert(foundAccount);
    }

    return { access_token, new_refresh_token, payload };
  }

  private async getGoogleUser(tokens: Credentials) {
    const loginTicket = await this.oAuth2Client.verifyIdToken({ idToken: tokens.id_token, audience: process.env.GOOGLE_CLIENT_ID });
    return loginTicket.getPayload()
  }

  async createAccessToken(payload: AuthUser) {
    return await this.jwtService.signAsync(payload, {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRATION!,
      secret: process.env.ACCESS_TOKEN_SECRET!,
    });
  }

  async createRefreshToken(payload: Pick<AuthUser, 'accountId'>) {
    const tokenId = uuidv4();
    return await this.jwtService.signAsync(
      { accountId: payload.accountId, tokenId: tokenId },
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION!, secret: process.env.REFRESH_TOKEN_SECRET },
    );
  }

  async register(registerDto: RegisterDto) {
    const foundAccount = await this.accountsRepo.findOneBy({
      email: registerDto.email,
    });

    if (foundAccount && foundAccount.isVerified) throw new ConflictException('User with this email already exists');

    let account: Account;

    if (foundAccount && !foundAccount.isVerified) { // same user can register multiple times without verifying, instead of creating new, use existing
      const hashedPassword = await bcrypt.hash(registerDto.password, 10);
      const newAccount = Object.assign(foundAccount, {
        ...registerDto,
        password: hashedPassword,
      });
      account = await this.accountRepository.insert(newAccount);
      await this.authRepository.removeVerificationEmailPending(foundAccount.email); // remove email_verification_pending if exist
    } else {
      const newAccount = this.accountsRepo.create(registerDto);
      account = await this.accountRepository.insert(newAccount); // ensure transaction
    }

    const otp = generateOtp();
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedVerificationToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');

    const emailVerificationPending = this.emailVerificationPendingRepo.create({
      email: account.email,
      otp: String(otp),
      hashedVerificationToken,
    });

    await this.authRepository.saveVerificationEmailPending(emailVerificationPending);

    const { previewUrl } = await this.mailService.sendEmailVerificationOtp(account, otp, verificationToken);

    return {
      message: 'OTP is valid for 30 hours',
      verificationToken,
      previewUrl,
    }
  }

  async verifyEmail({ verificationToken: token, otp }: EmailVerificationDto) {
    // CHECK IF TOKEN IS VALID
    const hashedVerificationToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    const foundRequest = await this.emailVerificationPendingRepo.findOneBy({ hashedVerificationToken });
    if (!foundRequest) throw new BadRequestException('Invalid token');

    // CHECK IF OTP IS VALID
    const isOtpValid = bcrypt.compareSync(String(otp), foundRequest.otp);
    if (!isOtpValid) throw new BadRequestException('Invalid OTP');

    // CHECI IF TOKEN HAS EXPIRED
    const now = new Date();
    const otpExpiration = new Date(foundRequest.createdAt);
    otpExpiration.setMinutes(otpExpiration.getMinutes() + 30); // 30 minutes
    if (now > otpExpiration) {
      await this.authRepository.removeVerificationEmailPending(foundRequest.email); // remove from database
      throw new BadRequestException('OTP has expired');
    }

    // GET ACCOUNT FROM DATABASE
    const foundAccount = await this.accountsRepo.findOneBy({ email: foundRequest.email });
    if (!foundAccount) throw new NotFoundException('Account not found');

    foundAccount.isVerified = true;
    const savedAccount = await this.accountRepository.insert(foundAccount);

    const newUser = this.usersRepo.create({
      account: savedAccount,
    });

    const savedUser = await this.userRepository.createUser(newUser);

    await this.authRepository.removeVerificationEmailPending(foundRequest.email); // remove from database

    return {
      message: 'Account Created Successfully',
      account: {
        email: savedAccount.email,
        name: savedAccount.firstName + ' ' + savedAccount.lastName,
      },
    };
  }

  async refresh(refresh_token: string) { // IMPLEMENTING REFRESH TOKEN RORATION WITH REUSE DETECTION
    // Is refresh token in db?
    const foundAccount = await this.accountsRepo.findOne({
      where: { refresh_token: Like(`%${refresh_token}%`) },
      relations: {
        user: true
      }
    });

    if (!foundAccount) {
      // verifying the refresh token
      const decoded = await this.jwtService.verifyAsync(refresh_token, {
        secret: process.env.REFRESH_TOKEN_SECRET,
      });
      if (!decoded) throw new ForbiddenException(); // INVALID REFRESH TOKEN, NO PROBLEM, JUST LOGOUT AND LOGIN AGAIN

      // DETECTED REUSE DETECTION: at this point, an account is hacked and we need to logout the account from all devices
      const hackedAccount = await this.accountsRepo.findOne({
        where: {
          id: decoded.accountId,
        }
      })
      hackedAccount.refresh_token = [];
      await this.accountRepository.insert(hackedAccount);

    }

    // here the refresh token is valid and not reused
    const newRefreshTokenArray = foundAccount?.refresh_token.filter((rt) => rt !== refresh_token) ?? [];

    const decoded = await this.jwtService.verifyAsync(refresh_token, {
      secret: process.env.REFRESH_TOKEN_SECRET,
    });

    if (!decoded) { // this means the refresh token may have been expired but is valid bcz invalid token are not saved in db
      foundAccount.refresh_token = [...newRefreshTokenArray]
      await this.accountRepository.insert(foundAccount);
    }

    // create new access token & refresh token
    const payload: AuthUser = {
      email: foundAccount.email,
      accountId: foundAccount.id,
      userId: foundAccount.user.id,
      name: foundAccount.firstName + ' ' + foundAccount.lastName,
      role: foundAccount.role,
    };

    const new_access_token = await this.createAccessToken(payload);
    const new_refresh_token = await this.createRefreshToken(payload);

    // saving refresh_token with current user
    foundAccount.refresh_token = [...newRefreshTokenArray, new_refresh_token];
    await this.accountsRepo.save(foundAccount);

    return {
      new_access_token,
      new_refresh_token,
      payload,
    };
  }

  async changePassword(changePasswordDto: ChangePasswordDto, currentUser: AuthUser) {
    const foundAccount = await this.accountsRepo.findOneBy({ email: currentUser.email });
    if (!foundAccount) throw new NotFoundException('Account not found');

    const isPasswordValid = await bcrypt.compare(changePasswordDto.oldPassword, foundAccount.password);
    if (!isPasswordValid) throw new BadRequestException('Invalid password');

    // CHECKING IF THE NEW PASSWORD IS THE SAME AS THE OLD ONE
    const samePassword = await bcrypt.compare(changePasswordDto.newPassword, foundAccount.password);
    if (samePassword) throw new BadRequestException('New password cannot be the same as the old one');

    foundAccount.password = await bcrypt.hash(changePasswordDto.newPassword, 10);
    await this.accountRepository.insert(foundAccount);

    return {
      message: 'Password changed successfully',
    }
  }

  async logout(
    refresh_token: string,
  ) {
    // Is refresh token in db?
    const foundAccount = await this.accountsRepo.findOne({
      where: { refresh_token: Like(`%${refresh_token}%`) },
    });

    if (foundAccount) {
      // delete refresh token in db
      foundAccount.refresh_token = foundAccount?.refresh_token.filter((rt) => rt !== refresh_token);;
      await this.accountRepository.insert(foundAccount);
    }

  }

  async forgetPassword(email: string) {
    const foundAccount = await this.accountsRepo.findOneBy({ email });
    if (!foundAccount) throw new NotFoundException('Account not found');

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // existing request
    const existingRequest = await this.passwordChangeRequestRepo.findOneBy({ email });
    if (existingRequest) {
      await this.passwordChangeRequestRepo.remove(existingRequest);
    }

    const passwordChangeRequest = this.passwordChangeRequestRepo.create({
      email: foundAccount.email,
      hashedResetToken,
    });
    await this.passwordChangeRequestRepo.save(passwordChangeRequest);

    const { previewUrl } = await this.mailService.sendResetPasswordLink(foundAccount, resetToken);
    return {
      message: 'Token is valid for 5 minutes',
      previewUrl,
    };
  }

  async verifyResetToken(providedResetToken: string) {
    // hash the provided token to check in database
    const hashedResetToken = crypto
      .createHash('sha256')
      .update(providedResetToken)
      .digest('hex');

    // Retrieve the hashed reset token from the database
    const passwordChangeRequest = await this.passwordChangeRequestRepo.findOneBy({ hashedResetToken });

    if (!passwordChangeRequest) {
      throw new BadRequestException('Invalid reset token');
    }

    // Check if the reset token has expired
    const now = new Date();
    const resetTokenExpiration = new Date(passwordChangeRequest.createdAt);
    resetTokenExpiration.setMinutes(resetTokenExpiration.getMinutes() + 5); // 5 minutes
    if (now > resetTokenExpiration) {
      await this.passwordChangeRequestRepo.remove(passwordChangeRequest);
      throw new BadRequestException('Reset token has expired');
    }

    return {
      message: 'Token is valid for now',
      valid: true,
    }
  }

  async resetPassword(password: string, providedResetToken: string) {
    // hash the provided token to check in database
    const hashedResetToken = crypto
      .createHash('sha256')
      .update(providedResetToken)
      .digest('hex');

    // Retrieve the hashed reset token from the database
    const passwordChangeRequest = await this.passwordChangeRequestRepo.findOneBy({ hashedResetToken });

    if (!passwordChangeRequest) {
      throw new BadRequestException('Invalid reset token');
    }

    // Check if the reset token has expired
    const now = new Date();
    const resetTokenExpiration = new Date(passwordChangeRequest.createdAt);
    resetTokenExpiration.setMinutes(resetTokenExpiration.getMinutes() + 5); // 5 minutes
    if (now > resetTokenExpiration) {
      await this.passwordChangeRequestRepo.remove(passwordChangeRequest);
      throw new BadRequestException('Reset token has expired');
    }

    // retrieve the user from the database
    const user = await this.accountsRepo.findOneBy({ email: passwordChangeRequest.email });
    if (!user) throw new InternalServerErrorException('The requested User was not available in the database.');

    // check if the new password is the same as the old one
    const samePassword = await bcrypt.compare(password, user.password);
    if (samePassword) {
      throw new BadRequestException('New password cannot be the same as the old one');
    }

    // hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // update the user password
    user.password = hashedPassword;
    await this.accountsRepo.save(user);

    // clear the reset token from the database
    await this.passwordChangeRequestRepo.remove(passwordChangeRequest);

    // Return success response
    return { message: 'Password reset successful' };
  }
}
