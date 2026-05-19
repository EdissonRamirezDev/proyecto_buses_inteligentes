import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCitizens } from '../../services/citizensService';
import { rechargeWallet, getTransactions } from '../../services/walletService';
import type { WalletTransaction } from '../../services/walletService';
import type { Citizen } from '../../types/citizen.types';
import Button from '../../components/common/Button';

const WalletPage = () => {
  const navigate = useNavigate();
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  
  const [monto, setMonto] = useState<number>(10000);
  const [metodo, setMetodo] = useState('tarjeta_credito');
  const [isLoading, setIsLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error', texto: string } | null>(null);

  useEffect(() => {
    fetchCitizens();
  }, []);

  const fetchCitizens = async () => {
    try {
      const data = await getCitizens();
      setCitizens(data);
    } catch (error) {
      console.error('Error fetching citizens:', error);
    }
  };

  const loadTransactions = async (citizenId: string) => {
    try {
      const data = await getTransactions(citizenId);
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const handleSelectCitizen = (citizenId: string) => {
    const citizen = citizens.find(c => c.id === citizenId) || null;
    setSelectedCitizen(citizen);
    if (citizen) {
      loadTransactions(citizen.id);
    } else {
      setTransactions([]);
    }
    setMensaje(null);
  };

  const handleRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCitizen) return;

    setIsLoading(true);
    setMensaje(null);

    try {
      // Simular tiempo de procesamiento ePayco
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const referencia = `EPAYCO-${Math.floor(Math.random() * 10000000)}`;
      const updatedCitizen = await rechargeWallet(selectedCitizen.id, monto, referencia);
      
      setSelectedCitizen(updatedCitizen);
      setMensaje({ tipo: 'exito', texto: `¡Recarga exitosa! Nuevo saldo: $${updatedCitizen.saldo}` });
      loadTransactions(selectedCitizen.id);
    } catch (error: any) {
      setMensaje({ tipo: 'error', texto: error.response?.data?.message || 'Hubo un error al procesar el pago.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-slate-100">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Billetera Electrónica (Recargas)</h1>
        <Button onClick={() => navigate('/dashboard')} className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700">
          ← Volver
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Panel Izquierdo: Selección y Formulario */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
            <h2 className="text-xl font-semibold mb-4 text-indigo-400">Seleccionar Ciudadano</h2>
            <select 
              className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              onChange={(e) => handleSelectCitizen(e.target.value)}
              value={selectedCitizen?.id || ''}
            >
              <option value="">Seleccione un usuario...</option>
              {citizens.map(c => (
                <option key={c.id} value={c.id}>{c.nombres} {c.apellidos} - Saldo: ${c.saldo}</option>
              ))}
            </select>
          </div>

          {selectedCitizen && (
            <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
              <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
                <h2 className="text-xl font-semibold text-white">Saldo Actual</h2>
                <span className="text-3xl font-bold text-emerald-400">${Number(selectedCitizen.saldo).toLocaleString()}</span>
              </div>

              <form onSubmit={handleRecharge} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Monto a Recargar</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-400">$</span>
                    <input 
                      type="number" 
                      min="1000" step="1000"
                      value={monto} 
                      onChange={(e) => setMonto(Number(e.target.value))}
                      className="w-full pl-8 bg-slate-900 border border-slate-600 text-white rounded-lg p-3"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Método de Pago</label>
                  <select 
                    value={metodo} 
                    onChange={(e) => setMetodo(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-3"
                  >
                    <option value="tarjeta_credito">Tarjeta de Crédito / Débito</option>
                    <option value="pse">PSE (Transferencia Bancaria)</option>
                    <option value="efectivo">Punto Efecty / Baloto</option>
                  </select>
                </div>

                {mensaje && (
                  <div className={`p-3 rounded-lg text-sm border ${mensaje.tipo === 'exito' ? 'bg-emerald-900/50 border-emerald-500 text-emerald-200' : 'bg-red-900/50 border-red-500 text-red-200'}`}>
                    {mensaje.tipo === 'exito' ? '✅' : '❌'} {mensaje.texto}
                  </div>
                )}

                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 py-4 font-bold text-lg shadow-lg shadow-indigo-600/30"
                >
                  {isLoading ? 'Procesando con ePayco...' : `Pagar $${monto.toLocaleString()}`}
                </Button>
              </form>
            </div>
          )}
        </div>

        {/* Panel Derecho: Historial */}
        <div className="lg:col-span-2">
          {selectedCitizen ? (
            <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden">
              <div className="p-6 border-b border-slate-700 bg-slate-800">
                <h2 className="text-xl font-semibold text-white">Historial de Transacciones</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-700">
                  <thead className="bg-slate-700/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Fecha</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Tipo</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Monto</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Referencia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {transactions.length === 0 ? (
                      <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">No hay movimientos recientes</td></tr>
                    ) : transactions.map(t => (
                      <tr key={t.id} className="hover:bg-slate-700/30">
                        <td className="px-6 py-4 text-sm text-slate-300">{new Date(t.fecha_transaccion).toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                            t.tipo === 'RECARGA' ? 'bg-emerald-900/50 text-emerald-400' :
                            t.tipo === 'COMPRA_BOLETO' ? 'bg-blue-900/50 text-blue-400' : 'bg-orange-900/50 text-orange-400'
                          }`}>
                            {t.tipo}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-white">${Number(t.monto).toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm font-mono text-slate-400">{t.referencia_externa || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center bg-slate-800/50 border border-slate-700 border-dashed rounded-xl p-12">
              <p className="text-slate-500 text-lg">Selecciona un ciudadano para ver su billetera.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default WalletPage;
