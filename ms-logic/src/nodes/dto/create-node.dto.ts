import { IsArray, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateNodeDto {
  @IsNumber()
  @Min(1)
  orden: number;

  @IsNumber()
  @Min(0)
  distancia_anterior: number;

  @IsNumber()
  @Min(0)
  tiempo_estimado: number;

  @IsUUID()
  routeId: string;

  @IsUUID()
  busStopId: string;

  @IsArray()
  @IsOptional()
  via_points?: [number, number][];
}
