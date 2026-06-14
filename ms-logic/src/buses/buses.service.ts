import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateBusDto } from './dto/create-bus.dto';
import { UpdateBusDto } from './dto/update-bus.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Bus } from './entities/bus.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { In, Repository, DataSource } from 'typeorm';
import { CompaniesService } from 'src/companies/companies.service';
import { randomUUID } from 'crypto';
import { persistBusPhotoUrl } from '../photos/photo-file.util';
import { Schedule } from '../schedules/entities/schedule.entity';
import { Shift } from '../shifts/entities/shift.entity';
import { BusesIncident } from '../buses_incidents/entities/buses_incident.entity';

export interface BusCapacityInfo {
  max: number;
  ocupados: number;
  disponibles: number;
}

@Injectable()
export class BusesService {

  private readonly blockingScheduleStates = ['programado'];

  constructor(
    @InjectRepository(Bus)
    private readonly busRepository: Repository<Bus>,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
    @InjectRepository(Shift)
    private readonly shiftRepository: Repository<Shift>,
    private readonly companyService: CompaniesService,
    private dataSource: DataSource
  ) { }

  /** Impide mover de empresa si el bus tiene servicios o turnos activos. */
  async assertBusAvailableForCompanyChange(busId: number): Promise<void> {
    const activeSchedules = await this.scheduleRepository.count({
      where: { bus: { id: busId }, estado: In(this.blockingScheduleStates) },
    });
    if (activeSchedules > 0) {
      throw new BadRequestException(
        'El bus tiene programaciones en estado "programado". Cancele o complete esos servicios antes de cambiar de empresa.',
      );
    }

    const shifts = await this.shiftRepository.find({ where: { bus: { id: busId } } });
    const hasActiveShift = shifts.some((s) => {
      const st = (s.estado || '').toLowerCase();
      return st === 'programado' || st.startsWith('en_curso');
    });
    if (hasActiveShift) {
      throw new BadRequestException(
        'El bus tiene turnos programados o en curso. Finalice el turno antes de cambiar de empresa.',
      );
    }
  }

  private parseEstado(estado?: string): { base: string; meta: Record<string, string> } {
    if (!estado) return { base: '', meta: {} };
    const [base, ...parts] = estado.split('|');
    const meta: Record<string, string> = {};
    for (const part of parts) {
      const idx = part.indexOf(':');
      if (idx > 0) meta[part.slice(0, idx)] = part.slice(idx + 1);
    }
    return { base, meta };
  }

  getMaxCapacity(bus: Bus): number {
    const { meta } = this.parseEstado(bus.estado);
    const fromMeta = meta.maxCap ? Number(meta.maxCap) : NaN;
    if (Number.isFinite(fromMeta) && fromMeta > 0) return fromMeta;
    return bus.capacidad ?? 0;
  }

  private buildEstadoWithCapacity(bus: Bus, disponibles: number, max: number): string {
    const { base, meta } = this.parseEstado(bus.estado);
    meta.maxCap = String(max);
    meta.disp = String(disponibles);
    const metaStr = Object.entries(meta)
      .map(([k, v]) => `${k}:${v}`)
      .join('|');
    const root = base || 'activo';
    return metaStr ? `${root}|${metaStr}` : root;
  }

  async countPassengersOnBoard(busId: number, scheduleId?: string): Promise<number> {
    const qb = this.ticketRepository
      .createQueryBuilder('t')
      .innerJoin('t.schedule', 's')
      .where('s.busId = :busId', { busId })
      .andWhere('t.estado = :estado', { estado: 'usado' });

    if (scheduleId) {
      qb.andWhere('s.id = :scheduleId', { scheduleId });
    }

    return qb.getCount();
  }

  /** Sincroniza asientos libres según boletos en estado "usado" (abordados, no descendidos). */
  async syncCapacityFromTickets(busId: number, scheduleId?: string): Promise<BusCapacityInfo> {
    const bus = await this.findOne(busId);
    const max = this.getMaxCapacity(bus);
    const ocupados = await this.countPassengersOnBoard(busId, scheduleId);
    const disponibles = Math.max(0, max - ocupados);

    bus.capacidad = disponibles;
    bus.estado = this.buildEstadoWithCapacity(bus, disponibles, max);
    await this.busRepository.save(bus);

    return { max, ocupados, disponibles };
  }

  async create(createBusDto: CreateBusDto): Promise<Bus> {
    const placaNormalizada = createBusDto.placa.trim().toUpperCase();
    const existing = await this.busRepository.findOne({ where: { placa: placaNormalizada } });
    if (existing) {
      throw new BadRequestException(`Ya existe un bus registrado con la placa ${placaNormalizada}`);
    }

    let company: any = null;

    if (createBusDto.companyId) {
      company = await this.companyService.findOne(createBusDto.companyId)
      .catch(() => null);

      if (!company) {
        throw new NotFoundException('Company id not found')
      }
    }
    
    const metaParts: string[] = [];
    if (createBusDto.anio) metaParts.push(`anio:${createBusDto.anio}`);
    if (createBusDto.capacidad_sentados != null) metaParts.push(`sentados:${createBusDto.capacidad_sentados}`);
    if (createBusDto.capacidad_parados != null) metaParts.push(`parados:${createBusDto.capacidad_parados}`);
    const codigoQr = `QR-${randomUUID().substring(0, 8).toUpperCase()}`;
    metaParts.push(`qr:${codigoQr}`);
    metaParts.push(`maxCap:${createBusDto.capacidad}`);
    metaParts.push(`disp:${createBusDto.capacidad}`);
    if (createBusDto.foto_url) {
      const fotoPath = persistBusPhotoUrl(createBusDto.foto_url);
      metaParts.push(`foto:${fotoPath}`);
    }

    const estadoConMeta = metaParts.length
      ? `${createBusDto.estado}|${metaParts.join('|')}`
      : createBusDto.estado;

    const bus = this.busRepository.create({
      ...createBusDto,
      placa: placaNormalizada,
      estado: estadoConMeta,
      company: company,
    });
    const saved = await this.busRepository.save(bus);
    return Object.assign(saved, { codigo_qr: codigoQr });
  }

