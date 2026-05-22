import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBusinessAdministratorDto } from './dto/create-business_administrator.dto';
import { UpdateBusinessAdministratorDto } from './dto/update-business_administrator.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessAdministrator } from './entities/business_administrator.entity';
import { Person } from '../persons/entities/person.entity';
import { Company } from '../companies/entities/company.entity';

@Injectable()
export class BusinessAdministratorService {
  constructor(
    @InjectRepository(BusinessAdministrator)
    private readonly businessAdminRepository: Repository<BusinessAdministrator>,
    @InjectRepository(Person)
    private readonly personRepository: Repository<Person>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  async create(createBusinessAdministratorDto: CreateBusinessAdministratorDto) {
    const { personId, companyId } = createBusinessAdministratorDto;

    const person = await this.personRepository.findOne({ where: { id: personId } });
    if (!person) {
      throw new NotFoundException(`Persona con ID ${personId} no encontrada`);
    }

    const company = await this.companyRepository.findOne({ where: { id: companyId } });
    if (!company) {
      throw new NotFoundException(`Empresa con ID ${companyId} no encontrada`);
    }

    // Buscar si ya existe una asociación
    let businessAdmin = await this.businessAdminRepository.findOne({
      where: { person: { id: personId } },
      relations: ['person', 'company'],
    });

    if (businessAdmin) {
      businessAdmin.company = company;
    } else {
      businessAdmin = this.businessAdminRepository.create({
        person,
        company,
      });
    }

    return await this.businessAdminRepository.save(businessAdmin);
  }

  async findAll() {
    return await this.businessAdminRepository.find({
      relations: ['person', 'company'],
    });
  }

  async findOne(id: string) {
    const admin = await this.businessAdminRepository.findOne({
      where: { id },
      relations: ['person', 'company'],
    });
    if (!admin) {
      throw new NotFoundException(`Administrador de empresa con ID ${id} no encontrado`);
    }
    return admin;
  }

  async findByPersonId(personId: string) {
    const admin = await this.businessAdminRepository.findOne({
      where: { person: { id: personId } },
      relations: ['person', 'company'],
    });
    return admin;
  }

  async findByUserId(userId: string) {
    const admin = await this.businessAdminRepository.findOne({
      where: { person: { userId } },
      relations: ['person', 'company'],
    });
    return admin;
  }

  async update(id: string, updateBusinessAdministratorDto: UpdateBusinessAdministratorDto) {
    const admin = await this.findOne(id);
    if (updateBusinessAdministratorDto.companyId) {
      const company = await this.companyRepository.findOne({ where: { id: updateBusinessAdministratorDto.companyId } });
      if (!company) {
        throw new NotFoundException(`Empresa con ID ${updateBusinessAdministratorDto.companyId} no encontrada`);
      }
      admin.company = company;
    }
    return await this.businessAdminRepository.save(admin);
  }

  async remove(id: string) {
    const admin = await this.findOne(id);
    return await this.businessAdminRepository.remove(admin);
  }

  async removeByPersonId(personId: string) {
    const admin = await this.findByPersonId(personId);
    if (!admin) {
      return { message: 'No se encontró asociación de administrador para esta persona, no es necesario eliminar.' };
    }
    await this.businessAdminRepository.remove(admin);
    return { message: 'Asociación de administrador de empresa eliminada correctamente.' };
  }
}

