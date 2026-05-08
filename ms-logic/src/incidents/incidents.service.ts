import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Incident } from './entities/incident.entity';
import { Repository } from 'typeorm';

@Injectable()
export class IncidentsService {
  constructor(
    @InjectRepository(Incident)
    private readonly incidentRepository: Repository<Incident>,
  ) {}

  async create(createIncidentDto: CreateIncidentDto) {
    const incident = this.incidentRepository.create(createIncidentDto);
    return await this.incidentRepository.save(incident);
  }

  async findAll() {
    return await this.incidentRepository.find({ relations: ['busesIncidents'] });
  }

  async findOne(id: number) {
    const incident = await this.incidentRepository.findOne({ where: { id }, relations: ['busesIncidents'] });
    if (!incident) throw new NotFoundException(`Incident #${id} no encontrado`);
    return incident;
  }

  async update(id: number, updateIncidentDto: UpdateIncidentDto) {
    const incident = await this.findOne(id);
    const updated = Object.assign(incident, updateIncidentDto);
    return await this.incidentRepository.save(updated);
  }

  async remove(id: number) {
    const incident = await this.findOne(id);
    await this.incidentRepository.remove(incident);
    return { message: `Incident #${id} eliminado correctamente` };
  }
}
