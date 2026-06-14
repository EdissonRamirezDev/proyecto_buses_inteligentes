import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Person } from '../../persons/entities/person.entity';
import { MessageRecipientPerson } from '../../message-recipient-persons/entities/message-recipient-person.entity';
import { MessageRecipientGroup } from '../../message-recipient-groups/entities/message-recipient-group.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  contenido: string;

  @CreateDateColumn()
  fecha_envio: Date;

  @ManyToOne(() => Person, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'emisor_id', referencedColumnName: 'userId' })
  emisor: Person;

  @OneToMany(() => MessageRecipientPerson, rp => rp.message)
  destinatarios_personas: MessageRecipientPerson[];

  @OneToMany(() => MessageRecipientGroup, rg => rg.message)
  destinatarios_grupos: MessageRecipientGroup[];

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  latitud: number;

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  longitud: number;

  @Column({ default: false })
  is_mass_alert: boolean;

  @Column({ default: false })
  is_urgent: boolean;

  @Column({ nullable: true })
  scheduled_for: Date;

  @Column({ nullable: true })
  mass_alert_scope: string;
}
