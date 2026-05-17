import { Module } from '@nestjs/common';
import { BusesService } from './buses.service';
import { BusesController } from './buses.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bus } from './entities/bus.entity';
import { Shift } from 'src/shifts/entities/shift.entity';
import { Gps } from 'src/gps/entities/gps.entity';
import { Company } from 'src/companies/entities/company.entity';
import { CompaniesModule } from 'src/companies/companies.module';

@Module({
  imports: [TypeOrmModule.forFeature([Bus, Shift, Gps, Company]),
    CompaniesModule],
  controllers: [BusesController],
  providers: [BusesService],
  exports: [BusesService],
})
export class BusesModule { }
