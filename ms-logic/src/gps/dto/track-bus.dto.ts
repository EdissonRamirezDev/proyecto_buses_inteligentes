import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class TrackBusDto {
  @IsString()
  @IsNotEmpty()
  routeId: string;

  @IsString()
  @IsOptional()
  busStopId?: string; // Paradero del usuario para calcular ETA
}
