import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { History } from './entities/history.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { Node } from '../nodes/entities/node.entity';

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(History) private readonly historyRepository: Repository<History>,
    @InjectRepository(Ticket) private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(Node) private readonly nodeRepository: Repository<Node>,
    private dataSource: DataSource,
  ) {}

  async scanTicket(ticketId: string, nodeId: string): Promise<History> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Verificar ticket
      const ticket = await queryRunner.manager.findOne(Ticket, { where: { id: ticketId } });
      if (!ticket) throw new NotFoundException('Boleto no encontrado');
      if (ticket.estado !== 'activo') {
        throw new BadRequestException(`El boleto no se puede usar. Estado actual: ${ticket.estado}`);
      }

      // 2. Verificar nodo
      const node = await queryRunner.manager.findOne(Node, { where: { id: nodeId } });
      if (!node) throw new NotFoundException('Punto de validación (Nodo) no encontrado');

      // 3. Registrar en historial
      const history = new History();
      history.ticket = ticket;
      history.node = node;
      const savedHistory = await queryRunner.manager.save(history);

      // 4. Marcar boleto como usado
      ticket.estado = 'usado';
      await queryRunner.manager.save(ticket);

      await queryRunner.commitTransaction();
      return savedHistory;

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
