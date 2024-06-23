import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { PasswordChangeRequest } from './entities/password-change-request.dto';
require('dotenv').config();

@Module({
  imports: [
    TypeOrmModule.forFeature([User, PasswordChangeRequest]),
    JwtModule.register({
      global: true,
      secret: process.env.ACCESS_TOKEN_SECRET!,
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
  ]
})
export class AuthModule { }
