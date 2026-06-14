import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsArray, ArrayMinSize } from 'class-validator';

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(2, { message: 'Debe añadir al menos 2 miembros adicionales al grupo' })
  memberIds: string[];
}
