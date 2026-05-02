import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBusDto } from './dto/create-bus.dto';
import { UpdateBusDto } from './dto/update-bus.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Bus } from './entities/bus.entity';
import { Repository } from 'typeorm';

@Injectable()
export class BusesService {

  constructor(
    @InjectRepository(Bus)
    private readonly busRepository: Repository<Bus>,
  ) {}

  async create(createBusDto: CreateBusDto): Promise<Bus>{
    const bus = this.busRepository.create(createBusDto);
    return await this.busRepository.save(bus);
  }

  async findAll() {
    return await this.busRepository.find();
  }

  async findOne(id: number) {
    const bus = await this.busRepository.findOne({
      where: {id}
    });

    if (!bus) throw new NotFoundException(`Bus #${id} no encontrado`);
    return bus;
  }

  async update(id: number, updateBusDto: UpdateBusDto) {
    const bus = await this.findOne(id);

    const updated = Object.assign(bus, updateBusDto);

    return await this.busRepository.save(updated);
  }

  async remove(id: number) {
    const bus = await this.findOne(id); // asegura que exista

    // if (theater.projector) {
    //   throw new BadRequestException('No se puede eliminar el teatro porque tiene un proyector asociado');
    // }

    await this.busRepository.remove(bus);

    return { message: `Bus #${id} eliminado correctamente` };
  }
}
