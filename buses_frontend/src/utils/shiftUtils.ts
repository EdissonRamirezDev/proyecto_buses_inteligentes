import type { Shift } from '../types/shift.types';

export function shiftEstadoBase(estado?: string): string {
  if (!estado) return '';
  return estado.split(';;')[0].trim().toLowerCase();
}

export function isShiftProgramado(estado?: string): boolean {
  return shiftEstadoBase(estado) === 'programado';
}

export function isShiftEnCurso(estado?: string): boolean {
  return shiftEstadoBase(estado) === 'en_curso';
}

export function isShiftWithinWindow(shift: Shift): boolean {
  if (!shift.fecha_inicio || !shift.fecha_fin) return false;
  const now = Date.now();
  const start = new Date(shift.fecha_inicio).getTime();
  const end = new Date(shift.fecha_fin).getTime();
  return !Number.isNaN(start) && !Number.isNaN(end) && now >= start && now <= end;
}

/** Turno que el conductor puede iniciar ahora (programado + ventana vigente). */
export function findShiftStartableNow(shifts: Shift[]): Shift | null {
  const match = shifts.find(
    (s) =>
      (s.puede_iniciar === true) ||
      (isShiftProgramado(s.estado) && isShiftWithinWindow(s)),
  );
  return match ?? null;
}

export function formatShiftWindow(shift: Shift): string {
  if (!shift.fecha_inicio || !shift.fecha_fin) return 'Horario no definido';
  const ini = new Date(shift.fecha_inicio).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  const fin = new Date(shift.fecha_fin).toLocaleString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${ini} – ${fin}`;
}
