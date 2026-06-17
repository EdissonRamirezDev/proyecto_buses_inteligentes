import { IsString, IsEmail, IsEnum, MaxLength, IsOptional, IsArray } from 'class-validator';
import { PqrsType, PqrsCategory } from '../entities/pqrs.entity';

export class CreatePqrsDto {
  @IsEnum(PqrsType)
  tipo: PqrsType;

  @IsEnum(PqrsCategory)
  categoria: PqrsCategory;

  @IsString()
  @MaxLength(500)
  descripcion: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fotos?: string[];
}
