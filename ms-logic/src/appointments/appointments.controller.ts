import { Controller, Get, Post, Body, HttpException, HttpStatus, Query } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { ScheduleAppointmentDto } from './dto/schedule-appointment.dto';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get('availability')
  async getAvailability(@Query('asesorEmail') asesorEmail?: string) {
    try {
      return await this.appointmentsService.getAvailability(asesorEmail);
    } catch (error) {
      throw new HttpException(
        'Error fetching availability from n8n',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('schedule')
  async scheduleAppointment(@Body() dto: ScheduleAppointmentDto) {
    try {
      return await this.appointmentsService.scheduleAppointment(dto);
    } catch (error) {
      throw new HttpException(
        'Error scheduling appointment through n8n',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
