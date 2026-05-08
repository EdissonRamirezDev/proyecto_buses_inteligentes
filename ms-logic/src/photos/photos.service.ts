import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePhotoDto } from './dto/create-photo.dto';
import { UpdatePhotoDto } from './dto/update-photo.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Photo } from './entities/photo.entity';
import { Repository } from 'typeorm';
import { BusesIncidentsService } from 'src/buses_incidents/buses_incidents.service';

@Injectable()
export class PhotosService {
  constructor(
    @InjectRepository(Photo)
    private readonly photoRepository: Repository<Photo>,
    private readonly busIncidentService: BusesIncidentsService
  ) {}

  async create(createPhotoDto: CreatePhotoDto) {
    let busIncident: any = null;
    if (createPhotoDto.busIncidentId) {
      busIncident = await this.busIncidentService
        .findOne(createPhotoDto.busIncidentId)
        .catch(() => null);

      if (!busIncident) {
        throw new NotFoundException('Bus Incident id not found');
      }
    }
    const photo = this.photoRepository.create({
      ...createPhotoDto,
      busIncident: busIncident
    });
    return await this.photoRepository.save(photo);
  }

  async findAll() {
    return await this.photoRepository.find({ relations: ['busIncident'] });
  }

  async findOne(id: number) {
    const photo = await this.photoRepository.findOne({ where: { id }, relations: ['busIncident'] });
    if (!photo) throw new NotFoundException(`Photo #${id} no encontrado`);
    return photo;
  }

  async update(id: number, updatePhotoDto: UpdatePhotoDto) {
    const photo = await this.findOne(id);
    const updated = Object.assign(photo, updatePhotoDto);
    return await this.photoRepository.save(updated);
  }

  async remove(id: number) {
    const photo = await this.findOne(id);
    await this.photoRepository.remove(photo);
    return { message: `Photo #${id} eliminado correctamente` };
  }
}
