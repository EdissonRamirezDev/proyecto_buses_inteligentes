import { IsString, IsNotEmpty } from 'class-validator';

export class AddMemberDto {
  @IsString()
  @IsNotEmpty()
  adminId: string;

  @IsString()
  @IsNotEmpty()
  personId: string;
}
