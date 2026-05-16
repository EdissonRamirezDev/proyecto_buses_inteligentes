import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Bus } from './bus.entity';

@Entity('gps_devices')
export class GPS {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  codigo_serial: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  ultima_latitud: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  ultima_longitud: number;

  @Column({ type: 'timestamp', nullable: true })
  ultima_actualizacion: Date;

  @OneToOne(() => Bus, (bus) => bus.gps, { onDelete: 'CASCADE' })
  @JoinColumn()
  bus: Bus;
}
