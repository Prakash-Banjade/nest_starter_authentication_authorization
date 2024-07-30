import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { CaslModule } from 'src/casl/casl.module';
import { UsersRepository } from './repository/users.repository';
import { Account } from 'src/accounts/entities/account.entity';
import { ImagesModule } from 'src/images/images.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Account
    ]),
    ImagesModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService, UsersRepository],
})
export class UsersModule { }
