import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  contenido: string;

  @CreateDateColumn()
  fecha_envio: Date;

  @Column()
  emisor_id: string; // userId from ms-security
}
