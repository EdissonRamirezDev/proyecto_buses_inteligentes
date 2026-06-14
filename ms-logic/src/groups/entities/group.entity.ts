import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { GroupPerson } from '../../group-persons/entities/group-person.entity';
import { MessageRecipientGroup } from '../../message-recipient-groups/entities/message-recipient-group.entity';

@Entity('groups')
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column({ nullable: true })
  descripcion: string;

  @CreateDateColumn()
  fecha_creacion: Date;

  @Column({ default: false })
  is_public: boolean;

  @Column({ nullable: true })
  icon: string;

  @OneToMany(() => GroupPerson, gp => gp.group)
  miembros: GroupPerson[];

  @OneToMany(() => MessageRecipientGroup, mrg => mrg.group)
  mensajesRecibidos: MessageRecipientGroup[];
}
