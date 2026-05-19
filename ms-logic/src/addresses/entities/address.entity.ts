import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Citizen } from '../../citizens/entities/citizen.entity';

@Entity('addresses')
export class Address {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  direccion: string;

  @Column({ nullable: true })
  ciudad: string;

  @OneToOne(() => Citizen, (citizen) => citizen.address, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'citizen_id' })
  citizen: Citizen;
}
