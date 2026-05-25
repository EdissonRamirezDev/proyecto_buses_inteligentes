import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Driver } from './entities/driver.entity';
import { Person } from 'src/persons/entities/person.entity';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';

@Injectable()
export class DriversService {
  constructor(
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
    @InjectRepository(Person)
    private readonly personRepository: Repository<Person>,
  ) {}
  
  mapDriver(driver: Driver) {
    return {
      ...driver,
      name: driver.person?.name,
      last_name: driver.person?.lastName,
      email: driver.person?.email,
      phone: driver.person?.phone,
      licencia: driver.license,
      license: driver.license,
    };
  }

  async create(createDriverDto: CreateDriverDto): Promise<Driver> {
    let person: Person;

    if (createDriverDto.personId) {
      const found = await this.personRepository.findOne({ where: { id: createDriverDto.personId } });
      if (!found) {
        throw new NotFoundException('Persona no encontrada');
      }
      person = found;
    } else if (createDriverDto.name?.trim() && createDriverDto.last_name?.trim()) {
      const newPerson = this.personRepository.create({
        userId: `driver-${randomUUID()}`,
        name: createDriverDto.name.trim(),
        lastName: createDriverDto.last_name.trim(),
        email: createDriverDto.email?.trim(),
        phone: createDriverDto.phone?.trim(),
      });
      person = await this.personRepository.save(newPerson);
    } else {
      throw new BadRequestException('Indique nombre y apellido o un personId válido');
    }

    const license = createDriverDto.license?.trim();
    if (!license) {
      throw new BadRequestException('La licencia de conducir es requerida');
    }

    const driverEntity = this.driverRepository.create({
      license,
      status: createDriverDto.status || 'activo',
      person,
    });
    const saved = await this.driverRepository.save(driverEntity);
    const full = await this.driverRepository.findOne({
      where: { id: saved.id },
      relations: ['person'],
    });
    if (!full) {
      throw new NotFoundException('Error al recuperar el conductor creado');
    }
    return this.mapDriver(full);
  }

  async findAll() {
    const drivers = await this.driverRepository.find({ relations: ['person'] });
    return drivers.map((d) => this.mapDriver(d));
  }

  async findOne(id: number) {
    const driver = await this.driverRepository.findOne({ 
      where: { id },
      relations: ['person', 'shifts', 'shifts.bus', 'companyDrivers', 'companyDrivers.company'] 
    });
    if (!driver) throw new NotFoundException(`Conductor #${id} no encontrado`);
    return this.mapDriver(driver);
  }

  async update(id: number, updateDriverDto: UpdateDriverDto) {
    const driver = await this.findOne(id);
    const updated = Object.assign(driver, updateDriverDto);
    return this.driverRepository.save(updated);
  }

  async remove(id: number) {
    const driver = await this.findOne(id);
    await this.driverRepository.remove(driver);
    return { message: `Conductor #${id} eliminado correctamente` };
  }
}
