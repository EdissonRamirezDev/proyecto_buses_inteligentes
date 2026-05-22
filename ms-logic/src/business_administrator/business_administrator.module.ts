import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessAdministratorService } from './business_administrator.service';
import { BusinessAdministratorController } from './business_administrator.controller';
import { BusinessAdministrator } from './entities/business_administrator.entity';
import { Person } from '../persons/entities/person.entity';
import { Company } from '../companies/entities/company.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BusinessAdministrator, Person, Company])],
  controllers: [BusinessAdministratorController],
  providers: [BusinessAdministratorService],
  exports: [BusinessAdministratorService]
})
export class BusinessAdministratorModule {}

