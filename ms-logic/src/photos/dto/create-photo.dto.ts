import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePhotoDto {
    @IsNotEmpty()
    @IsString()
    url: string;

    @IsOptional()
    @IsNumber()
    busIncidentId?: number;
}
