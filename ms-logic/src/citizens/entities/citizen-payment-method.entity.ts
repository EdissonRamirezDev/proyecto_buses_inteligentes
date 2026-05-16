import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Citizen } from './citizen.entity';
import { PaymentMethod } from './payment-method.entity';

@Entity('citizen_payment_methods')
export class CitizenPaymentMethod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Citizen, (citizen) => citizen.paymentMethods, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'citizen_id' })
  citizen: Citizen;

  @ManyToOne(() => PaymentMethod, (pm) => pm.citizenPaymentMethods, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'payment_method_id' })
  paymentMethod: PaymentMethod;

  @Column({ nullable: true })
  identificador_instrumento: string; // e.g., últimos 4 dígitos de tarjeta

  @Column({ default: true })
  is_active: boolean;
}
