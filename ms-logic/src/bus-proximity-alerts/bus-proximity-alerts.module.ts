import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusProximityAlertsService } from './bus-proximity-alerts.service';
import { BusProximityAlertsController } from './bus-proximity-alerts.controller';
import { BusProximityAlert } from './entities/bus-proximity-alert.entity';
import { PersonsModule } from '../persons/persons.module';
import { GpsModule } from '../gps/gps.module';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BusProximityAlert]),
    PersonsModule,
    GpsModule,
    MessagesModule,
  ],
  controllers: [BusProximityAlertsController],
  providers: [BusProximityAlertsService],
})
export class BusProximityAlertsModule {}
