import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { Bus } from "src/buses/entities/bus.entity";

export class CreateGpsDto {
    @IsNumber()
    latitude: number

    @IsNumber()
    longitude: number

    @IsOptional()
    @IsNumber()
    bus_id?: number
}
