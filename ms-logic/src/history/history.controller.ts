import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { HistoryService } from './history.service';

@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Post('scan')
  scanTicket(@Body() body: { ticketId: string; nodeId: string }) {
    return this.historyService.scanTicket(body.ticketId, body.nodeId);
  }

  @Get()
  findAll() {
    return this.historyService.findAll();
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.historyService.remove(id);
  }
}
