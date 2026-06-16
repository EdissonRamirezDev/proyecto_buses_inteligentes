import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Advisor } from './entities/advisor.entity';
import { CreateAdvisorDto } from './dto/create-advisor.dto';
import { UpdateAdvisorDto } from './dto/update-advisor.dto';

@Injectable()
export class AdvisorsService {
  constructor(
    @InjectRepository(Advisor)
    private readonly advisorRepository: Repository<Advisor>,
  ) {}

  async create(createAdvisorDto: CreateAdvisorDto) {
    const advisor = this.advisorRepository.create(createAdvisorDto);
    return await this.advisorRepository.save(advisor);
  }

  async findAll() {
    return await this.advisorRepository.find({
      order: {
        nombre: 'ASC'
      }
    });
  }

  async findActive() {
    return await this.advisorRepository.find({
      where: { isActive: true },
      order: { nombre: 'ASC' }
    });
  }

  async findOne(id: string) {
    const advisor = await this.advisorRepository.findOneBy({ id });
    if (!advisor) {
      throw new NotFoundException(`Advisor with ID ${id} not found`);
    }
    return advisor;
  }

  async update(id: string, updateAdvisorDto: UpdateAdvisorDto) {
    const advisor = await this.findOne(id);
    this.advisorRepository.merge(advisor, updateAdvisorDto);
    return await this.advisorRepository.save(advisor);
  }

  async remove(id: string) {
    const advisor = await this.findOne(id);
    return await this.advisorRepository.remove(advisor);
  }
}
