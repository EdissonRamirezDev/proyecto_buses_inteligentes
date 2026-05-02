import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Shift } from "../../shifts/entities/shift.entity";

@Entity('drivers')
export class Driver {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column()
    name?: string;

    @Column()
    last_name?: string;

    @Column()
    license?: string;

    @Column()
    phone?: string;

    @Column()
    email?: string;

    @Column()
    status?: string;

    @OneToMany(() => Shift, (shift) => shift.driver)
    shifts?: Shift[];
}
