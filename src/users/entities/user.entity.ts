import { BaseEntity } from "src/core/entities/base.entity";
import { BeforeInsert, BeforeUpdate, Column, Entity } from "typeorm";
import * as bcrypt from 'bcrypt';
import { Roles } from "src/core/types/global.types";

@Entity()
export class User extends BaseEntity {
    @Column({ type: 'varchar' })
    name: string;

    @Column({ type: 'varchar' })
    email: string;

    @Column({ type: 'varchar' })
    password: string;

    @Column({ type: 'enum', enum: Roles, default: Roles.USER })
    role: Roles;

    @Column({ type: 'varchar', nullable: true })
    image: string;

    @Column({ type: 'boolean', default: false })
    isDonor: boolean;

    // TODO: Define donor

    @Column({ type: 'varchar', nullable: true })
    refresh_token: string;

    @BeforeInsert()
    hashPassword() {
        if (!this.password) throw new Error('Password required');

        this.password = bcrypt.hashSync(this.password, 10);
    }

    @BeforeInsert()
    @BeforeUpdate()
    validateEmail() {
        if (!this.email) throw new Error('Email required');

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(this.email)) throw new Error('Invalid email');
    }

}
