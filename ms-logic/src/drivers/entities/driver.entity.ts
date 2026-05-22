import { Column, Entity, OneToMany, OneToOne, JoinColumn, PrimaryGeneratedColumn } from "typeorm";
import { Shift } from "../../shifts/entities/shift.entity";
import { CompanyDriver } from "../../company_drivers/entities/company_driver.entity";
import { Person } from "../../persons/entities/person.entity";

@Entity('drivers')
export class Driver {
    @PrimaryGeneratedColumn()
    id?: number;

    @OneToOne(() => Person, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'person_id' })
    person?: Person;

    @Column()
    license?: string;

    @Column()
    status?: string;

    // One to Many relationships
    @OneToMany(() => Shift, (shift) => shift.driver)
    shifts?: Shift[];

    @OneToMany(() => CompanyDriver, (companyDriver) => companyDriver.driver)
    companyDrivers?: CompanyDriver[];
}
