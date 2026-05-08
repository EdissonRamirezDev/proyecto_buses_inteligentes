import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Company } from './entities/company.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  async create(createCompanyDto: CreateCompanyDto) {
    const company = this.companyRepository.create(createCompanyDto);
    return await this.companyRepository.save(company);
  }

  async findAll() {
    return await this.companyRepository.find({ relations: ['companyDrivers', 'buses'] });
  }

  async findOne(id: number) {
    const company = await this.companyRepository.findOne({ where: { id }, relations: ['companyDrivers', 'buses'] });
    if (!company) throw new NotFoundException(`Company #${id} no encontrado`);
    return company;
  }

  async update(id: number, updateCompanyDto: UpdateCompanyDto) {
    const company = await this.findOne(id);
    const updated = Object.assign(company, updateCompanyDto);
    return await this.companyRepository.save(updated);
  }

  async remove(id: number) {
    const company = await this.findOne(id);
    await this.companyRepository.remove(company);
    return { message: `Company #${id} eliminado correctamente` };
  }
}
