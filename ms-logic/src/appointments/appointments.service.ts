import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { ScheduleAppointmentDto } from './dto/schedule-appointment.dto';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);
  
  // Estas URLs luego el usuario las cambiará por las reales de su n8n
  private readonly n8nAvailabilityUrl = 'http://n8n:5678/webhook/availability';
  private readonly n8nScheduleUrl = 'http://n8n:5678/webhook/schedule';

  constructor(private readonly httpService: HttpService) {}

  async getAvailability(asesorEmail?: string) {
    try {
      this.logger.log(`Fetching availability from: ${this.n8nAvailabilityUrl}`);
      
      // Llamada HTTP al webhook de n8n
      const response = await lastValueFrom(
        this.httpService.get(this.n8nAvailabilityUrl, {
          params: { asesorEmail }
        })
      );
      
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get availability from n8n', error.message);
      throw new Error('No se pudo conectar con el servidor de agendamiento (n8n). Verifica que el webhook de disponibilidad esté escuchando.');
    }
  }

  async scheduleAppointment(dto: ScheduleAppointmentDto) {
    try {
      this.logger.log(`Scheduling appointment to: ${this.n8nScheduleUrl}`);
      
      // Llamada HTTP al webhook de n8n con el DTO
      const response = await lastValueFrom(
        this.httpService.post(this.n8nScheduleUrl, dto)
      );
      
      return response.data;
    } catch (error) {
      this.logger.error('Failed to schedule appointment in n8n', error.message);
      throw new Error('No se pudo agendar la cita. Verifica que el webhook de agendamiento en n8n esté escuchando.');
    }
  }

}
