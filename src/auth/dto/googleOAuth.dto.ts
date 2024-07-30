import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class GoogleOAuthDto {
    @IsString()
    @IsNotEmpty()
    code: string
}