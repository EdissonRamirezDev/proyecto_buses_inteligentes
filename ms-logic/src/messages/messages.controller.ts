import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { CreateMassAlertDto } from './dto/create-mass-alert.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { UserIdDto } from './dto/user-id.dto';
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}


  // ── Mensajes ──

  @Post('send')
  sendDirect(@Body() createMessageDto: CreateMessageDto) {
    return this.messagesService.sendMessage(createMessageDto);
  }

  @Get('search-persons')
  searchPersons(@Query('q') query: string) {
    return this.messagesService.searchPersons(query);
  }

  @Get('unread-count/:userId')
  getUnreadCount(@Param('userId') userId: string) {
    return this.messagesService.getUnreadCount(userId);
  }

  @Get('inbox/:userId')
  getInbox(
    @Param('userId') userId: string,
    @Query('unread') unread?: string,
    @Query('type') type?: 'individual' | 'group',
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.messagesService.getInbox(userId, {
      unread: unread === 'true',
      type,
      dateFrom,
      dateTo,
    });
  }

  @Get('sent/:userId')
  getSent(@Param('userId') userId: string) {
    return this.messagesService.getSent(userId);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @Body() body: UserIdDto) {
    return this.messagesService.markAsRead(id, body.userId);
  }

  @Delete('delete/:id')
  deleteMessage(@Param('id') id: string, @Body() body: UserIdDto) {
    return this.messagesService.deleteMessage(id, body.userId);
  }

  // ── Alertas Masivas ──

  @Post('mass-alerts/calculate')
  calculateMassAlertRecipients(@Body() body: { scope: 'ALL' | 'ROUTE' | 'ZONE', scopeValue?: string, emisorId?: string }) {
    return this.messagesService.calculateMassAlertRecipients(body.scope, body.scopeValue, body.emisorId);
  }

  @Post('mass-alerts')
  sendMassAlert(@Body() dto: CreateMassAlertDto) {
    return this.messagesService.sendMassAlert(dto);
  }

  @Get('mass-alerts/stats/:userId')
  getMassAlertStats(@Param('userId') userId: string) {
    return this.messagesService.getMassAlertStats(userId);
  }

  // ── CRUD genérico original ──
  @Post()
  create(@Body() createMessageDto: CreateMessageDto) {
    return this.messagesService.create(createMessageDto);
  }

  @Get()
  findAll() {
    return this.messagesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.messagesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMessageDto: UpdateMessageDto) {
    return this.messagesService.update(+id, updateMessageDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.messagesService.remove(id);
  }
}
