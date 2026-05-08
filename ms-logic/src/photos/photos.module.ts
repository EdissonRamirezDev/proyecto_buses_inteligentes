import { Module } from '@nestjs/common';
import { PhotosService } from './photos.service';
import { PhotosController } from './photos.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Photo } from './entities/photo.entity';
import { BusesIncident } from 'src/buses_incidents/entities/buses_incident.entity';
import { BusesIncidentsModule } from '../buses_incidents/buses_incidents.module';
import { BusesIncidentsService } from 'src/buses_incidents/buses_incidents.service';
import { BusesModule } from 'src/buses/buses.module';
import { IncidentsModule } from 'src/incidents/incidents.module';
import { IncidentsService } from 'src/incidents/incidents.service';

@Module({
  imports: [TypeOrmModule.forFeature([Photo, BusesIncident]),
  BusesIncidentsModule, BusesModule, IncidentsModule],
  controllers: [PhotosController],
  providers: [PhotosService],
})
export class PhotosModule {}
