import { httpBusiness } from './http';

export interface MessagePerson {
  id?: string;
  userId: string;
  name: string;
  lastName: string;
  email?: string;
  isAdmin?: boolean;
  fecha_union?: string;
}

export interface Group {
  id: string;
  nombre: string;
  descripcion?: string;
  isPublic: boolean;
  icon?: string;
  isAdmin: boolean;
}

export interface InboxMessage {
  id: string;
  messageId: string;
  contenido: string;
  ubicacion: { lat: number; lng: number } | null;
  fecha_envio: string;
  leido: boolean;
  fecha_lectura: string | null;
  esGrupo: boolean;
  nombreGrupo: string | null;
  groupId: string | null;
  isMassAlert?: boolean;
  isUrgent?: boolean;
  emisor: MessagePerson;
}

export interface SentMessageRecipient {
  recipientId: string;
  leido: boolean;
  fecha_lectura: string | null;
  persona: MessagePerson;
}

export interface SentMessage {
  id: string;
  contenido: string;
  ubicacion: { lat: number; lng: number } | null;
  fecha_envio: string;
  esGrupo: boolean;
  grupos: { id: string; nombre: string }[];
  destinatarios: SentMessageRecipient[];
}

export interface SendMessageDto {
  emisor_id: string;
  destinatario_id?: string;
  grupos_id?: string[];
  contenido: string;
  latitud?: number;
  longitud?: number;
}

export interface MassAlertStats {
  id: string;
  contenido: string;
  fecha_envio: string;
  scheduled_for: string | null;
  is_urgent: boolean;
  scope: string;
  totalRecipients: number;
  readCount: number;
}

// ── Messages ──

export const sendMessage = async (dto: SendMessageDto): Promise<any> => {
  const response = await httpBusiness.post('/messages/send', dto);
  return response.data;
};

export const getInbox = async (userId: string): Promise<InboxMessage[]> => {
  const response = await httpBusiness.get<InboxMessage[]>(`/messages/inbox/${userId}`);
  return response.data;
};

export const getSent = async (userId: string): Promise<SentMessage[]> => {
  const response = await httpBusiness.get<SentMessage[]>(`/messages/sent/${userId}`);
  return response.data;
};

export const markAsRead = async (recipientId: string, userId: string): Promise<any> => {
  const response = await httpBusiness.patch(`/messages/${recipientId}/read`, { userId });
  return response.data;
};

export const deleteMessage = async (messageId: string, userId: string): Promise<any> => {
  const response = await httpBusiness.delete(`/messages/delete/${messageId}`, { data: { userId } });
  return response.data;
};

export const searchPersons = async (query: string): Promise<MessagePerson[]> => {
  const response = await httpBusiness.get<MessagePerson[]>(`/messages/search-persons?q=${encodeURIComponent(query)}`);
  return response.data;
};

// ── Mass Alerts ──

export const calculateMassAlertRecipients = async (scope: 'ALL' | 'ROUTE' | 'ZONE', scopeValue?: string, emisorId?: string): Promise<{ count: number }> => {
  const response = await httpBusiness.post<{ count: number }>('/messages/mass-alerts/calculate', { scope, scopeValue, emisorId });
  return response.data;
};

export const sendMassAlert = async (dto: { emisor_id: string, contenido: string, scope: 'ALL' | 'ROUTE' | 'ZONE', scopeValue?: string, isUrgent?: boolean, scheduledFor?: string }): Promise<any> => {
  const response = await httpBusiness.post('/messages/mass-alerts', dto);
  return response.data;
};

export const getMassAlertStats = async (userId: string): Promise<MassAlertStats[]> => {
  const response = await httpBusiness.get<MassAlertStats[]>(`/messages/mass-alerts/stats/${userId}`);
  return response.data;
};

// ── Groups ──

export const createGroup = async (userId: string, nombre: string, descripcion: string = '', isPublic: boolean = false, icon: string = '👥', memberIds: string[] = []): Promise<Group> => {
  const response = await httpBusiness.post('/groups', { userId, nombre, descripcion, isPublic, icon, memberIds });
  return response.data;
};

export const getMyGroups = async (userId: string): Promise<Group[]> => {
  const response = await httpBusiness.get<Group[]>(`/groups/my-groups/${userId}`);
  return response.data;
};

export const addMemberToGroup = async (groupId: string, adminId: string, personId: string): Promise<any> => {
  const response = await httpBusiness.post(`/groups/${groupId}/members`, { adminId, personId });
  return response.data;
};

export const getGroupMembers = async (groupId: string): Promise<MessagePerson[]> => {
  const response = await httpBusiness.get<MessagePerson[]>(`/groups/${groupId}/members`);
  return response.data;
};

export const getPublicGroups = async (userId?: string, search?: string): Promise<any[]> => {
  const params = new URLSearchParams();
  if (userId) params.append('userId', userId);
  if (search) params.append('search', search);
  
  const response = await httpBusiness.get<any[]>(`/groups/public?${params.toString()}`);
  return response.data;
};

export const joinPublicGroup = async (groupId: string, userId: string): Promise<any> => {
  const response = await httpBusiness.post(`/groups/${groupId}/join`, { userId });
  return response.data;
};

export const leaveGroup = async (groupId: string, userId: string): Promise<any> => {
  const response = await httpBusiness.post(`/groups/${groupId}/leave`, { userId });
  return response.data;
};

// ── Group Administration ──

export const promoteGroupMember = async (groupId: string, adminId: string, personId: string): Promise<any> => {
  const response = await httpBusiness.patch(`/groups/${groupId}/members/${personId}/promote`, { userId: adminId });
  return response.data;
};

export const removeGroupMember = async (groupId: string, adminId: string, personId: string): Promise<any> => {
  const response = await httpBusiness.delete(`/groups/${groupId}/members/${personId}?adminId=${adminId}`);
  return response.data;
};

export const blockGroupMember = async (groupId: string, adminId: string, personId: string): Promise<any> => {
  const response = await httpBusiness.post(`/groups/${groupId}/members/${personId}/block`, { userId: adminId });
  return response.data;
};

export interface GroupLog {
  id: string;
  action: string;
  created_at: string;
  actor_id: string;
  target_id: string;
  actorName: string;
  targetName: string;
}

export const getGroupLogs = async (groupId: string, adminId: string): Promise<GroupLog[]> => {
  const response = await httpBusiness.get<GroupLog[]>(`/groups/${groupId}/logs?adminId=${adminId}`);
  return response.data;
};
