import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { Ticket } from './entities/ticket.entity';
import { Citizen } from '../citizens/entities/citizen.entity';
import { Schedule } from '../schedules/entities/schedule.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket, Citizen, Schedule])],
  controllers: [TicketsController],
  providers: [TicketsService],
})
export class TicketsModule {}
