import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { StartShiftDto } from './dto/start-shift.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Shift } from './entities/shift.entity';
import { Like, Repository } from 'typeorm';
import { BusesService } from 'src/buses/buses.service';
import { DriversService } from 'src/drivers/drivers.service';
import {
  buildBusEstadoFromStart,
  buildEnCursoEstado,
  isNowWithinShiftWindow,
  isProgramado,
  parseShiftEstado,
  SHIFT_ESTADO_PROGRAMADO,
} from './shift-state.util';

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

  enrichShift(shift: Shift) {
    const parsed = parseShiftEstado(shift.estado);
    return {
      ...shift,
      estado_base: parsed.base || shift.estado,
      hora_inicio_real: parsed.startedAt ?? null,
      observaciones_inicio: parsed.observations ?? null,
      bus_status_inicio: parsed.busStatus ?? null,
      puede_iniciar:
        isProgramado(shift.estado) &&
        isNowWithinShiftWindow(shift.fecha_inicio, shift.fecha_fin),
    };
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

    const inicio = createShiftDto.fecha_inicio ? new Date(createShiftDto.fecha_inicio) : undefined;
    const fin = createShiftDto.fecha_fin ? new Date(createShiftDto.fecha_fin) : undefined;
    if (inicio && fin && inicio >= fin) {
      throw new BadRequestException('La fecha/hora de fin debe ser posterior al inicio programado.');
    }

    const shift = this.shiftRepository.create({
      fecha_inicio: inicio,
      fecha_fin: fin,
      estado: createShiftDto.estado?.toLowerCase() === 'en_curso'
        ? buildEnCursoEstado(new Date(), { busStatus: 'ok' })
        : (createShiftDto.estado ?? SHIFT_ESTADO_PROGRAMADO),
      bus,
      driver,
    });

    const saved = await this.shiftRepository.save(shift);
    return this.enrichShift(await this.findOneEntity(saved.id!));
  }

  private async findOneEntity(id: number): Promise<Shift> {
    const shift = await this.shiftRepository.findOne({
      where: { id },
      relations: ['bus', 'driver', 'driver.person'],
    });

    if (!shift) throw new NotFoundException(`Turno #${id} no encontrado`);
    return shift;
  }

  async findAll() {
    const shifts = await this.shiftRepository.find({
      relations: ['bus', 'driver', 'driver.person'],
    });

    for (const shift of shifts) {
      if (shift.bus?.id) {
        const cap = await this.busService.syncCapacityFromTickets(shift.bus.id);
        Object.assign(shift.bus, {
          capacidad: cap.disponibles,
          capacidad_max: cap.max,
          capacidad_ocupados: cap.ocupados,
          capacidad_disponible: cap.disponibles,
        });
      }
    }

    return shifts.map((s) => this.enrichShift(s));
  }

  async findOne(id: number) {
    const shift = await this.findOneEntity(id);
    if (shift.bus?.id) {
      const cap = await this.busService.syncCapacityFromTickets(shift.bus.id);
      Object.assign(shift.bus, {
        capacidad: cap.disponibles,
        capacidad_max: cap.max,
        capacidad_ocupados: cap.ocupados,
        capacidad_disponible: cap.disponibles,
      });
    }
    return this.enrichShift(shift);
  }

  async update(id: number, updateShiftDto: UpdateShiftDto) {
    const shift = await this.findOneEntity(id);

    const busId = this.resolveId(updateShiftDto.bus_id);
    const driverId = this.resolveId(updateShiftDto.driver_id);

    if (busId) {
      const bus = await this.busService.findOne(busId);
      if (!bus) throw new NotFoundException(`Bus with id ${busId} not found`);
      shift.bus = bus;
    }

    if (driverId) {
      const driver = await this.driverService.findOne(driverId);
      if (!driver) throw new NotFoundException(`Driver with id ${driverId} not found`);
      shift.driver = driver;
    }

    if (updateShiftDto.fecha_inicio) {
      shift.fecha_inicio = new Date(updateShiftDto.fecha_inicio);
    }
    if (updateShiftDto.fecha_fin) {
      shift.fecha_fin = new Date(updateShiftDto.fecha_fin);
    }

    if (updateShiftDto.estado) {
      const next = updateShiftDto.estado.trim().toLowerCase();
      if (next === 'en_curso' || next === 'activo') {
        throw new BadRequestException(
          'Para iniciar un turno use POST /shifts/:id/start (valida fecha/hora y estado del bus).',
        );
      }
      shift.estado = updateShiftDto.estado;
    }

    const saved = await this.shiftRepository.save(shift);
    return this.enrichShift(await this.findOneEntity(saved.id!));
  }

  async startShift(id: number, dto: StartShiftDto) {
    const shift = await this.findOneEntity(id);

    if (!shift.bus?.id) {
      throw new BadRequestException('El turno no tiene un bus asignado.');
    }

    if (!isProgramado(shift.estado)) {
      throw new BadRequestException(
        `Solo se puede iniciar un turno en estado programado. Estado actual: ${normalizeEstadoLabel(shift.estado)}`,
      );
    }

    if (!isNowWithinShiftWindow(shift.fecha_inicio, shift.fecha_fin)) {
      const ini = shift.fecha_inicio
        ? new Date(shift.fecha_inicio).toLocaleString('es-CO')
        : '—';
      const fin = shift.fecha_fin ? new Date(shift.fecha_fin).toLocaleString('es-CO') : '—';
      throw new BadRequestException(
        `El turno solo puede iniciarse dentro de su ventana programada (${ini} – ${fin}).`,
      );
    }

    const otherActive = await this.shiftRepository.findOne({
      where: { driver: { id: shift.driver?.id }, estado: Like('en_curso%') },
    });
    if (otherActive && otherActive.id !== shift.id) {
      throw new BadRequestException('Ya tienes otro turno en curso. Finalízalo antes de iniciar uno nuevo.');
    }

    if (dto.driverEmail) {
      const email = shift.driver?.person?.email ?? (shift.driver as any)?.email;
      if (email && email.toLowerCase() !== dto.driverEmail.toLowerCase()) {
        throw new BadRequestException('Este turno no está asignado a tu usuario conductor.');
      }
    }

    if (dto.busStatus === 'obs' && !dto.observations?.trim()) {
      throw new BadRequestException('Debes registrar una nota cuando el bus tiene observaciones.');
    }

    const startedAt = new Date();
    shift.estado = buildEnCursoEstado(startedAt, {
      busStatus: dto.busStatus,
      observations: dto.observations,
    });

    await this.busService.update(shift.bus.id, {
      estado: buildBusEstadoFromStart(dto.busStatus, dto.observations),
    });

    const saved = await this.shiftRepository.save(shift);
    const enriched = this.enrichShift(await this.findOneEntity(saved.id!));
    return {
      ...enriched,
      gps_tracking_activo: true,
      mensaje: 'Turno iniciado. Rastreo GPS activado para el bus asignado.',
    };
  }

  async findStartableForDriverEmail(email: string) {
    const shifts = await this.shiftRepository.find({
      where: { driver: { person: { email } } },
      relations: ['bus', 'driver', 'driver.person'],
      order: { fecha_inicio: 'ASC' },
    });

    const startable = shifts.filter(
      (s) => isProgramado(s.estado) && isNowWithinShiftWindow(s.fecha_inicio, s.fecha_fin),
    );

    return startable.map((s) => this.enrichShift(s));
  }

  async remove(id: number) {
    const shift = await this.findOneEntity(id);

    await this.shiftRepository.remove(shift);

    return { message: `Turno #${id} eliminado correctamente` };
  }

  async findActiveByDriverEmail(email: string) {
    const shift = await this.shiftRepository.findOne({
      where: {
        driver: { person: { email } },
        estado: Like('en_curso%'),
      },
      relations: ['bus', 'driver', 'driver.person'],
      order: { fecha_inicio: 'DESC' },
    });

    if (!shift) {
      throw new NotFoundException(`No se encontró un turno en curso para el conductor con email ${email}`);
    }

    if (shift.bus?.id) {
      const cap = await this.busService.syncCapacityFromTickets(shift.bus.id);
      Object.assign(shift.bus, {
        capacidad: cap.disponibles,
        capacidad_max: cap.max,
        capacidad_ocupados: cap.ocupados,
        capacidad_disponible: cap.disponibles,
      });
    }

    return this.enrichShift(shift);
  }
}

function normalizeEstadoLabel(estado?: string): string {
  if (!estado) return 'desconocido';
  return estado.split(';;')[0];
}
