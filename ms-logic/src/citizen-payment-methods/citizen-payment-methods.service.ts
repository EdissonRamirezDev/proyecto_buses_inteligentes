import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CitizenPaymentMethod } from './entities/citizen-payment-method.entity';
import { CreateCitizenPaymentMethodDto } from './dto/create-citizen-payment-method.dto';
import { UpdateCitizenPaymentMethodDto } from './dto/update-citizen-payment-method.dto';
import { Citizen } from '../citizens/entities/citizen.entity';
import { PaymentMethod } from '../payment-methods/entities/payment-method.entity';

@Injectable()
export class CitizenPaymentMethodsService {
  constructor(
    @InjectRepository(CitizenPaymentMethod)
    private readonly citizenPaymentMethodRepository: Repository<CitizenPaymentMethod>,
    @InjectRepository(Citizen)
    private readonly citizenRepository: Repository<Citizen>,
    @InjectRepository(PaymentMethod)
    private readonly paymentMethodRepository: Repository<PaymentMethod>,
  ) {}

  async create(createDto: CreateCitizenPaymentMethodDto): Promise<CitizenPaymentMethod> {
    const citizen = await this.citizenRepository.findOne({ where: { id: createDto.citizenId } });
    if (!citizen) {
      throw new NotFoundException(`Citizen with ID ${createDto.citizenId} not found`);
    }

    const paymentMethod = await this.paymentMethodRepository.findOne({ where: { id: createDto.paymentMethodId } });
    if (!paymentMethod) {
      throw new NotFoundException(`PaymentMethod with ID ${createDto.paymentMethodId} not found`);
    }

    const citizenPaymentMethod = this.citizenPaymentMethodRepository.create({
      citizen,
      paymentMethod,
      identificador_instrumento: createDto.identificador_instrumento,
      is_active: createDto.is_active ?? true,
    });

    return await this.citizenPaymentMethodRepository.save(citizenPaymentMethod);
  }

  async findAll(): Promise<CitizenPaymentMethod[]> {
    return await this.citizenPaymentMethodRepository.find({
      relations: ['citizen', 'paymentMethod'],
    });
  }

  async findOne(id: string): Promise<CitizenPaymentMethod> {
    const record = await this.citizenPaymentMethodRepository.findOne({
      where: { id },
      relations: ['citizen', 'paymentMethod'],
    });
    if (!record) {
      throw new NotFoundException(`CitizenPaymentMethod with ID ${id} not found`);
    }
    return record;
  }

  async update(id: string, updateDto: UpdateCitizenPaymentMethodDto): Promise<CitizenPaymentMethod> {
    const record = await this.findOne(id);
    
    if (updateDto.citizenId) {
      const citizen = await this.citizenRepository.findOne({ where: { id: updateDto.citizenId } });
      if (!citizen) throw new NotFoundException(`Citizen with ID ${updateDto.citizenId} not found`);
      record.citizen = citizen;
    }

    if (updateDto.paymentMethodId) {
      const paymentMethod = await this.paymentMethodRepository.findOne({ where: { id: updateDto.paymentMethodId } });
      if (!paymentMethod) throw new NotFoundException(`PaymentMethod with ID ${updateDto.paymentMethodId} not found`);
      record.paymentMethod = paymentMethod;
    }

    if (updateDto.identificador_instrumento !== undefined) {
      record.identificador_instrumento = updateDto.identificador_instrumento;
    }

    if (updateDto.is_active !== undefined) {
      record.is_active = updateDto.is_active;
    }

    return await this.citizenPaymentMethodRepository.save(record);
  }

  async remove(id: string): Promise<void> {
    const record = await this.findOne(id);
    await this.citizenPaymentMethodRepository.remove(record);
  }
}
