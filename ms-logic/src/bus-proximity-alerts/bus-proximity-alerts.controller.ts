import { Controller, Get, Post, Body, Param, Patch } from '@nestjs/common';
import { BusProximityAlertsService } from './bus-proximity-alerts.service';
import { SubscribeAlertDto } from './dto/subscribe-alert.dto';

@Controller('bus-proximity-alerts')
export class BusProximityAlertsController {
  constructor(private readonly alertsService: BusProximityAlertsService) {}

  @Post('subscribe')
  subscribe(@Body() dto: SubscribeAlertDto) {
    return this.alertsService.subscribe(dto);
  }

  @Patch('unsubscribe/:id')
  unsubscribe(@Param('id') id: string) {
    return this.alertsService.unsubscribe(id);
  }

  @Get('active/:userId')
  getActiveAlerts(@Param('userId') userId: string) {
    return this.alertsService.getActiveAlerts(userId);
  }
}
