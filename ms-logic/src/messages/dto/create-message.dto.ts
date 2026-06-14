import { IsString, IsOptional, IsArray, IsNumber, MaxLength, IsNotEmpty } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  emisor_id: string;

  @IsString()
  @IsOptional()
  destinatario_id?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  grupos_id?: string[];

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  contenido: string;

  @IsNumber()
  @IsOptional()
  latitud?: number;

  @IsNumber()
  @IsOptional()
  longitud?: number;
}
