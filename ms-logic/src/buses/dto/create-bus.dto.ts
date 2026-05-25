import { IsNotEmpty, IsString, IsNumber, Min, IsISIN, IsIn, IsOptional } from 'class-validator';

export class CreateBusDto {
    @IsString()
    @IsNotEmpty({ message: 'La placa es requerida' })
    placa: string;

    @IsString()
    @IsNotEmpty({ message: 'El modelo es requerido' })
    modelo: string;

    @IsNumber()
    @IsNotEmpty({ message: 'La capacidad es requerida' })
    @Min(1, { message: 'La capacidad debe ser mayor a 0' })
    capacidad: number;

    @IsString()
    @IsNotEmpty({ message: 'El estado es requerido' })
    @IsIn(['available', 'in service', 'maintenance', 'out of service'], { message: 'El estado debe ser available, in service, maintenance o out of service' })
    estado: string;

    @IsOptional()
    @IsNumber()
    companyId?: number;

    @IsOptional()
    @IsNumber()
    anio?: number;

    @IsOptional()
    @IsNumber()
    capacidad_sentados?: number;

    @IsOptional()
    @IsNumber()
    capacidad_parados?: number;

    @IsOptional()
    @IsString()
    foto_url?: string;
}
