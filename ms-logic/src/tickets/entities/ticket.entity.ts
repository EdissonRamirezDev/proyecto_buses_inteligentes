import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn } from 'typeorm';
import { Citizen } from '../../citizens/entities/citizen.entity';
import { Schedule } from '../../schedules/entities/schedule.entity';
import { History } from '../../history/entities/history.entity';

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  codigo_qr: string;

  @Column({ default: 'activo' })
  estado: string; // activo, usado, cancelado

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precio_pagado: number;

  @CreateDateColumn()
  fecha_compra: Date;

  @ManyToOne(() => Citizen, (citizen) => citizen.tickets, { onDelete: 'CASCADE' })
  citizen: Citizen;

  @ManyToOne(() => Schedule, (schedule) => schedule.tickets, { onDelete: 'CASCADE' })
  schedule: Schedule;

  @OneToMany(() => History, (history) => history.ticket)
  history: History[];
}
