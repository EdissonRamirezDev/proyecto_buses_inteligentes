import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Route } from '../../routes/entities/route.entity';
import { Bus } from '../../buses/entities/bus.entity';

@Entity('schedules')
export class Schedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  fecha: Date;

  @Column({ type: 'time' })
  hora_salida: string;

  @Column({ type: 'int', default: 0 })
  tolerancia_minutos: number;

  @Column({ default: false })
  es_recurrente: boolean;

  @Column({ nullable: true })
  tipo_recurrencia: string;

  @Column({ default: 'programado' })
  estado: string;

  @ManyToOne(() => Route, (route) => route.schedules, { onDelete: 'CASCADE' })
  route: Route;

  @ManyToOne(() => Bus, (bus) => bus.shifts, { onDelete: 'SET NULL' }) // Usando shifts temporalmente o creando relacion en Bus
  bus: Bus;
}
