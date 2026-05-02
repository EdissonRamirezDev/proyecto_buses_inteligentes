import { Module } from '@nestjs/common';
import { BusesService } from './buses.service';
import { BusesController } from './buses.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bus } from './entities/bus.entity';
import { Shift } from 'src/shifts/entities/shift.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Bus, Shift])],
  controllers: [BusesController],
  providers: [BusesService],
  exports: [BusesService],
})
export class BusesModule {}
