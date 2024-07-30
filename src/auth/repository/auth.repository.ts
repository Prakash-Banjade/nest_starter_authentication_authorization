import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { BaseRepository } from 'src/core/repository/base.repository';
import { DataSource } from 'typeorm';
import { EmailVerificationPending } from '../entities/email-verification-pending.entity';

@Injectable({ scope: Scope.REQUEST })
export class AuthRepository extends BaseRepository {
    constructor(dataSource: DataSource, @Inject(REQUEST) req: Request) {
        super(dataSource, req);
    }

    async saveVerificationEmailPending(emailVerificationPending: EmailVerificationPending) {
        return await this.getRepository<EmailVerificationPending>(EmailVerificationPending).save(emailVerificationPending);
    }

    async removeVerificationEmailPending(email: string) {
        return await this.getRepository<EmailVerificationPending>(EmailVerificationPending).delete({ email });
    }
}