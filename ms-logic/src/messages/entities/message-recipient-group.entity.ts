import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Message } from './message.entity';
import { Group } from './group.entity';

@Entity('message_recipient_groups')
export class MessageRecipientGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Message, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'message_id' })
  message: Message;

  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: Group;
}
