import React, { useState, useEffect } from 'react';
import { getAgeDistribution, getRevenueByMethod } from '../../services/reportsService';
import { getBuses } from '../../services/busesService';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';

const AnalyticsPage = () => {
  const [ageData, setAgeData] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [buses, setBuses] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Polling cada 10s para ver si hay cambios simulados
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [ages, revs, busList] = await Promise.all([
        getAgeDistribution(),
        getRevenueByMethod(),
        getBuses() // Para la ocupación en vivo (HU-ENTR-2-016) - Simularemos que algunos están en ruta
      ]);
      setAgeData(ages);
      setRevenueData(revs);
      setBuses(busList);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-slate-100">
      <h1 className="text-3xl font-bold text-white mb-8">Dashboard de Analítica e Inteligencia</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Gráfico 1: Rango Etario (Pie) */}
        <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
          <h2 className="text-xl font-bold text-white mb-6">Distribución por Rango Etario</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ageData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {ageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Ingresos por Método (Bar) */}
        <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
          <h2 className="text-xl font-bold text-white mb-6">Ingresos por Método de Pago (ePayco)</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="method" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Ingresos']}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Legend />
                <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} name="Monto ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Monitor en Tiempo Real de Buses */}
      <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
          Monitoreo de Flota en Tiempo Real
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {buses.slice(0, 8).map((bus, idx) => {
            // Simulamos ocupación aleatoria basada en la capacidad para la demo del panel
            const currentOcupation = Math.floor(Math.random() * (bus.capacidad || 40));
            const percent = Math.round((currentOcupation / (bus.capacidad || 40)) * 100);
            
            return (
              <div key={bus.id || idx} className="bg-slate-900 border border-slate-700 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-slate-300">Bus {bus.placa}</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-bold ${percent > 80 ? 'bg-red-900/50 text-red-400' : percent > 50 ? 'bg-orange-900/50 text-orange-400' : 'bg-emerald-900/50 text-emerald-400'}`}>
                    {percent}%
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2.5 mb-2 overflow-hidden">
                  <div className={`h-2.5 rounded-full ${percent > 80 ? 'bg-red-500' : percent > 50 ? 'bg-orange-500' : 'bg-emerald-500'}`} style={{ width: `${percent}%` }}></div>
                </div>
                <div className="text-xs text-slate-400 flex justify-between">
                  <span>{currentOcupation} a bordo</span>
                  <span>Cap: {bus.capacidad}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default AnalyticsPage;
