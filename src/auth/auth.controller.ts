import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/signIn.dto';
import { CookieOptions, Request, Response } from 'express';
import { RegisterDto } from './dto/register.dto';
import { ApiTags } from '@nestjs/swagger';
import { Public } from 'src/decorators/setPublicRoute.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    cookieOptions: CookieOptions = {
        httpOnly: true,
        secure: false,
        sameSite: 'lax'
    }

    @Public()
    @HttpCode(HttpStatus.OK)
    @Post('login')
    async signIn(@Body() signInDto: SignInDto, @Res({ passthrough: true }) res: Response) {
        const { access_token, refresh_token } = await this.authService.signIn(signInDto);

        res.cookie('refresh_token', refresh_token, {
            ...this.cookieOptions,
            expires: new Date(Date.now() + 7 * 24 * 60 * 1000), // after 7 day
        });

        return { access_token };
    }

    @Public()
    @Post('refresh')
    async refreshToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        const refresh_token = req.cookies.refresh_token;
        if (!refresh_token) throw new UnauthorizedException('No refresh token provided');

        return this.authService.refresh(refresh_token);
    }

    @Public()
    @Post('register')
    async register(@Body() registerDto: RegisterDto) {
        return await this.authService.register(registerDto);
    }

    @Post('logout')
    @HttpCode(HttpStatus.NO_CONTENT)
    logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        const refresh_token = req.cookies.refresh_token;
        if (!refresh_token) return;

        res.clearCookie('refresh_token', this.cookieOptions);
        return;
    }
}
