import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Citizen } from '../citizens/entities/citizen.entity';
import { WalletTransaction } from '../citizens/entities/wallet-transaction.entity';
import { Incident } from '../incidents/entities/incident.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Citizen)
    private readonly citizenRepository: Repository<Citizen>,
    @InjectRepository(WalletTransaction)
    private readonly transactionRepository: Repository<WalletTransaction>,
    @InjectRepository(Incident)
    private readonly incidentRepository: Repository<Incident>,
    private readonly dataSource: DataSource,
  ) {}

  private calcAge(fechaNacimiento: string | Date): number {
    const birth = new Date(fechaNacimiento);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  private bucketAge(age: number) {
    if (age <= 17) return 'Menores (0-17)';
    if (age <= 25) return 'Jóvenes (18-25)';
    if (age <= 40) return 'Adultos jóvenes (26-40)';
    if (age <= 60) return 'Adultos (41-60)';
    return 'Mayores (60+)';
  }

  private async countAgeBuckets(
    rutaId?: string,
    fechaInicio?: string,
    fechaFin?: string,
  ): Promise<Record<string, number>> {
    let qb = this.citizenRepository.createQueryBuilder('citizen').select('citizen.fecha_nacimiento', 'fecha_nacimiento');

    if (rutaId || fechaInicio || fechaFin) {
      qb.innerJoin('citizen.tickets', 'ticket')
        .innerJoin('ticket.schedule', 'schedule')
        .innerJoin('schedule.route', 'route');

      if (rutaId) qb.andWhere('route.id = :rutaId', { rutaId });
      if (fechaInicio) qb.andWhere('ticket.fecha_compra >= :fechaInicio', { fechaInicio });
      if (fechaFin) qb.andWhere('ticket.fecha_compra <= :fechaFin', { fechaFin });
      qb.groupBy('citizen.id');
    }

    const citizens = await qb.getRawMany();
    const buckets: Record<string, number> = {
      'Menores (0-17)': 0,
      'Jóvenes (18-25)': 0,
      'Adultos jóvenes (26-40)': 0,
      'Adultos (41-60)': 0,
      'Mayores (60+)': 0,
      'Sin información': 0,
    };

    citizens.forEach((c) => {
      if (!c.fecha_nacimiento) {
        buckets['Sin información']++;
        return;
      }
      const age = this.calcAge(c.fecha_nacimiento);
      buckets[this.bucketAge(age)]++;
    });

    return buckets;
  }

  async getAgeDistribution(rutaId?: string, fechaInicio?: string, fechaFin?: string) {
    const current = await this.countAgeBuckets(rutaId, fechaInicio, fechaFin);

    const prevEnd = fechaFin ? new Date(fechaFin) : new Date();
    const prevStart = fechaInicio ? new Date(fechaInicio) : new Date(prevEnd);
    if (!fechaInicio) {
      prevStart.setMonth(prevStart.getMonth() - 1);
    } else {
      prevEnd.setMonth(prevEnd.getMonth() - 1);
      prevStart.setMonth(prevStart.getMonth() - 1);
    }

    const previous = await this.countAgeBuckets(
      rutaId,
      prevStart.toISOString().split('T')[0],
      prevEnd.toISOString().split('T')[0],
    );

    const fills: Record<string, string> = {
      'Menores (0-17)': '#3b82f6',
      'Jóvenes (18-25)': '#8b5cf6',
      'Adultos jóvenes (26-40)': '#10b981',
      'Adultos (41-60)': '#f59e0b',
      'Mayores (60+)': '#ef4444',
      'Sin información': '#94a3b8',
    };

    const segments = Object.entries(current).map(([name, value]) => ({
      name,
      value,
      fill: fills[name],
    }));

    const total = segments.reduce((acc, s) => acc + s.value, 0);
    const table = segments.map((s) => {
      const prev = previous[s.name] || 0;
      const pct = total > 0 ? ((s.value / total) * 100).toFixed(1) : '0.0';
      const prevPct = total > 0 ? ((prev / total) * 100).toFixed(1) : '0.0';
      const variation = (Number(pct) - Number(prevPct)).toFixed(1);
      return {
        name: s.name,
        cantidad: s.value,
        porcentaje: pct,
        variacionMesAnterior: variation,
      };
    });

    return { segments, table, total };
  }

  private parsePaymentMethod(referencia?: string): 'tarjeta' | 'pse' | 'efectivo' {
    if (!referencia) return 'tarjeta';
    const match = referencia.match(/\|metodo:(\w+)/i);
    if (match) {
      const m = match[1].toLowerCase();
      if (m === 'pse') return 'pse';
      if (m === 'efectivo' || m === 'efecty' || m === 'baloto') return 'efectivo';
      return 'tarjeta';
    }
    if (referencia.toUpperCase().includes('PSE')) return 'pse';
    if (referencia.toUpperCase().includes('EFECT')) return 'efectivo';
    return 'tarjeta';
  }

  async getRevenueByMethod(meses: number = 6) {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth() - (meses - 1), 1);

    const transactions = await this.transactionRepository
      .createQueryBuilder('t')
      .where('t.tipo = :tipo', { tipo: 'RECARGA' })
      .andWhere('t.fecha_transaccion >= :startDate', { startDate })
      .getMany();

    const monthlyData: Record<string, { method: string; tarjeta: number; pse: number; efectivo: number }> = {};

    for (let i = meses - 1; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthStr = d.toISOString().substring(0, 7);
      monthlyData[monthStr] = { method: monthStr, tarjeta: 0, pse: 0, efectivo: 0 };
    }

    const totals = { tarjeta: 0, pse: 0, efectivo: 0 };

    transactions.forEach((t) => {
      const monthStr = new Date(t.fecha_transaccion).toISOString().substring(0, 7);
      if (!monthlyData[monthStr]) return;
      const m = Number(t.monto);
      const method = this.parsePaymentMethod(t.referencia_externa);
      monthlyData[monthStr][method] += m;
      totals[method] += m;
    });

    return {
      monthly: Object.values(monthlyData).sort((a, b) => a.method.localeCompare(b.method)),
      totals,
      grandTotal: totals.tarjeta + totals.pse + totals.efectivo,
    };
  }

  private mapIncidentTypeToTrend(type?: string): string {
    const t = (type || 'OTRO').toUpperCase();
    if (t === 'RETRASO') return 'CONGESTION';
    if (['MECANICO', 'ACCIDENTE', 'CONGESTION', 'PASAJERO', 'OTRO'].includes(t)) return t;
    return 'OTRO';
  }

  async getIncidentTrends(empresaId?: string, meses: number = 3) {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth() - (meses - 1), 1);

    const incidents = await this.incidentRepository.find({
      relations: ['busesIncidents', 'busesIncidents.bus', 'busesIncidents.bus.company'],
    });

    const monthlyData: Record<string, { MECANICO: number; ACCIDENTE: number; CONGESTION: number; PASAJERO: number; OTRO: number }> = {};

    for (let i = meses - 1; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthStr = d.toISOString().substring(0, 7);
      monthlyData[monthStr] = { MECANICO: 0, ACCIDENTE: 0, CONGESTION: 0, PASAJERO: 0, OTRO: 0 };
    }

    incidents.forEach((inc) => {
      const incDate = new Date(inc.date as string);
      if (incDate < startDate) return;

      const busLinks = inc.busesIncidents || [];
      const matchesCompany =
        !empresaId ||
        busLinks.some((bi) => String(bi.bus?.company?.id) === String(empresaId));
      if (!matchesCompany) return;

      const monthStr = incDate.toISOString().substring(0, 7);
      if (!monthlyData[monthStr]) return;

      const key = this.mapIncidentTypeToTrend(inc.type);
      monthlyData[monthStr][key] = (monthlyData[monthStr][key] || 0) + 1;
    });

    return Object.keys(monthlyData)
      .sort()
      .map((month) => ({
        month,
        MECANICO: monthlyData[month].MECANICO,
        ACCIDENTE: monthlyData[month].ACCIDENTE,
        CONGESTION: monthlyData[month].CONGESTION,
        PASAJERO: monthlyData[month].PASAJERO,
        OTRO: monthlyData[month].OTRO,
      }));
  }
}
