import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn } from 'typeorm';
import { Citizen } from '../../citizens/entities/citizen.entity';
import { Schedule } from '../../schedules/entities/schedule.entity';
import { History } from '../../history/entities/history.entity';
import { CitizenPaymentMethod } from '../../citizen-payment-methods/entities/citizen-payment-method.entity';

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

  @Column({ type: 'timestamp', nullable: true })
  fecha_fin: Date;

  @ManyToOne(() => Citizen, (citizen) => citizen.tickets, { onDelete: 'CASCADE' })
  citizen: Citizen;

  @ManyToOne(() => Schedule, (schedule) => schedule.tickets, { onDelete: 'CASCADE' })
  schedule: Schedule;

  @ManyToOne(() => CitizenPaymentMethod, (cpm) => cpm.tickets, { nullable: true, onDelete: 'SET NULL' })
  citizenPaymentMethod?: CitizenPaymentMethod;

  @OneToMany(() => History, (history) => history.ticket)
  history: History[];
}
