import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { CitizenPaymentMethod } from '../../citizen-payment-methods/entities/citizen-payment-method.entity';

@Entity('payment_methods')
export class PaymentMethod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string; // e.g., 'Tarjeta de Crédito', 'Tarjeta Recargable', 'Efectivo', 'PSE'

  @Column({ nullable: true })
  descripcion: string;

  @OneToMany(() => CitizenPaymentMethod, (cpm) => cpm.paymentMethod)
  citizenPaymentMethods: CitizenPaymentMethod[];
}
