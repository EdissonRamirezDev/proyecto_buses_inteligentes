import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCompanyDriverDto } from './dto/create-company_driver.dto';
import { UpdateCompanyDriverDto } from './dto/update-company_driver.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { CompanyDriver } from './entities/company_driver.entity';
import { Repository } from 'typeorm';
import { CompaniesService } from 'src/companies/companies.service';
import { DriversService } from 'src/drivers/drivers.service';

@Injectable()
export class CompanyDriversService {
  constructor(
    @InjectRepository(CompanyDriver)
    private readonly companyDriverRepository: Repository<CompanyDriver>,
    private readonly companyService: CompaniesService,
    private readonly driverService: DriversService
  ) {}

  async create(createCompanyDriverDto: CreateCompanyDriverDto) {
    let company: any = null;
    if (createCompanyDriverDto.companyId) {
      company = await this.companyService
        .findOne(createCompanyDriverDto.companyId)
        .catch(() => null);

      if (!company) {
        throw new NotFoundException('Company id not found');
      }
    }

    let driver: any = null;
    if (createCompanyDriverDto.driverId) {
      driver = await this.driverService
        .findOne(createCompanyDriverDto.driverId)
        .catch(() => null);

      if (!driver) {
        throw new NotFoundException('Driver id not found');
      }
    }
    const companyDriver = this.companyDriverRepository.create({
      ...createCompanyDriverDto,
      company: company,
      driver: driver
    });
    return await this.companyDriverRepository.save(companyDriver);
  }

  async findAll() {
    return await this.companyDriverRepository.find({ relations: ['company', 'driver', 'driver.person'] });
  }

  async findOne(id: number) {
    const companyDriver = await this.companyDriverRepository.findOne({ where: { id }, relations: ['company', 'driver', 'driver.person'] });
    if (!companyDriver) throw new NotFoundException(`CompanyDriver #${id} no encontrado`);
    return companyDriver;
  }

  async update(id: number, updateCompanyDriverDto: UpdateCompanyDriverDto) {
    const companyDriver = await this.findOne(id);
    const updated = Object.assign(companyDriver, updateCompanyDriverDto);
    return await this.companyDriverRepository.save(updated);
  }

  async remove(id: number) {
    const companyDriver = await this.findOne(id);
    await this.companyDriverRepository.remove(companyDriver);
    return { message: `CompanyDriver #${id} eliminado correctamente` };
  }
}
