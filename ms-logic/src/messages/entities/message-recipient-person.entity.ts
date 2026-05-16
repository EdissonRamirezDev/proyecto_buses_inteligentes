import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Message } from './message.entity';

@Entity('message_recipient_persons')
export class MessageRecipientPerson {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Message, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'message_id' })
  message: Message;

  @Column()
  destinatario_id: string; // userId from ms-security

  @Column({ default: false })
  leido: boolean;

  @Column({ type: 'timestamp', nullable: true })
  fecha_lectura: Date;
}
