import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Shift } from './entities/shift.entity';
import { Repository } from 'typeorm';
import { BusesService } from 'src/buses/buses.service';
import { DriversService } from 'src/drivers/drivers.service';

@Injectable()
export class ShiftsService {
  constructor(
    @InjectRepository(Shift)
    private readonly shiftRepository: Repository<Shift>,
    private readonly busService: BusesService,
    private readonly driverService: DriversService,
  ) {}

  private resolveId(value: any): number | undefined {
    if (!value) return undefined;
    if (typeof value === 'number') return value;
    if (typeof value === 'object' && 'id' in value) return (value as any).id;
    return undefined;
  }

  async create(createShiftDto: CreateShiftDto): Promise<Shift> {
    const busId = this.resolveId(createShiftDto.bus_id);
    const driverId = this.resolveId(createShiftDto.driver_id);

    if (!busId) throw new BadRequestException('bus id is required');
    if (!driverId) throw new BadRequestException('driver id is required');

    const bus = await this.busService.findOne(busId);
    if (!bus) throw new NotFoundException(`Bus with id ${busId} not found`);

    const driver = await this.driverService.findOne(driverId);
    if (!driver) throw new NotFoundException(`Driver with id ${driverId} not found`);

    const shift = this.shiftRepository.create({
      fecha_inicio: createShiftDto.fecha_inicio ? new Date(createShiftDto.fecha_inicio) : undefined,
      fecha_fin: createShiftDto.fecha_fin ? new Date(createShiftDto.fecha_fin) : undefined,
      estado: createShiftDto.estado,
      bus,
      driver,
    });

    return this.shiftRepository.save(shift);
  }

  async findAll() {
    return await this.shiftRepository.find({
      relations: ['bus', 'driver']
    });
  }

  async findOne(id: number) {
    const shift = await this.shiftRepository.findOne({
      where: {id},
      relations: ['bus', 'driver']
    });

    if (!shift) throw new NotFoundException(`Turno #${id} no encontrado`);
    return shift;
  }

  async update(id: number, updateShiftDto: UpdateShiftDto) {
    const shift = await this.findOne(id);

    const updated = Object.assign(shift, updateShiftDto);

    return await this.shiftRepository.save(updated);
  }

  async remove(id: number) {
    const shift = await this.findOne(id);

    await this.shiftRepository.remove(shift);

    return { message: `Turno #${id} eliminado correctamente` };
  }
}
