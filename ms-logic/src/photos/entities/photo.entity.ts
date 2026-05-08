import { BusesIncident } from "../../buses_incidents/entities/buses_incident.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('photos')
export class Photo {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column()
    url?: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    uploadedAt?: Date;

    @ManyToOne(() => BusesIncident, (busIncident) => busIncident.photos, {onDelete: 'CASCADE'})
    busIncident?: BusesIncident;
}