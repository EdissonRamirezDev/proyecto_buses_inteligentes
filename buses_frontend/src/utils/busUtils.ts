import { API_BUSINESS_URL } from './constants';

export const resolveBusPhotoPublicUrl = (url?: string): string => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  const origin = (API_BUSINESS_URL || 'http://localhost:3000/api').replace(/\/api\/?$/, '');
  return url.startsWith('/') ? `${origin}${url}` : `${origin}/${url}`;
};

export const parseBusEstado = (estado?: string) => {
  if (!estado) return { base: '', meta: {} as Record<string, string> };
  const [base, ...parts] = estado.split('|');
  const meta: Record<string, string> = {};
  for (const part of parts) {
    const idx = part.indexOf(':');
    if (idx > 0) {
      meta[part.slice(0, idx)] = part.slice(idx + 1);
    }
  }
  return { base, meta };
};

export const getBusQrCode = (bus: { placa?: string; estado?: string; codigo_qr?: string }) => {
  if (bus.codigo_qr) return bus.codigo_qr;
  const { meta } = parseBusEstado(bus.estado);
  return meta.qr || `BUS:${bus.placa || ''}`;
};

export const getBusPhotoUrl = (estado?: string) => {
  const raw = parseBusEstado(estado).meta.foto;
  return resolveBusPhotoPublicUrl(raw);
};
