import type { Driver } from '../types/driver.types';
import type { CompanyDriver } from '../services/companyDriverService';

export const mapDriverFromApi = (raw: Driver & { person?: Driver['person']; license?: string }): Driver => ({
  ...raw,
  name: raw.name || raw.person?.name || '',
  last_name: raw.last_name || raw.person?.lastName || '',
  email: raw.email || raw.person?.email,
  phone: raw.phone || raw.person?.phone,
  license: raw.license || raw.licencia,
  licencia: raw.licencia || raw.license,
});

export const mapCompanyDriverFromApi = (cd: CompanyDriver): CompanyDriver => ({
  ...cd,
  driver: cd.driver ? mapDriverFromApi(cd.driver as Driver) : cd.driver,
});

export const driverDisplayName = (d?: Driver | null) => {
  if (!d) return 'Conductor';
  const n = `${d.name || ''} ${d.last_name || ''}`.trim();
  return n || `Conductor #${d.id}`;
};
