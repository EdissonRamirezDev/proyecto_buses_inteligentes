import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Group } from './group.entity';

export enum GroupAction {
  JOINED = 'JOINED',
  ADDED = 'ADDED',
  REMOVED = 'REMOVED',
  BLOCKED = 'BLOCKED',
  PROMOTED = 'PROMOTED',
  LEFT = 'LEFT',
}

@Entity('group_logs')
export class GroupLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @Column()
  actor_id: string; // The person who performed the action

  @Column({ nullable: true })
  target_id: string; // The person affected by the action

  @Column({
    type: 'enum',
    enum: GroupAction,
  })
  action: GroupAction;

  @CreateDateColumn()
  created_at: Date;
}
