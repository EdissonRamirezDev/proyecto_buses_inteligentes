import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateCitizenDto {
  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsNotEmpty()
  nombres: string;

  @IsString()
  @IsNotEmpty()
  apellidos: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsString()
  @IsOptional()
  direccion?: string;

  @IsString()
  @IsOptional()
  fecha_nacimiento?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  saldo?: number;

  @IsOptional()
  weatherAlertsEnabled?: boolean;

  @IsString()
  @IsOptional()
  habitualTravelTime?: string;
}
