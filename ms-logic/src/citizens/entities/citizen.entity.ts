import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { WalletTransaction } from './wallet-transaction.entity';
import { CitizenPaymentMethod } from './citizen-payment-method.entity';

@Entity('citizens')
export class Citizen {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  userId: string; // Enlace con ms-security

  @Column()
  nombres: string;

  @Column()
  apellidos: string;

  @Column({ nullable: true })
  telefono: string;

  @Column({ nullable: true })
  direccion: string;

  @Column({ type: 'date', nullable: true })
  fecha_nacimiento: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.00 })
  saldo: number;

  @OneToMany(() => Ticket, (ticket) => ticket.citizen)
  tickets: Ticket[];

  @OneToMany(() => WalletTransaction, (transaction) => transaction.citizen)
  transactions: WalletTransaction[];

  @OneToMany(() => CitizenPaymentMethod, (cpm) => cpm.citizen)
  paymentMethods: CitizenPaymentMethod[];
}
