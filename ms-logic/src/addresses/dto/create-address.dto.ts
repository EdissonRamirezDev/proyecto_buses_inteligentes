import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateAddressDto {
  @IsString()
  @IsNotEmpty()
  direccion: string;

  @IsString()
  @IsOptional()
  ciudad?: string;

  @IsString()
  @IsNotEmpty()
  citizenId: string;
}
