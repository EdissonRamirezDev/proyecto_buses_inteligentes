import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from './entities/group.entity';
import { GroupPerson } from '../group-persons/entities/group-person.entity';
import { GroupLog, GroupAction } from './entities/group-log.entity';
import { Person } from '../persons/entities/person.entity';
import { MessagesService } from '../messages/messages.service';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(GroupPerson)
    private groupPersonRepository: Repository<GroupPerson>,
    @InjectRepository(GroupLog)
    private groupLogRepository: Repository<GroupLog>,
    @InjectRepository(Person)
    private personRepository: Repository<Person>,
    @Inject(forwardRef(() => MessagesService))
    private messagesService: MessagesService,
  ) {}

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

    const creator = await this.personRepository.findOne({ where: { userId } });
    if (!creator) throw new BadRequestException('El usuario creador no existe');

    // Añadir creador como admin
    await this.groupPersonRepository.save(
      this.groupPersonRepository.create({
        group: savedGroup,
        persona: creator,
        is_admin: true,
      })
    );

    // Añadir miembros iniciales
    for (const memberId of memberIds) {
      if (memberId !== userId) {
        const memberPerson = await this.personRepository.findOne({ where: { userId: memberId } });
        if (memberPerson) {
          await this.groupPersonRepository.save(
            this.groupPersonRepository.create({
              group: savedGroup,
              persona: memberPerson,
              is_admin: false,
            })
          );
        }
      }
    }

    const creatorName = creator ? `${creator.name} ${creator.lastName}` : 'Un usuario';
    
    // Usamos el fan-out de mensaje de grupo para que llegue etiquetado como grupo
    await this.messagesService.sendMessage({
      emisor_id: userId,
      grupos_id: [savedGroup.id],
      contenido: `¡Hola! ${creatorName} ha creado este grupo y te ha añadido.`,
    });

    return savedGroup;
  }

  /**
   * Añadir un nuevo miembro a un grupo existente. (Solo admins)
   */
  async addMemberToGroup(groupId: string, adminId: string, personId: string) {
    const group = await this.groupRepository.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Grupo no encontrado');

    // Check if admin
    const adminCheck = await this.groupPersonRepository.findOne({
      where: { persona: { userId: adminId }, group: { id: groupId }, is_admin: true }
    });
    if (!adminCheck) throw new ForbiddenException('No tienes permiso de administrador');

    // Check if user exists and not blocked
    const existing = await this.groupPersonRepository.findOne({
      where: { persona: { userId: personId }, group: { id: groupId } }
    });
    if (existing) {
      if (existing.is_blocked) throw new BadRequestException('El usuario está bloqueado de este grupo.');
      throw new BadRequestException('El usuario ya pertenece al grupo.');
    }

    const newMemberPerson = await this.personRepository.findOne({ where: { userId: personId } });
    if (!newMemberPerson) throw new BadRequestException('El usuario a añadir no existe');

    const savedMember = await this.groupPersonRepository.save(
      this.groupPersonRepository.create({
        group,
        persona: newMemberPerson,
        is_admin: false,
      })
    );

    await this.groupLogRepository.save(
      this.groupLogRepository.create({
        group,
        actor_id: adminId,
        target_id: personId,
        action: GroupAction.ADDED,
      })
    );

    // Notificar al usuario por mensaje directo
    await this.messagesService.sendMessage({
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
      where: { group: { id: groupId }, is_blocked: false },
      relations: ['persona']
    });

    return members.map(m => {
      const p = m.persona;
      return p 
        ? { id: p.id, userId: p.userId, name: p.name, lastName: p.lastName, email: p.email, isAdmin: m.is_admin, fecha_union: m.fecha_union } 
        : { userId: 'unknown', isAdmin: m.is_admin, fecha_union: m.fecha_union };
    });
  }

  /**
   * Obtener directorio de grupos públicos con conteo de miembros.
   */
  async getPublicGroups(userId?: string, search?: string) {
    const groups = await this.groupRepository.find({ where: { is_public: true } });
    const result: any[] = [];
    for (const g of groups) {
      const memberCount = await this.groupPersonRepository.count({ where: { group: { id: g.id }, is_blocked: false } });
      let isMember = false;
      if (userId) {
        const check = await this.groupPersonRepository.findOne({ where: { group: { id: g.id }, persona: { userId } } });
        isMember = !!check && !check.is_blocked;
      }
      if (search) {
        if (!g.nombre.toLowerCase().includes(search.toLowerCase()) && !(g.descripcion && g.descripcion.toLowerCase().includes(search.toLowerCase()))) {
          continue;
        }
      }
      result.push({ ...g, isPublic: g.is_public, memberCount, isMember });
    }
    return result;
  }

  /**
   * Unirse a un grupo público.
   */
  async joinPublicGroup(groupId: string, userId: string) {
    const group = await this.groupRepository.findOne({ where: { id: groupId, is_public: true } });
    if (!group) throw new NotFoundException('Grupo público no encontrado');

    const existing = await this.groupPersonRepository.findOne({
      where: { group: { id: groupId }, persona: { userId } }
    });
    if (existing) {
      if (existing.is_blocked) throw new BadRequestException('Estás bloqueado de este grupo.');
      throw new BadRequestException('Ya eres miembro');
    }

    const joinerPerson = await this.personRepository.findOne({ where: { userId } });
    if (!joinerPerson) throw new BadRequestException('El usuario no existe');

    await this.groupPersonRepository.save(
      this.groupPersonRepository.create({
        group,
        persona: joinerPerson,
        is_admin: false,
      })
    );

    await this.groupLogRepository.save(
      this.groupLogRepository.create({
        group,
        actor_id: userId,
        target_id: userId,
        action: GroupAction.JOINED,
      })
    );

    return { success: true };
  }

  /**
   * Obtener mis grupos.
   */
  async getMyGroups(userId: string) {
    const memberships = await this.groupPersonRepository.find({
      where: { persona: { userId }, is_blocked: false },
      relations: ['group'],
    });

    return memberships.map(m => ({
      ...m.group,
      isPublic: m.group.is_public,
      isAdmin: m.is_admin,
    }));
  }

  async promoteMember(groupId: string, adminId: string, targetId: string) {
    const adminCheck = await this.groupPersonRepository.findOne({
      where: { persona: { userId: adminId }, group: { id: groupId }, is_admin: true }
    });
    if (!adminCheck) throw new ForbiddenException('No tienes permiso de administrador');

    const targetMember = await this.groupPersonRepository.findOne({
      where: { persona: { userId: targetId }, group: { id: groupId } }
    });
    if (!targetMember) throw new NotFoundException('Usuario no encontrado en el grupo');
    if (targetMember.is_blocked) throw new BadRequestException('El usuario está bloqueado.');

    targetMember.is_admin = true;
    await this.groupPersonRepository.save(targetMember);

    const group = await this.groupRepository.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Grupo no encontrado');

    await this.groupLogRepository.save(
      this.groupLogRepository.create({
        group,
        actor_id: adminId,
        target_id: targetId,
        action: GroupAction.PROMOTED,
      })
    );

    return targetMember;
  }

  async removeMember(groupId: string, adminId: string, targetId: string) {
    const group = await this.groupRepository.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Grupo no encontrado');

    const adminCheck = await this.groupPersonRepository.findOne({
      where: { persona: { userId: adminId }, group: { id: groupId }, is_admin: true }
    });
    if (!adminCheck) throw new ForbiddenException('No tienes permiso de administrador');

    const targetMember = await this.groupPersonRepository.findOne({
      where: { persona: { userId: targetId }, group: { id: groupId } }
    });
    if (!targetMember) throw new NotFoundException('Usuario no encontrado en el grupo');

    await this.groupPersonRepository.remove(targetMember);

    await this.groupLogRepository.save(
      this.groupLogRepository.create({
        group,
        actor_id: adminId,
        target_id: targetId,
        action: GroupAction.REMOVED,
      })
    );

    await this.messagesService.sendMessage({
      emisor_id: adminId,
      destinatario_id: targetId,
      contenido: `Has sido removido del grupo ${group.nombre} ${group.icon || ''}`,
    });

    return { success: true };
  }

  async blockMember(groupId: string, adminId: string, targetId: string) {
    const group = await this.groupRepository.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Grupo no encontrado');

    const adminCheck = await this.groupPersonRepository.findOne({
      where: { persona: { userId: adminId }, group: { id: groupId }, is_admin: true }
    });
    if (!adminCheck) throw new ForbiddenException('No tienes permiso de administrador');

    const targetMember = await this.groupPersonRepository.findOne({
      where: { persona: { userId: targetId }, group: { id: groupId } }
    });

    if (!targetMember) {
      const targetPerson = await this.personRepository.findOne({ where: { userId: targetId } });
      if (!targetPerson) throw new BadRequestException('El usuario a bloquear no existe');

      await this.groupPersonRepository.save(
        this.groupPersonRepository.create({
          group,
          persona: targetPerson,
          is_admin: false,
          is_blocked: true,
        })
      );
    } else {
      targetMember.is_blocked = true;
      targetMember.is_admin = false;
      await this.groupPersonRepository.save(targetMember);
    }

    await this.groupLogRepository.save(
      this.groupLogRepository.create({
        group,
        actor_id: adminId,
        target_id: targetId,
        action: GroupAction.BLOCKED,
      })
    );

    await this.messagesService.sendMessage({
      emisor_id: adminId,
      destinatario_id: targetId,
      contenido: `Has sido bloqueado del grupo ${group.nombre} ${group.icon || ''}`,
    });

    return { success: true };
  }

  async getGroupLogs(groupId: string, adminId: string) {
    const adminCheck = await this.groupPersonRepository.findOne({
      where: { persona: { userId: adminId }, group: { id: groupId }, is_admin: true }
    });
    if (!adminCheck) throw new ForbiddenException('No tienes permiso de administrador');

    const logs = await this.groupLogRepository.find({
      where: { group: { id: groupId } },
      order: { created_at: 'DESC' },
    });

    return await Promise.all(logs.map(async (l) => {
      const actor = await this.personRepository.findOne({ where: { userId: l.actor_id } });
      const target = l.target_id ? await this.personRepository.findOne({ where: { userId: l.target_id } }) : null;
      return {
        ...l,
        actorName: actor ? `${actor.name} ${actor.lastName}` : l.actor_id,
        targetName: target ? `${target.name} ${target.lastName}` : l.target_id,
      };
    }));
  }

  async leaveGroup(groupId: string, userId: string) {
    const group = await this.groupRepository.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Grupo no encontrado');

    const member = await this.groupPersonRepository.findOne({
      where: { group: { id: groupId }, persona: { userId } }
    });
    if (!member) throw new BadRequestException('No eres miembro del grupo');

    if (member.is_admin) {
      const allAdmins = await this.groupPersonRepository.find({
        where: { group: { id: groupId }, is_admin: true }
      });
      if (allAdmins.length === 1) {
        throw new BadRequestException('Eres el único administrador. Debes promover a alguien más antes de abandonar el grupo.');
      }
    }

    await this.groupPersonRepository.remove(member);

    await this.groupLogRepository.save(
      this.groupLogRepository.create({
        group,
        actor_id: userId,
        target_id: userId,
        action: GroupAction.LEFT,
      })
    );

    const person = await this.personRepository.findOne({ where: { userId } });
    const personName = person ? `${person.name} ${person.lastName}` : 'Un usuario';
    
    const admins = await this.groupPersonRepository.find({
      where: { group: { id: groupId }, is_admin: true },
      relations: ['persona']
    });

    for (const admin of admins) {
      if (admin.persona) {
        await this.messagesService.sendMessage({
          emisor_id: userId,
          destinatario_id: admin.persona.userId,
          contenido: `🚪 El usuario ${personName} ha abandonado el grupo ${group.nombre} de forma voluntaria.`,
        });
      }
    }

    return { success: true };
  }
}
