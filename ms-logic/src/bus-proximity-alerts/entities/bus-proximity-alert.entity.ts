import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Person } from '../../persons/entities/person.entity';

@Entity('bus_proximity_alerts')
export class BusProximityAlert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Person, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'person_id', referencedColumnName: 'userId' })
  persona: Person;

  @Column()
  route_id: string;

  @Column()
  bus_stop_id: string;

  @Column({ type: 'int', default: 10 })
  minutes_advance: number; // 5, 10 o 15 minutos de anticipación

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  was_triggered: boolean;

  @Column({ type: 'timestamp', nullable: true })
  triggered_at: Date;

  @CreateDateColumn()
  created_at: Date;
}
