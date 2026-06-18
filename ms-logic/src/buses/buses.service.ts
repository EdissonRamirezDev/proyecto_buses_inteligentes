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
import { Route } from '../routes/entities/route.entity';
import { Incident } from '../incidents/entities/incident.entity';
import { Gps } from '../gps/entities/gps.entity';


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

  async simulateTraffic(): Promise<any> {
    const routeRepo = this.dataSource.getRepository(Route);
    const incidentRepo = this.dataSource.getRepository(Incident);
    const busesIncidentRepo = this.dataSource.getRepository(BusesIncident);
    const gpsRepo = this.dataSource.getRepository(Gps);
    const scheduleRepo = this.scheduleRepository;
    const ticketRepo = this.ticketRepository;

    const routes = await routeRepo.find({ relations: ['nodes', 'nodes.busStop'] });
    let buses = await this.busRepository.find({ relations: ['gps'] });

    if (routes.length === 0) {
      return { message: 'No se encontraron rutas en la base de datos para simular.', simulated: 0 };
    }

    // Asegurar que existan al menos 4 buses en la base de datos para simular una flota viva
    const simulatedPlates = ['SIM-001', 'SIM-002', 'SIM-003', 'SIM-004'];
    for (const plate of simulatedPlates) {
      const exists = buses.some(b => b.placa === plate);
      if (!exists) {
        const newBus = this.busRepository.create({
          placa: plate,
          modelo: 'Mercedes-Benz Sprinter (Simulado)',
          capacidad: 40,
          estado: 'activo'
        });
        const savedBus = await this.busRepository.save(newBus);
        buses.push(savedBus);
      }
    }

    const types = ['Tráfico pesado', 'Accidente de tránsito', 'Falla mecánica', 'Manifestación', 'Desvío de ruta'];
    const severities = ['MEDIA', 'ALTA', 'CRITICA'];

    let simulatedCount = 0;

    for (const bus of buses) {
      // 1. Obtener o crear schedule activo para la simulación
      let activeSchedule = await scheduleRepo.findOne({
        where: {
          bus: { id: bus.id },
          estado: In(['programado', 'en_curso']),
        },
        relations: ['route'],
      });

      let route = activeSchedule?.route;
      if (!activeSchedule) {
        // Asignar ruta aleatoria
        route = routes[Math.floor(Math.random() * routes.length)];
        activeSchedule = scheduleRepo.create({
          fecha: new Date(),
          hora_salida: '12:00:00',
          tolerancia_minutos: 999, // Identificador especial para simulación
          es_recurrente: false,
          estado: 'en_curso',
          route: route,
          bus: bus,
        });
        activeSchedule = await scheduleRepo.save(activeSchedule);
      }

      if (!route) continue;

      // 2. Simular ocupación aleatoria (tickets activos)
      const maxCap = this.getMaxCapacity(bus);
      // Ocupación que a veces supera la capacidad para disparar alerta de ocupación máxima
      const occupancy = Math.floor(Math.random() * (maxCap + 5));

      // Limpiar tickets simulados previos para este schedule
      await ticketRepo
        .createQueryBuilder()
        .delete()
        .where('scheduleId = :scheduleId AND codigo_qr LIKE :prefix', {
          scheduleId: activeSchedule.id,
          prefix: 'SIM-QR-%',
        })
        .execute();

      const ticketsToInsert: Ticket[] = [];
      for (let i = 0; i < occupancy; i++) {
        ticketsToInsert.push(
          ticketRepo.create({
            codigo_qr: `SIM-QR-${randomUUID().substring(0, 18).toUpperCase()}`,
            estado: 'activo',
            precio_pagado: 2500,
            schedule: activeSchedule,
          })
        );
      }
      if (ticketsToInsert.length > 0) {
        await ticketRepo.save(ticketsToInsert);
      }

      // 3. Simular ubicación GPS aleatoria cerca de un paradero de la ruta
      const nodes = route.nodes || [];
      let lat = 4.6097;
      let lng = -74.0817;
      if (nodes.length > 0) {
        const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
        if (randomNode.busStop) {
          // Pequeño desplazamiento aleatorio de ±0.0015
          lat = Number(randomNode.busStop.latitud) + (Math.random() - 0.5) * 0.003;
          lng = Number(randomNode.busStop.longitud) + (Math.random() - 0.5) * 0.003;
        }
      }

      let gps = bus.gps;
      if (!gps) {
        gps = gpsRepo.create({ bus });
      }
      gps.latitude = lat;
      gps.longitude = lng;
      await gpsRepo.save(gps);

      // 4. Limpiar incidentes simulados anteriores de este bus
      const existingSimIncidents = await busesIncidentRepo
        .createQueryBuilder('bi')
        .innerJoinAndSelect('bi.incident', 'incident')
        .where('bi.bus_id = :busId AND incident.description LIKE :prefix', {
          busId: bus.id,
          prefix: '[SIMULACION]%',
        })
        .getMany();

      if (existingSimIncidents.length > 0) {
        const incidentIds = existingSimIncidents.map((bi) => bi.incident!.id).filter((id): id is number => id !== undefined);
        await busesIncidentRepo.delete(existingSimIncidents.map((bi) => bi.id!));
        await incidentRepo.delete(incidentIds);
      }

      // 5. Simular reporte de incidente aleatorio (35% de probabilidad)
      if (Math.random() < 0.35) {
        const selectedType = types[Math.floor(Math.random() * types.length)];
        const selectedSeverity = severities[Math.floor(Math.random() * severities.length)];

        const incident = incidentRepo.create({
          type: selectedType,
          severity: selectedSeverity,
          description: `[SIMULACION] ${selectedType} reportado automáticamente por simulación de tráfico.`,
          date: new Date().toISOString(),
          state: 'Abierto',
        });
        const savedIncident = await incidentRepo.save(incident);

        const busesIncident = busesIncidentRepo.create({
          latitude: lat,
          longitude: lng,
          reportDate: new Date().toISOString(),
          bus: bus,
          incident: savedIncident,
        });
        await busesIncidentRepo.save(busesIncident);
      }

      simulatedCount++;
    }

    return { message: 'Tráfico e incidentes simulados en la base de datos con éxito.', simulated: simulatedCount };
  }

  async resetSimulation(): Promise<any> {
    // 1. Eliminar incidentes de simulación
    const simulatedIncidents = await this.dataSource.getRepository(Incident)
      .createQueryBuilder('i')
      .where("i.description LIKE :pattern", { pattern: '[SIMULACION]%' })
      .getMany();
      
    if (simulatedIncidents.length > 0) {
      const incidentIds = simulatedIncidents.map(i => i.id);
      await this.dataSource.getRepository(BusesIncident)
        .createQueryBuilder()
        .delete()
        .where("incident_id IN (:...incidentIds)", { incidentIds })
        .execute();
        
      await this.dataSource.getRepository(Incident)
        .createQueryBuilder()
        .delete()
        .where("id IN (:...incidentIds)", { incidentIds })
        .execute();
    }
    
    // 2. Eliminar boletos simulados
    await this.dataSource.getRepository(Ticket)
      .createQueryBuilder()
      .delete()
      .where("codigo_qr LIKE :pattern", { pattern: 'SIM-QR-%' })
      .execute();
      
    // 3. Eliminar programaciones simuladas creadas para la simulación
    await this.scheduleRepository
      .createQueryBuilder()
      .delete()
      .where("tolerancia_minutos = :tol", { tol: 999 })
      .execute();

    // 4. Eliminar buses simulados de la base de datos (SIM-001, SIM-002, etc.)
    const simulatedBuses = await this.busRepository
      .createQueryBuilder('b')
      .where("b.placa LIKE :pattern", { pattern: 'SIM-%' })
      .getMany();
      
    if (simulatedBuses.length > 0) {
      const busIds = simulatedBuses.map(b => b.id);
      
      // Eliminar registros de GPS vinculados
      await this.dataSource.getRepository(Gps)
        .createQueryBuilder()
        .delete()
        .where("busId IN (:...busIds)", { busIds })
        .execute();

      // Eliminar programaciones remanentes asociadas a estos buses
      await this.scheduleRepository
        .createQueryBuilder()
        .delete()
        .where("busId IN (:...busIds)", { busIds })
        .execute();
        
      // Eliminar los buses
      await this.busRepository
        .createQueryBuilder()
        .delete()
        .where("id IN (:...busIds)", { busIds })
        .execute();
    }
      
    return { message: 'Simulación de flota y tráfico restablecida con éxito.' };
  }
}
