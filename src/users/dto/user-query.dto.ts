import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional } from "class-validator";
import { QueryDto } from "src/core/dto/query.dto";
import { Gender, Roles } from "src/core/types/global.types";

export class UsersQueryDto extends QueryDto {
    @ApiPropertyOptional({ type: 'string', required: false })
    @IsOptional()
    phone?: string;

    @ApiPropertyOptional({ type: 'enum', enum: Gender })
    @IsOptional()
    gender?: Gender;

    @ApiPropertyOptional({ type: 'string', required: false })
    @IsOptional()
    dob?: string;

    @ApiPropertyOptional({ type: 'enum', enum: Roles })
    @IsOptional()
    role: Roles
}