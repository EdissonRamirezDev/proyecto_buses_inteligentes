import { Injectable, OnModuleInit, OnModuleDestroy, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusProximityAlert } from './entities/bus-proximity-alert.entity';
import { SubscribeAlertDto } from './dto/subscribe-alert.dto';
import { Person } from '../persons/entities/person.entity';
import { GpsService } from '../gps/gps.service';
import { MessagesGateway } from '../messages/messages.gateway';

@Injectable()
export class BusProximityAlertsService implements OnModuleInit, OnModuleDestroy {
  private timer: NodeJS.Timeout;

  constructor(
    @InjectRepository(BusProximityAlert)
    private readonly alertRepository: Repository<BusProximityAlert>,
    @InjectRepository(Person)
    private readonly personRepository: Repository<Person>,
    private readonly gpsService: GpsService,
    private readonly messagesGateway: MessagesGateway,
  ) {}

  onModuleInit() {
    // Check alerts every 30 seconds
    this.timer = setInterval(() => this.checkAlerts(), 30000);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async subscribe(dto: SubscribeAlertDto) {
    const persona = await this.personRepository.findOne({ where: { userId: dto.userId } });
    if (!persona) throw new NotFoundException('Persona no encontrada');

    const alert = this.alertRepository.create({
      persona,
      route_id: dto.routeId,
      bus_stop_id: dto.busStopId,
      minutes_advance: dto.minutesAdvance,
      is_active: true,
      was_triggered: false,
    });

    return await this.alertRepository.save(alert);
  }

  async unsubscribe(id: string) {
    const alert = await this.alertRepository.findOne({ where: { id } });
    if (!alert) throw new NotFoundException('Alerta no encontrada');

    alert.is_active = false;
    return await this.alertRepository.save(alert);
  }

  async getActiveAlerts(userId: string) {
    return await this.alertRepository.find({
      where: { persona: { userId }, is_active: true },
      order: { created_at: 'DESC' }
    });
  }

  async checkAlerts() {
    const activeAlerts = await this.alertRepository.find({
      where: { is_active: true, was_triggered: false },
      relations: ['persona']
    });

    if (activeAlerts.length === 0) return;

    // Group by route to minimize calls to GpsService
    const routesToTrack = [...new Set(activeAlerts.map(a => a.route_id))];

    for (const routeId of routesToTrack) {
      try {
        const tracking = await this.gpsService.getRouteTracking(routeId);
        if (!tracking.buses || tracking.buses.length === 0) continue;

        const alertsForRoute = activeAlerts.filter(a => a.route_id === routeId);

        for (const alert of alertsForRoute) {
          const paraderoAlerta = tracking.paraderos?.find(p => p.id === alert.bus_stop_id);
          if (!paraderoAlerta) continue;

          for (const busInfo of tracking.buses) {
             if (busInfo.latitude == null || busInfo.longitude == null) continue;
             
             // Simplistic Haversine calculation for distance
             const R = 6371; 
             const dLat = (paraderoAlerta.latitud - busInfo.latitude) * (Math.PI / 180);
             const dLon = (paraderoAlerta.longitud - busInfo.longitude) * (Math.PI / 180);
             const lat1 = busInfo.latitude * (Math.PI / 180);
             const lat2 = paraderoAlerta.latitud * (Math.PI / 180);
             const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
             const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
             const distKm = R * c;
             const etaMinutos = Math.round((distKm / 20) * 60); // Assuming 20km/h avg speed

             if (etaMinutos <= alert.minutes_advance) {
               // Trigger the alert
               alert.was_triggered = true;
               alert.is_active = false;
               alert.triggered_at = new Date();
               await this.alertRepository.save(alert);

               // Send push notification
               this.messagesGateway.notifyUsers([alert.persona.userId], 'busProximityAlert', {
                 routeId,
                 busStopId: alert.bus_stop_id,
                 busStopName: paraderoAlerta.nombre,
                 placa: busInfo.placa,
                 eta_minutos: etaMinutos,
                 mensaje: `El bus ${busInfo.placa} se acerca a tu paradero (${paraderoAlerta.nombre}). Llegará en aproximadamente ${etaMinutos} minutos. ¡Prepara tu método de pago!`
               });
               
               break; 
             }
          }
        }
      } catch (error) {
        console.error('Error checking alerts for route', routeId, error);
      }
    }
  }
}
