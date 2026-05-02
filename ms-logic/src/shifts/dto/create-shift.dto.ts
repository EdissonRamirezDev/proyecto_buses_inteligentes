import { IsInt, IsISO8601, IsNotEmpty, IsString } from "class-validator";

export class CreateShiftDto {
    @IsISO8601()
    @IsNotEmpty()
    fecha_inicio?: string; // "2026-01-01 16:00:00"

    @IsISO8601()
    @IsNotEmpty()
    fecha_fin?: string; // "2024-10-20T18:00:00Z"

    @IsString()
    @IsNotEmpty()
    estado?: string;

    @IsInt()
    @IsNotEmpty()
    bus_id?: number;

    @IsInt()
    @IsNotEmpty()
    driver_id?: number;
}
