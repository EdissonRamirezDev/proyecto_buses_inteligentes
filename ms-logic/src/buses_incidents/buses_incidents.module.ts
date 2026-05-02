import { Module } from '@nestjs/common';
import { BusesIncidentsService } from './buses_incidents.service';
import { BusesIncidentsController } from './buses_incidents.controller';

@Module({
  controllers: [BusesIncidentsController],
  providers: [BusesIncidentsService],
})
export class BusesIncidentsModule {}
