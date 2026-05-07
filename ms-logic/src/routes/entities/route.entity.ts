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

  @OneToMany(() => Node, (node) => node.route)
  nodes: Node[];

  @OneToMany(() => Schedule, (schedule) => schedule.route)
  schedules: Schedule[];
}
