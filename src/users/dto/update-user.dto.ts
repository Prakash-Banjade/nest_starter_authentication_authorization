import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';
import { MemoryStoredFile } from 'nestjs-form-data';

export class UpdateUserDto {
    @ApiPropertyOptional({ type: 'string', description: 'Name' })
    @IsString()
    @IsOptional()
    name: string;

    @ApiPropertyOptional({ type: 'string', description: 'Email' })
    @IsEmail()
    @IsOptional()
    email: string;

    @ApiPropertyOptional({ type: 'string', format: 'binary', description: 'Profile Image' })
    @IsString()
    @IsOptional()
    image: string | MemoryStoredFile
}
