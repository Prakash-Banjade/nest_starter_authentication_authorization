import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { CaslModule } from 'src/casl/casl.module';
import { UsersRepository } from './repository/users.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User
    ]),
    CaslModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
})
export class UsersModule { }
