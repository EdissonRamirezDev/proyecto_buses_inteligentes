import { IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator";
import { Bus } from "src/buses/entities/bus.entity";
import { Shift } from "src/shifts/entities/shift.entity";

export class CreateDriverDto {
    @IsString()
    @IsNotEmpty()
    name?: string;

    @IsString()
    @IsNotEmpty()
    last_name?: string;

    @IsString()
    @IsNotEmpty()
    license?: string;

    @IsString()
    @IsNotEmpty()
    phone?: string;

    @IsString()
    @IsNotEmpty()
    email?: string;

    @IsString()
    @IsNotEmpty()
    status?: string;
}
