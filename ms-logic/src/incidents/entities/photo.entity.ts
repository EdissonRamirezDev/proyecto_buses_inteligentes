import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { IncidentBus } from './incident-bus.entity';

@Entity('photos')
export class Photo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  url_imagen: string;

  @CreateDateColumn()
  fecha_captura: Date;

  @ManyToOne(() => IncidentBus, (ib) => ib.photos, { onDelete: 'CASCADE' })
  incidentBus: IncidentBus;
}
