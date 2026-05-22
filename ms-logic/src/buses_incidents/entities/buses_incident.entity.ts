import { Bus } from "../../buses/entities/bus.entity";
import { Incident } from "../../incidents/entities/incident.entity";
import { Photo } from "../../photos/entities/photo.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('buses_incidents')
export class BusesIncident {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column()
    latitude?: number;

    @Column()
    longitude?: number;

    @Column()
    reportDate?: String;

    // Relación con Bus
    @ManyToOne(() => Bus, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'bus_id' })
    bus?: Bus;

    @ManyToOne(() => Incident, (incident) => incident.busesIncidents, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'incident_id' })
    incident?: Incident;

    // Hasta 5 fotos por incidente — HU-ENTR-2-007
    @OneToMany(() => Photo, (photo) => photo.busIncident)
    photos?: Photo[];
}