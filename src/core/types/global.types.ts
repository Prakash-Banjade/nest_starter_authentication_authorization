export enum Roles {
    ADMIN = 'admin',
    MODERATOR = 'moderator',
    USER = 'user',
}

export interface AuthUser {
    userId: string;
    accountId: string;
    name: string;
    email: string;
    role: Roles;
}

export enum Action {
    MANAGE = 'manage',
    CREATE = 'create',
    READ = 'read',
    UPDATE = 'update',
    DELETE = 'delete',
    RESTORE = 'restore',
}

export enum AuthProvider {
    GOOGLE = 'google',
    CREDENTIALS = 'credentials',
}

export enum Gender {
    MALE = 'male',
    FEMALE = 'female',
    OTHER = 'other',
}