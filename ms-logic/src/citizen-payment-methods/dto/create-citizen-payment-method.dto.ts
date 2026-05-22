import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateCitizenPaymentMethodDto {
  @IsString()
  @IsNotEmpty()
  citizenId: string;

  @IsString()
  @IsNotEmpty()
  paymentMethodId: string;

  @IsString()
  @IsOptional()
  identificador_instrumento?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
