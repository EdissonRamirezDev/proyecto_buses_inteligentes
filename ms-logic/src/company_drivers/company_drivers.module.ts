import { Module } from '@nestjs/common';
import { CompanyDriversService } from './company_drivers.service';
import { CompanyDriversController } from './company_drivers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyDriver } from './entities/company_driver.entity';
import { Driver } from 'src/drivers/entities/driver.entity';
import { Company } from 'src/companies/entities/company.entity';
import { CompaniesModule } from 'src/companies/companies.module';
import { DriversModule } from 'src/drivers/drivers.module';
import { CompaniesService } from 'src/companies/companies.service';

@Module({
  imports: [TypeOrmModule.forFeature([CompanyDriver, Driver, Company]),
  CompaniesModule, 
  DriversModule],
  controllers: [CompanyDriversController],
  providers: [CompanyDriversService],
})
export class CompanyDriversModule {}
