// create-company-driver.dto.ts
import { IsEnum, IsInt, IsNotEmpty, IsOptional } from 'class-validator'
import { CompanyDriverStatus } from '../../company_drivers/entities/company_driver.entity'

export class CreateCompanyDriverDto {
    @IsNotEmpty()
    @IsInt()
    companyId: number

    @IsNotEmpty()
    @IsInt()
    driverId: number

    @IsOptional()
    @IsEnum(CompanyDriverStatus, { message: 'Status must be: ACTIVE, INACTIVE' })
    status?: CompanyDriverStatus
}