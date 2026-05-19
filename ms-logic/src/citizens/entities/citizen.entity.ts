import { Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne } from 'typeorm';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { WalletTransaction } from './wallet-transaction.entity';
import { CitizenPaymentMethod } from '../../citizen-payment-methods/entities/citizen-payment-method.entity';
import { Address } from '../../addresses/entities/address.entity';

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

  @OneToOne(() => Address, (address) => address.citizen)
  address?: Address;

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
