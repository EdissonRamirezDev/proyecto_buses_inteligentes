/** Convención en columna `estado` (sin nuevas entidades): en_curso;;startedAt=ISO;;busStatus=ok|obs|rev;;obs=texto */

export const SHIFT_ESTADO_PROGRAMADO = 'programado';
export const SHIFT_ESTADO_COMPLETADO = 'completado';

export type ShiftBusStatusAtStart = 'ok' | 'obs' | 'rev';

export interface ParsedShiftEstado {
  base: string;
  startedAt?: string;
  busStatus?: ShiftBusStatusAtStart;
  observations?: string;
}

export function isProgramado(estado?: string): boolean {
  return normalizeShiftBase(estado) === SHIFT_ESTADO_PROGRAMADO;
}

export function isEnCurso(estado?: string): boolean {
  return normalizeShiftBase(estado) === 'en_curso';
}

export function isCompletado(estado?: string): boolean {
  const base = normalizeShiftBase(estado);
  return base === SHIFT_ESTADO_COMPLETADO || base === 'finalizado' || base === 'completado';
}

export function normalizeShiftBase(estado?: string): string {
  if (!estado) return '';
  return estado.split(';;')[0].trim().toLowerCase();
}

export function parseShiftEstado(estado?: string): ParsedShiftEstado {
  if (!estado) {
    return { base: SHIFT_ESTADO_PROGRAMADO };
  }
  const [base, ...metaParts] = estado.split(';;');
  const meta: Record<string, string> = {};
  for (const part of metaParts) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    meta[part.slice(0, eq)] = part.slice(eq + 1);
  }
  const busStatus = meta.busStatus as ShiftBusStatusAtStart | undefined;
  return {
    base: base.trim().toLowerCase(),
    startedAt: meta.startedAt,
    busStatus:
      busStatus === 'ok' || busStatus === 'obs' || busStatus === 'rev' ? busStatus : undefined,
    observations: meta.obs ? decodeURIComponent(meta.obs) : undefined,
  };
}

export function buildEnCursoEstado(
  startedAt: Date,
  meta: { busStatus: ShiftBusStatusAtStart; observations?: string },
): string {
  const parts = ['en_curso', `startedAt=${startedAt.toISOString()}`, `busStatus=${meta.busStatus}`];
  if (meta.observations?.trim()) {
    parts.push(`obs=${encodeURIComponent(meta.observations.trim())}`);
  }
  return parts.join(';;');
}

export function isNowWithinShiftWindow(fechaInicio?: Date | string, fechaFin?: Date | string): boolean {
  if (!fechaInicio || !fechaFin) return false;
  const now = Date.now();
  const start = new Date(fechaInicio).getTime();
  const end = new Date(fechaFin).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return false;
  return now >= start && now <= end;
}

export function buildBusEstadoFromStart(
  busStatus: ShiftBusStatusAtStart,
  observations?: string,
): string {
  if (busStatus === 'obs') {
    const note = observations?.trim() || 'Sin detalle';
    return `Operativo con observaciones: ${note}`;
  }
  if (busStatus === 'rev') {
    return 'Requiere revisión antes de salir';
  }
  return 'available';
}
