import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateBusesIncidentDto {
    @IsNotEmpty()
    @IsNumber()
    latitude: number;

    @IsNotEmpty()
    @IsNumber()
    longitude: number;

    @IsNotEmpty()
    @IsString()
    reportDate: string;

    @IsOptional()
    @IsNumber()
    busId?: number;

    @IsOptional()
    @IsNumber()
    incidentId?: number;
}
