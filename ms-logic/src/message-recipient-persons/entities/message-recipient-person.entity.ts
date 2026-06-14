import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Message } from '../../messages/entities/message.entity';
import { Person } from '../../persons/entities/person.entity';

@Entity('message_recipient_persons')
export class MessageRecipientPerson {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Message, m => m.destinatarios_personas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'message_id' })
  message: Message;

  @ManyToOne(() => Person, p => p.mensajesRecibidos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'destinatario_id', referencedColumnName: 'userId' })
  persona: Person;

  @Column({ default: false })
  leido: boolean;

  @Column({ type: 'timestamp', nullable: true })
  fecha_lectura: Date;
}
