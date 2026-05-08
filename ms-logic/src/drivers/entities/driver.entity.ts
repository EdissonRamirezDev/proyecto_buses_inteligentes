import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Shift } from "../../shifts/entities/shift.entity";
import { CompanyDriver } from "../../company_drivers/entities/company_driver.entity";

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

    // One to Many relationships
    @OneToMany(() => Shift, (shift) => shift.driver)
    shifts?: Shift[];

    @OneToMany(() => CompanyDriver, (companyDriver) => companyDriver.company)
    companyDrivers?: CompanyDriver[];
}