  async findAll() {
    return await this.busRepository.find({
      relations: ['company']
    });
  }

  async getLiveFleetStatus(): Promise<any> {
    const qb = this.busRepository.createQueryBuilder('bus')
      .innerJoinAndSelect('bus.gps', 'gps'); // Only buses with GPS
    
    const buses = await qb.getMany();
    
    // Get all active incidents for these buses
    const incidents = await this.dataSource.getRepository(BusesIncident)
      .createQueryBuilder('bi')
      .leftJoinAndSelect('bi.bus', 'bus')
      .innerJoinAndSelect('bi.incident', 'incident')
      .where('incident.state != :state1', { state1: 'Resuelto' })
      .andWhere('incident.state != :state2', { state2: 'Cerrado' })
      .getMany();
      
    // Get all active tickets for currently active schedules
    const activeSchedules = await this.scheduleRepository.createQueryBuilder('s')
      .leftJoinAndSelect('s.bus', 'bus')
      .leftJoinAndSelect('s.tickets', 'ticket', "ticket.estado = 'activo'")
      .where("s.estado IN ('programado', 'en_curso')")
      .getMany();

    let totalPassengers = 0;
    
    const fleetStatus = buses.map(bus => {
      const maxCap = this.getMaxCapacity(bus);
      
      const busSchedules = activeSchedules.filter(s => s.bus && s.bus.id === bus.id);
      let activeTicketsCount = 0;
      busSchedules.forEach(s => {
        if (s.tickets) activeTicketsCount += s.tickets.length;
      });
      
      totalPassengers += activeTicketsCount;
      
      const busIncidents = incidents.filter(i => i.bus?.id === bus.id);
      const hasIncident = busIncidents.length > 0;
      const isMaxOccupancy = activeTicketsCount >= maxCap;
      
      return {
         id: bus.id,
         placa: bus.placa,
         latitude: bus.gps?.latitude,
         longitude: bus.gps?.longitude,
         estado: hasIncident ? 'incidente' : 'normal',
         ocupacion: activeTicketsCount,
         capacidad: maxCap,
         alerta_ocupacion: isMaxOccupancy,
         incidentes: busIncidents.map(bi => ({
            type: bi.incident?.type,
            severity: bi.incident?.severity,
            description: bi.incident?.description
         }))
      };
    });
    
    return {
      totalPassengers,
      buses: fleetStatus
    };
  }

  async findOne(id: number) {
    const bus = await this.busRepository.findOne({
      where: { id },
      relations: ['company']
    });

    if (!bus) throw new NotFoundException(`Bus #${id} no encontrado`);
    return this.enrichBusWithCapacity(bus);
  }

  private enrichBusWithCapacity(bus: Bus): Bus & {
    capacidad_max: number;
    capacidad_ocupados: number;
    capacidad_disponible: number;
  } {
    const max = this.getMaxCapacity(bus);
    const { meta } = this.parseEstado(bus.estado);
    const dispFromMeta = meta.disp ? Number(meta.disp) : NaN;
    const disponibles = Number.isFinite(dispFromMeta)
      ? Math.min(max, Math.max(0, dispFromMeta))
      : (bus.capacidad ?? max);
    const ocupados = Math.max(0, max - disponibles);
    return Object.assign(bus, {
      capacidad_max: max,
      capacidad_ocupados: ocupados,
      capacidad_disponible: disponibles,
    });
  }

  async update(id: number, updateBusDto: UpdateBusDto) {
    const bus = await this.findOne(id);
    const { companyId, foto_url, ...rest } = updateBusDto as UpdateBusDto & {
      companyId?: number;
      foto_url?: string;
    };

    if ('companyId' in updateBusDto) {
      const currentId = bus.company?.id ?? null;
      const nextId =
        companyId === null || companyId === undefined ? null : Number(companyId);

      if (nextId !== currentId) {
        await this.assertBusAvailableForCompanyChange(id);
        if (nextId == null) {
          bus.company = undefined;
        } else {
          const company = await this.companyService.findOne(nextId).catch(() => null);
          if (!company) {
            throw new NotFoundException('Company id not found');
          }
          bus.company = company;
        }
      }
    }

    if (foto_url) {
      const { base, meta } = this.parseEstado(bus.estado);
      meta.foto = persistBusPhotoUrl(foto_url);
      const metaStr = Object.entries(meta)
        .map(([k, v]) => `${k}:${v}`)
        .join('|');
      bus.estado = metaStr ? `${base || 'available'}|${metaStr}` : base || bus.estado;
    }

    Object.assign(bus, rest);
    return await this.busRepository.save(bus);
  }

  async remove(id: number) {
    const bus = await this.findOne(id); // asegura que exista

    // if (theater.projector) {
    //   throw new BadRequestException('No se puede eliminar el teatro porque tiene un proyector asociado');
    // }

    await this.busRepository.remove(bus);

    return { message: `Bus #${id} eliminado correctamente` };
  }
}
