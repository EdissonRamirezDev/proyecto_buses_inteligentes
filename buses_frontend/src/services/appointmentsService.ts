import { httpBusiness } from './http';

export interface ScheduleAppointmentData {
  userId: string;
  nombre: string;
  email: string;
  modalidad: string;
  motivo: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin: string;
}

export const getAppointmentsAvailability = async () => {
  const response = await httpBusiness.get('/appointments/availability');
  return response.data;
};

export const scheduleAppointment = async (data: ScheduleAppointmentData) => {
  const response = await httpBusiness.post('/appointments/schedule', data);
  return response.data;
};
