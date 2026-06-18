export interface CitizenPerson {
  userId?: string;
  name?: string;
  lastName?: string;
  phone?: string;
}

export interface Citizen {
  id: string;
  userId?: string;
  person?: CitizenPerson;
  nombres: string;
  apellidos: string;
  telefono?: string;
  direccion?: string;
  fecha_nacimiento?: string;
  saldo: number;
  weatherAlertsEnabled?: boolean;
  habitualTravelTime?: string;
}

/** userId plano o anidado en person (respuestas antiguas del API). */
export function getCitizenUserId(citizen: Citizen): string | undefined {
  return citizen.userId ?? citizen.person?.userId;
}
