import { IsString, IsEmail, IsBoolean, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateAdvisorDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
