import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Ticket } from './entities/ticket.entity';
import { Citizen } from '../citizens/entities/citizen.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { CitizenPaymentMethod } from '../citizen-payment-methods/entities/citizen-payment-method.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket) private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(Citizen) private readonly citizenRepository: Repository<Citizen>,
    @InjectRepository(Schedule) private readonly scheduleRepository: Repository<Schedule>,
    private dataSource: DataSource
  ) {}

  async purchaseTicket(citizenId: string, scheduleId: string, citizenPaymentMethodId?: string): Promise<Ticket> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Fetch Citizen and Schedule (with Route)
      const citizen = await queryRunner.manager.findOne(Citizen, { where: { id: citizenId } });
      if (!citizen) throw new NotFoundException('Ciudadano no encontrado');

      const schedule = await queryRunner.manager.findOne(Schedule, { 
        where: { id: scheduleId },
        relations: ['route']
      });
      if (!schedule) throw new NotFoundException('Despacho no encontrado');
      if (!schedule.route) throw new BadRequestException('El despacho no tiene una ruta asignada con tarifa');

      let citizenPaymentMethod: CitizenPaymentMethod | null = null;
      if (citizenPaymentMethodId) {
        citizenPaymentMethod = await queryRunner.manager.findOne(CitizenPaymentMethod, {
          where: { id: citizenPaymentMethodId, citizen: { id: citizenId } }
        });
        if (!citizenPaymentMethod) {
          throw new NotFoundException('Método de pago del ciudadano no encontrado o no le pertenece');
        }
      }

      const tarifa = Number(schedule.route.tarifa);
      const saldoActual = Number(citizen.saldo);

      // 2. Validate balance
      if (saldoActual < tarifa) {
        throw new BadRequestException('Saldo insuficiente para comprar el boleto');
      }

      // 3. Deduct balance
      citizen.saldo = saldoActual - tarifa;
      await queryRunner.manager.save(citizen);

      // 4. Create Ticket
      const ticket = new Ticket();
      ticket.codigo_qr = uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase(); // Simulated QR Hash
      ticket.estado = 'activo';
      ticket.precio_pagado = tarifa;
      ticket.citizen = citizen;
      ticket.schedule = schedule;
      if (citizenPaymentMethod) {
        ticket.citizenPaymentMethod = citizenPaymentMethod;
      }

      const savedTicket = await queryRunner.manager.save(ticket);

      await queryRunner.commitTransaction();
      return savedTicket;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(): Promise<Ticket[]> {
    return await this.ticketRepository.find({
      relations: ['citizen', 'schedule', 'schedule.route']
    });
  }

  async remove(id: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const ticket = await queryRunner.manager.findOne(Ticket, { 
        where: { id }, 
        relations: ['citizen'] 
      });
      if (!ticket) throw new NotFoundException('Boleto no encontrado');

      // Devolver saldo al ciudadano si el boleto estaba activo
      if (ticket.estado === 'activo' && ticket.citizen) {
        ticket.citizen.saldo = Number(ticket.citizen.saldo) + Number(ticket.precio_pagado);
        await queryRunner.manager.save(ticket.citizen);
      }

      ticket.estado = 'cancelado';
      await queryRunner.manager.save(ticket);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
