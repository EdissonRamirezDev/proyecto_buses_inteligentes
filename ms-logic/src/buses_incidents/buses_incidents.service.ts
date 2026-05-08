import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateBusesIncidentDto } from './dto/create-buses_incident.dto';
import { UpdateBusesIncidentDto } from './dto/update-buses_incident.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { BusesIncident } from './entities/buses_incident.entity';
import { Repository } from 'typeorm';
import { BusesService } from 'src/buses/buses.service';
import { IncidentsService } from 'src/incidents/incidents.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class BusesIncidentsService {
  constructor(
    @InjectRepository(BusesIncident)
    private readonly busesIncidentRepository: Repository<BusesIncident>,
    private readonly busService: BusesService,
    private readonly incidentService: IncidentsService,
    private readonly httpService: HttpService,
  ) {}

  private resolveId(value: any): number | undefined {
    if (!value) return undefined;
    if (typeof value === 'number') return value;
    if (typeof value === 'object' && 'id' in value) return (value as any).id;
    return undefined;
  }

  async create(createBusesIncidentDto: CreateBusesIncidentDto): Promise<BusesIncident> {
      const busId = this.resolveId(createBusesIncidentDto.busId);
      const incidentId = this.resolveId(createBusesIncidentDto.incidentId);
  
      if (!busId) throw new BadRequestException('bus id is required');
      if (!incidentId) throw new BadRequestException('incident id is required');
  
      const bus = await this.busService.findOne(busId);
      if (!bus) throw new NotFoundException(`Bus with id ${busId} not found`);
  
      const incident = await this.incidentService.findOne(incidentId);
      if (!incident) throw new NotFoundException(`Incident with id ${incidentId} not found`);
  
    const busIncident = this.busesIncidentRepository.create({
      latitude: createBusesIncidentDto.latitude,
      longitude: createBusesIncidentDto.longitude,
      reportDate: createBusesIncidentDto.reportDate, 
      bus: bus,
      incident: incident,
    })
  
      const savedBusIncident = await this.busesIncidentRepository.save(busIncident);

      // Lógica de notificación si el incidente es ALTO o CRÍTICO
      if (incident.severity === 'ALTA' || incident.severity === 'CRITICA') {
        await this.notifySupervisorByEmail(savedBusIncident, bus.company?.email);
      }

      return savedBusIncident;
    }

  private async notifySupervisorByEmail(busIncident: BusesIncident, recipientEmail: string | undefined) {
    if (!recipientEmail) {
      console.warn('No se pudo enviar notificación: La empresa no tiene correo configurado.');
      return;
    }

    const incident = busIncident.incident;
    const bus = busIncident.bus;

    const subject = `⚠️ ALERTA DE INCIDENTE ${incident?.severity}: Bus ${bus?.placa}`;
    const body_html = `
      <h2>Reporte de Incidente Crítico</h2>
      <p>Se ha registrado un incidente que requiere atención inmediata.</p>
      <ul>
        <li><strong>Bus:</strong> ${bus?.placa} (${bus?.modelo})</li>
        <li><strong>Tipo:</strong> ${incident?.type}</li>
        <li><strong>Gravedad:</strong> ${incident?.severity}</li>
        <li><strong>Descripción:</strong> ${incident?.description}</li>
        <li><strong>Ubicación:</strong> Lat: ${busIncident.latitude}, Lng: ${busIncident.longitude}</li>
        <li><strong>Fecha de Reporte:</strong> ${busIncident.reportDate}</li>
      </ul>
      <p>Por favor, ingrese a la plataforma para más detalles.</p>
    `;

    try {
      await firstValueFrom(
        this.httpService.post('http://localhost:5000/send-email', {
          subject,
          recipient: recipientEmail,
          body_html
        })
      );
      console.log(`Notificación por correo enviada a ${recipientEmail}`);
    } catch (error) {
      console.error('Error enviando notificación por correo:', error.message);
    }
  }

  async findAll() {
    return await this.busesIncidentRepository.find({ relations: ['bus', 'incident', 'photos'] });
  }

  async findOne(id: number) {
    const busesIncident = await this.busesIncidentRepository.findOne({ where: { id }, relations: ['bus', 'incident', 'photos'] });
    if (!busesIncident) throw new NotFoundException(`BusesIncident #${id} no encontrado`);
    return busesIncident;
  }

  async update(id: number, updateBusesIncidentDto: UpdateBusesIncidentDto) {
    const busIncident = await this.findOne(id)

    // Solo actualiza los campos propios de la entidad
    if (updateBusesIncidentDto.latitude !== undefined)
      busIncident.latitude = updateBusesIncidentDto.latitude

    if (updateBusesIncidentDto.longitude !== undefined)
      busIncident.longitude = updateBusesIncidentDto.longitude

    if (updateBusesIncidentDto.reportDate !== undefined)
      busIncident.reportDate = updateBusesIncidentDto.reportDate

    if (updateBusesIncidentDto.busId !== undefined) {
      const bus = await this.busService.findOne(updateBusesIncidentDto.busId)
      if (!bus) throw new NotFoundException(`Bus with id ${updateBusesIncidentDto.busId} not found`)
      busIncident.bus = bus
    }

    if (updateBusesIncidentDto.incidentId !== undefined) {
      const incident = await this.incidentService.findOne(updateBusesIncidentDto.incidentId)
      if (!incident) throw new NotFoundException(`Incident with id ${updateBusesIncidentDto.incidentId} not found`)
      busIncident.incident = incident
    }

    return await this.busesIncidentRepository.save(busIncident)
  }

  async remove(id: number) {
    const busesIncident = await this.findOne(id);
    await this.busesIncidentRepository.remove(busesIncident);
    return { message: `BusesIncident #${id} eliminado correctamente` };
  }
}
