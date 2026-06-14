import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CreateMessageDto } from './dto/create-message.dto';
import { CreateMassAlertDto } from './dto/create-mass-alert.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { MessagesGateway } from './messages.gateway';
import { Message } from './entities/message.entity';
import { MessageRecipientPerson } from './entities/message-recipient-person.entity';
import { MessageRecipientGroup } from './entities/message-recipient-group.entity';
import { Group } from './entities/group.entity';
import { GroupPerson } from './entities/group-person.entity';
import { Person } from '../persons/entities/person.entity';

@Injectable()
export class MessagesService {

  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(MessageRecipientPerson)
    private readonly recipientRepository: Repository<MessageRecipientPerson>,
    @InjectRepository(MessageRecipientGroup)
    private readonly recipientGroupRepository: Repository<MessageRecipientGroup>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(GroupPerson)
    private readonly groupPersonRepository: Repository<GroupPerson>,
    @InjectRepository(Person)
    private readonly personRepository: Repository<Person>,
    private readonly messagesGateway: MessagesGateway,
  ) {}

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

    const message = this.messageRepository.create({
      contenido: dto.contenido,
      emisor_id: dto.emisor_id,
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

          const members = await this.groupPersonRepository.find({ where: { group: { id: groupId } } });
          for (const member of members) {
            if (member.person_id !== dto.emisor_id) {
              const existing = await this.recipientRepository.findOne({
                where: { message: { id: savedMessage.id }, destinatario_id: member.person_id }
              });
              if (!existing) {
                await this.recipientRepository.save(
                  this.recipientRepository.create({
                    message: savedMessage,
                    destinatario_id: member.person_id,
                    leido: false,
                  })
                );
                notifyUserIds.add(member.person_id);
              }
            }
          }
        }
      }
    } else if (dto.destinatario_id) {
      if (dto.emisor_id === dto.destinatario_id) {
        throw new BadRequestException('No puedes enviarte un mensaje a ti mismo');
      }
      await this.recipientRepository.save(
        this.recipientRepository.create({
          message: savedMessage,
          destinatario_id: dto.destinatario_id,
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
   * Calcula la cantidad de destinatarios para una alerta masiva
   */
  async calculateMassAlertRecipients(scope: 'ALL' | 'ROUTE' | 'ZONE', scopeValue?: string, emisorId?: string) {
    let count = 0;
    if (scope === 'ALL') {
      count = await this.personRepository.count();
    } else if (scope === 'ROUTE' || scope === 'ZONE') {
      // Simular encontrando un porcentaje de los usuarios
      count = Math.max(1, Math.floor((await this.personRepository.count()) * 0.4));
    }
    
    // Descontar al emisor si existe y la cuenta es mayor a 0
    if (emisorId && count > 0) {
      const emisorExists = await this.personRepository.findOne({ where: { userId: emisorId } });
      if (emisorExists) count -= 1;
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
    } else {
      // Simplificación para el prototipo
      persons = await this.personRepository.find({ take: Math.max(1, Math.floor((await this.personRepository.count()) * 0.4)) });
    }

    if (persons.length === 0) {
      throw new BadRequestException('No se encontraron destinatarios para el alcance seleccionado');
    }

    const messageObj: any = {
      contenido: dto.contenido,
      emisor_id: dto.emisor_id,
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
        destinatario_id: p.userId,
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
      const recipientIds = recipients.map(r => r.destinatario_id);
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
      where: { emisor_id: userId, is_mass_alert: true },
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

  // Compatibilidad hacia atrás
  async sendDirectMessage(dto: CreateMessageDto) {
    return this.sendMessage(dto);
  }

  /**
   * Obtener bandeja de entrada de un usuario.
   */
  async getInbox(userId: string) {
    const recipients = await this.recipientRepository
      .createQueryBuilder('r')
      .innerJoinAndSelect('r.message', 'msg')
      .where('r.destinatario_id = :userId', { userId })
      .andWhere('(msg.fecha_envio <= :now)', { now: new Date() })
      .orderBy('msg.fecha_envio', 'DESC')
      .getMany();

    const enriched = await Promise.all(
      recipients.map(async (r) => {
        const emisor = await this.personRepository.findOne({ where: { userId: r.message.emisor_id } });
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
            : { userId: r.message.emisor_id, name: 'Usuario', lastName: 'Desconocido' },
        };
      })
    );

    return enriched;
  }

  /**
   * Obtener bandeja de enviados de un usuario.
   */
  async getSent(userId: string) {
    const messages = await this.messageRepository
      .createQueryBuilder('msg')
      .where('msg.emisor_id = :userId', { userId })
      .orderBy('msg.fecha_envio', 'DESC')
      .getMany();

    const enriched = await Promise.all(
      messages.map(async (msg) => {
        const recipients = await this.recipientRepository.find({ where: { message: { id: msg.id } } });
        
        const destinatarios = await Promise.all(
          recipients.map(async (r) => {
            const person = await this.personRepository.findOne({ where: { userId: r.destinatario_id } });
            return {
              recipientId: r.id,
              leido: r.leido,
              fecha_lectura: r.fecha_lectura,
              persona: person
                ? { id: person.id, userId: person.userId, name: person.name, lastName: person.lastName, email: person.email }
                : { userId: r.destinatario_id, name: 'Usuario', lastName: 'Desconocido' },
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
      where: { id: recipientId, destinatario_id: userId },
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
    const msg = await this.messageRepository.findOne({ where: { id: messageId } });
    if (!msg) throw new NotFoundException('Mensaje no encontrado');

    const recGroups = await this.recipientGroupRepository.find({
      where: { message: { id: messageId } },
      relations: ['group'],
    });

    let isAuthorized = false;

    if (msg.emisor_id === userId) {
      isAuthorized = true;
    } else if (recGroups.length > 0) {
      for (const rg of recGroups) {
        const adminCheck = await this.groupPersonRepository.findOne({
          where: { person_id: userId, group: { id: rg.group.id }, is_admin: true }
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
   * Crear un nuevo grupo, añadir al creador como admin, añadir miembros y notificar.
   */
  async createGroup(userId: string, nombre: string, descripcion: string = '', isPublic: boolean = false, icon: string = '👥', memberIds: string[] = []) {
    if (memberIds.length < 2) {
      throw new BadRequestException('Debe añadir al menos 2 miembros adicionales al grupo.');
    }

    const group = this.groupRepository.create({
      nombre,
      descripcion,
      is_public: isPublic,
      icon,
    });
    const savedGroup = await this.groupRepository.save(group);

    // Añadir creador como admin
    await this.groupPersonRepository.save(
      this.groupPersonRepository.create({
        group: savedGroup,
        person_id: userId,
        is_admin: true,
      })
    );

    // Añadir miembros iniciales
    for (const memberId of memberIds) {
      if (memberId !== userId) {
        await this.groupPersonRepository.save(
          this.groupPersonRepository.create({
            group: savedGroup,
            person_id: memberId,
            is_admin: false,
          })
        );
      }
    }

    // Notificar a los miembros por mensaje directo
    const creator = await this.personRepository.findOne({ where: { userId } });
    const creatorName = creator ? `${creator.name} ${creator.lastName}` : 'Un usuario';
    
    // Usamos el fan-out de mensaje de grupo para que llegue etiquetado como grupo
    await this.sendMessage({
      emisor_id: userId,
      grupos_id: [savedGroup.id],
      contenido: `¡Hola! ${creatorName} ha creado este grupo y te ha añadido.`,
    });

    return savedGroup;
  }

  /**
   * Obtener los grupos a los que pertenece un usuario.
   */
  async getMyGroups(userId: string) {
    const groupPersons = await this.groupPersonRepository.find({
      where: { person_id: userId },
      relations: ['group'],
    });

    return groupPersons.map(gp => ({
      id: gp.group.id,
      nombre: gp.group.nombre,
      descripcion: gp.group.descripcion,
      isPublic: gp.group.is_public,
      icon: gp.group.icon,
      isAdmin: gp.is_admin,
    }));
  }

  /**
   * Añadir un miembro a un grupo.
   */
  async addMemberToGroup(groupId: string, adminId: string, personId: string) {
    const group = await this.groupRepository.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Grupo no encontrado');

    const adminCheck = await this.groupPersonRepository.findOne({
      where: { person_id: adminId, group: { id: groupId }, is_admin: true }
    });

    if (!adminCheck) {
      throw new ForbiddenException('No tienes permiso de administrador para añadir miembros');
    }

    const existing = await this.groupPersonRepository.findOne({
      where: { group: { id: groupId }, person_id: personId }
    });

    if (existing) throw new BadRequestException('El usuario ya pertenece al grupo');

    const member = this.groupPersonRepository.create({
      group,
      person_id: personId,
      is_admin: false,
    });
    const savedMember = await this.groupPersonRepository.save(member);

    // Notificar al usuario por mensaje directo
    await this.sendMessage({
      emisor_id: adminId,
      destinatario_id: personId,
      contenido: `Has sido añadido al grupo: ${group.nombre} ${group.icon || ''}`,
    });

    return savedMember;
  }

  /**
   * Listar miembros de un grupo.
   */
  async getGroupMembers(groupId: string) {
    const members = await this.groupPersonRepository.find({
      where: { group: { id: groupId } }
    });

    return await Promise.all(members.map(async (m) => {
      const p = await this.personRepository.findOne({ where: { userId: m.person_id } });
      return p 
        ? { id: p.id, userId: p.userId, name: p.name, lastName: p.lastName, email: p.email, isAdmin: m.is_admin } 
        : { userId: m.person_id, isAdmin: m.is_admin };
    }));
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
