import { Company } from "../../companies/entities/company.entity";
import { Driver } from "../../drivers/entities/driver.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

export enum CompanyDriverStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
}

@Entity('company_drivers')
export class CompanyDriver {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    assignedAt?: Date;

    @Column({
        type: 'enum',
        enum: CompanyDriverStatus,
        default: CompanyDriverStatus.ACTIVE
    })
    status?: CompanyDriverStatus;

    @ManyToOne(() => Company, (company) => company.companyDrivers)
    company?: Company;

    @ManyToOne(() => Driver, (driver) => driver.companyDrivers)
    driver?: Driver;
}