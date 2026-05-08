import { Module } from '@nestjs/common';
import { BusesService } from './buses.service';
import { BusesController } from './buses.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bus } from './entities/bus.entity';
import { Shift } from 'src/shifts/entities/shift.entity';
import { Gps } from 'src/gps/entities/gps.entity';
import { Company } from 'src/companies/entities/company.entity';
import { BusesIncident } from 'src/buses_incidents/entities/buses_incident.entity';
import { CompaniesModule } from 'src/companies/companies.module';
import { CompaniesService } from 'src/companies/companies.service';

@Module({
  imports: [TypeOrmModule.forFeature([Bus, Shift, Gps, Company, BusesIncident]),
    CompaniesModule],
  controllers: [BusesController],
  providers: [BusesService],
  exports: [BusesService],
})
export class BusesModule { }
