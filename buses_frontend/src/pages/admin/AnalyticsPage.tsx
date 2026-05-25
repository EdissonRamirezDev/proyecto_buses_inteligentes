import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import { getAgeDistribution, getRevenueByMethod, getIncidentTrends } from '../../services/reportsService';
import { getBuses } from '../../services/busService';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getRoutes } from '../../services/routesService';

const AnalyticsPage = () => {
  const navigate = useNavigate();
  const [ageData, setAgeData] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [buses, setBuses] = useState<any[]>([]);

  const [incidentData, setIncidentData] = useState<any[]>([]);
  const [routesList, setRoutesList] = useState<any[]>([]);

  // Filtros
  const [revenueMonths, setRevenueMonths] = useState<number>(6);
  const [ageRoute, setAgeRoute] = useState<string>('');
  const [ageStartDate, setAgeStartDate] = useState<string>('');
  const [ageEndDate, setAgeEndDate] = useState<string>('');
  const [incidentMonths, setIncidentMonths] = useState<number>(3);
  const [incidentCompany, setIncidentCompany] = useState<string>('');

  useEffect(() => {
    fetchData();
    loadRoutes();
    const interval = setInterval(fetchData, 10000); // Polling cada 10s para ver si hay cambios simulados en buses
    return () => clearInterval(interval);
  }, [revenueMonths, ageRoute, ageStartDate, ageEndDate, incidentMonths, incidentCompany]);

  const loadRoutes = async () => {
    try {
      const rs = await getRoutes();
      setRoutesList(rs);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchData = async () => {
    try {
      const [ages, revs, incs, busList] = await Promise.all([
        getAgeDistribution(ageRoute, ageStartDate, ageEndDate),
        getRevenueByMethod(revenueMonths),
        getIncidentTrends(incidentCompany, incidentMonths),
        getBuses() // Para la ocupación en vivo (HU-ENTR-2-016)
      ]);
      setAgeData(ages);
      setRevenueData(revs);
      setIncidentData(incs);
      setBuses(busList);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const handleExportCSV = (data: any[], filename: string) => {
    if (!data || !data.length) return;
    const keys = Object.keys(data[0]).filter(k => k !== 'fill');
    const csvContent = [
      keys.join(','),
      ...data.map(row => keys.map(k => row[k]).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-slate-100">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Dashboard de Analítica e Inteligencia</h1>
        <Button onClick={() => navigate('/dashboard')} className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700">
          ← Volver
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Gráfico 1: Rango Etario (Pie) */}
        <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-xl font-bold text-white">Distribución por Rango Etario</h2>
            <Button onClick={() => handleExportCSV(ageData, 'edades')} className="bg-slate-700 hover:bg-slate-600 text-xs py-1 px-3">Exportar CSV</Button>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mb-4">
            <select value={ageRoute} onChange={e => setAgeRoute(e.target.value)} className="bg-slate-900 border border-slate-600 text-slate-300 rounded p-2 text-sm">
              <option value="">Todas las rutas</option>
              {routesList.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
            </select>
            <input type="date" value={ageStartDate} onChange={e => setAgeStartDate(e.target.value)} className="bg-slate-900 border border-slate-600 text-slate-300 rounded p-2 text-sm" placeholder="Inicio" />
            <input type="date" value={ageEndDate} onChange={e => setAgeEndDate(e.target.value)} className="bg-slate-900 border border-slate-600 text-slate-300 rounded p-2 text-sm" placeholder="Fin" />
          </div>

          <div className="h-64">
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
                  label={({ percent }) => (percent ?? 0) > 0 ? `${((percent ?? 0) * 100).toFixed(0)}%` : ''}
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
          
          {/* Tabla de Edades */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-300">
              <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
                <tr>
                  <th className="px-4 py-2">Rango</th>
                  <th className="px-4 py-2 text-right">Cantidad</th>
                  <th className="px-4 py-2 text-right">%</th>
                </tr>
              </thead>
              <tbody>
                {ageData.map((row, idx) => {
                  const total = ageData.reduce((acc, curr) => acc + curr.value, 0);
                  const pct = total > 0 ? ((row.value / total) * 100).toFixed(1) : '0.0';
                  const isMax = row.value === Math.max(...ageData.map(d => d.value)) && row.value > 0;
                  return (
                    <tr key={idx} className={`border-b border-slate-700 ${isMax ? 'bg-indigo-900/20' : ''}`}>
                      <td className="px-4 py-2 font-medium flex items-center gap-2">
                        {isMax && <span className="w-2 h-2 rounded-full bg-indigo-500" title="Predominante" />}
                        {row.name}
                      </td>
                      <td className="px-4 py-2 text-right">{row.value}</td>
                      <td className="px-4 py-2 text-right">{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Gráfico 2: Ingresos por Método (Stacked Bar) */}
        <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-xl font-bold text-white">Evolución de Ingresos por Método</h2>
            <div className="flex gap-2">
              <select value={revenueMonths} onChange={e => setRevenueMonths(Number(e.target.value))} className="bg-slate-900 border border-slate-600 text-slate-300 rounded p-1 text-sm">
                <option value={3}>3 meses</option>
                <option value={6}>6 meses</option>
                <option value={12}>12 meses</option>
              </select>
              <Button onClick={() => handleExportCSV(revenueData, 'ingresos')} className="bg-slate-700 hover:bg-slate-600 text-xs py-1 px-3">Exportar</Button>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="method" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  formatter={(value: any) => [`$${Number(value || 0).toLocaleString()}`, 'Monto']}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Legend />
                <Bar dataKey="tarjeta" stackId="a" fill="#6366f1" name="Tarjeta Crédito/Débito" />
                <Bar dataKey="pse" stackId="a" fill="#10b981" name="PSE" />
                <Bar dataKey="efectivo" stackId="a" fill="#f59e0b" name="Efectivo" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Gráfico 3: Tendencia de Incidentes (LineChart) */}
      <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700 mb-8">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl font-bold text-white">Tendencia de Incidentes</h2>
          <div className="flex gap-2">
            <select value={incidentCompany} onChange={e => setIncidentCompany(e.target.value)} className="bg-slate-900 border border-slate-600 text-slate-300 rounded p-1 text-sm">
              <option value="">Consolidado</option>
              <option value="simulated-id-1">Empresa A</option>
            </select>
            <select value={incidentMonths} onChange={e => setIncidentMonths(Number(e.target.value))} className="bg-slate-900 border border-slate-600 text-slate-300 rounded p-1 text-sm">
              <option value={3}>3 meses</option>
              <option value={6}>6 meses</option>
              <option value={12}>12 meses</option>
            </select>
            <Button onClick={() => handleExportCSV(incidentData, 'incidentes')} className="bg-slate-700 hover:bg-slate-600 text-xs py-1 px-3">Exportar</Button>
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={incidentData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
              <Legend />
              <Line type="monotone" dataKey="MECANICO" stroke="#ef4444" strokeWidth={3} name="Mecánico" />
              <Line type="monotone" dataKey="ACCIDENTE" stroke="#f59e0b" strokeWidth={3} name="Accidente" />
              <Line type="monotone" dataKey="CONGESTION" stroke="#eab308" strokeWidth={3} name="Congestión" />
              <Line type="monotone" dataKey="PASAJERO" stroke="#3b82f6" strokeWidth={3} name="Pasajero" />
              <Line type="monotone" dataKey="OTRO" stroke="#8b5cf6" strokeWidth={3} name="Otro" />
            </LineChart>
          </ResponsiveContainer>
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
