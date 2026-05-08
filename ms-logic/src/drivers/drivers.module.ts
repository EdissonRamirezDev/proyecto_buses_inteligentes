import { Module } from '@nestjs/common';
import { DriversService } from './drivers.service';
import { DriversController } from './drivers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Driver } from './entities/driver.entity';
import { Shift } from 'src/shifts/entities/shift.entity';
import { CompanyDriver } from 'src/company_drivers/entities/company_driver.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Driver, Shift, CompanyDriver])],
  controllers: [DriversController],
  providers: [DriversService],
  exports: [DriversService],
})
export class DriversModule {}
