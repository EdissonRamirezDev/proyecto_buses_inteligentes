import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum PqrsType {
  PETICION = 'Petición',
  QUEJA = 'Queja',
  RECLAMO = 'Reclamo',
  SUGERENCIA = 'Sugerencia',
}

export enum PqrsCategory {
  CONDUCTOR = 'Conductor',
  BUS = 'Bus',
  RUTA = 'Ruta',
  TARJETA = 'Tarjeta',
  OTRO = 'Otro',
}

export enum PqrsStatus {
  RECIBIDO = 'Recibido',
  EN_REVISION = 'En revisión',
  EN_PROCESO = 'En proceso',
  RESUELTO = 'Resuelto',
}

@Entity('pqrs')
export class Pqrs {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: true })
  radicado: string; // Puede ser nulo al momento de creación si dependemos de una API externa asíncrona, pero será llenado casi de inmediato.

  @Column({
    type: 'enum',
    enum: PqrsType,
    default: PqrsType.PETICION
  })
  tipo: PqrsType;

  @Column({
    type: 'enum',
    enum: PqrsCategory,
    default: PqrsCategory.OTRO
  })
  categoria: PqrsCategory;

  @Column('varchar', { length: 500 })
  descripcion: string;

  @Column()
  email: string;

  // Usamos tipo json nativo que soporta hasta 1GB en MySQL para guardar las fotos Base64
  @Column({ type: 'json', nullable: true })
  fotos: string[];

  @Column({
    type: 'enum',
    enum: PqrsStatus,
    default: PqrsStatus.RECIBIDO
  })
  estado: PqrsStatus;

  @Column('text', { nullable: true })
  respuesta: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
