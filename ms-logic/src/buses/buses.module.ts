import { Module } from '@nestjs/common';
import { BusesService } from './buses.service';
import { BusesController } from './buses.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bus } from './entities/bus.entity';
import { Shift } from 'src/shifts/entities/shift.entity';
import { Company } from './entities/company.entity';
import { GPS } from './entities/gps.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Bus, Shift, Company, GPS])],
  controllers: [BusesController],
  providers: [BusesService],
  exports: [BusesService],
})
export class BusesModule {}
