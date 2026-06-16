import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Inject, forwardRef, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { Message } from './entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { CreateMassAlertDto } from './dto/create-mass-alert.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

import { Person } from '../persons/entities/person.entity';
import { GroupPerson } from '../group-persons/entities/group-person.entity';
import { Group } from '../groups/entities/group.entity';
import { MessageRecipientPerson } from '../message-recipient-persons/entities/message-recipient-person.entity';
import { MessageRecipientGroup } from '../message-recipient-groups/entities/message-recipient-group.entity';
import { MessagesGateway } from './messages.gateway';
import { GroupsService } from '../groups/groups.service';
import { Ticket } from '../tickets/entities/ticket.entity';
import { Schedule } from '../schedules/entities/schedule.entity';

@Injectable()
export class MessagesService implements OnModuleInit, OnModuleDestroy {
  private timer: NodeJS.Timeout;

  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(MessageRecipientPerson)
    private readonly recipientRepository: Repository<MessageRecipientPerson>,
    @InjectRepository(MessageRecipientGroup)
    private readonly recipientGroupRepository: Repository<MessageRecipientGroup>,
    @InjectRepository(GroupPerson)
    private readonly groupPersonRepository: Repository<GroupPerson>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(Person)
    private readonly personRepository: Repository<Person>,
    private readonly messagesGateway: MessagesGateway,
    @Inject(forwardRef(() => GroupsService))
    private readonly groupsService: GroupsService,
    private readonly dataSource: DataSource,
  ) {}

  onModuleInit() {
    // Check for scheduled alerts every minute
    this.timer = setInterval(() => this.checkScheduledAlerts(), 60000);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  /**
   * Process scheduled mass alerts
   */
  async checkScheduledAlerts() {
    const scheduledMessages = await this.messageRepository.find({
      where: {
        is_mass_alert: true,
        // En un caso real usaríamos un flag como "procesado" en la BD.
        // Aquí podemos confiar en que la fecha ya pasó y el push no se ha enviado.
      }
    });

    const now = Date.now();
    for (const msg of scheduledMessages) {
      if (msg.scheduled_for && msg.scheduled_for.getTime() <= now) {
        // Enviar notificación Push solo si no se ha enviado aún.
        // Como no tenemos un flag "push_sent", podríamos limpiar scheduled_for,
        // pero mejor sería añadir un flag si podemos.
        // Por brevedad, lo enviaremos a todos los recipients de este mensaje.
        
        // Verifica si ya se notificó comprobando algo, o simplemente evita re-enviar.
        // Como es un prototipo, asumimos que esto es suficiente si añadimos un chequeo rápido.
        // Mejor limpiamos el scheduled_for
        
        const originalScheduledFor = msg.scheduled_for;
        msg.scheduled_for = null as any; // Mark as processed
        await this.messageRepository.save(msg);

        const recipients = await this.recipientRepository.find({
          where: { message: { id: msg.id } },
          relations: ['persona']
        });

        if (recipients.length > 0) {
          const recipientIds = recipients.map(r => r.persona.userId);
          this.messagesGateway.notifyUsers(recipientIds, 'newMassAlert', { 
            messageId: msg.id, 
            isUrgent: msg.is_urgent,
            contenido: msg.contenido
          });
        }
      }
    }
  }

  /**
   * Envía un mensaje directo o a uno/varios grupos.
   */
  async sendMessage(dto: CreateMessageDto) {
    if (!dto.emisor_id) throw new BadRequestException('Se requiere emisor_id');
    if (!dto.destinatario_id && (!dto.grupos_id || dto.grupos_id.length === 0)) {
      throw new BadRequestException('Se requiere un destinatario_id o al menos un grupos_id');
    }
    if (!dto.contenido || dto.contenido.trim().length === 0) {
      throw new BadRequestException('El contenido del mensaje no puede estar vacío');
    }
    if (dto.contenido.length > 500) {
      throw new BadRequestException('El mensaje no puede exceder los 500 caracteres');
    }

    const emisor = await this.personRepository.findOne({ where: { userId: dto.emisor_id } });
    if (!emisor) throw new BadRequestException('El usuario emisor no existe');

    const message = this.messageRepository.create({
      contenido: dto.contenido,
      emisor,
      latitud: dto.latitud,
      longitud: dto.longitud,
      is_mass_alert: false,
      is_urgent: false,
    });

    const savedMessage = await this.messageRepository.save(message);
    const notifyUserIds = new Set<string>();

    // Si es a grupos
    if (dto.grupos_id && dto.grupos_id.length > 0) {
      for (const groupId of dto.grupos_id) {
        const group = await this.groupRepository.findOne({ where: { id: groupId } });
        if (group) {
          await this.recipientGroupRepository.save(
            this.recipientGroupRepository.create({ message: savedMessage, group })
          );

          const members = await this.groupPersonRepository.find({ 
            where: { group: { id: groupId }, is_blocked: false },
            relations: ['persona']
          });
          
          for (const member of members) {
            if (member.persona && member.persona.userId !== dto.emisor_id) {
              const existing = await this.recipientRepository.findOne({
                where: { message: { id: savedMessage.id }, persona: { id: member.persona.id } }
              });
              if (!existing) {
                await this.recipientRepository.save(
                  this.recipientRepository.create({
                    message: savedMessage,
                    persona: member.persona,
                    leido: false,
                  })
                );
                notifyUserIds.add(member.persona.userId);
              }
            }
          }
        }
      }
    } else if (dto.destinatario_id) {
      if (dto.emisor_id === dto.destinatario_id) {
        throw new BadRequestException('No puedes enviarte un mensaje a ti mismo');
      }
      
      const destinatario = await this.personRepository.findOne({ where: { userId: dto.destinatario_id } });
      if (!destinatario) throw new BadRequestException('El destinatario no existe');

      await this.recipientRepository.save(
        this.recipientRepository.create({
          message: savedMessage,
          persona: destinatario,
          leido: false,
        })
      );
      notifyUserIds.add(dto.destinatario_id);
    }

    // Emit WebSocket Event
    this.messagesGateway.notifyUsers(Array.from(notifyUserIds), 'newMessage', { messageId: savedMessage.id, senderId: dto.emisor_id });

    return { message: savedMessage };
  }

  /**
   * Busca personas vinculadas a una ruta (compraron tickets en schedules de esa ruta).
   */
  private async findPersonsByRoute(routeId: string): Promise<Person[]> {
    const citizenUserIds: { userId: string }[] = await this.dataSource
      .createQueryBuilder()
      .select('DISTINCT person.userId', 'userId')
      .from('tickets', 'ticket')
      .innerJoin('schedules', 'schedule', 'ticket.scheduleId = schedule.id')
      .innerJoin('citizens', 'citizen', 'ticket.citizenId = citizen.id')
      .innerJoin('persons', 'person', 'citizen.personId = person.id')
      .where('schedule.routeId = :routeId', { routeId })
      .getRawMany();

    if (citizenUserIds.length === 0) return [];

    const userIds = citizenUserIds.map(r => r.userId);
    return this.personRepository.find({ where: { userId: In(userIds) } });
  }

  /**
   * Busca personas vinculadas a una zona (tickets en schedules cuya ruta tiene paraderos en esa zona).
   * scopeValue es el ID de un bus_stop que sirve como referencia de zona (radio 5km).
   */
  private async findPersonsByZone(zoneStopId: string): Promise<Person[]> {
    // Obtener el paradero de referencia para la zona
    const refStop = await this.dataSource
      .createQueryBuilder()
      .select('bs.latitud', 'lat')
      .addSelect('bs.longitud', 'lng')
      .from('bus_stops', 'bs')
      .where('bs.id = :zoneStopId', { zoneStopId })
      .getRawOne();

    if (!refStop) {
      // Si no se encuentra el paradero, retornar todos como fallback
      return this.personRepository.find();
    }

    // Encontrar paraderos dentro de un radio de 5km usando fórmula Haversine simplificada
    const lat = Number(refStop.lat);
    const lng = Number(refStop.lng);
    const radiusKm = 5;

    const nearbyStopIds = await this.dataSource
      .createQueryBuilder()
      .select('bs.id', 'id')
      .from('bus_stops', 'bs')
      .where(`(
        6371 * ACOS(
          COS(RADIANS(:lat)) * COS(RADIANS(bs.latitud)) *
          COS(RADIANS(bs.longitud) - RADIANS(:lng)) +
          SIN(RADIANS(:lat)) * SIN(RADIANS(bs.latitud))
        )
      ) <= :radiusKm`, { lat, lng, radiusKm })
      .getRawMany();

    if (nearbyStopIds.length === 0) return this.personRepository.find();

    // Encontrar rutas que pasan por esos paraderos
    const routeIds = await this.dataSource
      .createQueryBuilder()
      .select('DISTINCT node.routeId', 'routeId')
      .from('nodes', 'node')
      .where('node.busStopId IN (:...stopIds)', { stopIds: nearbyStopIds.map(s => s.id) })
      .getRawMany();

    if (routeIds.length === 0) return this.personRepository.find();

    // Encontrar personas con tickets en esas rutas
    const citizenUserIds = await this.dataSource
      .createQueryBuilder()
      .select('DISTINCT person.userId', 'userId')
      .from('tickets', 'ticket')
      .innerJoin('schedules', 'schedule', 'ticket.scheduleId = schedule.id')
      .innerJoin('citizens', 'citizen', 'ticket.citizenId = citizen.id')
      .innerJoin('persons', 'person', 'citizen.personId = person.id')
      .where('schedule.routeId IN (:...routeIds)', { routeIds: routeIds.map(r => r.routeId) })
      .getRawMany();

    if (citizenUserIds.length === 0) return this.personRepository.find();

    return this.personRepository.find({ where: { userId: In(citizenUserIds.map(r => r.userId)) } });
  }

  /**
   * Calcula la cantidad de destinatarios para una alerta masiva
   */
  async calculateMassAlertRecipients(scope: 'ALL' | 'ROUTE' | 'ZONE', scopeValue?: string, emisorId?: string) {
    let persons: Person[] = [];

    if (scope === 'ALL') {
      persons = await this.personRepository.find();
    } else if (scope === 'ROUTE' && scopeValue) {
      persons = await this.findPersonsByRoute(scopeValue);
    } else if (scope === 'ZONE' && scopeValue) {
      persons = await this.findPersonsByZone(scopeValue);
    } else {
      persons = await this.personRepository.find();
    }

    let count = persons.length;
    
    // Descontar al emisor si existe y la cuenta es mayor a 0
    if (emisorId && count > 0) {
      const inList = persons.some(p => p.userId === emisorId);
      if (inList) count -= 1;
    }
    
    return { count: Math.max(0, count) };
  }

  /**
   * Crea y envía una alerta masiva
   */
  async sendMassAlert(dto: CreateMassAlertDto) {
    let persons: Person[] = [];
    if (dto.scope === 'ALL') {
      persons = await this.personRepository.find();
    } else if (dto.scope === 'ROUTE' && dto.scopeValue) {
      persons = await this.findPersonsByRoute(dto.scopeValue);
    } else if (dto.scope === 'ZONE' && dto.scopeValue) {
      persons = await this.findPersonsByZone(dto.scopeValue);
    } else {
      persons = await this.personRepository.find();
    }

    if (persons.length === 0) {
      throw new BadRequestException('No se encontraron destinatarios para el alcance seleccionado');
    }

    const emisor = dto.emisor_id ? await this.personRepository.findOne({ where: { userId: dto.emisor_id } }) : null;

    const messageObj: any = {
      contenido: dto.contenido,
      emisor,
      is_mass_alert: true,
      is_urgent: dto.isUrgent || false,
      mass_alert_scope: dto.scope === 'ALL' ? 'ALL' : `${dto.scope}:${dto.scopeValue}`,
    };

    if (dto.scheduledFor) {
      messageObj.scheduled_for = new Date(dto.scheduledFor);
      messageObj.fecha_envio = new Date(dto.scheduledFor);
    }

    const message = this.messageRepository.create(messageObj as import('typeorm').DeepPartial<Message>);
    
    const savedMessage = await this.messageRepository.save(message);

    // Crear destinatarios
    const recipients = persons.filter(p => p.userId !== dto.emisor_id).map(p => {
      return this.recipientRepository.create({
        message: savedMessage as any,
        persona: p,
        leido: false,
      });
    });

    if (recipients.length === 0) {
      // Rollback del mensaje si no hay a quien enviarle
      await this.messageRepository.delete(savedMessage.id);
      throw new BadRequestException('No hay otros usuarios en el sistema a los cuales enviar la alerta.');
    }

    // Guardar en lotes si es necesario, aquí directo
    await this.recipientRepository.save(recipients);

    // Notify Users if not scheduled for future
    if (!dto.scheduledFor || new Date(dto.scheduledFor).getTime() <= Date.now()) {
      const recipientIds = recipients.map(r => r.persona.userId);
      this.messagesGateway.notifyUsers(recipientIds, 'newMassAlert', { 
        messageId: savedMessage.id, 
        isUrgent: savedMessage.is_urgent,
        contenido: savedMessage.contenido
      });
    }

    return { message: savedMessage, recipientCount: recipients.length };
  }

  /**
   * Obtener estadísticas de alertas masivas enviadas por un usuario
   */
  async getMassAlertStats(userId: string) {
    const alerts = await this.messageRepository.find({
      where: { emisor: { userId }, is_mass_alert: true },
      order: { fecha_envio: 'DESC' }
    });

    const stats = await Promise.all(alerts.map(async (alert) => {
      const recipients = await this.recipientRepository.find({ where: { message: { id: alert.id } } });
      const readCount = recipients.filter(r => r.leido).length;
      return {
        id: alert.id,
        contenido: alert.contenido,
        fecha_envio: alert.fecha_envio,
        scheduled_for: alert.scheduled_for,
        is_urgent: alert.is_urgent,
        scope: alert.mass_alert_scope,
        totalRecipients: recipients.length,
        readCount
      };
    }));

    return stats;
  }

  /**
   * Obtener bandeja de entrada de un usuario con filtros opcionales.
   */
  async getInbox(userId: string, filters?: { unread?: boolean; type?: 'individual' | 'group'; dateFrom?: string; dateTo?: string }) {
    const recipients = await this.recipientRepository
      .createQueryBuilder('r')
      .innerJoinAndSelect('r.message', 'msg')
      .innerJoin('r.persona', 'persona')
      .innerJoinAndSelect('msg.emisor', 'emisor')
      .where('persona.userId = :userId', { userId })
      .andWhere('(msg.fecha_envio <= :now)', { now: new Date() })
      .orderBy('msg.fecha_envio', 'DESC')
      .getMany();

    const enriched = await Promise.all(
      recipients.map(async (r) => {
        const emisor = r.message.emisor;
        const recGroup = await this.recipientGroupRepository.findOne({
          where: { message: { id: r.message.id } },
          relations: ['group'],
        });

        const ubicacion = (r.message.latitud != null && r.message.longitud != null) 
          ? { lat: Number(r.message.latitud), lng: Number(r.message.longitud) }
          : null;

        return {
          id: r.id,
          messageId: r.message.id,
          contenido: r.message.contenido,
          ubicacion,
          fecha_envio: r.message.fecha_envio,
          leido: r.leido,
          fecha_lectura: r.fecha_lectura,
          esGrupo: !!recGroup,
          nombreGrupo: recGroup ? recGroup.group.nombre : null,
          groupId: recGroup ? recGroup.group.id : null,
          isMassAlert: r.message.is_mass_alert,
          isUrgent: r.message.is_urgent,
          emisor: emisor
            ? { id: emisor.id, userId: emisor.userId, name: emisor.name, lastName: emisor.lastName, email: emisor.email }
            : { userId: 'unknown', name: 'Usuario', lastName: 'Desconocido' },
        };
      })
    );

    // Aplicar filtros
    let result = enriched;

    if (filters?.unread === true) {
      result = result.filter(m => !m.leido);
    }

    if (filters?.type === 'individual') {
      result = result.filter(m => !m.esGrupo);
    } else if (filters?.type === 'group') {
      result = result.filter(m => m.esGrupo);
    }

    if (filters?.dateFrom) {
      const from = new Date(filters.dateFrom);
      result = result.filter(m => new Date(m.fecha_envio) >= from);
    }

    if (filters?.dateTo) {
      const to = new Date(filters.dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter(m => new Date(m.fecha_envio) <= to);
    }

    return result;
  }

  /**
   * Contar mensajes no leídos de un usuario.
   */
  async getUnreadCount(userId: string) {
    const count = await this.recipientRepository
      .createQueryBuilder('r')
      .innerJoin('r.message', 'msg')
      .innerJoin('r.persona', 'persona')
      .where('persona.userId = :userId', { userId })
      .andWhere('r.leido = :leido', { leido: false })
      .andWhere('msg.fecha_envio <= :now', { now: new Date() })
      .getCount();

    return { unreadCount: count };
  }

  /**
   * Obtener bandeja de enviados de un usuario.
   */
  async getSent(userId: string) {
    const messages = await this.messageRepository
      .createQueryBuilder('msg')
      .innerJoin('msg.emisor', 'emisor')
      .where('emisor.userId = :userId', { userId })
      .orderBy('msg.fecha_envio', 'DESC')
      .getMany();

    const enriched = await Promise.all(
      messages.map(async (msg) => {
        const recipients = await this.recipientRepository.find({ 
          where: { message: { id: msg.id } },
          relations: ['persona'] 
        });
        
        const destinatarios = await Promise.all(
          recipients.map(async (r) => {
            const person = r.persona;
            return {
              recipientId: r.id,
              leido: r.leido,
              fecha_lectura: r.fecha_lectura,
              persona: person
                ? { id: person.id, userId: person.userId, name: person.name, lastName: person.lastName, email: person.email }
                : { userId: 'unknown', name: 'Usuario', lastName: 'Desconocido' },
            };
          })
        );

        const recGroups = await this.recipientGroupRepository.find({
          where: { message: { id: msg.id } },
          relations: ['group'],
        });

        const ubicacion = (msg.latitud != null && msg.longitud != null) 
          ? { lat: Number(msg.latitud), lng: Number(msg.longitud) }
          : null;

        return {
          id: msg.id,
          contenido: msg.contenido,
          ubicacion,
          fecha_envio: msg.fecha_envio,
          esGrupo: recGroups.length > 0,
          grupos: recGroups.map(rg => ({ id: rg.group.id, nombre: rg.group.nombre })),
          destinatarios,
        };
      })
    );

    return enriched;
  }

  /**
   * Marcar como leído.
   */
  async markAsRead(recipientId: string, userId: string) {
    const recipient = await this.recipientRepository.findOne({
      where: { id: recipientId, persona: { userId } },
    });
    if (!recipient) throw new NotFoundException('Mensaje no encontrado');
    if (recipient.leido) return recipient;
    
    recipient.leido = true;
    recipient.fecha_lectura = new Date();
    return await this.recipientRepository.save(recipient);
  }

  /**
   * Eliminar mensaje (si se es admin del grupo o si es el emisor directo).
   */
  async deleteMessage(messageId: string, userId: string) {
    const msg = await this.messageRepository.findOne({ 
      where: { id: messageId },
      relations: ['emisor']
    });
    if (!msg) throw new NotFoundException('Mensaje no encontrado');

    const recGroups = await this.recipientGroupRepository.find({
      where: { message: { id: messageId } },
      relations: ['group'],
    });

    let isAuthorized = false;

    if (msg.emisor?.userId === userId) {
      isAuthorized = true;
    } else if (recGroups.length > 0) {
      for (const rg of recGroups) {
        const adminCheck = await this.groupPersonRepository.findOne({
          where: { persona: { userId }, group: { id: rg.group.id }, is_admin: true }
        });
        if (adminCheck) {
          isAuthorized = true;
          break;
        }
      }
    }

    if (!isAuthorized) {
      throw new ForbiddenException('No tienes permiso para eliminar este mensaje');
    }

    await this.messageRepository.remove(msg);
    return { success: true };
  }

  /**
   * Buscar personas.
   */
  async searchPersons(query: string) {
    if (!query || query.trim().length < 2) return [];
    const q = `%${query.trim()}%`;
    const persons = await this.personRepository
      .createQueryBuilder('p')
      .where('p.name LIKE :q', { q })
      .orWhere('p.lastName LIKE :q', { q })
      .orWhere('p.email LIKE :q', { q })
      .take(15)
      .getMany();

    return persons.map((p) => ({
      id: p.id,
      userId: p.userId,
      name: p.name,
      lastName: p.lastName,
      email: p.email,
    }));
  }

  // ── CRUD original ──
  create(createMessageDto: CreateMessageDto) { return this.sendMessage(createMessageDto); }
  findAll() { return this.messageRepository.find({ order: { fecha_envio: 'DESC' } }); }
  async findOne(id: string) {
    const msg = await this.messageRepository.findOne({ where: { id } });
    if (!msg) throw new NotFoundException(`Message #${id} not found`);
    return msg;
  }
  update(id: number, updateMessageDto: UpdateMessageDto) { return `This action updates #${id}`; }
  async remove(id: string) { return this.deleteMessage(id, 'admin'); }
}
