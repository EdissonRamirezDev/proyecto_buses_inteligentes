import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Gps } from './entities/gps.entity';
import { BusesService } from 'src/buses/buses.service';
import { CreateGpsDto } from './dto/create-gps.dto';
import { UpdateGpDto } from './dto/update-gps.dto';
import { BusStop } from '../bus-stops/entities/bus-stop.entity';
import { Node } from '../nodes/entities/node.entity';
import { Schedule } from '../schedules/entities/schedule.entity';

/** Velocidad promedio urbana en km/h para estimación de ETA */
const AVG_BUS_SPEED_KMH = 20;

@Injectable()
export class GpsService {
  constructor(
    @InjectRepository(Gps)
    private readonly gpsRepository: Repository<Gps>,
    private readonly busService: BusesService,
    private readonly dataSource: DataSource,
  ) { }

  /**
   * Calcula la distancia en km entre dos puntos usando la fórmula de Haversine.
   */
  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Estima el tiempo de llegada en minutos entre dos puntos.
   */
  private estimateMinutes(distanceKm: number): number {
    return Math.round((distanceKm / AVG_BUS_SPEED_KMH) * 60);
  }

  /**
   * Encuentra el paradero más cercano al bus de una lista de paraderos.
   */
  private findNearestStop(busLat: number, busLng: number, stops: { id: string; nombre: string; latitud: number; longitud: number; orden: number }[]) {
    let nearest: typeof stops[0] | null = null;
    let minDist = Infinity;

    for (const stop of stops) {
      const dist = this.haversineDistance(busLat, busLng, Number(stop.latitud), Number(stop.longitud));
      if (dist < minDist) {
        minDist = dist;
        nearest = stop;
      }
    }

    return nearest ? { ...nearest, distanciaKm: Math.round(minDist * 100) / 100 } : null;
  }

  /** Un bus tiene un solo registro GPS (1:1): actualizar posición, no insertar duplicados. */
  async create(createGpsDto: CreateGpsDto) {
    if (!createGpsDto.bus_id) {
      throw new BadRequestException('bus_id es requerido para reportar GPS');
    }

    const bus = await this.busService.findOne(createGpsDto.bus_id).catch(() => null);
    if (!bus) {
      throw new NotFoundException('Bus id not found');
    }

    let gps = await this.gpsRepository.findOne({
      where: { bus: { id: createGpsDto.bus_id } },
      relations: ['bus'],
    });

    if (gps) {
      gps.latitude = createGpsDto.latitude;
      gps.longitude = createGpsDto.longitude;
      return await this.gpsRepository.save(gps);
    }

    gps = this.gpsRepository.create({
      latitude: createGpsDto.latitude,
      longitude: createGpsDto.longitude,
      bus,
    });
    return await this.gpsRepository.save(gps);
  }

  async findAll() {
    return await this.gpsRepository.find();
  }

  async findOne(id: number) {
    const gps = await this.gpsRepository.findOne({
      where: { id },
    });

    if (!gps) throw new NotFoundException(`Gps #${id} no encontrado`);
    return gps;
  }

  async update(id: number, updateGpsDto: UpdateGpDto) {
    const gps = await this.findOne(id);

    Object.assign(gps, updateGpsDto);

    return await this.gpsRepository.save(gps);
  }

  async remove(id: number) {
    const gps = await this.findOne(id);

    await this.gpsRepository.remove(gps);

    return { message: `Gps #${id} eliminado correctamente` };
  }

