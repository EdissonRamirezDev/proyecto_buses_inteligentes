import { Module } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './entities/company.entity';
import { CompanyDriver } from 'src/company_drivers/entities/company_driver.entity';
import { Bus } from 'src/buses/entities/bus.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Company, CompanyDriver, Bus])],
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [CompaniesService],
})
export class CompaniesModule {}
