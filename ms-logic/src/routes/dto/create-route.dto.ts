import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, IsArray } from 'class-validator';

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

  @IsNumber()
  @IsOptional()
  inicio_lat?: number;

  @IsNumber()
  @IsOptional()
  inicio_lng?: number;

  @IsString()
  @IsOptional()
  inicio_nombre?: string;

  @IsNumber()
  @IsOptional()
  fin_lat?: number;

  @IsNumber()
  @IsOptional()
  fin_lng?: number;

  @IsString()
  @IsOptional()
  fin_nombre?: string;

  @IsArray()
  @IsOptional()
  inicio_via_points?: [number, number][];
}
