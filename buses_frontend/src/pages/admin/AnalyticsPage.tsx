import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import { getAgeDistribution, getRevenueByMethod, getIncidentTrends } from '../../services/reportsService';
import { getBuses } from '../../services/busService';
import { getCompanies } from '../../services/companyService';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getRoutes } from '../../services/routesService';

const AnalyticsPage = () => {
  const navigate = useNavigate();
  const pieRef = useRef<HTMLDivElement>(null);
  const [ageSegments, setAgeSegments] = useState<any[]>([]);
  const [ageTable, setAgeTable] = useState<any[]>([]);
  const [selectedPieSegment, setSelectedPieSegment] = useState<string | null>(null);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [revenueTotals, setRevenueTotals] = useState<Record<string, number>>({});
  const [revenueGrandTotal, setRevenueGrandTotal] = useState(0);
  const [buses, setBuses] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [incidentData, setIncidentData] = useState<any[]>([]);
  const [routesList, setRoutesList] = useState<any[]>([]);

  const [revenueMonths, setRevenueMonths] = useState<number>(6);
  const [ageRoute, setAgeRoute] = useState<string>('');
  const [ageStartDate, setAgeStartDate] = useState<string>('');
  const [ageEndDate, setAgeEndDate] = useState<string>('');
  const [incidentMonths, setIncidentMonths] = useState<number>(3);
  const [incidentCompany, setIncidentCompany] = useState<string>('');

  useEffect(() => {
    loadRoutes();
    loadCompanies();
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [revenueMonths, ageRoute, ageStartDate, ageEndDate, incidentMonths, incidentCompany]);

  const loadRoutes = async () => {
    try {
      setRoutesList(await getRoutes());
    } catch (e) {
      console.error(e);
    }
  };

  const loadCompanies = async () => {
    try {
      const list = await getCompanies();
      setCompanies(list);
    } catch {
      setCompanies([]);
    }
  };

  const fetchData = async () => {
    try {
      const [ages, revs, incs, busList] = await Promise.all([
        getAgeDistribution(ageRoute, ageStartDate, ageEndDate),
        getRevenueByMethod(revenueMonths),
        getIncidentTrends(incidentCompany || undefined, incidentMonths),
        getBuses(),
      ]);
      setAgeSegments(ages.segments || ages);
      setAgeTable(ages.table || []);
      setRevenueData(revs.monthly || revs);
      setRevenueTotals(revs.totals || {});
      setRevenueGrandTotal(revs.grandTotal || 0);
      setIncidentData(incs);
      setBuses(busList);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const handleExportCSV = (data: any[], filename: string) => {
    if (!data?.length) return;
    const keys = Object.keys(data[0]).filter((k) => k !== 'fill');
    const csvContent = [keys.join(','), ...data.map((row) => keys.map((k) => row[k]).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
  };

  const handleExportAgeExcel = () => {
    handleExportCSV(ageTable, 'edades-detalle');
  };

  const formatMonth = (m: string) => {
    const [y, mo] = m.split('-');
    const names = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${names[Number(mo) - 1]} ${y}`;
  };

  const revenueChartData = revenueData.map((row: any) => ({
    ...row,
    methodLabel: formatMonth(row.method),
  }));

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-slate-100">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Dashboard de Analítica e Inteligencia</h1>
        <Button onClick={() => navigate('/dashboard')} className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700">
          ← Volver
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
          <div className="flex justify-between items-start mb-6 flex-wrap gap-2">
            <h2 className="text-xl font-bold text-white">Distribución por Rango Etario</h2>
            <div className="flex gap-2">
              <Button onClick={() => handleExportCSV(ageTable, 'edades')} className="bg-slate-700 hover:bg-slate-600 text-xs py-1 px-3">CSV</Button>
              <Button onClick={handleExportAgeExcel} className="bg-slate-700 hover:bg-slate-600 text-xs py-1 px-3">Excel/CSV</Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <select value={ageRoute} onChange={(e) => setAgeRoute(e.target.value)} className="bg-slate-900 border border-slate-600 text-slate-300 rounded p-2 text-sm">
              <option value="">Todas las rutas</option>
              {routesList.map((r) => (
                <option key={r.id} value={r.id}>{r.nombre}</option>
              ))}
            </select>
            <input type="date" value={ageStartDate} onChange={(e) => setAgeStartDate(e.target.value)} className="bg-slate-900 border border-slate-600 text-slate-300 rounded p-2 text-sm" />
            <input type="date" value={ageEndDate} onChange={(e) => setAgeEndDate(e.target.value)} className="bg-slate-900 border border-slate-600 text-slate-300 rounded p-2 text-sm" />
          </div>

          {selectedPieSegment && (
            <p className="text-sm text-indigo-300 mb-2">
              Segmento seleccionado: <strong>{selectedPieSegment}</strong> —{' '}
              {ageSegments.find((s) => s.name === selectedPieSegment)?.value ?? 0} pasajeros
            </p>
          )}

          <div ref={pieRef} className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ageSegments}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ percent }) => (percent ?? 0) > 0 ? `${((percent ?? 0) * 100).toFixed(0)}%` : ''}
                  onClick={(_, index) => setSelectedPieSegment(ageSegments[index]?.name || null)}
                >
                  {ageSegments.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.fill}
                      stroke={selectedPieSegment === entry.name ? '#fff' : undefined}
                      strokeWidth={selectedPieSegment === entry.name ? 2 : 0}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-300">
              <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
                <tr>
                  <th className="px-4 py-2">Rango</th>
                  <th className="px-4 py-2 text-right">Cantidad</th>
                  <th className="px-4 py-2 text-right">%</th>
                  <th className="px-4 py-2 text-right">Δ mes ant.</th>
                </tr>
              </thead>
              <tbody>
                {ageTable.map((row, idx) => {
                  const isMax = row.cantidad === Math.max(...ageTable.map((d) => d.cantidad), 0) && row.cantidad > 0;
                  return (
                    <tr key={idx} className={`border-b border-slate-700 ${isMax ? 'bg-indigo-900/20' : ''}`}>
                      <td className="px-4 py-2 font-medium flex items-center gap-2">
                        {isMax && <span className="w-2 h-2 rounded-full bg-indigo-500" title="Predominante" />}
                        {row.name}
                      </td>
                      <td className="px-4 py-2 text-right">{row.cantidad}</td>
                      <td className="px-4 py-2 text-right">{row.porcentaje}%</td>
                      <td className="px-4 py-2 text-right">{row.variacionMesAnterior}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-xl font-bold text-white">Evolución de Ingresos por Método</h2>
            <div className="flex gap-2 items-center">
              <select value={revenueMonths} onChange={(e) => setRevenueMonths(Number(e.target.value))} className="bg-slate-900 border border-slate-600 text-slate-300 rounded p-1 text-sm">
                <option value={3}>3 meses</option>
                <option value={6}>6 meses</option>
                <option value={12}>12 meses</option>
              </select>
              <Button onClick={() => handleExportCSV(revenueChartData, 'ingresos')} className="bg-slate-700 hover:bg-slate-600 text-xs py-1 px-3">Exportar</Button>
            </div>
          </div>
          <p className="text-xs text-slate-400 mb-2">
            Total período: <strong className="text-white">${revenueGrandTotal.toLocaleString()}</strong>
            {' '}(Tarjeta: ${(revenueTotals.tarjeta || 0).toLocaleString()} · PSE: ${(revenueTotals.pse || 0).toLocaleString()} · Efectivo: ${(revenueTotals.efectivo || 0).toLocaleString()})
          </p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="methodLabel" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip formatter={(value) => [`$${Number(value ?? 0).toLocaleString()}`, 'Monto']} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Legend />
                <Bar dataKey="tarjeta" stackId="a" fill="#6366f1" name="Tarjeta" />
                <Bar dataKey="pse" stackId="a" fill="#10b981" name="PSE" />
                <Bar dataKey="efectivo" stackId="a" fill="#f59e0b" name="Efectivo" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700 mb-8">
        <div className="flex justify-between items-start mb-6 flex-wrap gap-2">
          <h2 className="text-xl font-bold text-white">Tendencia de Incidentes</h2>
          <div className="flex gap-2">
            <select value={incidentCompany} onChange={(e) => setIncidentCompany(e.target.value)} className="bg-slate-900 border border-slate-600 text-slate-300 rounded p-1 text-sm">
              <option value="">Consolidado</option>
              {companies.map((c: any) => (
                <option key={c.id} value={String(c.id)}>{c.name || c.nombre}</option>
              ))}
            </select>
            <select value={incidentMonths} onChange={(e) => setIncidentMonths(Number(e.target.value))} className="bg-slate-900 border border-slate-600 text-slate-300 rounded p-1 text-sm">
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
              <XAxis dataKey="month" stroke="#94a3b8" tickFormatter={formatMonth} />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
              <Legend />
              <Line type="monotone" dataKey="MECANICO" stroke="#ef4444" strokeWidth={3} name="Mecánico" />
              <Line type="monotone" dataKey="ACCIDENTE" stroke="#f59e0b" strokeWidth={3} name="Accidente" />
              <Line type="monotone" dataKey="CONGESTION" stroke="#eab308" strokeWidth={3} name="Retraso" />
              <Line type="monotone" dataKey="PASAJERO" stroke="#3b82f6" strokeWidth={3} name="Pasajero" />
              <Line type="monotone" dataKey="OTRO" stroke="#8b5cf6" strokeWidth={3} name="Otro" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
          Monitoreo de Flota en Tiempo Real
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {buses.map((bus) => (
            <div key={bus.id} className="p-4 bg-slate-900 rounded-lg border border-slate-700">
              <p className="font-bold">{bus.placa}</p>
              <p className="text-xs text-slate-400">{bus.modelo}</p>
              <p className="text-xs mt-2 text-emerald-400">Estado: {bus.estado?.split('|')[0] || bus.estado}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
