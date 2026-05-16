import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn } from 'typeorm';
import { Shift } from '../../shifts/entities/shift.entity';
import { IncidentBus } from './incident-bus.entity';

@Entity('incidents')
export class Incident {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  titulo: string;

  @Column('text')
  descripcion: string;

  @Column({ type: 'enum', enum: ['MECANICO', 'ACCIDENTE', 'CONGESTION', 'PASAJERO', 'OTRO'] })
  categoria: string;

  @Column({ type: 'enum', enum: ['REPORTADO', 'EN_REVISION', 'RESUELTO'], default: 'REPORTADO' })
  estado: string;

  @CreateDateColumn()
  fecha_reporte: Date;

  @ManyToOne(() => Shift, (shift) => shift.incidents, { onDelete: 'CASCADE' })
  shift: Shift; // Para saber qué turno (y por tanto qué conductor y bus) lo reportó

  @OneToMany(() => IncidentBus, (ib) => ib.incident)
  incidentBuses: IncidentBus[];
}
