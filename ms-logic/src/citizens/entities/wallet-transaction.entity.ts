import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Citizen } from './citizen.entity';

@Entity('wallet_transactions')
export class WalletTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monto: number;

  @Column({ type: 'enum', enum: ['RECARGA', 'COMPRA_BOLETO', 'REEMBOLSO'] })
  tipo: string;

  @Column({ nullable: true })
  referencia_externa: string; // Para guardar el ID de ePayco o stripe

  @CreateDateColumn()
  fecha_transaccion: Date;

  @ManyToOne(() => Citizen, (citizen) => citizen.transactions, { onDelete: 'CASCADE' })
  citizen: Citizen;
}
