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

  private readonly incidentRelations = [
    'busesIncidents',
    'busesIncidents.bus',
    'busesIncidents.bus.company',
    'busesIncidents.photos',
  ] as const;

  private matchesFilters(incident: Incident, busId?: number, empresaId?: number): boolean {
    const links = incident.busesIncidents ?? [];
    if (busId !== undefined) {
      return links.some((bi) => bi.bus?.id === busId);
    }
    if (empresaId !== undefined) {
      return links.some((bi) => bi.bus?.company?.id === empresaId);
    }
    return true;
  }

  async findAll(busId?: number, empresaId?: number) {
    const incidents = await this.incidentRepository.find({
      relations: [...this.incidentRelations],
    });

    if (busId === undefined && empresaId === undefined) {
      return incidents;
    }

    return incidents.filter((inc) => this.matchesFilters(inc, busId, empresaId));
  }

  async getStats(busId?: number, empresaId?: number) {
    const incidents = await this.findAll(busId, empresaId);
    const total = incidents.length;
    const resueltos = incidents.filter((i) => {
      const state = (i.state || '').toUpperCase();
      return state === 'RESUELTO' || state === 'CERRADO' || state === 'RESOLVED';
    }).length;

    const porTipo: Record<string, number> = {};
    for (const inc of incidents) {
      const tipo = inc.type || 'OTRO';
      porTipo[tipo] = (porTipo[tipo] ?? 0) + 1;
    }

    const tasaResolucion = total > 0 ? Math.round((resueltos / total) * 100) : 0;

    return { total, resueltos, tasaResolucion, porTipo };
  }

  async findOne(id: number) {
    const incident = await this.incidentRepository.findOne({ where: { id }, relations: ['busesIncidents', 'busesIncidents.bus', 'busesIncidents.photos'] });
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
