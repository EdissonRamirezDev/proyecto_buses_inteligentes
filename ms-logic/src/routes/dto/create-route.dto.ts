import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateRouteDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsNumber()
  @Min(0)
  tarifa: number;

  @IsString()
  @IsOptional()
  color_hex?: string;

  @IsOptional()
  is_active?: boolean;
}
