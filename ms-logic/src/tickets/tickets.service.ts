import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Like } from 'typeorm';
import { Ticket } from './entities/ticket.entity';
import { Citizen } from '../citizens/entities/citizen.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { CitizenPaymentMethod } from '../citizen-payment-methods/entities/citizen-payment-method.entity';
import { v4 as uuidv4 } from 'uuid';
import { Shift } from '../shifts/entities/shift.entity';
import { HistoryService } from '../history/history.service';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket) private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(Citizen) private readonly citizenRepository: Repository<Citizen>,
    @InjectRepository(Schedule) private readonly scheduleRepository: Repository<Schedule>,
    private dataSource: DataSource,
    private readonly historyService: HistoryService,
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
      if (schedule.estado === 'cancelado' || schedule.estado === 'completado') {
        throw new BadRequestException('La programación no está activa para abordaje');
      }
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

  async boardAtStop(
    citizenId: string,
    scheduleId: string,
    nodeId: string,
    citizenPaymentMethodId?: string,
  ) {
    const schedule = await this.scheduleRepository.findOne({
      where: { id: scheduleId },
      relations: ['bus', 'route', 'route.nodes'],
    });
    if (!schedule) {
      throw new NotFoundException('Programación no encontrada');
    }
    if (schedule.estado !== 'programado') {
      throw new BadRequestException('La programación del bus no está activa para abordaje');
    }

    const nodeOnRoute = schedule.route?.nodes?.some((n) => n.id === nodeId);
    if (!nodeOnRoute) {
      throw new BadRequestException('El paradero no pertenece a la ruta de esta programación');
    }

    let ticket = await this.ticketRepository.findOne({
      where: {
        citizen: { id: citizenId },
        schedule: { id: scheduleId },
        estado: 'activo',
      },
    });

    if (!ticket) {
      ticket = await this.purchaseTicket(citizenId, scheduleId, citizenPaymentMethodId);
    }

    const scanResult = await this.historyService.scanTicket(ticket.id, nodeId, 'ENTRADA');
    return {
      ticket,
      ...scanResult,
    };
  }

  async descendAtStop(ticketId: string, nodeId: string) {
    return this.historyService.scanTicket(ticketId, nodeId, 'SALIDA');
  }

  async findByCitizenAndCodigo(citizenId: string, codigoQr: string): Promise<Ticket | null> {
    return this.ticketRepository.findOne({
      where: {
        citizen: { id: citizenId },
        codigo_qr: codigoQr.toUpperCase(),
        estado: 'activo',
      },
      relations: ['schedule', 'schedule.bus', 'citizen'],
    });
  }

  async findActiveByCitizen(citizenId: string): Promise<Ticket[]> {
    return this.ticketRepository.find({
      where: [
        { citizen: { id: citizenId }, estado: 'activo' },
        { citizen: { id: citizenId }, estado: 'usado' },
      ],
      relations: [
        'schedule',
        'schedule.route',
        'schedule.route.nodes',
        'schedule.route.nodes.busStop',
        'schedule.bus',
        'citizenPaymentMethod',
      ],
      order: { fecha_compra: 'DESC' },
    });
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

  private mapDriverForTrip(driver: any) {
    if (!driver) return null;
    return {
      id: driver.id,
      name: driver.person?.name ?? driver.name ?? '',
      last_name: driver.person?.lastName ?? driver.last_name ?? '',
      license: driver.license ?? '',
    };
  }

  private scheduleReferenceTime(schedule: Schedule, entradaAt?: Date): Date {
    if (entradaAt && !Number.isNaN(entradaAt.getTime())) {
      return entradaAt;
    }
    const rawFecha = schedule.fecha as Date | string;
    const dateStr =
      rawFecha instanceof Date
        ? rawFecha.toISOString().slice(0, 10)
        : String(rawFecha).slice(0, 10);
    const timeRaw = String(schedule.hora_salida ?? '08:00');
    const timeStr = timeRaw.length >= 5 ? timeRaw.substring(0, 5) : '08:00';
    return new Date(`${dateStr}T${timeStr}:00`);
  }

  private async resolveDriverForBusAtTime(busId: number, referenceTime: Date) {
    const shiftRepo = this.dataSource.getRepository(Shift);

    let shift = await shiftRepo
      .createQueryBuilder('shift')
      .leftJoinAndSelect('shift.driver', 'driver')
      .leftJoinAndSelect('driver.person', 'person')
      .where('shift.bus_id = :busId', { busId })
      .andWhere('shift.fecha_inicio <= :ref', { ref: referenceTime })
      .andWhere('shift.fecha_fin >= :ref', { ref: referenceTime })
      .orderBy('shift.fecha_inicio', 'DESC')
      .getOne();

    if (!shift) {
      shift = await shiftRepo.findOne({
        where: { bus: { id: busId }, estado: Like('en_curso%') },
        relations: ['driver', 'driver.person'],
        order: { fecha_inicio: 'DESC' },
      });
    }

    return shift?.driver ? this.mapDriverForTrip(shift.driver) : null;
  }

  async getTripDetails(ticketId: string) {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId },
      relations: [
        'citizen',
        'schedule',
        'schedule.route',
        'schedule.route.nodes',
        'schedule.route.nodes.busStop',
        'schedule.bus',
        'history',
        'history.node',
        'history.node.busStop',
      ],
    });

    if (!ticket) {
      throw new NotFoundException('Boleto no encontrado');
    }

    if (ticket.history?.length) {
      ticket.history.sort(
        (a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime(),
      );
    }

    const entrada = ticket.history?.find((h) => h.tipo_validacion === 'ENTRADA');
    const salida = ticket.history?.find((h) => h.tipo_validacion === 'SALIDA');

    let driver: {
      id: number;
      name: string;
      last_name: string;
      license?: string;
    } | null = null;
    if (ticket.schedule?.bus?.id) {
      const refTime = this.scheduleReferenceTime(
        ticket.schedule,
        entrada?.fecha_hora ? new Date(entrada.fecha_hora) : undefined,
      );
      driver = await this.resolveDriverForBusAtTime(ticket.schedule.bus.id, refTime);
    }

    let totalDurationMinutes: number | null = null;
    if (entrada && salida) {
      const diffMs = new Date(salida.fecha_hora).getTime() - new Date(entrada.fecha_hora).getTime();
      totalDurationMinutes = Math.max(1, Math.round(diffMs / 60000));
    }

    return {
      ticket,
      driver,
      totalDurationMinutes,
    };
  }
}
