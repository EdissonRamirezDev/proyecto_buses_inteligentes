import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistoryService } from './history.service';
import { HistoryController } from './history.controller';
import { History } from './entities/history.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { Node } from '../nodes/entities/node.entity';

@Module({
  imports: [TypeOrmModule.forFeature([History, Ticket, Node])],
  controllers: [HistoryController],
  providers: [HistoryService],
})
export class HistoryModule {}
