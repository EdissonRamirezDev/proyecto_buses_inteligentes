import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Group } from '../../groups/entities/group.entity';
import { Person } from '../../persons/entities/person.entity';

@Entity('group_persons')
export class GroupPerson {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @ManyToOne(() => Person, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'person_id', referencedColumnName: 'userId' })
  persona: Person;

  @Column({ default: false })
  is_admin: boolean;

  @CreateDateColumn()
  fecha_union: Date;

  @Column({ default: false })
  is_blocked: boolean;
}
