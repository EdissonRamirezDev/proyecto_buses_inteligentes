import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { Gps } from './entities/gps.entity';
import { BusesService } from 'src/buses/buses.service';
import { CreateGpsDto } from './dto/create-gps.dto';
import { UpdateGpDto } from './dto/update-gps.dto';

@Injectable()
export class GpsService {
  constructor(
    @InjectRepository(Gps)
    private readonly gpsRepository: Repository<Gps>,
    private readonly busService: BusesService
  ) { }

  /** Un bus tiene un solo registro GPS (1:1): actualizar posición, no insertar duplicados. */
  async create(createGpsDto: CreateGpsDto) {
    if (!createGpsDto.bus_id) {
      throw new BadRequestException('bus_id es requerido para reportar GPS');
    }

    const bus = await this.busService.findOne(createGpsDto.bus_id).catch(() => null);
    if (!bus) {
      throw new NotFoundException('Bus id not found');
    }

    let gps = await this.gpsRepository.findOne({
      where: { bus: { id: createGpsDto.bus_id } },
      relations: ['bus'],
    });

    if (gps) {
      gps.latitude = createGpsDto.latitude;
      gps.longitude = createGpsDto.longitude;
      return await this.gpsRepository.save(gps);
    }

    gps = this.gpsRepository.create({
      latitude: createGpsDto.latitude,
      longitude: createGpsDto.longitude,
      bus,
    });
    return await this.gpsRepository.save(gps);
  }

  async findAll() {
    return await this.gpsRepository.find();
  }

  async findOne(id: number) {
    const gps = await this.gpsRepository.findOne({
      where: { id },
    });

    if (!gps) throw new NotFoundException(`Gps #${id} no encontrado`);
    return gps;
  }

  async update(id: number, updateProjectorDto: UpdateGpDto) {
    const gps = await this.findOne(id);

    // if (updateProjectorDto.theater) {
    //   const theater = await this.theaterService
    //     .findOne(updateProjectorDto.theater.id??0)
    //     .catch(() => null);

    //   if (!theater) {
    //     throw new NotFoundException('Theater id not found');
    //   }
    // }

    Object.assign(gps, updateProjectorDto);

    return await this.gpsRepository.save(gps);
  }

  async remove(id: number) {
    const gps = await this.findOne(id);

    await this.gpsRepository.remove(gps);

    return { message: `Gps #${id} eliminado correctamente` };
  }

}