import { BusesIncident } from "../../buses_incidents/entities/buses_incident.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

// export enum TipoIncidente {
//     MECANICO = 'MECANICO',
//     ACCIDENTE = 'ACCIDENTE',
//     RETRASO = 'RETRASO',
//     PROBLEMA_PASAJEROS = 'PROBLEMA_PASAJEROS',
//     OTRO = 'OTRO',
// }

// export enum GravedadIncidente {
//     BAJO = 'BAJO',
//     MEDIO = 'MEDIO',
//     ALTO = 'ALTO',
//     CRITICO = 'CRITICO',
// }

// export enum EstadoIncidente {
//     PENDIENTE = 'PENDIENTE',
//     EN_REVISION = 'EN_REVISION',
//     RESUELTO = 'RESUELTO',
// }

@Entity('incidents')
export class Incident {
    @PrimaryGeneratedColumn()
    id?: number;

    // @Column({ type: 'enum', enum: TipoIncidente })
    @Column()
    type?: String;

    // @Column({ type: 'enum', enum: GravedadIncidente })
    @Column()
    severity?: String;

    @Column()
    description?: string;

    @Column()
    date?: String;

    @Column()
    state?: String;

    @OneToMany(() => BusesIncident, (busIncident) => busIncident.incident)
    busesIncidents?: BusesIncident[];
}