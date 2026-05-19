import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Node } from '../../nodes/entities/node.entity';
import { Schedule } from '../../schedules/entities/schedule.entity';

@Entity('routes')
export class Route {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  codigo: string;

  @Column()
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  tarifa: number;

  @Column({ default: '#3b82f6' })
  color_hex: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  inicio_lat?: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  inicio_lng?: number;

  @Column({ nullable: true })
  inicio_nombre?: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  fin_lat?: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  fin_lng?: number;

  @Column({ nullable: true })
  fin_nombre?: string;

  @Column({ type: 'simple-json', nullable: true })
  inicio_via_points?: [number, number][];

  @OneToMany(() => Node, (node) => node.route)
  nodes: Node[];

  @OneToMany(() => Schedule, (schedule) => schedule.route)
  schedules: Schedule[];
}
