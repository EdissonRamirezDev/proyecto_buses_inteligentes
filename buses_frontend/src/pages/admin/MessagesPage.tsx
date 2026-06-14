import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../context/SocketContext';
import AdminHeader from '../../components/common/AdminHeader';
import Button from '../../components/common/Button';
import {
  sendMessage,
  getInbox,
  getSent,
  markAsRead,
  deleteMessage,
  searchPersons,
  getMyGroups,
  createGroup,
  addMemberToGroup,
} from '../../services/messageService';
import type {
  InboxMessage,
  SentMessage,
  MessagePerson,
  Group,
} from '../../services/messageService';

const EMOJI_OPTIONS = ['👥', '🚌', '🏙️', '⚽', '🎓', '🚑', '🚨', '🎉', '💼', '🏡'];

const MessagesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { triggerRefresh } = useSocket();
  const currentUserId = user?.id || '';

  const [tab, setTab] = useState<'inbox' | 'sent' | 'compose' | 'groups'>('inbox');
  const [inbox, setInbox] = useState<InboxMessage[]>([]);
  const [sent, setSent] = useState<SentMessage[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Compose state
  const [composeMode, setComposeMode] = useState<'direct' | 'group'>('direct');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MessagePerson[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<MessagePerson | null>(null);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  
  const [content, setContent] = useState('');
  const [attachLocation, setAttachLocation] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [sending, setSending] = useState(false);
  
  // Group creation state
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupPublic, setNewGroupPublic] = useState(false);
  const [newGroupIcon, setNewGroupIcon] = useState('👥');
  const [newGroupMembers, setNewGroupMembers] = useState<MessagePerson[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);

  const [toast, setToast] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const searchTimeout = useRef<any>(null);
  const prevInboxCount = useRef(0);

  // Inbox filters
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'individual' | 'group'>('all');
  const [filterDate, setFilterDate] = useState('');

  const fetchData = async () => {
    if (!currentUserId) return;
    try {
      const [inboxData, sentData, groupsData] = await Promise.all([
        getInbox(currentUserId),
        getSent(currentUserId),
        getMyGroups(currentUserId),
      ]);
      if (prevInboxCount.current > 0 && inboxData.length > prevInboxCount.current) {
        const newCount = inboxData.length - prevInboxCount.current;
        showToast(`📩 ${newCount} nuevo(s) mensaje(s) recibido(s)`);
      }
      prevInboxCount.current = inboxData.length;
      setInbox(inboxData);
      setSent(sentData);
      setMyGroups(groupsData);
    } catch (err) {
      console.error('Error fetching messages', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // reduced frequency since we have websockets
    return () => clearInterval(interval);
  }, [currentUserId, triggerRefresh]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchPersons(searchQuery);
        // Filtramos para no buscarnos a nosotros mismos
        setSearchResults(results.filter((p) => p.userId !== currentUserId));
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  }, [searchQuery]);

  const handleSend = async () => {
    if (composeMode === 'direct' && !selectedPerson) return;
    if (composeMode === 'group' && selectedGroups.length === 0) return;
    if (!content.trim()) return;

    setSending(true);
    try {
      await sendMessage({
        emisor_id: currentUserId,
        destinatario_id: composeMode === 'direct' ? selectedPerson?.userId : undefined,
        grupos_id: composeMode === 'group' ? selectedGroups : undefined,
        contenido: content.trim(),
        latitud: attachLocation && userLocation ? userLocation.lat : undefined,
        longitud: attachLocation && userLocation ? userLocation.lng : undefined,
      });
      showToast('✅ Mensaje enviado correctamente');
      setContent('');
      setSelectedPerson(null);
      setSelectedGroups([]);
      setSearchQuery('');
      setAttachLocation(false);
      setTab('sent');
      await fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.message || '❌ Error al enviar mensaje');
    } finally {
      setSending(false);
    }
  };

  const handleMarkRead = async (recipientId: string) => {
    try {
      await markAsRead(recipientId, currentUserId);
      setInbox((prev) =>
        prev.map((m) =>
          m.id === recipientId
            ? { ...m, leido: true, fecha_lectura: new Date().toISOString() }
            : m,
        ),
      );
    } catch (err) {
      console.error('Error marking read', err);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este mensaje para todos?')) return;
    try {
      await deleteMessage(messageId, currentUserId);
      showToast('🗑️ Mensaje eliminado');
      await fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.message || '❌ No tienes permiso para eliminar este mensaje');
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    if (newGroupMembers.length < 2) {
      showToast('⚠️ Debes añadir al menos 2 miembros adicionales al grupo');
      return;
    }
    setCreatingGroup(true);
    try {
      const memberIds = newGroupMembers.map(m => m.userId);
      await createGroup(currentUserId, newGroupName.trim(), newGroupDesc.trim(), newGroupPublic, newGroupIcon, memberIds);
      showToast('✅ Grupo creado correctamente y miembros notificados');
      setNewGroupName('');
      setNewGroupDesc('');
      setNewGroupPublic(false);
      setNewGroupIcon('👥');
      setNewGroupMembers([]);
      setSearchQuery('');
      await fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.message || '❌ Error al crear grupo');
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleAddMemberToGroup = async (groupId: string, personId: string) => {
    try {
      await addMemberToGroup(groupId, currentUserId, personId);
      showToast('✅ Miembro añadido al grupo');
      setSearchQuery('');
      setSearchResults([]);
      await fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.message || '❌ Error al añadir miembro');
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      showToast('Tu navegador no soporta geolocalización');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setAttachLocation(true);
        showToast('📍 Ubicación adjuntada');
      },
      () => showToast('No se pudo obtener ubicación'),
    );
  };

  const unreadCount = inbox.filter((m) => !m.leido).length;

  const filteredInbox = inbox.filter(msg => {
    if (filterType === 'unread' && msg.leido) return false;
    if (filterType === 'individual' && msg.esGrupo) return false;
    if (filterType === 'group' && !msg.esGrupo) return false;
    
    if (filterDate) {
      const msgDate = new Date(msg.fecha_envio).toISOString().split('T')[0];
      if (msgDate !== filterDate) return false;
    }
    return true;
  });

  const handleReply = (msg: InboxMessage) => {
    setComposeMode('direct');
    setSelectedPerson(msg.emisor);
    setContent(`\n\n--- En respuesta a ---\n${msg.contenido}`);
    setTab('compose');
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <AdminHeader
          title="Comunicaciones"
          subtitle="Envía y recibe mensajes directos o a grupos"
          showBack
          onBack={() => navigate(-1)}
        />

        {toast && (
          <div className="fixed top-6 right-6 z-[9999] animate-slide-in bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl px-5 py-3 text-sm font-medium text-gray-800 dark:text-gray-200 max-w-sm">
            {toast}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-1 overflow-x-auto">
          <button
            onClick={() => setTab('inbox')}
            className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${tab === 'inbox' ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            📥 Recibidos {unreadCount > 0 && <span className="ml-1 bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
          </button>
          <button
            onClick={() => setTab('sent')}
            className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${tab === 'sent' ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            📤 Enviados
          </button>
          <button
            onClick={() => setTab('compose')}
            className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${tab === 'compose' ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            ✏️ Redactar
          </button>
          <button
            onClick={() => setTab('groups')}
            className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${tab === 'groups' ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            👥 Mis Grupos
          </button>
        </div>

        {/* ── INBOX ── */}
        {tab === 'inbox' && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2 bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 items-center justify-between shadow-sm">
              <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                <button onClick={() => setFilterType('all')} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${filterType === 'all' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Todos</button>
                <button onClick={() => setFilterType('unread')} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${filterType === 'unread' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>No Leídos</button>
                <button onClick={() => setFilterType('individual')} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${filterType === 'individual' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Individuales</button>
                <button onClick={() => setFilterType('group')} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${filterType === 'group' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Grupos</button>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">Fecha:</span>
                <input 
                  type="date" 
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full sm:w-auto p-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none"
                />
                {filterDate && <button onClick={() => setFilterDate('')} className="text-gray-400 hover:text-rose-500 font-bold">×</button>}
              </div>
            </div>

            {loading ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">Cargando mensajes...</p>
            ) : filteredInbox.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <p className="text-4xl mb-3">📭</p>
                <p className="text-gray-500 dark:text-gray-400 font-medium">Tu bandeja de entrada está vacía</p>
              </div>
            ) : (
              filteredInbox.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => {
                    setExpandedId(expandedId === msg.id ? null : msg.id);
                    if (!msg.leido) handleMarkRead(msg.id);
                  }}
                  className={`bg-white dark:bg-gray-800 rounded-xl border cursor-pointer transition-all hover:shadow-md ${!msg.leido ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''} ${msg.isUrgent ? 'border-rose-400 dark:border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.2)]' : (!msg.leido ? 'border-indigo-400 dark:border-indigo-500' : 'border-gray-200 dark:border-gray-700')}`}
                >
                  <div className="px-5 py-4 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {!msg.leido && <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0"></span>}
                        {msg.isMassAlert && <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900">Alerta del Sistema</span>}
                        {msg.isUrgent && <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-rose-500 text-white animate-pulse">Urgente</span>}
                        <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                          {msg.isMassAlert ? 'Administrador' : `${msg.emisor.name} ${msg.emisor.lastName}`}
                        </span>
                        {msg.esGrupo && !msg.isMassAlert && (
                          <span className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                            👥 {msg.nombreGrupo}
                          </span>
                        )}
                      </div>
                      <p className={`text-sm truncate ${expandedId === msg.id ? 'whitespace-normal' : ''} ${!msg.leido ? 'text-gray-800 dark:text-gray-200 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                        {msg.contenido}
                      </p>
                      {expandedId === msg.id && msg.ubicacion && (
                        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-xs text-gray-600 dark:text-gray-300 flex items-center gap-2">
                          📍 Ubicación adjuntada: <a href={`https://www.google.com/maps?q=${msg.ubicacion.lat},${msg.ubicacion.lng}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 underline">Ver en Google Maps</a>
                        </div>
                      )}
                      {expandedId === msg.id && !msg.isMassAlert && (
                        <div className="mt-3 flex justify-end">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleReply(msg); }}
                            className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-xs px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-1"
                          >
                            ↩️ Responder
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(msg.fecha_envio)}</p>
                      {msg.leido && msg.fecha_lectura && (
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">✓✓ Leído {formatDate(msg.fecha_lectura)}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── SENT ── */}
        {tab === 'sent' && (
          <div className="space-y-3">
            {loading ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">Cargando mensajes...</p>
            ) : sent.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <p className="text-4xl mb-3">📤</p>
                <p className="text-gray-500 dark:text-gray-400 font-medium">Aún no has enviado mensajes</p>
              </div>
            ) : (
              sent.map((msg) => {
                const isGroupAdmin = msg.esGrupo && msg.grupos.some(g => myGroups.find(mg => mg.id === g.id)?.isAdmin);
                
                return (
                  <div
                    key={msg.id}
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 transition-all hover:shadow-md"
                  >
                    <div 
                      className="px-5 py-4 flex items-start justify-between gap-4 cursor-pointer"
                      onClick={() => setExpandedId(expandedId === msg.id ? null : msg.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Para:</span>
                          {msg.esGrupo ? (
                            msg.grupos.map(g => (
                              <span key={g.id} className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                👥 {g.nombre}
                              </span>
                            ))
                          ) : (
                            msg.destinatarios.map((d) => (
                              <span key={d.recipientId} className="font-semibold text-sm text-gray-900 dark:text-white">
                                {d.persona.name} {d.persona.lastName}
                              </span>
                            ))
                          )}
                        </div>
                        <p className={`text-sm text-gray-600 dark:text-gray-400 ${expandedId === msg.id ? 'whitespace-normal' : 'truncate'}`}>
                          {msg.contenido}
                        </p>
                        
                        {expandedId === msg.id && (
                          <div className="mt-4 space-y-3" onClick={e => e.stopPropagation()}>
                            {msg.ubicacion && (
                              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-xs text-gray-600 dark:text-gray-300 flex items-center gap-2">
                                📍 Ubicación adjuntada: <a href={`https://www.google.com/maps?q=${msg.ubicacion.lat},${msg.ubicacion.lng}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 underline">Ver en Google Maps</a>
                              </div>
                            )}
                            
                            {msg.esGrupo && (
                              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
                                <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">Estado de lectura ({msg.destinatarios.filter(d => d.leido).length}/{msg.destinatarios.length})</h4>
                                <div className="max-h-32 overflow-y-auto space-y-1">
                                  {msg.destinatarios.map(d => (
                                    <div key={d.recipientId} className="flex justify-between text-[11px] items-center">
                                      <span className="text-gray-600 dark:text-gray-400">{d.persona.name} {d.persona.lastName}</span>
                                      <span className={d.leido ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}>
                                        {d.leido ? `✓✓ ${formatDate(d.fecha_lectura!)}` : '✓ Enviado'}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {(isGroupAdmin || !msg.esGrupo) && (
                              <div className="flex justify-end pt-2">
                                <button 
                                  onClick={() => handleDeleteMessage(msg.id)}
                                  className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 font-medium border border-transparent hover:border-rose-200"
                                >
                                  🗑️ Eliminar mensaje para todos
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(msg.fecha_envio)}</p>
                        {!msg.esGrupo && msg.destinatarios.map((d) => (
                          <p key={d.recipientId} className={`text-[10px] mt-1 ${d.leido ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                            {d.leido ? `✓✓ Leído ${d.fecha_lectura ? formatDate(d.fecha_lectura) : ''}` : '✓ Enviado'}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── COMPOSE ── */}
        {tab === 'compose' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
              <h2 className="font-bold text-gray-900 dark:text-white text-lg">Redactar mensaje</h2>
              <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
                <button
                  onClick={() => setComposeMode('direct')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${composeMode === 'direct' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                >
                  Mensaje Directo
                </button>
                <button
                  onClick={() => setComposeMode('group')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${composeMode === 'group' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                >
                  A Grupo(s)
                </button>
              </div>
            </div>

            {composeMode === 'direct' ? (
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Destinatario</label>
                {selectedPerson ? (
                  <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-lg px-4 py-3">
                    <div>
                      <span className="font-semibold text-indigo-700 dark:text-indigo-300">{selectedPerson.name} {selectedPerson.lastName}</span>
                      {selectedPerson.email && <span className="text-xs text-indigo-500 ml-2">({selectedPerson.email})</span>}
                    </div>
                    <button onClick={() => { setSelectedPerson(null); setSearchQuery(''); }} className="text-xs text-rose-600 hover:underline">Cambiar</button>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar por nombre o email..."
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                    {searching && <p className="text-xs text-gray-400 mt-1">Buscando...</p>}
                    {searchResults.length > 0 && (
                      <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-52 overflow-y-auto">
                        {searchResults.map((p) => (
                          <button
                            key={p.userId}
                            onClick={() => {
                              setSelectedPerson(p);
                              setSearchQuery('');
                              setSearchResults([]);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0"
                          >
                            <span className="font-medium text-gray-900 dark:text-white text-sm">{p.name} {p.lastName}</span>
                            {p.email && <span className="text-xs text-gray-500 ml-2">({p.email})</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Seleccionar Grupos Destinatarios</label>
                {myGroups.length === 0 ? (
                  <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                    No perteneces a ningún grupo. Crea uno en la pestaña "Mis Grupos".
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {myGroups.map(g => (
                      <div 
                        key={g.id} 
                        onClick={() => {
                          if (selectedGroups.includes(g.id)) {
                            setSelectedGroups(selectedGroups.filter(id => id !== g.id));
                          } else {
                            setSelectedGroups([...selectedGroups, g.id]);
                          }
                        }}
                        className={`p-3 rounded-xl border cursor-pointer transition-colors flex items-center justify-between ${selectedGroups.includes(g.id) ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 shadow-sm' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-indigo-300'}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{g.icon || '👥'}</span>
                          <div>
                            <p className={`font-semibold text-sm ${selectedGroups.includes(g.id) ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-800 dark:text-gray-200'}`}>
                              {g.nombre}
                            </p>
                            <div className="flex items-center gap-1 mt-0.5">
                              {g.isAdmin && <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold uppercase">Admin</span>}
                              <span className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded uppercase">{g.isPublic ? 'Público' : 'Privado'}</span>
                            </div>
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedGroups.includes(g.id) ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300'}`}>
                          {selectedGroups.includes(g.id) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Mensaje</label>
              <textarea
                value={content}
                onChange={(e) => {
                  if (e.target.value.length <= 500) setContent(e.target.value);
                }}
                rows={5}
                placeholder="Escribe tu mensaje aquí..."
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
              <div className="flex justify-between items-center mt-1">
                <p className={`text-xs ${content.length >= 480 ? 'text-rose-500' : 'text-gray-400'}`}>
                  {content.length}/500 caracteres
                </p>
                <button
                  onClick={handleGetLocation}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${attachLocation ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400' : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  📍 {attachLocation ? 'Ubicación adjuntada ✓' : 'Adjuntar ubicación'}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleSend}
                disabled={(composeMode === 'direct' && !selectedPerson) || (composeMode === 'group' && selectedGroups.length === 0) || !content.trim() || sending}
              >
                {sending ? 'Enviando...' : '📨 Enviar mensaje'}
              </Button>
            </div>
          </div>
        )}

        {/* ── GROUPS MANAGER ── */}
        {tab === 'groups' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <h2 className="font-bold text-gray-900 dark:text-white text-lg mb-4">Crear Nuevo Grupo</h2>
              
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del Grupo</label>
                    <input
                      type="text"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="Ej: Pasajeros Ruta 42"
                      className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div className="w-full md:w-48 flex-shrink-0">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Visibilidad</label>
                    <select
                      value={newGroupPublic ? 'public' : 'private'}
                      onChange={(e) => setNewGroupPublic(e.target.value === 'public')}
                      className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    >
                      <option value="private">🔒 Privado</option>
                      <option value="public">🌍 Público</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                  <input
                    type="text"
                    value={newGroupDesc}
                    onChange={(e) => setNewGroupDesc(e.target.value)}
                    placeholder="Descripción del grupo..."
                    className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ícono del grupo</label>
                  <div className="flex flex-wrap gap-2">
                    {EMOJI_OPTIONS.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => setNewGroupIcon(emoji)}
                        className={`text-2xl p-2 border rounded-lg transition-colors ${newGroupIcon === emoji ? 'bg-indigo-100 border-indigo-500' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Añadir miembros (Mínimo 2)</label>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {newGroupMembers.map(m => (
                      <div key={m.userId} className="flex items-center gap-1 bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-full text-sm">
                        <span>{m.name} {m.lastName}</span>
                        <button onClick={() => setNewGroupMembers(newGroupMembers.filter(p => p.userId !== m.userId))} className="ml-1 text-indigo-400 hover:text-indigo-600 font-bold">×</button>
                      </div>
                    ))}
                    {newGroupMembers.length === 0 && <span className="text-sm text-gray-500 py-1.5">No has añadido a nadie aún.</span>}
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar personas para añadir..."
                      className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                    {searching && <p className="text-xs text-gray-400 mt-1">Buscando...</p>}
                    {searchResults.length > 0 && (
                      <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-52 overflow-y-auto">
                        {searchResults.map((p) => {
                          const isAlreadyAdded = newGroupMembers.some(m => m.userId === p.userId);
                          return (
                            <button
                              key={p.userId}
                              disabled={isAlreadyAdded}
                              onClick={() => {
                                setNewGroupMembers([...newGroupMembers, p]);
                                setSearchQuery('');
                                setSearchResults([]);
                              }}
                              className={`w-full text-left px-4 py-3 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0 flex justify-between items-center ${isAlreadyAdded ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:bg-indigo-50 dark:hover:bg-indigo-900/20'}`}
                            >
                              <div>
                                <span className="font-medium text-gray-900 dark:text-white text-sm block">{p.name} {p.lastName}</span>
                                {p.email && <span className="text-xs text-gray-500">{p.email}</span>}
                              </div>
                              {!isAlreadyAdded ? (
                                <span className="text-indigo-600 text-xs font-bold bg-indigo-100 px-2 py-1 rounded">+ Añadir</span>
                              ) : (
                                <span className="text-gray-500 text-xs font-bold">Añadido</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={handleCreateGroup} 
                    disabled={!newGroupName.trim() || creatingGroup || newGroupMembers.length < 2}
                  >
                    {creatingGroup ? 'Creando...' : '➕ Crear Grupo'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="font-bold text-gray-900 dark:text-white text-lg">Grupos que administro</h2>
              </div>
              
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {myGroups.filter(g => g.isAdmin).length === 0 ? (
                  <p className="p-6 text-center text-gray-500 dark:text-gray-400">No administras ningún grupo.</p>
                ) : (
                  myGroups.filter(g => g.isAdmin).map(g => (
                    <div key={g.id} className="p-6">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl bg-gray-50 rounded-lg p-2 border">{g.icon || '👥'}</span>
                          <div>
                            <h3 className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">{g.nombre}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded uppercase font-medium">{g.isPublic ? 'Público' : 'Privado'}</span>
                              <span className="text-xs text-gray-500">{g.descripcion}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Añadir miembro al grupo */}
                      <div className="relative max-w-md mt-4">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Añadir nuevo miembro</label>
                        <input
                          type="text"
                          value={expandedId === `search-${g.id}` ? searchQuery : ''}
                          onChange={(e) => {
                            setExpandedId(`search-${g.id}`);
                            setSearchQuery(e.target.value);
                          }}
                          placeholder="Buscar persona por nombre/email..."
                          className="w-full p-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none"
                        />
                        {expandedId === `search-${g.id}` && searchResults.length > 0 && (
                          <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-52 overflow-y-auto">
                            {searchResults.map((p) => (
                              <button
                                key={p.userId}
                                onClick={() => handleAddMemberToGroup(g.id, p.userId)}
                                className="w-full text-left px-4 py-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors border-b border-gray-100 dark:border-gray-700 flex justify-between items-center"
                              >
                                <div>
                                  <span className="font-medium text-gray-900 dark:text-white text-sm block">{p.name} {p.lastName}</span>
                                  {p.email && <span className="text-xs text-gray-500">{p.email}</span>}
                                </div>
                                <span className="text-emerald-600 text-xs font-bold bg-emerald-100 px-2 py-1 rounded">Añadir</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default MessagesPage;
