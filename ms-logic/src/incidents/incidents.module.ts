import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IncidentsService } from './incidents.service';
import { IncidentsController } from './incidents.controller';
import { Incident } from './entities/incident.entity';
import { IncidentBus } from './entities/incident-bus.entity';
import { Photo } from './entities/photo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Incident, IncidentBus, Photo])],
  controllers: [IncidentsController],
  providers: [IncidentsService],
  exports: [IncidentsService]
})
export class IncidentsModule {}
