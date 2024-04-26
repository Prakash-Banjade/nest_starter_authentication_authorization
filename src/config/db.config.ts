import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';
require('dotenv').config();

const configService: TypeOrmModuleOptions = {
    type: 'mysql',
    url: process.env.DATABASE_URL!,

    entities: [join(__dirname, '**', '*.entity.{ts,js}')],

    migrationsTableName: 'migration',

    migrations: ['src/migration/*.ts'],

    autoLoadEntities: true,
    synchronize: false,
};

export { configService };
