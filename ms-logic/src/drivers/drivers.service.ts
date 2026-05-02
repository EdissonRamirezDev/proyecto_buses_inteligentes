import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Driver } from './entities/driver.entity';
import { Repository } from 'typeorm';

@Injectable()
export class DriversService {
  constructor(
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
  ) {}
  async create(createDriverDto: CreateDriverDto): Promise<Driver> {
      const driver = this.driverRepository.create({
        ...createDriverDto,
      });
      return this.driverRepository.save(driver);
    }

  async findAll() {
    return await this.driverRepository.find();
  }

  async findOne(id: number) {
    const driver = await this.driverRepository.findOne({ where: { id } });
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
