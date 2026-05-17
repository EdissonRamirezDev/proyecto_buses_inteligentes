import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Incident } from './incident.entity';
import { Bus } from '../../buses/entities/bus.entity';
import { Photo } from './photo.entity';

@Entity('incident_buses')
export class IncidentBus {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Incident, (incident) => incident.incidentBuses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'incident_id' })
  incident: Incident;

  @ManyToOne(() => Bus, { onDelete: 'CASCADE' }) // Relación unidireccional por ahora
  @JoinColumn({ name: 'bus_id' })
  bus: Bus;

  @Column({ nullable: true })
  nivel_gravedad: number; // 1-5 por ejemplo

  @OneToMany(() => Photo, (photo) => photo.incidentBus)
  photos: Photo[];
}
