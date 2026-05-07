import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Node } from '../../nodes/entities/node.entity';

@Entity('bus_stops')
export class BusStop {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  codigo: string;

  @Column()
  nombre: string;

  @Column({ type: 'decimal', precision: 10, scale: 8 })
  latitud: number;

  @Column({ type: 'decimal', precision: 11, scale: 8 })
  longitud: number;

  @Column({ default: 'regular' })
  tipo: string;

  @Column({ default: 'N/A' })
  sentido: string;

  @OneToMany(() => Node, (node) => node.busStop)
  nodes: Node[];
}
