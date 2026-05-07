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
}
