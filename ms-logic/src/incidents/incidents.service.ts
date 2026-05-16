import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { Incident } from './entities/incident.entity';
import { IncidentBus } from './entities/incident-bus.entity';
import { Photo } from './entities/photo.entity';
import { Shift } from '../shifts/entities/shift.entity';

@Injectable()
export class IncidentsService {
  constructor(
    @InjectRepository(Incident)
    private readonly incidentRepository: Repository<Incident>,
    @InjectRepository(IncidentBus)
    private readonly incidentBusRepository: Repository<IncidentBus>,
    @InjectRepository(Photo)
    private readonly photoRepository: Repository<Photo>,
  ) {}

  async create(createIncidentDto: CreateIncidentDto) {
    const incident = this.incidentRepository.create({
      titulo: createIncidentDto.titulo,
      descripcion: createIncidentDto.descripcion,
      categoria: createIncidentDto.categoria,
      shift: { id: createIncidentDto.shiftId } as Shift,
    });
    const savedIncident = await this.incidentRepository.save(incident);

    const incidentBus = this.incidentBusRepository.create({
      incident: savedIncident,
      bus: createIncidentDto.busId ? { id: createIncidentDto.busId } : undefined,
    });
    const savedIncidentBus = await this.incidentBusRepository.save(incidentBus);

    if (createIncidentDto.photos && createIncidentDto.photos.length > 0) {
      const photos = createIncidentDto.photos.map(url => this.photoRepository.create({
        url_imagen: url,
        incidentBus: savedIncidentBus
      }));
      await this.photoRepository.save(photos);
    }

    return await this.findOne(savedIncident.id);
  }

  async findAll() {
    return await this.incidentRepository.find({
      relations: ['shift', 'shift.driver', 'shift.bus', 'incidentBuses', 'incidentBuses.photos'],
      order: { fecha_reporte: 'DESC' }
    });
  }

  async findOne(id: string) {
    const incident = await this.incidentRepository.findOne({
      where: { id },
      relations: ['shift', 'shift.driver', 'shift.bus', 'incidentBuses', 'incidentBuses.photos'],
    });
    if (!incident) throw new NotFoundException('Incidente no encontrado');
    return incident;
  }

  async update(id: string, updateIncidentDto: UpdateIncidentDto) {
    const incident = await this.findOne(id);
    this.incidentRepository.merge(incident, updateIncidentDto as any);
    return await this.incidentRepository.save(incident);
  }

  async remove(id: string) {
    const incident = await this.findOne(id);
    return await this.incidentRepository.remove(incident);
  }
}
