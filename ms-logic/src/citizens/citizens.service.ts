import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCitizenDto } from './dto/create-citizen.dto';
import { UpdateCitizenDto } from './dto/update-citizen.dto';
import { Citizen } from './entities/citizen.entity';
import { WalletTransaction } from './entities/wallet-transaction.entity';
import { Person } from '../persons/entities/person.entity';

@Injectable()
export class CitizensService {
  constructor(
    @InjectRepository(Citizen)
    private readonly citizenRepository: Repository<Citizen>,
    @InjectRepository(WalletTransaction)
    private readonly transactionRepository: Repository<WalletTransaction>,
    @InjectRepository(Person)
    private readonly personRepository: Repository<Person>,
  ) {}

  /** Respuesta plana para el frontend (userId y nombres viven en Person). */
  mapCitizenToResponse(citizen: Citizen) {
    return {
      id: citizen.id,
      userId: citizen.person?.userId,
      email: citizen.person?.email,
      nombres: citizen.person?.name ?? '',
      apellidos: citizen.person?.lastName ?? '',
      telefono: citizen.person?.phone,
      direccion: citizen.direccion,
      fecha_nacimiento: citizen.fecha_nacimiento,
      saldo: Number(citizen.saldo),
      weatherAlertsEnabled: citizen.weatherAlertsEnabled,
      habitualTravelTime: citizen.habitualTravelTime,
      person: citizen.person ? {
        id: citizen.person.id,
        userId: citizen.person.userId,
        name: citizen.person.name,
        lastName: citizen.person.lastName,
        email: citizen.person.email,
        phone: citizen.person.phone,
      } : null,
    };
  }

  async create(createCitizenDto: CreateCitizenDto) {
    let person = await this.personRepository.findOne({
      where: { userId: createCitizenDto.userId }
    });

    if (!person) {
      person = this.personRepository.create({
        userId: createCitizenDto.userId,
        name: createCitizenDto.nombres,
        lastName: createCitizenDto.apellidos,
        email: createCitizenDto.email,
        phone: createCitizenDto.telefono,
      });
      person = await this.personRepository.save(person);
    } else {
      let personUpdated = false;
      if (createCitizenDto.email && person.email !== createCitizenDto.email) {
        person.email = createCitizenDto.email;
        personUpdated = true;
      }
      if (createCitizenDto.nombres && person.name !== createCitizenDto.nombres) {
        person.name = createCitizenDto.nombres;
        personUpdated = true;
      }
      if (createCitizenDto.apellidos && person.lastName !== createCitizenDto.apellidos) {
        person.lastName = createCitizenDto.apellidos;
        personUpdated = true;
      }
      if (createCitizenDto.telefono && person.phone !== createCitizenDto.telefono) {
        person.phone = createCitizenDto.telefono;
        personUpdated = true;
      }
      if (personUpdated) {
        person = await this.personRepository.save(person);
      }

      const existing = await this.citizenRepository.findOne({
        where: { person: { id: person.id } },
        relations: ['person'],
      });
      if (existing) {
        let citizenUpdated = false;
        if (createCitizenDto.direccion && existing.direccion !== createCitizenDto.direccion) {
          existing.direccion = createCitizenDto.direccion;
          citizenUpdated = true;
        }
        if (createCitizenDto.fecha_nacimiento && existing.fecha_nacimiento !== createCitizenDto.fecha_nacimiento) {
          existing.fecha_nacimiento = createCitizenDto.fecha_nacimiento;
          citizenUpdated = true;
        }
        if (citizenUpdated) {
          const savedExisting = await this.citizenRepository.save(existing);
          return this.mapCitizenToResponse(savedExisting);
        }
        return this.mapCitizenToResponse(existing);
      }
    }

    const citizen = this.citizenRepository.create({
      direccion: createCitizenDto.direccion,
      fecha_nacimiento: createCitizenDto.fecha_nacimiento,
      saldo: createCitizenDto.saldo ?? 0,
      person,
    });
    const saved = await this.citizenRepository.save(citizen);
    return this.mapCitizenToResponse(await this.findOneEntity(saved.id));
  }

  private async findOneEntity(id: string): Promise<Citizen> {
    const citizen = await this.citizenRepository.findOne({ where: { id }, relations: ['person'] });
    if (!citizen) {
      throw new NotFoundException(`Citizen with ID ${id} not found`);
    }
    return citizen;
  }

  async findAll() {
    const citizens = await this.citizenRepository.find({ relations: ['person'] });
    return citizens.map((c) => this.mapCitizenToResponse(c));
  }

  async findOne(id: string) {
    const citizen = await this.findOneEntity(id);
    return this.mapCitizenToResponse(citizen);
  }

  async getWeatherSubscribers() {
    const citizens = await this.citizenRepository.find({
      where: { weatherAlertsEnabled: true },
      relations: ['person']
    });
    return citizens.map((c) => this.mapCitizenToResponse(c));
  }

  async update(id: string, updateCitizenDto: UpdateCitizenDto) {
    const citizen = await this.findOneEntity(id);
    if (updateCitizenDto.direccion !== undefined) {
      citizen.direccion = updateCitizenDto.direccion;
    }
    if (updateCitizenDto.fecha_nacimiento !== undefined) {
      citizen.fecha_nacimiento = updateCitizenDto.fecha_nacimiento;
    }
    if (updateCitizenDto.saldo !== undefined) {
      citizen.saldo = updateCitizenDto.saldo;
    }
    if (citizen.person && (updateCitizenDto.nombres || updateCitizenDto.apellidos || updateCitizenDto.telefono)) {
      if (updateCitizenDto.nombres) citizen.person.name = updateCitizenDto.nombres;
      if (updateCitizenDto.apellidos) citizen.person.lastName = updateCitizenDto.apellidos;
      if (updateCitizenDto.telefono !== undefined) citizen.person.phone = updateCitizenDto.telefono;
      await this.personRepository.save(citizen.person);
    }
    
    if (updateCitizenDto.weatherAlertsEnabled !== undefined) {
      citizen.weatherAlertsEnabled = updateCitizenDto.weatherAlertsEnabled;
    }
    if (updateCitizenDto.habitualTravelTime !== undefined) {
      citizen.habitualTravelTime = updateCitizenDto.habitualTravelTime;
    }

    const saved = await this.citizenRepository.save(citizen);
    return this.mapCitizenToResponse(await this.findOneEntity(saved.id));
  }

  async remove(id: string): Promise<void> {
    const citizen = await this.findOneEntity(id);
    await this.citizenRepository.remove(citizen);
  }

  async rechargeWallet(id: string, monto: number, referencia: string, metodoPago?: string) {
    if (monto <= 0) {
      throw new BadRequestException('El monto de recarga debe ser positivo');
    }

    const citizen = await this.findOneEntity(id);
    citizen.saldo = Number(citizen.saldo) + Number(monto);

    const refConMetodo = metodoPago
      ? `${referencia}|metodo:${metodoPago.toLowerCase()}`
      : referencia;

    const transaction = this.transactionRepository.create({
      monto,
      tipo: 'RECARGA',
      referencia_externa: refConMetodo,
      citizen
    });

    await this.transactionRepository.save(transaction);
    const saved = await this.citizenRepository.save(citizen);
    return this.mapCitizenToResponse(await this.findOneEntity(saved.id));
  }

  async getTransactions(id: string): Promise<WalletTransaction[]> {
    return await this.transactionRepository.find({
      where: { citizen: { id } },
      order: { fecha_transaccion: 'DESC' }
    });
  }
}
