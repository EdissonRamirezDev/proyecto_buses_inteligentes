import type { Schedule } from '../types/schedule.types';
import type { Shift } from '../types/shift.types';

export type BusAssignmentBlockReason = 'schedule' | 'shift' | null;

export function getBusAssignmentBlockReason(
  busId: number,
  schedules: Schedule[],
  shifts: Shift[],
): BusAssignmentBlockReason {
  const hasSchedule = schedules.some(
    (s) => s.bus?.id === busId && (s.estado || '').toLowerCase() === 'programado',
  );
  if (hasSchedule) return 'schedule';

  const hasShift = shifts.some((s) => {
    if (s.bus?.id !== busId) return false;
    const st = (s.estado || '').toLowerCase();
    return st === 'programado' || st.startsWith('en_curso');
  });
  if (hasShift) return 'shift';

  return null;
}

export function canAssignBusToCompany(
  busId: number,
  schedules: Schedule[],
  shifts: Shift[],
): boolean {
  return getBusAssignmentBlockReason(busId, schedules, shifts) === null;
}
