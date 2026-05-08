import { Module } from '@nestjs/common';
import { BusesIncidentsService } from './buses_incidents.service';
import { BusesIncidentsController } from './buses_incidents.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusesIncident } from './entities/buses_incident.entity';
import { Bus } from 'src/buses/entities/bus.entity';
import { Incident } from 'src/incidents/entities/incident.entity';
import { Photo } from 'src/photos/entities/photo.entity';
import { BusesModule } from '../buses/buses.module';
import { IncidentsModule } from 'src/incidents/incidents.module';
import { IncidentsService } from 'src/incidents/incidents.service';

import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    TypeOrmModule.forFeature([BusesIncident, Bus, Incident, Photo]),
    BusesModule, 
    IncidentsModule,
    HttpModule
  ],
  controllers: [BusesIncidentsController],
  providers: [BusesIncidentsService],
  exports: [BusesIncidentsService],
})
export class BusesIncidentsModule {}
