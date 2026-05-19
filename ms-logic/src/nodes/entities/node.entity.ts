import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Route } from '../../routes/entities/route.entity';
import { History } from '../../history/entities/history.entity';
import { BusStop } from '../../bus-stops/entities/bus-stop.entity';

@Entity('nodes')
export class Node {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  orden: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  distancia_anterior: number;

  @Column({ type: 'int', default: 0 })
  tiempo_estimado: number;

  @ManyToOne(() => Route, (route) => route.nodes, { onDelete: 'CASCADE' })
  route: Route;

  @OneToMany(() => History, (history) => history.node)
  history: History[];

  @ManyToOne(() => BusStop, (busStop) => busStop.nodes, { onDelete: 'CASCADE' })
  busStop: BusStop;

  @Column({ type: 'simple-json', nullable: true })
  via_points?: [number, number][];
}
