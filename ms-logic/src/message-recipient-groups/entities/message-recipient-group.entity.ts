import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Message } from '../../messages/entities/message.entity';
import { Group } from '../../groups/entities/group.entity';

@Entity('message_recipient_groups')
export class MessageRecipientGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Message, m => m.destinatarios_grupos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'message_id' })
  message: Message;

  @ManyToOne(() => Group, g => g.mensajesRecibidos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: Group;
}
