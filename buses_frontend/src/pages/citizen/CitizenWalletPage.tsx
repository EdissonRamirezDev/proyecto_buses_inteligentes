import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { getCitizens } from '../../services/citizensService';
import { rechargeWallet, getTransactions } from '../../services/walletService';
import type { WalletTransaction } from '../../services/walletService';
import type { Citizen } from '../../types/citizen.types';
import Button from '../../components/common/Button';

const CitizenWalletPage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [citizen, setCitizen] = useState<Citizen | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [monto, setMonto] = useState<number>(10000);
  const [metodo, setMetodo] = useState('pse');
  const [loading, setLoading] = useState(true);
  const [isRecharging, setIsRecharging] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error', texto: string } | null>(null);
  const [showEpaycoModal, setShowEpaycoModal] = useState(false);

  const COMISION_FIJA = 900;
  const COMISION_PORCENTAJE = 0.029; // 2.9%
  const totalComision = monto * COMISION_PORCENTAJE + COMISION_FIJA;
  const totalAPagar = monto + totalComision;
  const saldoProyectado = (citizen?.saldo ? Number(citizen.saldo) : 0) + monto;

  const loadData = async () => {
    try {
      const data = await getCitizens();
      const myCitizen = data.find(c => c.userId === user?.id);
      if (myCitizen) {
        setCitizen(myCitizen);
        const txs = await getTransactions(myCitizen.id);
        setTransactions(txs);
      }
    } catch (error) {
      console.error('Error loading citizen wallet data:', error);
      setMensaje({ tipo: 'error', texto: 'No se pudo cargar la billetera.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const handleStartPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!citizen) return;
    if (monto < 5000) {
      setMensaje({ tipo: 'error', texto: 'El monto mínimo es $5.000' });
      return;
    }
    if (monto > 500000) {
      setMensaje({ tipo: 'error', texto: 'El monto máximo es $500.000' });
      return;
    }
    setShowEpaycoModal(true);
    setMensaje(null);
  };

  const handleConfirmRecharge = async () => {
    if (!citizen) return;

    setIsRecharging(true);
    setMensaje(null);

    try {
      // Simular tiempo de procesamiento de ePayco
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const referencia = `EPAYCO-${Math.floor(Math.random() * 10000000)}`;
      const updatedCitizen = await rechargeWallet(citizen.id, monto, referencia);
      
      setCitizen(updatedCitizen);
      setMensaje({ tipo: 'exito', texto: `¡Recarga exitosa! Nuevo saldo: $${updatedCitizen.saldo.toLocaleString()}` });
      
      // Actualizar transacciones
      const txs = await getTransactions(updatedCitizen.id);
      setTransactions(txs);
      setShowEpaycoModal(false);
      setMonto(10000); // Reset monto
    } catch (error: any) {
      setMensaje({ tipo: 'error', texto: error.response?.data?.message || 'Hubo un error al procesar el pago.' });
      setShowEpaycoModal(false);
    } finally {
      setIsRecharging(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-slate-100">
      <div className="max-w-6xl mx-auto flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Mi Billetera</h1>
          <p className="text-slate-400 text-sm">Gestiona tu saldo y consulta tus transacciones</p>
        </div>
        <Button onClick={() => navigate('/citizen/dashboard')} className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700">
          ← Volver
        </Button>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recharge Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
            <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
              <h2 className="text-lg font-semibold text-slate-400">Saldo Disponible</h2>
              <span className="text-3xl font-bold text-emerald-400">${Number(citizen?.saldo || 0).toLocaleString()}</span>
            </div>

            <form onSubmit={handleStartPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Montos Rápidos</label>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[10000, 20000, 50000, 100000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setMonto(val)}
                      className={`py-2 rounded-lg text-sm font-bold border transition-colors ${
                        monto === val 
                          ? 'bg-indigo-600 border-indigo-500 text-white' 
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      ${val.toLocaleString()}
                    </button>
                  ))}
                </div>

                <label className="block text-sm font-medium text-slate-400 mb-1">Otro Monto ($5k - $500k)</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-400">$</span>
                  <input 
                    type="number" 
                    min="5000" max="500000" step="1000"
                    value={monto} 
                    onChange={(e) => setMonto(Number(e.target.value))}
                    className="w-full pl-8 bg-slate-900 border border-slate-600 text-white rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* Detalle de recarga */}
              <div className="bg-slate-900 p-4 rounded-lg space-y-2 text-sm border border-slate-700">
                <div className="flex justify-between text-slate-400">
                  <span>Saldo Actual:</span>
                  <span>${Number(citizen?.saldo || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Monto a recargar:</span>
                  <span>${monto.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Comisión ePayco (2.9% + $900):</span>
                  <span>${Math.round(totalComision).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-white border-t border-slate-700 pt-2 mt-2">
                  <span>Total a Pagar:</span>
                  <span>${Math.round(totalAPagar).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-400">
                  <span>Saldo Proyectado:</span>
                  <span>${Math.round(saldoProyectado).toLocaleString()}</span>
                </div>
              </div>

              {mensaje && (
                <div className={`p-3 rounded-lg text-sm border ${mensaje.tipo === 'exito' ? 'bg-emerald-900/50 border-emerald-500 text-emerald-200' : 'bg-red-900/50 border-red-500 text-red-200'}`}>
                  {mensaje.tipo === 'exito' ? '✅' : '❌'} {mensaje.texto}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-indigo-600 hover:bg-indigo-700 py-4 font-bold text-lg shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
              >
                Continuar al Pago
              </Button>
            </form>
          </div>
        </div>

        {/* Transaction History */}
        <div className="lg:col-span-2">
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
        </div>
      </div>

      {/* Modal Simulado de ePayco */}
      {showEpaycoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-white text-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-100 p-4 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#ff6b00] rounded-full flex items-center justify-center text-white font-bold italic">e</div>
                <span className="font-bold text-xl tracking-tight text-[#ff6b00]">payco</span>
              </div>
              <button onClick={() => setShowEpaycoModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <div className="p-6 space-y-6 flex-grow">
              <div className="text-center">
                <p className="text-slate-500 text-sm">Resumen de compra</p>
                <h3 className="text-3xl font-bold text-slate-800">${Math.round(totalAPagar).toLocaleString()}</h3>
                <p className="text-slate-400 text-xs mt-1">Ref: {`EPAYCO-${Math.floor(Math.random() * 10000000)}`}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Selecciona un medio de pago</label>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => setMetodo('pse')} className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${metodo === 'pse' ? 'border-[#ff6b00] bg-orange-50' : 'border-slate-200 hover:border-slate-300'}`}>
                    <span className="font-bold text-slate-700">PSE</span>
                  </button>
                  <button onClick={() => setMetodo('tarjeta')} className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${metodo === 'tarjeta' ? 'border-[#ff6b00] bg-orange-50' : 'border-slate-200 hover:border-slate-300'}`}>
                    <span className="text-xs font-bold text-slate-700">Tarjeta</span>
                  </button>
                  <button onClick={() => setMetodo('efectivo')} className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${metodo === 'efectivo' ? 'border-[#ff6b00] bg-orange-50' : 'border-slate-200 hover:border-slate-300'}`}>
                    <span className="text-xs font-bold text-slate-700">Efectivo</span>
                  </button>
                </div>
              </div>

              {metodo === 'tarjeta' && (
                <div className="space-y-3 animate-in fade-in">
                  <input type="text" placeholder="Número de tarjeta" className="w-full border border-slate-300 rounded-lg p-3 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#ff6b00]" />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="MM/YY" className="w-full border border-slate-300 rounded-lg p-3 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#ff6b00]" />
                    <input type="text" placeholder="CVC" className="w-full border border-slate-300 rounded-lg p-3 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#ff6b00]" />
                  </div>
                </div>
              )}
              
              {metodo === 'pse' && (
                <div className="space-y-3 animate-in fade-in">
                  <select className="w-full border border-slate-300 rounded-lg p-3 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#ff6b00]">
                    <option>Selecciona tu banco</option>
                    <option>Bancolombia</option>
                    <option>Davivienda</option>
                    <option>Nequi</option>
                    <option>Banco de Bogotá</option>
                  </select>
                </div>
              )}

              <Button 
                onClick={handleConfirmRecharge} 
                disabled={isRecharging}
                className="w-full bg-[#ff6b00] hover:bg-[#e66000] py-4 text-white font-bold rounded-xl shadow-lg shadow-orange-500/30 flex justify-center items-center gap-2"
              >
                {isRecharging ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                    Procesando Pago...
                  </>
                ) : `Pagar $${Math.round(totalAPagar).toLocaleString()}`}
              </Button>

              <div className="flex justify-center items-center gap-1 text-xs text-slate-400 mt-4">
                🔒 Pagos seguros procesados por ePayco
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CitizenWalletPage;
