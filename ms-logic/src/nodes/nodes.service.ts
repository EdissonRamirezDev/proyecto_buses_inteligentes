import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateNodeDto } from './dto/create-node.dto';
import { UpdateNodeDto } from './dto/update-node.dto';
import { Node } from './entities/node.entity';

@Injectable()
export class NodesService {
  constructor(
    @InjectRepository(Node)
    private readonly nodeRepository: Repository<Node>,
  ) {}

  async create(createNodeDto: CreateNodeDto): Promise<Node> {
    const duplicate = await this.nodeRepository.findOne({
      where: {
        route: { id: createNodeDto.routeId },
        busStop: { id: createNodeDto.busStopId },
      },
    });
    if (duplicate) {
      throw new BadRequestException('El paradero ya pertenece a esta ruta');
    }

    const node = this.nodeRepository.create({
      ...createNodeDto,
      route: { id: createNodeDto.routeId },
      busStop: { id: createNodeDto.busStopId },
    });
    return await this.nodeRepository.save(node);
  }

  async findAll(): Promise<Node[]> {
    return await this.nodeRepository.find({ relations: ['route', 'busStop'] });
  }

  async findOne(id: string): Promise<Node> {
    const node = await this.nodeRepository.findOne({ where: { id }, relations: ['route', 'busStop'] });
    if (!node) {
      throw new NotFoundException(`Node with ID ${id} not found`);
    }
    return node;
  }

  async update(id: string, updateNodeDto: UpdateNodeDto): Promise<Node> {
    const node = await this.findOne(id);
    if (updateNodeDto.routeId) {
      node.route = { id: updateNodeDto.routeId } as any;
    }
    if (updateNodeDto.busStopId) {
      node.busStop = { id: updateNodeDto.busStopId } as any;
    }
    this.nodeRepository.merge(node, updateNodeDto);
    return await this.nodeRepository.save(node);
  }

  async remove(id: string): Promise<void> {
    const node = await this.findOne(id);
    await this.nodeRepository.remove(node);
  }
}
