import { Module } from '@nestjs/common';
import { GpsService } from './gps.service';
import { GpsController } from './gps.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bus } from 'src/buses/entities/bus.entity';
import { Gps } from './entities/gps.entity';
import { BusesModule } from 'src/buses/buses.module';
import { BusStop } from '../bus-stops/entities/bus-stop.entity';
import { Node } from '../nodes/entities/node.entity';
import { Schedule } from '../schedules/entities/schedule.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Gps, Bus, BusStop, Node, Schedule]),
    BusesModule,
  ],
  controllers: [GpsController],
  providers: [GpsService],
  exports: [GpsService],
})
export class GpsModule {}
