import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { Schedule } from './entities/schedule.entity';
import { Shift } from '../shifts/entities/shift.entity';
import { Route } from '../routes/entities/route.entity';

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
    private readonly dataSource: DataSource,
  ) {}

  private getMinutesFromMidnight(timeStr: string): number {
    const [hh, mm] = timeStr.split(':').map(Number);
    return hh * 60 + (mm || 0);
  }

  private async validateSchedule(dto: {
    fecha: string;
    hora_salida: string;
    routeId: string;
    busId: number;
    tolerancia_minutos?: number;
  }, excludeScheduleId?: string): Promise<void> {
    // 1. Validar que el bus tenga un conductor asignado (turno) para ese horario
    // Formatear la fecha/hora de salida
    const dateStr = dto.fecha.includes('T') ? dto.fecha.split('T')[0] : dto.fecha;
    const timeStr = dto.hora_salida.substring(0, 5);
    const departureDateTime = new Date(`${dateStr}T${timeStr}:00`);

    const shift = await this.dataSource.getRepository(Shift).createQueryBuilder('shift')
      .leftJoinAndSelect('shift.bus', 'bus')
      .leftJoinAndSelect('shift.driver', 'driver')
      .where('bus.id = :busId', { busId: dto.busId })
      .andWhere('shift.fecha_inicio <= :departureDateTime', { departureDateTime })
      .andWhere('shift.fecha_fin >= :departureDateTime', { departureDateTime })
      .getOne();

    if (!shift) {
      throw new BadRequestException('El bus no tiene un conductor asignado (turno) para esta fecha y hora.');
    }

    // 2. Validar que el bus no tenga otra programación activa en el mismo horario
    const route = await this.dataSource.getRepository(Route).findOne({
      where: { id: dto.routeId },
      relations: ['nodes']
    });
    if (!route) {
      throw new NotFoundException('Ruta no encontrada');
    }

    const routeDuration = route.nodes?.reduce((sum, node) => sum + (node.tiempo_estimado || 0), 0) || 60;
    const tolerancia = dto.tolerancia_minutos || 0;
    const totalTripDuration = routeDuration + tolerancia;

    const newStartMinutes = this.getMinutesFromMidnight(dto.hora_salida);
    const newEndMinutes = newStartMinutes + totalTripDuration;

    const existingSchedules = await this.scheduleRepository.find({
      where: {
        bus: { id: dto.busId },
        fecha: dateStr as any,
        estado: 'programado',
      },
      relations: ['route', 'route.nodes']
    });

    for (const existing of existingSchedules) {
      if (excludeScheduleId && existing.id === excludeScheduleId) {
        continue;
      }

      const existingDuration = existing.route?.nodes?.reduce((sum, node) => sum + (node.tiempo_estimado || 0), 0) || 60;
      const existingTotalDuration = existingDuration + (existing.tolerancia_minutos || 0);

      const existingStartMinutes = this.getMinutesFromMidnight(existing.hora_salida);
      const existingEndMinutes = existingStartMinutes + existingTotalDuration;

      if (newStartMinutes < existingEndMinutes && newEndMinutes > existingStartMinutes) {
        const endHour = Math.floor(existingEndMinutes / 60);
        const endMin = existingEndMinutes % 60;
        const endStr = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
        throw new BadRequestException(
          `El bus ya tiene otra programación activa en este horario (${existing.hora_salida} - ${endStr} en la ruta ${existing.route?.nombre}).`
        );
      }
    }
  }

  private async validateRouteHasMinStops(routeId: string, minStops = 3): Promise<Route> {
    const route = await this.dataSource.getRepository(Route).findOne({
      where: { id: routeId },
      relations: ['nodes'],
    });
    if (!route) {
      throw new NotFoundException('Ruta no encontrada');
    }
    if (!route.nodes || route.nodes.length < minStops) {
      throw new BadRequestException(`La ruta debe tener al menos ${minStops} paraderos para programar un servicio`);
    }
    return route;
  }

  async findActiveByBusId(busId: number): Promise<Schedule | null> {
    const today = new Date().toISOString().split('T')[0];
    const schedules = await this.scheduleRepository.find({
      where: {
        bus: { id: busId },
        fecha: today as any,
        estado: 'programado',
      },
      relations: ['route', 'route.nodes', 'route.nodes.busStop', 'bus'],
      order: { hora_salida: 'ASC' },
    });

    if (!schedules.length) return null;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    return (
      schedules.find((s) => {
        const [hh, mm] = s.hora_salida.substring(0, 5).split(':').map(Number);
        const start = hh * 60 + (mm || 0);
        const duration =
          s.route?.nodes?.reduce((sum, node) => sum + (node.tiempo_estimado || 0), 0) || 120;
        const end = start + duration + (s.tolerancia_minutos || 0);
        return currentMinutes >= start - (s.tolerancia_minutos || 0) && currentMinutes <= end;
      }) || schedules[0]
    );
  }

  async findAvailableForCitizens(): Promise<Schedule[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.scheduleRepository.find({
      where: {
        fecha: today as any,
        estado: 'programado',
      },
      relations: ['route', 'bus'],
      order: { hora_salida: 'ASC' },
    });
  }

  async create(createScheduleDto: CreateScheduleDto): Promise<Schedule> {
    await this.validateRouteHasMinStops(createScheduleDto.routeId);
    await this.validateSchedule(createScheduleDto);

    const schedule = this.scheduleRepository.create({
      ...createScheduleDto,
      route: { id: createScheduleDto.routeId },
      bus: { id: createScheduleDto.busId },
    });
    return await this.scheduleRepository.save(schedule);
  }

  async findAll(): Promise<Schedule[]> {
    return await this.scheduleRepository.find({ relations: ['route', 'bus'] });
  }

  async findOne(id: string): Promise<Schedule> {
    const schedule = await this.scheduleRepository.findOne({ where: { id }, relations: ['route', 'bus'] });
    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }
    return schedule;
  }

  async update(id: string, updateScheduleDto: UpdateScheduleDto): Promise<Schedule> {
    const schedule = await this.findOne(id);
    
    // Si se actualiza el bus, la fecha, la hora o la ruta, re-validamos
    const checkDto = {
      fecha: updateScheduleDto.fecha || schedule.fecha.toString(),
      hora_salida: updateScheduleDto.hora_salida || schedule.hora_salida,
      routeId: updateScheduleDto.routeId || schedule.route?.id,
      busId: updateScheduleDto.busId || schedule.bus?.id,
      tolerancia_minutos: updateScheduleDto.tolerancia_minutos !== undefined ? updateScheduleDto.tolerancia_minutos : schedule.tolerancia_minutos,
    };

    if (checkDto.routeId && checkDto.busId) {
      await this.validateSchedule(checkDto as any, id);
    }

    if (updateScheduleDto.routeId) {
      schedule.route = { id: updateScheduleDto.routeId } as any;
    }
    if (updateScheduleDto.busId) {
      schedule.bus = { id: updateScheduleDto.busId } as any;
    }
    this.scheduleRepository.merge(schedule, updateScheduleDto);
    return await this.scheduleRepository.save(schedule);
  }

  async remove(id: string): Promise<void> {
    const schedule = await this.findOne(id);
    await this.scheduleRepository.remove(schedule);
  }
}

