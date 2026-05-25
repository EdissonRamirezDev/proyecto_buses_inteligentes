import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class StartShiftDto {
  @IsIn(['ok', 'obs', 'rev'])
  busStatus: 'ok' | 'obs' | 'rev';

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observations?: string;

  /** Valida que el turno pertenezca al conductor autenticado (email). */
  @IsOptional()
  @IsString()
  driverEmail?: string;
}
