import { IsEmail, IsNotEmpty } from "class-validator";

export class PasswordChangeRequestDto {
    @IsNotEmpty()
    @IsEmail()
    email!: string;
}