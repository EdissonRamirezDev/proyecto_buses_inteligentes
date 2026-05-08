import { Bus } from "../../buses/entities/bus.entity";
import { CompanyDriver } from "../../company_drivers/entities/company_driver.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('companies')
export class Company {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column()
    name?: string;

    @Column({ unique: true })
    nit?: string;

    @Column({ nullable: true })
    phone?: string;

    @Column({ nullable: true })
    email?: string;

    @Column({ nullable: true })
    address?: string;

    @Column({ nullable: true })
    logo?: string;

    // One to Many relationships
    @OneToMany(() => CompanyDriver, (companyDriver) => companyDriver.company)
    companyDrivers?: CompanyDriver[];

    @OneToMany(() => Bus, (bus) => bus.company)
    buses?: Bus[];
}