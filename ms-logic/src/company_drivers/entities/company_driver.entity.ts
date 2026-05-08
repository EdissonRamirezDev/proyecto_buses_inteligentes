import { Company } from "../../companies/entities/company.entity";
import { Driver } from "../../drivers/entities/driver.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

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

    // Many to One relationships
    @ManyToOne(() => Company, (company) => company.companyDrivers)
    // @JoinColumn({ name: 'company_id' })
    company?: Company;

    @ManyToOne(() => Driver, (driver) => driver.companyDrivers)
    // @JoinColumn({ name: 'driver_id' })
    driver?: Driver;
}