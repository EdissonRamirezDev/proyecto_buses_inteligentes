import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post('purchase')
  purchaseTicket(@Body() body: { citizenId: string, scheduleId: string, citizenPaymentMethodId?: string }) {
    return this.ticketsService.purchaseTicket(body.citizenId, body.scheduleId, body.citizenPaymentMethodId);
  }

  @Post('board-at-stop')
  boardAtStop(
    @Body() body: { citizenId: string; scheduleId: string; nodeId: string; citizenPaymentMethodId?: string },
  ) {
    return this.ticketsService.boardAtStop(
      body.citizenId,
      body.scheduleId,
      body.nodeId,
      body.citizenPaymentMethodId,
    );
  }

  @Post('descend-at-stop')
  descendAtStop(@Body() body: { ticketId: string; nodeId: string }) {
    return this.ticketsService.descendAtStop(body.ticketId, body.nodeId);
  }

  @Get('citizen/:citizenId/active')
  findActiveByCitizen(@Param('citizenId') citizenId: string) {
    return this.ticketsService.findActiveByCitizen(citizenId);
  }

  @Get()
  findAll() {
    return this.ticketsService.findAll();
  }

  @Get(':id/trip-details')
  getTripDetails(@Param('id') id: string) {
    return this.ticketsService.getTripDetails(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ticketsService.remove(id);
  }
}

