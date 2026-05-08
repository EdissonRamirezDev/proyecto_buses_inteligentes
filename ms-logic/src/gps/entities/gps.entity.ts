import { Bus } from "../../buses/entities/bus.entity";
import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('gps')
export class Gps {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column('decimal', { precision: 10, scale: 7, nullable: true })
    latitude?: number;

    @Column('decimal', { precision: 10, scale: 7, nullable: true })
    longitude?: number;

    @OneToOne(() => Bus, (bus) => bus.gps)
    @JoinColumn({ name: 'busId' })  
    bus?: Bus;
}
