import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCitizenDto } from './dto/create-citizen.dto';
import { UpdateCitizenDto } from './dto/update-citizen.dto';
import { Citizen } from './entities/citizen.entity';
import { WalletTransaction } from './entities/wallet-transaction.entity';

@Injectable()
export class CitizensService {
  constructor(
    @InjectRepository(Citizen)
    private readonly citizenRepository: Repository<Citizen>,
    @InjectRepository(WalletTransaction)
    private readonly transactionRepository: Repository<WalletTransaction>,
  ) {}

  async create(createCitizenDto: CreateCitizenDto): Promise<Citizen> {
    const citizen = this.citizenRepository.create(createCitizenDto);
    return await this.citizenRepository.save(citizen);
  }

  async findAll(): Promise<Citizen[]> {
    return await this.citizenRepository.find();
  }

  async findOne(id: string): Promise<Citizen> {
    const citizen = await this.citizenRepository.findOne({ where: { id } });
    if (!citizen) {
      throw new NotFoundException(`Citizen with ID ${id} not found`);
    }
    return citizen;
  }

  async update(id: string, updateCitizenDto: UpdateCitizenDto): Promise<Citizen> {
    const citizen = await this.findOne(id);
    this.citizenRepository.merge(citizen, updateCitizenDto);
    return await this.citizenRepository.save(citizen);
  }

  async remove(id: string): Promise<void> {
    const citizen = await this.findOne(id);
    await this.citizenRepository.remove(citizen);
  }

  async rechargeWallet(id: string, monto: number, referencia: string): Promise<Citizen> {
    if (monto <= 0) throw new Error('El monto de recarga debe ser positivo');

    const citizen = await this.findOne(id);
    citizen.saldo = Number(citizen.saldo) + Number(monto);

    const transaction = this.transactionRepository.create({
      monto,
      tipo: 'RECARGA',
      referencia_externa: referencia,
      citizen
    });

    await this.transactionRepository.save(transaction);
    return await this.citizenRepository.save(citizen);
  }

  async getTransactions(id: string): Promise<WalletTransaction[]> {
    return await this.transactionRepository.find({
      where: { citizen: { id } },
      order: { fecha_transaccion: 'DESC' }
    });
  }
}
