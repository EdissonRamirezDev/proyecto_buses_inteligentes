import { IsBoolean, IsDateString, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateScheduleDto {
  @IsDateString()
  fecha: string;

  @IsString()
  hora_salida: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  tolerancia_minutos?: number;

  @IsBoolean()
  @IsOptional()
  es_recurrente?: boolean;

  @IsString()
  @IsOptional()
  tipo_recurrencia?: string;

  @IsString()
  @IsOptional()
  estado?: string;

  @IsUUID()
  routeId: string;

  @IsNumber() // Bus ID es number en la entidad
  busId: number;
}
