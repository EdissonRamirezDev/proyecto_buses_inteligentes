import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { Ticket } from './entities/ticket.entity';
import { Citizen } from '../citizens/entities/citizen.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { CitizenPaymentMethod } from '../citizen-payment-methods/entities/citizen-payment-method.entity';
import { HistoryModule } from '../history/history.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ticket, Citizen, Schedule, CitizenPaymentMethod]),
    HistoryModule,
  ],
  controllers: [TicketsController],
  providers: [TicketsService],
})
export class TicketsModule {}
