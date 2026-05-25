import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCompanyDriverDto } from './dto/create-company_driver.dto';
import { UpdateCompanyDriverDto } from './dto/update-company_driver.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { CompanyDriver, CompanyDriverStatus } from './entities/company_driver.entity';
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

  private mapCompanyDriver(cd: CompanyDriver) {
    const driver = cd.driver as any;
    if (driver?.person) {
      driver.name = driver.person.name;
      driver.last_name = driver.person.lastName;
      driver.email = driver.person.email;
      driver.licencia = driver.license;
    }
    return cd;
  }

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

    const alreadyLinked = await this.companyDriverRepository.findOne({
      where: {
        company: { id: createCompanyDriverDto.companyId },
        driver: { id: createCompanyDriverDto.driverId },
      },
    });
    if (alreadyLinked) {
      throw new BadRequestException('Este conductor ya está vinculado a la empresa');
    }

    const companyDriver = this.companyDriverRepository.create({
      company,
      driver,
      status: createCompanyDriverDto.status ?? CompanyDriverStatus.ACTIVE,
    });
    const saved = await this.companyDriverRepository.save(companyDriver);
    return this.mapCompanyDriver(await this.findOne(saved.id!));
  }

  async findAll() {
    const list = await this.companyDriverRepository.find({
      relations: ['company', 'driver', 'driver.person'],
    });
    return list.map((cd) => this.mapCompanyDriver(cd));
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
