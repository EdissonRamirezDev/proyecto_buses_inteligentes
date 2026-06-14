import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { Route } from './entities/route.entity';
import { randomUUID } from 'crypto';

@Injectable()
export class RoutesService {
  constructor(
    @InjectRepository(Route)
    private readonly routeRepository: Repository<Route>,
  ) {}

  async create(createRouteDto: CreateRouteDto): Promise<Route> {
    const codigo = `RUT-${randomUUID().substring(0, 8).toUpperCase()}`;
    const route = this.routeRepository.create({ ...createRouteDto, codigo });
    return await this.routeRepository.save(route);
  }

  async findAll(): Promise<Route[]> {
    return await this.routeRepository.find({
      relations: ['nodes', 'nodes.busStop'],
      order: { nodes: { orden: 'ASC' } }
    });
  }

  async findOne(id: string): Promise<Route> {
    const route = await this.routeRepository.findOneBy({ id });
    if (!route) {
      throw new NotFoundException(`Route with ID ${id} not found`);
    }
    return route;
  }

  async update(id: string, updateRouteDto: UpdateRouteDto): Promise<Route> {
    const route = await this.findOne(id);
    this.routeRepository.merge(route, updateRouteDto);
    return await this.routeRepository.save(route);
  }

  async remove(id: string): Promise<void> {
    const route = await this.findOne(id);
    await this.routeRepository.remove(route);
  }

  async getActiveBuses(routeId: string): Promise<any[]> {
    const route = await this.routeRepository.createQueryBuilder('route')
      .leftJoinAndSelect('route.schedules', 'schedule')
      .leftJoinAndSelect('schedule.bus', 'bus')
      .leftJoinAndSelect('bus.gps', 'gps')
      .where('route.id = :id', { id: routeId })
      .getOne();

    if (!route) {
      throw new NotFoundException(`Route with ID ${routeId} not found`);
    }

    const activeBuses = route.schedules?.map(s => {
      if (s.bus && s.bus.gps && s.bus.gps.latitude && s.bus.gps.longitude) {
        return {
          scheduleId: s.id,
          estado: s.estado,
          hora_salida: s.hora_salida,
          tolerancia_minutos: s.tolerancia_minutos,
          busId: s.bus.id,
          placa: s.bus.placa,
          latitude: s.bus.gps.latitude,
          longitude: s.bus.gps.longitude,
        };
      }
      return null;
    }).filter(b => b !== null) || [];

    return activeBuses;
  }
}
