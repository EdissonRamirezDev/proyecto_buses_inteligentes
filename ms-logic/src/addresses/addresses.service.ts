import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from './entities/address.entity';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { Citizen } from '../citizens/entities/citizen.entity';

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    @InjectRepository(Citizen)
    private readonly citizenRepository: Repository<Citizen>,
  ) {}

  async create(createAddressDto: CreateAddressDto): Promise<Address> {
    const citizen = await this.citizenRepository.findOne({ 
      where: { id: createAddressDto.citizenId },
      relations: ['address']
    });
    if (!citizen) {
      throw new NotFoundException(`Citizen with ID ${createAddressDto.citizenId} not found`);
    }

    if (citizen.address) {
      throw new BadRequestException(`Citizen with ID ${createAddressDto.citizenId} already has an address`);
    }

    const address = this.addressRepository.create({
      direccion: createAddressDto.direccion,
      ciudad: createAddressDto.ciudad,
      citizen,
    });

    return await this.addressRepository.save(address);
  }

  async findAll(): Promise<Address[]> {
    return await this.addressRepository.find({ relations: ['citizen'] });
  }

  async findOne(id: string): Promise<Address> {
    const address = await this.addressRepository.findOne({ 
      where: { id },
      relations: ['citizen'] 
    });
    if (!address) {
      throw new NotFoundException(`Address with ID ${id} not found`);
    }
    return address;
  }

  async update(id: string, updateAddressDto: UpdateAddressDto): Promise<Address> {
    const address = await this.findOne(id);
    
    if (updateAddressDto.citizenId && updateAddressDto.citizenId !== address.citizen?.id) {
      const citizen = await this.citizenRepository.findOne({ 
        where: { id: updateAddressDto.citizenId },
        relations: ['address']
      });
      if (!citizen) {
        throw new NotFoundException(`Citizen with ID ${updateAddressDto.citizenId} not found`);
      }
      if (citizen.address) {
        throw new BadRequestException(`Citizen with ID ${updateAddressDto.citizenId} already has an address`);
      }
      address.citizen = citizen;
    }

    if (updateAddressDto.direccion !== undefined) {
      address.direccion = updateAddressDto.direccion;
    }

    if (updateAddressDto.ciudad !== undefined) {
      address.ciudad = updateAddressDto.ciudad;
    }

    return await this.addressRepository.save(address);
  }

  async remove(id: string): Promise<void> {
    const address = await this.findOne(id);
    await this.addressRepository.remove(address);
  }
}
