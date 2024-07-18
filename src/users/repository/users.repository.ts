import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { BaseRepository } from 'src/core/repository/base.repository';
import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable({ scope: Scope.REQUEST })
export class UsersRepository extends BaseRepository {
    constructor(dataSource: DataSource, @Inject(REQUEST) req: Request) {
        super(dataSource, req);
    }

    async createUser(user: User) {
        return await this.getRepository<User>(User).save(user);
    }
}