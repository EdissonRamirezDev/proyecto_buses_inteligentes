import { Gps } from "../../gps/entities/gps.entity";
import { Shift } from "../../shifts/entities/shift.entity";
import { Column, Entity, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { BusesIncident } from "../../buses_incidents/entities/buses_incident.entity";
import { Company } from "../../companies/entities/company.entity";

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

    // One to One relationships
    @OneToOne(() => Gps, (gps) => gps.bus)
    gps?: Gps;

    // One to Many relationships
    @OneToMany(() => Shift, (shift) => shift.bus)  
    shifts?: Shift[];

    @OneToMany(() => BusesIncident, (busIncident) => busIncident.bus)  
    busIncidents?: BusesIncident[];

    // Many to One relationships
    @ManyToOne(() => Company, (company) => company.buses)
    company?: Company;
}
