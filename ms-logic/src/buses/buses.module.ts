import { Module } from '@nestjs/common';
import { BusesService } from './buses.service';
import { BusesController } from './buses.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bus } from './entities/bus.entity';
import { Shift } from 'src/shifts/entities/shift.entity';
import { Gps } from 'src/gps/entities/gps.entity';
import { Company } from 'src/companies/entities/company.entity';
import { CompaniesModule } from 'src/companies/companies.module';
import { Ticket } from 'src/tickets/entities/ticket.entity';
import { Schedule } from 'src/schedules/entities/schedule.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Bus, Shift, Gps, Company, Ticket, Schedule]),
    CompaniesModule],
  controllers: [BusesController],
  providers: [BusesService],
  exports: [BusesService],
})
export class BusesModule { }
