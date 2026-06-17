import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pqrs } from './entities/pqrs.entity';
import { CreatePqrsDto } from './dto/create-pqrs.dto';
import { UpdatePqrsDto } from './dto/update-pqrs.dto';

@Injectable()
export class PqrsService {
  constructor(
    @InjectRepository(Pqrs)
    private pqrsRepository: Repository<Pqrs>,
  ) {}

  async create(createPqrsDto: CreatePqrsDto) {
    const pqrs = this.pqrsRepository.create(createPqrsDto);
    return await this.pqrsRepository.save(pqrs);
  }

  async findByRadicado(radicado: string) {
    const pqrs = await this.pqrsRepository.findOne({ where: { radicado } });
    if (!pqrs) {
      throw new NotFoundException(`No se encontró un PQRS con el radicado ${radicado}`);
    }
    return pqrs;
  }

  async update(id: string, updatePqrsDto: UpdatePqrsDto) {
    const pqrs = await this.pqrsRepository.findOneBy({ id });
    if (!pqrs) {
      throw new NotFoundException(`PQRS with ID ${id} not found`);
    }
    
    this.pqrsRepository.merge(pqrs, updatePqrsDto);
    return await this.pqrsRepository.save(pqrs);
  }

  // Solo para admin si lo necesitaran
  async findAll() {
    return await this.pqrsRepository.find({ order: { createdAt: 'DESC' } });
  }
}
