import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Bus } from "../../buses/entities/bus.entity";
import { Driver } from "../../drivers/entities/driver.entity";

@Entity('shifts')
export class Shift {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column()
    fecha_inicio?: Date;

    @Column()
    fecha_fin?: Date;

    @Column()
    estado?: string;

    @ManyToOne(() => Bus, (bus) => bus.shifts, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'bus_id' })
    bus?: Bus;

    @ManyToOne(() => Driver, (driver) => driver.shifts, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'driver_id' })
    driver?: Driver;
}
