import { Shift } from "../../shifts/entities/shift.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('buses')
export class Bus {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column()
    placa?: string;

    @Column()
    modelo?: string;

    @Column()
    capacidad?: number;

    @Column()
    estado?: string;

    @OneToMany(() => Shift, (shift) => shift.bus)  
    shifts?: Shift[];
}
