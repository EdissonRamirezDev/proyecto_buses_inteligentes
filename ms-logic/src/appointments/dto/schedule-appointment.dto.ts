import { IsString, IsEmail, IsNotEmpty, MaxLength, IsIn } from 'class-validator';

export class ScheduleAppointmentDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['Presencial', 'Virtual'])
  modalidad: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['Problema con tarjeta', 'Reclamo', 'Reembolso', 'Otro'])
  motivo: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  descripcion: string;

  @IsString()
  @IsNotEmpty()
  fecha_inicio: string; // ISO String

  @IsString()
  @IsNotEmpty()
  fecha_fin: string; // ISO String
}
