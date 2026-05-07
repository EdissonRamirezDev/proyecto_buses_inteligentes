import { IsString, IsNotEmpty, IsNumber, IsOptional, IsLatitude, IsLongitude } from 'class-validator';

export class CreateBusStopDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsNumber()
  @IsLatitude()
  latitud: number;

  @IsNumber()
  @IsLongitude()
  longitud: number;

  @IsString()
  @IsOptional()
  tipo?: string;

  @IsString()
  @IsOptional()
  sentido?: string;
}
