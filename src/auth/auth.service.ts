import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { SignInDto } from './dto/signIn.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { v4 as uuidv4 } from 'uuid';
require('dotenv').config()

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User) private usersRepository: Repository<User>,
        private jwtService: JwtService
    ) { }

    async signIn(signInDto: SignInDto) {
        const foundUser = await this.usersRepository.findOneBy({ email: signInDto.email });

        if (!foundUser) throw new BadRequestException('User with this email does not exist');

        const isPasswordValid = await bcrypt.compare(signInDto.password, foundUser.password);

        if (!isPasswordValid) throw new BadRequestException('Invalid password');

        const payload = { email: foundUser.email, userId: foundUser.id, name: foundUser.name };

        const access_token = await this.createAccessToken(payload);

        const refresh_token = await this.createRefreshToken(foundUser.id);

        await this.usersRepository.update(foundUser.id, { refresh_token }); // save refresh token in db

        return { access_token, refresh_token }
    }

    async createAccessToken(payload: { email: string, userId: string }) {
        return await this.jwtService.signAsync(payload, { expiresIn: '20s', secret: process.env.ACCESS_TOKEN_SECRET });
    }

    async createRefreshToken(userId: string) {
        const tokenId = uuidv4();
        return await this.jwtService.signAsync({ id: userId, tokenId: tokenId }, { expiresIn: '7d', secret: process.env.REFRESH_TOKEN_SECRET });
    }

    async register(registerDto: RegisterDto) {
        const foundUser = await this.usersRepository.findOneBy({ email: registerDto.email });

        if (foundUser) throw new BadRequestException('User with this email already exists');

        const createdUser = this.usersRepository.create(registerDto)

        return await this.usersRepository.save(createdUser);
    }

    async refresh(refresh_token: string) {
        const decoded = await this.jwtService.verifyAsync(refresh_token, { secret: process.env.REFRESH_TOKEN_SECRET });

        if (!decoded) throw new BadRequestException('Invalid refresh token');

        const foundUser = await this.usersRepository.findOneBy({ id: decoded.id, refresh_token });

        if (!foundUser) throw new ForbiddenException('User not found');

        const payload = { email: foundUser.email, userId: foundUser.id, name: foundUser.name };

        const access_token = await this.createAccessToken(payload);

        return { access_token }
    }
}
