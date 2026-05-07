import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateBusStopDto } from './dto/create-bus-stop.dto';
import { UpdateBusStopDto } from './dto/update-bus-stop.dto';
import { BusStop } from './entities/bus-stop.entity';
import { randomUUID } from 'crypto';

@Injectable()
export class BusStopsService {
  constructor(
    @InjectRepository(BusStop)
    private readonly busStopRepository: Repository<BusStop>,
  ) {}

  async create(createBusStopDto: CreateBusStopDto): Promise<BusStop> {
    const codigo = `PAR-${randomUUID().substring(0, 8).toUpperCase()}`;
    const busStop = this.busStopRepository.create({ ...createBusStopDto, codigo });
    return await this.busStopRepository.save(busStop);
  }

  async findAll(): Promise<BusStop[]> {
    return await this.busStopRepository.find();
  }

  async findOne(id: string): Promise<BusStop> {
    const busStop = await this.busStopRepository.findOneBy({ id });
    if (!busStop) {
      throw new NotFoundException(`BusStop with ID ${id} not found`);
    }
    return busStop;
  }

  async update(id: string, updateBusStopDto: UpdateBusStopDto): Promise<BusStop> {
    const busStop = await this.findOne(id);
    this.busStopRepository.merge(busStop, updateBusStopDto);
    return await this.busStopRepository.save(busStop);
  }

  async remove(id: string): Promise<void> {
    const busStop = await this.findOne(id);
    await this.busStopRepository.remove(busStop);
  }
}
