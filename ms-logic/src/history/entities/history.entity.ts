import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { Node } from '../../nodes/entities/node.entity';

@Entity('history')
export class History {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  fecha_hora: Date;

  @ManyToOne(() => Ticket, (ticket) => ticket.history, { onDelete: 'CASCADE' })
  ticket: Ticket;

  @ManyToOne(() => Node, (node) => node.history, { onDelete: 'CASCADE' })
  node: Node;

  @Column({ type: 'enum', enum: ['ENTRADA', 'SALIDA'], default: 'ENTRADA' })
  tipo_validacion: string;
}
