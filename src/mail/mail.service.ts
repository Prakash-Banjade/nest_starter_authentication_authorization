import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/users/entities/user.entity';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
    constructor(
        private mailerService: MailerService,
        private readonly configService: ConfigService
    ) { }

    async sendUserCredentials(user: User, password: string) {
        const result = await this.mailerService.sendMail({
            to: user.email,
            subject: 'Welcome to NestJS Starter ! Confirm your Email',
            template: './sendUserCredentials', // `.hbs` extension is appended automatically | NOTE: update compilerOption in nest-cli.json
            context: { // ✏️ filling curly brackets with content
                name: user.name,
                email: user.email,
                password,
            },
        });

        const previewUrl = nodemailer.getTestMessageUrl(result);
        console.log('Preview URL:', previewUrl);

        return result;
    }

    async sendResetPasswordLink(user: User, resetToken: string) {
        const result = await this.mailerService.sendMail({
            to: user.email,
            subject: 'Reset your password',
            template: './sendResetPasswordLink', // `.hbs` extension is appended automatically
            context: { // ✏️ filling curly brackets with content
                name: user.name,
                resetLink: `${this.configService.get('CLIENT_URL')}/reset-password/${resetToken}`,
            },
        });

        const previewUrl = nodemailer.getTestMessageUrl(result);
        console.log('Preview URL:', previewUrl);

        return { result, previewUrl };
    }
}