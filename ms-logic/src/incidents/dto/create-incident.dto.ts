import { IsString, IsNotEmpty, IsEnum, IsOptional, IsArray } from 'class-validator';

export class CreateIncidentDto {
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @IsEnum(['MECANICO', 'ACCIDENTE', 'CONGESTION', 'PASAJERO', 'OTRO'])
  categoria: string;

  @IsString()
  @IsNotEmpty()
  shiftId: string; // El turno activo del conductor

  @IsOptional()
  @IsArray()
  photos?: string[]; // URLs de fotos

  @IsOptional()
  busId?: string; // Por si se quiere asociar un bus adicional
}
