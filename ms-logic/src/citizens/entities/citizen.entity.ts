import { Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { WalletTransaction } from './wallet-transaction.entity';
import { CitizenPaymentMethod } from '../../citizen-payment-methods/entities/citizen-payment-method.entity';
import { Address } from '../../addresses/entities/address.entity';
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

  @OneToOne(() => Address, (address) => address.citizen)
  address?: Address;

  @Column({ type: 'date', nullable: true })
  fecha_nacimiento: string;

  @Column({ type: 'boolean', default: false })
  weatherAlertsEnabled: boolean;

  @Column({ type: 'varchar', length: 5, nullable: true })
  habitualTravelTime: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.00 })
  saldo: number;

  @OneToMany(() => Ticket, (ticket) => ticket.citizen)
  tickets: Ticket[];

  @OneToMany(() => WalletTransaction, (transaction) => transaction.citizen)
  transactions: WalletTransaction[];

  @OneToMany(() => CitizenPaymentMethod, (cpm) => cpm.citizen)
  paymentMethods: CitizenPaymentMethod[];
}
