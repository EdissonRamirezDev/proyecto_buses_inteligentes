import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store';
import { createCitizen, findCitizenByUserId } from '../../services/citizensService';
import { getTransactions } from '../../services/walletService';
import type { WalletTransaction } from '../../services/walletService';
import { getTickets, getActiveTicketsForCitizen, getTripDetails } from '../../services/ticketsService';
import { getInbox } from '../../services/messageService';
import CitizenTripValidation from '../../components/citizen/CitizenTripValidation';
import type { Citizen } from '../../types/citizen.types';
import type { Ticket, TripDetails } from '../../types/ticket.types';
import Button from '../../components/common/Button';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const CitizenDashboard = () => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const [citizen, setCitizen] = useState<Citizen | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [selectedTripDetails, setSelectedTripDetails] = useState<TripDetails | null>(null);
  const [tripRoutePositions, setTripRoutePositions] = useState<[number, number][]>([]);
  const [mapLoading, setMapLoading] = useState(false);
  const [tripToast, setTripToast] = useState('');
  const [activeTripTickets, setActiveTripTickets] = useState<Ticket[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const reloadCitizenData = async (citizenId: string) => {
    const [txs, tkts, active] = await Promise.all([
      getTransactions(citizenId),
      getTickets(),
      getActiveTicketsForCitizen(citizenId),
    ]);
    setTransactions(txs);
    setTickets(tkts.filter((t: any) => t.citizen?.id === citizenId));
    setActiveTripTickets(active);
  };

  const buildOSRMCoordinates = (route: any): string => {
    const coords: string[] = [];
    if (route.inicio_lat && route.inicio_lng) {
      coords.push(`${Number(route.inicio_lng)},${Number(route.inicio_lat)}`);
      if (route.inicio_via_points && route.inicio_via_points.length > 0) {
        route.inicio_via_points.forEach((vp: [number, number]) => {
          coords.push(`${vp[1]},${vp[0]}`);
        });
      }
    }

    const nodes = route.nodes?.filter((n: any) => n.busStop) || [];
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      coords.push(`${Number(node.busStop.longitud)},${Number(node.busStop.latitud)}`);
      if (node.via_points && node.via_points.length > 0) {
        node.via_points.forEach((vp: [number, number]) => {
          coords.push(`${vp[1]},${vp[0]}`);
        });
      }
    }

    if (route.fin_lat && route.fin_lng) {
      coords.push(`${Number(route.fin_lng)},${Number(route.fin_lat)}`);
    }

    return coords.join(';');
  };

  useEffect(() => {
    const fetchOSRM = async () => {
      if (!selectedTripDetails?.ticket?.schedule?.route) return;
      const route = selectedTripDetails.ticket.schedule.route;
      const pointsCount = (route.inicio_lat ? 1 : 0) + (route.fin_lat ? 1 : 0) + (route.nodes?.length || 0);
      if (pointsCount < 2) {
        setTripRoutePositions([]);
        return;
      }
      setMapLoading(true);
      try {
        const coordinatesString = buildOSRMCoordinates(route);
        const url = `https://router.project-osrm.org/route/v1/driving/${coordinatesString}?overview=full&geometries=geojson`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.code === 'Ok' && data.routes.length > 0) {
          const mappedPositions = data.routes[0].geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
          setTripRoutePositions(mappedPositions);
        } else {
          setTripRoutePositions([]);
        }
      } catch (error) {
        console.error('Error fetching OSRM for trip:', error);
        setTripRoutePositions([]);
      } finally {
        setMapLoading(false);
      }
    };
    fetchOSRM();
  }, [selectedTripDetails]);

  const handleViewTripDetails = async (ticketId: string) => {
    try {
      const details = await getTripDetails(ticketId);
      setSelectedTripDetails(details);
    } catch (error) {
      console.error('Error fetching trip details:', error);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        if (user?.id) {
          getInbox(user.id).then(inbox => {
            setUnreadMessages(inbox.filter(m => !m.leido).length);
          }).catch(console.error);
        }

        // Buscar el perfil citizen vinculado a este userId
        const myCitizen = user?.id ? await findCitizenByUserId(user.id) : undefined;
        
        if (myCitizen) {
          setCitizen(myCitizen);
          await reloadCitizenData(myCitizen.id);
        } else if (user) {
          // Si no existe el perfil de ciudadano en ms-logic, lo auto-aprovisionamos en segundo plano
          try {
            const names = user.name ? user.name.split(' ') : ['Ciudadano'];
            const nombres = names[0];
            const apellidos = names.slice(1).join(' ') || 'Registrado';

            const newCitizen = await createCitizen({
              userId: user.id,
              nombres,
              apellidos,
              telefono: '',
              direccion: 'Sin dirección registrada',
              fecha_nacimiento: new Date().toISOString().split('T')[0]
            });
            setCitizen(newCitizen);
            setTransactions([]);
            setTickets([]);
          } catch (err) {
            console.error('Error auto-provisioning citizen profile:', err);
          }
        }
      } catch (error) {
        console.error('Error loading citizen data:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
      </div>
    );
  }

  const activeTickets = tickets.filter(t => t.estado === 'activo');
  const usedTickets = tickets.filter(t => t.estado === 'usado' || t.estado === 'completado');

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-200 text-sm">Bienvenido de vuelta,</p>
              <h1 className="text-3xl font-bold text-white">{citizen?.nombres} {citizen?.apellidos}</h1>
            </div>
            <Button onClick={() => { logout(); navigate('/login'); }} className="bg-red-600/80 hover:bg-red-700 text-white font-bold">
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 -mt-6">
        {/* Cards de resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Saldo */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
            <p className="text-slate-400 text-sm mb-1">Saldo Disponible</p>
            <p className="text-4xl font-bold text-emerald-400">${Number(citizen?.saldo || 0).toLocaleString()}</p>
            <Button onClick={() => navigate('/citizen/wallet')} className="mt-4 w-full bg-emerald-600 hover:bg-emerald-500 text-sm">
              Recargar Billetera
            </Button>
          </div>

          {/* Boletos Activos */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
            <p className="text-slate-400 text-sm mb-1">Boletos Activos</p>
            <p className="text-4xl font-bold text-blue-400">{activeTickets.length}</p>
            <p className="text-xs text-slate-500 mt-2">Listos para usar en tu próximo viaje</p>
          </div>

          {/* Viajes Realizados */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
            <p className="text-slate-400 text-sm mb-1">Viajes Completados</p>
            <p className="text-4xl font-bold text-purple-400">{usedTickets.length}</p>
            <p className="text-xs text-slate-500 mt-2">En total desde tu registro</p>
          </div>
        </div>

        {tripToast && (
          <div className="mb-6 p-4 rounded-xl bg-indigo-900/40 border border-indigo-500/50 text-indigo-100 text-sm">
            {tripToast}
          </div>
        )}

        {citizen?.id && (
          <div className="mb-8">
            <CitizenTripValidation
              citizenId={citizen.id}
              tickets={activeTripTickets}
              onDone={() => reloadCitizenData(citizen.id).catch(console.error)}
              onToast={setTripToast}
            />
          </div>
        )}

        {/* Sección de contenido */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Últimos Movimientos */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-700">
              <h2 className="text-lg font-bold text-white">Últimos Movimientos</h2>
            </div>
            <div className="divide-y divide-slate-700">
              {transactions.length === 0 ? (
                <p className="text-center text-slate-500 py-8">Sin movimientos recientes</p>
              ) : transactions.slice(0, 5).map(tx => (
                <div key={tx.id} className="px-4 py-3 flex justify-between items-center">
                  <div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      tx.tipo === 'RECARGA' ? 'bg-emerald-900/50 text-emerald-400' :
                      tx.tipo === 'COMPRA_BOLETO' ? 'bg-blue-900/50 text-blue-400' : 'bg-orange-900/50 text-orange-400'
                    }`}>
                      {tx.tipo}
                    </span>
                    <p className="text-xs text-slate-500 mt-1">{new Date(tx.fecha_transaccion).toLocaleString()}</p>
                  </div>
                  <span className={`font-bold ${tx.tipo === 'RECARGA' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {tx.tipo === 'RECARGA' ? '+' : '-'}${Number(tx.monto).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Mis Boletos */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-700">
              <h2 className="text-lg font-bold text-white">Mis Boletos</h2>
            </div>
            <div className="divide-y divide-slate-700">
              {tickets.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No tienes boletos aún</p>
              ) : tickets.slice(0, 6).map(t => (
                <div 
                  key={t.id} 
                  onClick={() => {
                    if (t.estado === 'usado' || t.estado === 'completado') {
                      handleViewTripDetails(t.id);
                    } else {
                      setSelectedTicket(t);
                    }
                  }}
                  className="px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-slate-700/50 transition-colors group"
                >
                  <div>
                    <p className="text-sm text-white font-medium group-hover:text-indigo-400 transition-colors">
                      {(t as any).schedule?.route?.nombre || 'Ruta desconocida'}
                    </p>
                    <p className="text-xs text-slate-500 flex gap-2 items-center mt-0.5">
                      <span>{new Date(t.fecha_compra || '').toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="text-indigo-400 group-hover:underline">Ver QR</span>
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                    t.estado === 'activo' ? 'bg-emerald-900/50 text-emerald-400' :
                    t.estado === 'usado' ? 'bg-blue-900/50 text-blue-400' :
                    t.estado === 'completado' ? 'bg-purple-900/50 text-purple-400' : 'bg-red-900/50 text-red-400'
                  }`}>
                    {t.estado}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Accesos rápidos */}
        <div className="mt-8 mb-8 grid grid-cols-2 md:grid-cols-5 gap-4">
          <button onClick={() => navigate('/citizen/routes')} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl p-4 text-center transition">
            <span className="text-2xl">🗺️</span>
            <p className="text-sm text-slate-300 mt-2">Ver Rutas</p>
          </button>
          <button onClick={() => navigate('/citizen/purchase')} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl p-4 text-center transition">
            <span className="text-2xl">🎟️</span>
            <p className="text-sm text-slate-300 mt-2">Comprar Boleto</p>
          </button>
          <button onClick={() => navigate('/citizen/wallet')} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl p-4 text-center transition">
            <span className="text-2xl">💳</span>
            <p className="text-sm text-slate-300 mt-2">Recargar</p>
          </button>
          <button onClick={() => navigate('/messages')} className="bg-slate-800 hover:bg-slate-700 border border-indigo-600/50 rounded-xl p-4 text-center transition flex flex-col items-center justify-center">
            <div className="relative inline-block">
              <span className="text-2xl">✉️</span>
              {unreadMessages > 0 && (
                <span className="absolute -top-2 -right-3 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-slate-800">
                  {unreadMessages > 99 ? '99+' : unreadMessages}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-300 mt-2">Mensajes</p>
          </button>
          <button onClick={() => navigate('/profile')} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl p-4 text-center transition">
            <span className="text-2xl">👤</span>
            <p className="text-sm text-slate-300 mt-2">Mi Perfil</p>
          </button>
        </div>
      </div>

      {/* Modal de Boleto Digital */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl relative flex flex-col items-center">
            {/* Cabecera del ticket */}
            <div className="bg-indigo-600 w-full px-6 py-5 text-center relative">
              <div className="absolute top-4 right-4">
                <button 
                  onClick={() => setSelectedTicket(null)} 
                  className="text-indigo-200 hover:text-white font-bold text-lg bg-black/20 hover:bg-black/30 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>
              <span className="text-xs uppercase tracking-widest text-indigo-200 font-bold">Pase de Abordaje</span>
              <h3 className="text-xl font-bold text-white mt-1">
                {(selectedTicket as any).schedule?.route?.nombre || 'Ruta de Transporte'}
              </h3>
            </div>

            {/* Cuerpo del ticket (Información del viaje) */}
            <div className="w-full p-6 text-slate-300 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 text-xs uppercase block">Pasajero</span>
                  <span className="font-semibold text-white">{citizen?.nombres} {citizen?.apellidos}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs uppercase block">Precio Pagado</span>
                  <span className="font-semibold text-emerald-400">${Number(selectedTicket.precio_pagado).toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 text-xs uppercase block">Fecha de Compra</span>
                  <span className="font-semibold text-white">
                    {new Date(selectedTicket.fecha_compra || '').toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs uppercase block">Hora de Salida</span>
                  <span className="font-semibold text-white">
                    {(selectedTicket as any).schedule?.hora_salida || 'Próximo'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 text-xs uppercase block">Estado</span>
                  <span className={`inline-block font-semibold px-2 py-0.5 rounded text-xs uppercase ${
                    selectedTicket.estado === 'activo' ? 'bg-emerald-900/50 text-emerald-400' :
                    selectedTicket.estado === 'usado' ? 'bg-blue-900/50 text-blue-400' : 'bg-red-900/50 text-red-400'
                  }`}>
                    {selectedTicket.estado}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs uppercase block">Fecha Viaje</span>
                  <span className="font-semibold text-white">
                    {(selectedTicket as any).schedule?.fecha || 'Programada'}
                  </span>
                </div>
              </div>
            </div>

            {/* Separador de ticket con estilo clásico */}
            <div className="w-full flex items-center justify-between px-1 relative">
              <div className="w-4 h-8 bg-slate-950 rounded-r-full -ml-3 border border-slate-700 border-l-0"></div>
              <div className="border-t-2 border-dashed border-slate-600 w-full mx-2"></div>
              <div className="w-4 h-8 bg-slate-950 rounded-l-full -mr-3 border border-slate-700 border-r-0"></div>
            </div>

            {/* Parte inferior: Código QR y Hash */}
            <div className="p-6 flex flex-col items-center w-full">
              <div className="bg-white p-3 rounded-2xl shadow-inner mb-4">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${selectedTicket.codigo_qr}&color=1e1b4b`} 
                  alt="Código QR del boleto"
                  className="w-44 h-44 object-contain"
                />
              </div>
              <span className="text-slate-400 text-xs uppercase block mb-1">Código de validación</span>
              <span className="font-mono text-white font-bold text-base tracking-wider bg-slate-900 px-4 py-1.5 rounded-lg border border-slate-700/80">
                {selectedTicket.codigo_qr}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalle de Viaje Map (HU-ENTR-2-005) */}
      {selectedTripDetails && (() => {
        const entryValidation = selectedTripDetails.ticket.history?.find(h => h.tipo_validacion === 'ENTRADA');
        const exitValidation = selectedTripDetails.ticket.history?.find(h => h.tipo_validacion === 'SALIDA');
        const routeColor = selectedTripDetails.ticket.schedule?.route?.color_hex || '#3b82f6';
        
        const boardIcon = new L.Icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
          iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
        });

        const alightIcon = new L.Icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
          iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
        });

        const polylinePositions: [number, number][] = tripRoutePositions.length > 0
          ? tripRoutePositions
          : (selectedTripDetails.ticket.schedule?.route?.nodes?.filter((n: any) => n.busStop)?.map((n: any) => [Number(n.busStop.latitud), Number(n.busStop.longitud)]) || []);

        return (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] overflow-y-auto">
            <div className="bg-slate-800 border border-slate-700 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl relative flex flex-col my-8">
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 flex justify-between items-center">
                <div>
                  <span className="text-xs uppercase tracking-widest text-indigo-200 font-bold">Detalle del Recorrido</span>
                  <h3 className="text-xl font-bold text-white mt-0.5">
                    Ruta: {selectedTripDetails.ticket.schedule?.route?.nombre || 'Desconocida'}
                  </h3>
                </div>
                <button 
                  onClick={() => {
                    setSelectedTripDetails(null);
                    setTripRoutePositions([]);
                  }} 
                  className="text-indigo-200 hover:text-white font-bold text-lg bg-black/20 hover:bg-black/30 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Map Area */}
              <div className="h-[280px] w-full border-b border-slate-700 relative">
                {mapLoading && (
                  <div className="absolute inset-0 bg-slate-900/50 z-[1000] flex items-center justify-center backdrop-blur-sm">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent"></div>
                  </div>
                )}
                <MapContainer center={[4.6097, -74.0817]} zoom={12} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  
                  {/* Boarding Marker */}
                  {entryValidation?.node?.busStop && (
                    <Marker position={[Number(entryValidation.node.busStop.latitud), Number(entryValidation.node.busStop.longitud)]} icon={boardIcon}>
                      <Popup>
                        <strong className="text-green-600">Abordaje</strong><br/>
                        {entryValidation.node.busStop.nombre}<br/>
                        {new Date(entryValidation.fecha_hora).toLocaleTimeString()}
                      </Popup>
                    </Marker>
                  )}

                  {/* Descent Marker */}
                  {exitValidation?.node?.busStop && (
                    <Marker position={[Number(exitValidation.node.busStop.latitud), Number(exitValidation.node.busStop.longitud)]} icon={alightIcon}>
                      <Popup>
                        <strong className="text-red-600">Descenso</strong><br/>
                        {exitValidation.node.busStop.nombre}<br/>
                        {new Date(exitValidation.fecha_hora).toLocaleTimeString()}
                      </Popup>
                    </Marker>
                  )}

                  {/* Complete Route Path */}
                  {polylinePositions.length > 1 && (
                    <Polyline positions={polylinePositions} color={routeColor} weight={4} opacity={0.8} />
                  )}
                </MapContainer>
              </div>

              {/* Travel Info details */}
              <div className="p-6 space-y-6 text-slate-300 text-sm overflow-y-auto max-h-[300px]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-700/60">
                    <span className="text-slate-400 text-xs uppercase block mb-1">Vehículo del Viaje</span>
                    <p className="font-semibold text-white">Placa: {selectedTripDetails.ticket.schedule?.bus?.placa || 'N/A'}</p>
                    <p className="text-xs text-slate-400">Modelo: {selectedTripDetails.ticket.schedule?.bus?.modelo || 'N/A'}</p>
                  </div>
                  <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-700/60">
                    <span className="text-slate-400 text-xs uppercase block mb-1">Conductor</span>
                    <p className="font-semibold text-white">
                      {selectedTripDetails.driver
                        ? `${selectedTripDetails.driver.name || ''} ${selectedTripDetails.driver.last_name || ''}`.trim() || 'Conductor asignado'
                        : 'No registrado / Turno sin asignar'}
                    </p>
                    <p className="text-xs text-slate-400">Licencia: {selectedTripDetails.driver?.license || 'N/A'}</p>
                  </div>
                </div>

                <div className="border-t border-slate-700/60 pt-4 space-y-3">
                  <div className="flex items-center gap-3">
                     <span className="text-green-400 text-lg">🟢</span>
                     <div className="flex-1">
                       <p className="text-xs text-slate-400 uppercase">Paradero de Abordaje</p>
                       <p className="font-semibold text-white">{entryValidation?.node?.busStop?.nombre || 'Pendiente de registrar'}</p>
                     </div>
                     <span className="text-xs font-mono text-slate-400">
                       {entryValidation ? new Date(entryValidation.fecha_hora).toLocaleTimeString() : 'N/A'}
                     </span>
                  </div>

                  <div className="flex items-center gap-3">
                     <span className="text-red-400 text-lg">🔴</span>
                     <div className="flex-1">
                       <p className="text-xs text-slate-400 uppercase">Paradero de Descenso</p>
                       <p className="font-semibold text-white">{exitValidation?.node?.busStop?.nombre || 'En viaje / Pendiente'}</p>
                     </div>
                     <span className="text-xs font-mono text-slate-400">
                       {exitValidation ? new Date(exitValidation.fecha_hora).toLocaleTimeString() : 'N/A'}
                     </span>
                  </div>
                </div>

                <div className="border-t border-slate-700/60 pt-4 flex justify-between items-center">
                  <div>
                    <span className="text-slate-400 text-xs uppercase block">Duración Total del Viaje</span>
                    <span className="text-lg font-bold text-indigo-400">
                      {selectedTripDetails.totalDurationMinutes !== null
                        ? `${selectedTripDetails.totalDurationMinutes} minutos`
                        : 'En curso / Pendiente de registrar salida'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs uppercase block text-right">Tarifa Pagada</span>
                    <span className="text-lg font-bold text-emerald-400 block text-right">
                      ${Number(selectedTripDetails.ticket.precio_pagado).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default CitizenDashboard;
