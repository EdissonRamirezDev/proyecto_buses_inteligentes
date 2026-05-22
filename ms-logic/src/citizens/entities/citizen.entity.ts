import { Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { WalletTransaction } from './wallet-transaction.entity';
import { CitizenPaymentMethod } from './citizen-payment-method.entity';
import { Person } from '../../persons/entities/person.entity';

@Entity('citizens')
export class Citizen {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Person, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'person_id' })
  person: Person;

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
