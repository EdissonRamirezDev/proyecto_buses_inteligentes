import { BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

const MAX_BYTES = 5 * 1024 * 1024;

type PhotoFolder = 'incidents' | 'buses';

function uploadDir(folder: PhotoFolder): string {
  return path.join(process.cwd(), 'uploads', folder);
}

function ensureUploadDir(folder: PhotoFolder): void {
  const dir = uploadDir(folder);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/** Guarda data URL en disco y devuelve ruta corta para varchar(255). */
export function persistImageUrl(inputUrl: string, folder: PhotoFolder): string {
  if (!inputUrl?.trim()) {
    throw new BadRequestException('La URL de la foto es obligatoria.');
  }

  if (!inputUrl.startsWith('data:image')) {
    if (inputUrl.length > 250) {
      throw new BadRequestException(
        'La URL de la foto es demasiado larga. Envíe la imagen como archivo (data URL) o una ruta corta.',
      );
    }
    return inputUrl;
  }

  const match = inputUrl.match(/^data:image\/([\w+.-]+);base64,(.+)$/);
  if (!match) {
    throw new BadRequestException('Formato de imagen inválido (se espera data:image/...;base64,...).');
  }

  let ext = match[1].toLowerCase();
  if (ext === 'jpeg') ext = 'jpg';
  if (!['png', 'jpg', 'gif', 'webp'].includes(ext)) {
    ext = 'jpg';
  }

  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length > MAX_BYTES) {
    throw new BadRequestException('Cada foto debe pesar menos de 5 MB.');
  }

  ensureUploadDir(folder);
  const filename = `${randomUUID()}.${ext}`;
  fs.writeFileSync(path.join(uploadDir(folder), filename), buffer);

  return folder === 'buses'
    ? `/api/photos/files/buses/${filename}`
    : `/api/photos/files/${filename}`;
}

export function persistIncidentPhotoUrl(inputUrl: string): string {
  return persistImageUrl(inputUrl, 'incidents');
}

export function persistBusPhotoUrl(inputUrl: string): string {
  return persistImageUrl(inputUrl, 'buses');
}

export function resolveStoredPhotoPath(filename: string, folder: PhotoFolder): string {
  const safe = path.basename(filename);
  const full = path.join(uploadDir(folder), safe);
  if (!fs.existsSync(full)) {
    throw new BadRequestException('Archivo de foto no encontrado.');
  }
  return full;
}

export function resolveIncidentPhotoPath(filename: string): string {
  return resolveStoredPhotoPath(filename, 'incidents');
}

export function resolveBusPhotoPath(filename: string): string {
  return resolveStoredPhotoPath(filename, 'buses');
}
