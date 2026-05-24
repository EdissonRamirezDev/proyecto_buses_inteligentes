import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateDriverDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    last_name?: string;

    @IsString()
    @IsOptional()
    license?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    status?: string;

    @IsOptional()
    @IsString()
    personId?: string;
}

