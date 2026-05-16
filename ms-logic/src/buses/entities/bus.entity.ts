import { Shift } from "../../shifts/entities/shift.entity";
import { Column, Entity, OneToMany, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Company } from "./company.entity";
import { GPS } from "./gps.entity";

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

    @ManyToOne(() => Company, (company) => company.buses, { onDelete: 'SET NULL', nullable: true })
    company?: Company;

    @OneToOne(() => GPS, (gps) => gps.bus, { nullable: true })
    gps?: GPS;
}
