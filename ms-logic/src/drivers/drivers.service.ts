import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Driver } from './entities/driver.entity';
import { Person } from 'src/persons/entities/person.entity';
import { Repository } from 'typeorm';

@Injectable()
export class DriversService {
  constructor(
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
    @InjectRepository(Person)
    private readonly personRepository: Repository<Person>,
  ) {}
  
  async create(createDriverDto: CreateDriverDto): Promise<Driver> {
    let person: any = null;
    if (createDriverDto.personId) {
      person = await this.personRepository.findOne({ where: { id: createDriverDto.personId } });
    }
    const driver = this.driverRepository.create({
      ...createDriverDto,
      person: person
    });
    return this.driverRepository.save(driver);
  }

  async findAll() {
    return await this.driverRepository.find({ relations: ['person'] });
  }

  async findOne(id: number) {
    const driver = await this.driverRepository.findOne({ 
      where: { id },
      relations: ['person', 'shifts', 'shifts.bus', 'companyDrivers', 'companyDrivers.company'] 
    });
    if (!driver) throw new NotFoundException(`Conductor #${id} no encontrado`);
    return driver;
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