  /**
   * HU-ENTR-3-001: Seguimiento de buses en tiempo real por ruta.
   * 
   * Retorna todos los buses activos de una ruta con:
   * - Ubicación GPS actual
   * - Placa del bus
   * - Paradero más cercano al bus
   * - ETA al paradero del usuario (si se proporciona busStopId)
   * - Alerta de retraso
   */
  async getRouteTracking(routeId: string, userBusStopId?: string) {
    // 1. Obtener los paraderos de la ruta (a través de nodes), ordenados
    const routeNodes = await this.dataSource
      .getRepository(Node)
      .createQueryBuilder('node')
      .innerJoinAndSelect('node.busStop', 'busStop')
      .where('node.routeId = :routeId', { routeId })
      .orderBy('node.orden', 'ASC')
      .getMany();

    const routeStops = routeNodes.map(n => ({
      id: n.busStop.id,
      nombre: n.busStop.nombre,
      latitud: Number(n.busStop.latitud),
      longitud: Number(n.busStop.longitud),
      orden: n.orden,
      tiempo_estimado: n.tiempo_estimado,
      distancia_anterior: Number(n.distancia_anterior),
    }));

    // 2. Obtener los buses asignados a esta ruta (a través de schedules activos)
    const activeSchedules = await this.dataSource
      .getRepository(Schedule)
      .createQueryBuilder('schedule')
      .innerJoinAndSelect('schedule.bus', 'bus')
      .innerJoinAndSelect('bus.gps', 'gps')
      .innerJoinAndSelect('schedule.route', 'route')
      .where('schedule.routeId = :routeId', { routeId })
      .andWhere("schedule.estado IN ('programado', 'en_curso')")
      .getMany();

    if (activeSchedules.length === 0) {
      return {
        routeId,
        buses: [],
        paraderos: routeStops,
        message: 'No hay buses activos en esta ruta en este momento.',
      };
    }

    // 3. Obtener el paradero del usuario (si se proporcionó)
    let userStop: { id: string; nombre: string; latitud: number; longitud: number; orden: number } | null = null;
    if (userBusStopId) {
      const foundStop = routeStops.find(s => s.id === userBusStopId);
      if (foundStop) {
        userStop = foundStop;
      } else {
        // Buscar directamente en la BD si no está en la ruta
        const stop = await this.dataSource.getRepository(BusStop).findOne({ where: { id: userBusStopId } });
        if (stop) {
          userStop = { id: stop.id, nombre: stop.nombre, latitud: Number(stop.latitud), longitud: Number(stop.longitud), orden: 999 };
        }
      }
    }

    // 4. Calcular detección de retraso basada en schedule
    const now = new Date();
    const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();

    // 5. Construir la respuesta por bus
    const busesTracking = activeSchedules.map(schedule => {
      const bus = schedule.bus;
      const gps = bus.gps;

      if (!gps || gps.latitude == null || gps.longitude == null) {
        return {
          busId: bus.id,
          placa: bus.placa,
          latitude: null,
          longitude: null,
          paradero_cercano: null,
          eta_minutos: null,
          distancia_km: null,
          alerta_retraso: false,
          mensaje_retraso: null,
          schedule: {
            id: schedule.id,
            hora_salida: schedule.hora_salida,
            estado: schedule.estado,
          },
        };
      }

      const busLat = Number(gps.latitude);
      const busLng = Number(gps.longitude);

      // Paradero más cercano al bus
      const nearest = this.findNearestStop(busLat, busLng, routeStops);

      // ETA al paradero del usuario
      let etaMinutos: number | null = null;
      let distanciaKm: number | null = null;
      if (userStop) {
        const dist = this.haversineDistance(busLat, busLng, userStop.latitud, userStop.longitud);
        distanciaKm = Math.round(dist * 100) / 100;
        etaMinutos = this.estimateMinutes(dist);
      }

      // Detección de retraso
      let alertaRetraso = false;
      let mensajeRetraso: string | null = null;

      if (schedule.hora_salida && nearest) {
        const [h, m] = schedule.hora_salida.split(':').map(Number);
        const scheduledMinutes = h * 60 + m;
        const elapsedMinutes = currentTimeMinutes - scheduledMinutes;

        // Si ya pasó más del tiempo estimado para llegar al paradero actual + 10 min de tolerancia
        const expectedProgressMinutes = routeStops
          .filter(s => s.orden <= nearest.orden)
          .reduce((acc, s) => acc + s.tiempo_estimado, 0);

        const tolerancia = schedule.tolerancia_minutos || 10;
        if (elapsedMinutes > expectedProgressMinutes + tolerancia && elapsedMinutes > 0) {
          alertaRetraso = true;
          const retrasoMin = elapsedMinutes - expectedProgressMinutes;
          mensajeRetraso = `Bus ${bus.placa} lleva aproximadamente ${retrasoMin} minutos de retraso.`;
        }
      }

      return {
        busId: bus.id,
        placa: bus.placa,
        latitude: busLat,
        longitude: busLng,
        paradero_cercano: nearest ? {
          id: nearest.id,
          nombre: nearest.nombre,
          distanciaKm: nearest.distanciaKm,
        } : null,
        eta_minutos: etaMinutos,
        distancia_km: distanciaKm,
        alerta_retraso: alertaRetraso,
        mensaje_retraso: mensajeRetraso,
        schedule: {
          id: schedule.id,
          hora_salida: schedule.hora_salida,
          estado: schedule.estado,
        },
      };
    });

    return {
      routeId,
      buses: busesTracking,
      paraderos: routeStops,
      userStop: userStop ? { id: userStop.id, nombre: userStop.nombre } : null,
    };
  }
}