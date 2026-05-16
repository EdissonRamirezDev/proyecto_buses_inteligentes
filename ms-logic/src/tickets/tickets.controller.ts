import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post('purchase')
  purchaseTicket(@Body() body: { citizenId: string, scheduleId: string }) {
    return this.ticketsService.purchaseTicket(body.citizenId, body.scheduleId);
  }

  @Get()
  findAll() {
    return this.ticketsService.findAll();
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ticketsService.remove(id);
  }
}
