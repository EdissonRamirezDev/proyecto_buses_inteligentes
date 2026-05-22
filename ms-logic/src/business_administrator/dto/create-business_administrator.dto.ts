import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class CreateBusinessAdministratorDto {
  @IsNotEmpty()
  @IsString()
  personId: string;

  @IsNotEmpty()
  @IsNumber()
  companyId: number;
}
