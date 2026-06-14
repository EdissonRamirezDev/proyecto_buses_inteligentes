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
