import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { History } from './entities/history.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { Node } from '../nodes/entities/node.entity';
import { BusesService } from '../buses/buses.service';

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(History) private readonly historyRepository: Repository<History>,
    @InjectRepository(Ticket) private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(Node) private readonly nodeRepository: Repository<Node>,
    private dataSource: DataSource,
    private readonly busesService: BusesService,
  ) {}

  async scanTicket(ticketId: string, nodeId: string, tipo_validacion: 'ENTRADA' | 'SALIDA' = 'ENTRADA') {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Verificar ticket (incluye citizen para devolver saldo)
      const ticket = await queryRunner.manager.findOne(Ticket, { 
        where: { id: ticketId },
        relations: ['schedule', 'schedule.bus', 'citizen']
      });
      if (!ticket) throw new NotFoundException('Boleto no encontrado');
      
      if (tipo_validacion === 'ENTRADA' && ticket.estado !== 'activo') {
        throw new BadRequestException(`El boleto no se puede usar para abordar. Estado actual: ${ticket.estado}`);
      }
      
      if (tipo_validacion === 'SALIDA' && ticket.estado !== 'usado') {
        throw new BadRequestException(`El boleto no está en curso o ya finalizó. Estado actual: ${ticket.estado}`);
      }

      // 1.5 Validar estado del despacho (Schedule)
      if (ticket.schedule && tipo_validacion === 'ENTRADA') {
         if (ticket.schedule.estado === 'cancelado') {
           throw new BadRequestException('El despacho asociado a este boleto ha sido cancelado.');
         }
         if (ticket.schedule.estado === 'completado') {
           throw new BadRequestException('El despacho asociado a este boleto ya finalizó.');
         }

         const bus = ticket.schedule.bus;
         if (bus?.id) {
            const max = this.busesService.getMaxCapacity(bus);
            const ocupacionActual = await queryRunner.manager.count(Ticket, {
               where: {
                 schedule: { id: ticket.schedule.id },
                 estado: 'usado',
               },
            });

            if (max > 0 && ocupacionActual >= max) {
               throw new BadRequestException(
                 `No se puede abordar. El bus ha alcanzado su capacidad máxima (${max} pasajeros).`,
               );
            }
         }
      }

      // 2. Verificar nodo
      const node = await queryRunner.manager.findOne(Node, { where: { id: nodeId } });
      if (!node) throw new NotFoundException('Punto de validación (Nodo) no encontrado');

      // 3. Registrar en historial
      const history = new History();
      history.ticket = ticket;
      history.node = node;
      history.tipo_validacion = tipo_validacion;
      const savedHistory = await queryRunner.manager.save(history);

      // 4. Marcar boleto según tipo de validación
      let mensaje = '';
      let saldoRestante: number | null = null;

      if (tipo_validacion === 'ENTRADA') {
        ticket.estado = 'usado'; // En viaje
        mensaje = 'Abordaje exitoso';
        saldoRestante = ticket.citizen ? Number(ticket.citizen.saldo) : null;
      } else if (tipo_validacion === 'SALIDA') {
        ticket.estado = 'completado'; // Viaje terminado
        ticket.fecha_fin = new Date(); // Marca la hora de finalización
        mensaje = 'Viaje completado - Gracias por usar nuestro servicio';
      }
      
      await queryRunner.manager.save(ticket);

      await queryRunner.commitTransaction();

      let capacidadBus: { max: number; ocupados: number; disponibles: number } | null = null;
      const busId = ticket.schedule?.bus?.id;
      if (busId) {
        capacidadBus = await this.busesService.syncCapacityFromTickets(
          busId,
          ticket.schedule?.id,
        );
      }

      // Retornar respuesta enriquecida
      return {
        history: savedHistory,
        mensaje,
        saldoRestante,
        fecha_fin: ticket.fecha_fin || null,
        capacidadBus,
      };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(): Promise<History[]> {
    return await this.historyRepository.find({
      relations: ['ticket', 'ticket.citizen', 'node', 'node.route'],
      order: { fecha_hora: 'DESC' }
    });
  }

  async remove(id: string): Promise<void> {
    const history = await this.historyRepository.findOne({ where: { id } });
    if (history) {
      await this.historyRepository.remove(history);
    }
  }
}

