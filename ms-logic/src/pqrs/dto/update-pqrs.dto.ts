import { IsString, IsEnum, IsOptional } from 'class-validator';
import { PqrsStatus } from '../entities/pqrs.entity';

export class UpdatePqrsDto {
  @IsOptional()
  @IsString()
  radicado?: string;

  @IsOptional()
  @IsEnum(PqrsStatus)
  estado?: PqrsStatus;

  @IsOptional()
  @IsString()
  respuesta?: string;
}
