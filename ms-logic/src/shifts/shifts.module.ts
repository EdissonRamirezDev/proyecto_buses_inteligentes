import { Module } from '@nestjs/common';
import { ShiftsService } from './shifts.service';
import { ShiftsController } from './shifts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shift } from './entities/shift.entity';
import { Bus } from 'src/buses/entities/bus.entity';
import { Driver } from 'src/drivers/entities/driver.entity';
import { BusesModule } from 'src/buses/buses.module';
import { DriversModule } from 'src/drivers/drivers.module';

@Module({
  imports: [TypeOrmModule.forFeature([Shift, Bus, Driver]),
  BusesModule,
  DriversModule
],
  controllers: [ShiftsController],
  providers: [ShiftsService],
})
export class ShiftsModule { }
