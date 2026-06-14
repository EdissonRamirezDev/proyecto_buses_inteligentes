import { IsString, IsOptional, IsBoolean, MaxLength, IsNotEmpty, IsDateString } from 'class-validator';

export class CreateMassAlertDto {
  @IsString()
  @IsNotEmpty()
  emisor_id: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  contenido: string;

  @IsString()
  @IsNotEmpty()
  scope: 'ALL' | 'ROUTE' | 'ZONE';

  @IsString()
  @IsOptional()
  scopeValue?: string; // route ID or zone ID

  @IsBoolean()
  @IsOptional()
  isUrgent?: boolean;

  @IsDateString()
  @IsOptional()
  scheduledFor?: string;
}
