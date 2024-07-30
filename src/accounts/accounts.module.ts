import { Module } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { AccountsController } from './accounts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './entities/account.entity';
import { AccountsRepository } from './repository/account.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Account]),
  ],
  controllers: [AccountsController],
  providers: [AccountsService, AccountsRepository],
  exports: [AccountsRepository, AccountsService],
})
export class AccountsModule { }
