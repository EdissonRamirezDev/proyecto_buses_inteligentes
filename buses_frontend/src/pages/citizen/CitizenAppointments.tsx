import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/common/Button';
import { getAppointmentsAvailability, scheduleAppointment } from '../../services/appointmentsService';

export default function CitizenAppointments() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loadingSlots, setLoadingSlots] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [modalidad, setModalidad] = useState('Virtual');
  const [motivo, setMotivo] = useState('Problema con tarjeta');
  const [descripcion, setDescripcion] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<any>(null);

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        setErrorMsg('');
        const slots = await getAppointmentsAvailability();
        // Intentar extraer el arreglo si n8n lo mandó envuelto en un objeto
        let extractedSlots = [];
        if (Array.isArray(slots)) {
          extractedSlots = slots;
        } else if (slots && Array.isArray(slots.data)) {
          extractedSlots = slots.data;
        } else if (slots && Array.isArray(slots.slots)) {
          extractedSlots = slots.slots;
        } else if (typeof slots === 'object' && slots !== null) {
          // A veces n8n manda un arreglo como { "0": {...}, "1": {...} }
          const values = Object.values(slots);
          if (values.length > 0 && typeof values[0] === 'object') {
             extractedSlots = values;
          }
        }
        setAvailableSlots(extractedSlots);
      } catch (error: any) {
        console.error('Error fetching slots:', error);
        setErrorMsg('Error de conexión con el sistema de citas (n8n). Asegúrate de tener el webhook encendido.');
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, []);

  // Agrupar slots por fecha (asegurando que availableSlots sea un Array)
  const slotsByDate = Array.isArray(availableSlots) ? availableSlots.reduce((acc: any, slot: any) => {
    if (!slot.date) return acc;
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date].push(slot);
    return acc;
  }, {}) : {};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return alert('Por favor selecciona un horario.');
    if (!user) return alert('Por favor inicia sesión.');

    setSubmitting(true);
    
    // En vez de usar .toISOString() que genera 'Z' (UTC), vamos a enviar
    // la fecha EXACTA con la zona horaria de Colombia quemada en el texto (-05:00)
    // Así es matemáticamente imposible que n8n o Google se confundan de día.
    const startDateStr = `${selectedSlot.date}T${selectedSlot.time}:00-05:00`;
    
    // Calcular el fin sumando 30 minutos a mano para mantener el formato
    const startObj = new Date(selectedSlot.datetime);
    const endObj = new Date(startObj.getTime() + 30 * 60000);
    
    // Obtener horas y minutos del fin
    // Ajustar a zona horaria local (-5 horas) desde el UTC
    const localEndObj = new Date(endObj.getTime() - 5 * 60 * 60 * 1000);
    const endH = String(localEndObj.getUTCHours()).padStart(2, '0');
    const endM = String(localEndObj.getUTCMinutes()).padStart(2, '0');
    
    // Mantener la fecha del start, asumiendo que no cruza medianoche (citas de día)
    const endDateStr = `${selectedSlot.date}T${endH}:${endM}:00-05:00`;

    try {
      await scheduleAppointment({
        userId: user.id,
        nombre: user.name || 'Ciudadano',
        email: user.email || 'correo@ejemplo.com',
        modalidad,
        motivo,
        descripcion,
        fecha_inicio: startDateStr,
        fecha_fin: endDateStr,
      });
      setSuccess(true);
    } catch (error) {
      console.error('Error scheduling:', error);
      alert('Error al agendar la cita. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-slate-800 p-8 rounded-3xl border border-emerald-500/30 max-w-md w-full shadow-2xl shadow-emerald-500/10">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-400 text-4xl">
            ✓
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">¡Cita Agendada!</h1>
          <p className="text-slate-300 mb-6 text-sm">
            Tu cita {modalidad.toLowerCase()} para tratar el tema de "{motivo}" ha sido programada con éxito.
            <br/><br/>
            <strong>En breve recibirás un correo electrónico</strong> con la invitación de Google Calendar y los enlaces de conexión.
          </p>
          <Button onClick={() => navigate('/citizen/dashboard')} className="w-full bg-emerald-600 hover:bg-emerald-500">
            Volver a Mi Panel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-10">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Atención al Cliente</h1>
            <p className="text-blue-100 text-sm opacity-90">Agenda una cita con un asesor para resolver tus dudas</p>
          </div>
          <Button onClick={() => navigate('/citizen/dashboard')} className="bg-white/20 hover:bg-white/30 backdrop-blur-sm shadow-sm transition-all border border-white/10">
            ← Mi Panel
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden flex flex-col md:flex-row">
          
          {/* Lado izquierdo: Formulario de la Cita */}
          <div className="flex-1 p-6 md:p-8 border-b md:border-b-0 md:border-r border-slate-700">
            <h2 className="text-xl font-bold text-white mb-6">Detalles de tu consulta</h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Modalidad de Atención</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setModalidad('Virtual')}
                    className={`py-3 rounded-xl border text-sm font-bold transition-colors ${
                      modalidad === 'Virtual' 
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' 
                        : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    💻 Virtual (Google Meet)
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalidad('Presencial')}
                    className={`py-3 rounded-xl border text-sm font-bold transition-colors ${
                      modalidad === 'Presencial' 
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' 
                        : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    🏢 Presencial (Oficina)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Motivo de la Cita</label>
                <select
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="Problema con tarjeta">Problema con tarjeta Cívica / Abono</option>
                  <option value="Reclamo">Presentar un reclamo formal</option>
                  <option value="Reembolso">Solicitar un reembolso</option>
                  <option value="Otro">Otro tema general</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">
                  Describe brevemente tu caso <span className="text-xs text-slate-500 font-normal">({descripcion.length}/300)</span>
                </label>
                <textarea
                  required
                  maxLength={300}
                  rows={4}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Escribe aquí los detalles para que el asesor pueda prepararse..."
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                />
              </div>

              <Button 
                type="submit" 
                disabled={!selectedSlot || submitting}
                className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 py-3.5 mt-4"
              >
                {submitting ? 'Agendando...' : 'Confirmar Cita'}
              </Button>
            </form>
          </div>

          {/* Lado derecho: Calendario de Slots */}
          <div className="flex-1 p-6 md:p-8 bg-slate-800/50">
            <h2 className="text-xl font-bold text-white mb-2">Disponibilidad</h2>
            <p className="text-xs text-slate-400 mb-6">Selecciona una fecha y hora (Sincronizado con Google Calendar en tiempo real)</p>

            {loadingSlots ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-500 border-t-transparent mb-4"></div>
                <p className="text-sm text-slate-400">Consultando agenda...</p>
              </div>
            ) : errorMsg ? (
              <div className="text-center py-12 border border-red-500/30 bg-red-500/10 rounded-2xl">
                <span className="text-3xl mb-2 block">⚠️</span>
                <p className="text-red-400 text-sm px-4">{errorMsg}</p>
                <button onClick={() => window.location.reload()} className="mt-4 text-xs font-bold bg-slate-800 border border-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-700">Reintentar</button>
              </div>
            ) : Object.keys(slotsByDate).length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-700 rounded-2xl">
                <p className="text-slate-400">No hay horarios disponibles en los próximos 10 días.</p>
              </div>
            ) : (
              <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {Object.keys(slotsByDate).map(date => (
                  <div key={date}>
                    <h4 className="font-semibold text-slate-300 mb-3 pb-2 border-b border-slate-800">
                  {(() => {
                    const [y, m, d] = date.split('-');
                    const localD = new Date(Number(y), Number(m) - 1, Number(d));
                    return localD.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                  })()}
                </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {slotsByDate[date].map((slot: any) => (
                        <button
                          key={slot.datetime}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`py-2 rounded-lg text-sm font-bold border transition-all ${
                            selectedSlot?.datetime === slot.datetime
                              ? 'bg-emerald-500 text-slate-900 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                              : 'bg-slate-700/50 text-slate-300 border-slate-600 hover:border-indigo-400 hover:bg-slate-700'
                          }`}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
