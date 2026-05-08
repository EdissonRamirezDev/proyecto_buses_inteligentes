import { Module } from '@nestjs/common';
import { GpsService } from './gps.service';
import { GpsController } from './gps.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bus } from 'src/buses/entities/bus.entity';
import { Gps } from './entities/gps.entity';
import { BusesModule } from 'src/buses/buses.module';

@Module({
  imports: [TypeOrmModule.forFeature([Gps, Bus ]),
  BusesModule],
  controllers: [GpsController],
  providers: [GpsService],
})
export class GpsModule {}
