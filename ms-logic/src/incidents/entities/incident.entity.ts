import { BusesIncident } from "../../buses_incidents/entities/buses_incident.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('incidents')
export class Incident {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column()
    type?: string;

    @Column()
    severity?: string;

    @Column()
    description?: string;

    @Column()
    date?: string;

    @Column()
    state?: string;

    @OneToMany(() => BusesIncident, (busIncident) => busIncident.incident)
    busesIncidents?: BusesIncident[];
}
