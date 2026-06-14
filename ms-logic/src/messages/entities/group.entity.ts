import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

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
}
