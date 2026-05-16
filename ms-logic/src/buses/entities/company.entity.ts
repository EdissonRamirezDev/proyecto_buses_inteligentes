import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Bus } from './bus.entity';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column({ nullable: true })
  nit: string;

  @Column({ nullable: true })
  telefono: string;

  @OneToMany(() => Bus, (bus) => bus.company)
  buses: Bus[];
}
