import React, { useState, useEffect, useMemo } from 'react';
import { getTickets, getParts } from '../../services/api';
import { Clock, CheckCircle2, Car, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';

export default function Analytics() {
  const [parts, setParts] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getTickets(), getParts()])
      .then(([tix, prts]) => {
        setTickets(tix || []);
        setParts(prts || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching analytics data:', err);
        setLoading(false);
      });
  }, []);

  const formatTime = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const metrics = useMemo(() => {
    // 1. Cycle Time
    const closedTickets = tickets.filter(t => t.closedAt && t.createdAt);
    let totalDays = 0;
    closedTickets.forEach(t => {
      const start = new Date(t.createdAt);
      const end = new Date(t.closedAt);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      totalDays += diffDays;
    });
    const avgCycleTime = closedTickets.length > 0 ? (totalDays / closedTickets.length).toFixed(1) : 0;

    // 2. Approval Rate
    const decisionTickets = tickets.filter(t => t.budgetStatus === 'approved' || t.budgetStatus === 'declined');
    const approvedTickets = decisionTickets.filter(t => t.budgetStatus === 'approved');
    const approvalRate = decisionTickets.length > 0 ? Math.round((approvedTickets.length / decisionTickets.length) * 100) : 0;

    // 3. Bay Occupancy
    const maxBays = 10;
    const activeTickets = tickets.filter(t => !t.closedAt && t.status !== 'Entrega');
    const occupancyRate = Math.round((activeTickets.length / maxBays) * 100);

    // 4. Financial Inventory Metrics
    const totalInventoryValue = parts.reduce((acc, p) => acc + ((p.cost || 0) * (p.qty || 1)), 0);

    const linkedParts = parts.filter(p => p.status === 'approved' && p.ticketId);
    const partsCost = linkedParts.reduce((acc, p) => acc + ((p.cost || 0) * (p.qty || 1)), 0);
    const partsRevenue = linkedParts.reduce((acc, p) => acc + ((p.salePrice || 0) * (p.qty || 1)), 0);
    const partsProfit = partsRevenue - partsCost;

    // 5. Technician stage times average
    const stageTimeTotals = {};
    const stageTimeCounts = {};
    tickets.forEach(t => {
      if (t.timeLogs) {
        Object.entries(t.timeLogs).forEach(([stage, seconds]) => {
          stageTimeTotals[stage] = (stageTimeTotals[stage] || 0) + seconds;
          stageTimeCounts[stage] = (stageTimeCounts[stage] || 0) + 1;
        });
      }
    });

    const avgStageTimes = Object.keys(stageTimeTotals).map(stage => {
      const avgSeconds = Math.round(stageTimeTotals[stage] / stageTimeCounts[stage]);
      return {
        stage,
        seconds: avgSeconds,
        formatted: formatTime(avgSeconds)
      };
    });

    return { 
      avgCycleTime, 
      approvalRate, 
      occupancyRate, 
      activeCount: activeTickets.length, 
      maxBays,
      totalInventoryValue,
      partsRevenue,
      partsProfit,
      avgStageTimes
    };
  }, [tickets, parts]);

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-400 font-bold tracking-widest text-xs uppercase animate-pulse">Cargando Analíticas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-black mb-2 tracking-tight">Rendimiento del Taller</h2>
        <p className="text-gray-400">Analíticas en tiempo real para optimizar tus operaciones.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Cycle Time Card */}
        <div className="card-morphism group">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
              <Clock size={24} />
            </div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Tiempo de Ciclo</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-5xl font-black">{metrics.avgCycleTime}</h3>
            <span className="text-gray-400 font-bold">días</span>
          </div>
          <p className="text-sm text-gray-500 mt-4 flex items-center gap-1">
            <TrendingUp size={14} className="text-accent-success" /> Promedio histórico
          </p>
        </div>

        {/* Approval Rate Card */}
        <div className="card-morphism group">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 rounded-xl bg-accent-success/10 text-accent-success group-hover:scale-110 transition-transform">
              <CheckCircle2 size={24} />
            </div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Tasa de Aprobación</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-5xl font-black">{metrics.approvalRate}</h3>
            <span className="text-gray-400 font-bold">%</span>
          </div>
          <p className="text-sm text-gray-500 mt-4">De presupuestos enviados</p>
        </div>

        {/* Bay Occupancy Card */}
        <div className="card-morphism group flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 rounded-xl bg-accent-primary/10 text-accent-primary group-hover:scale-110 transition-transform">
              <Car size={24} />
            </div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Ocupación de Bahías</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <h3 className="text-5xl font-black">{metrics.activeCount}</h3>
              <span className="text-gray-400 font-bold">/ {metrics.maxBays}</span>
            </div>
            
            {/* Pure CSS/SVG Donut Chart */}
            <div className="relative w-20 h-20">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                {/* Background Circle */}
                <circle cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                {/* Foreground Circle */}
                <circle 
                  cx="18" 
                  cy="18" 
                  r="15.91549430918954" 
                  fill="transparent" 
                  stroke="currentColor" 
                  strokeWidth="4" 
                  strokeDasharray={`${metrics.occupancyRate}, 100`}
                  strokeLinecap="round"
                  className={`${metrics.occupancyRate > 80 ? 'text-red-500' : 'text-accent-primary'} transition-all duration-1000 ease-out`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold">{metrics.occupancyRate}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Finanzas e Inventario */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card-morphism !bg-white/5 border-white/10 p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 rounded-xl bg-accent-success/10 text-accent-success">
              <DollarSign size={24} />
            </div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Finanzas de Refacciones</span>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-2">
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Valor en Inventario</p>
              <p className="text-3xl font-black text-white mt-1">${metrics.totalInventoryValue.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Costo total de stock</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Ganancia en Refacciones</p>
              <p className="text-3xl font-black text-accent-success mt-1">${metrics.partsProfit.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Utilidad en autopartes vendidas</p>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
            <span>Ingreso por autopartes: <strong>${metrics.partsRevenue.toLocaleString()}</strong></span>
            <span>Margen de utilidad promedio: <strong>
              {metrics.partsRevenue > 0 
                ? `${Math.round((metrics.partsProfit / metrics.partsRevenue) * 100)}%` 
                : '0%'}
            </strong></span>
          </div>
        </div>

        {/* Rendimiento de Tiempos por Etapa */}
        <div className="card-morphism !bg-white/5 border-white/10 p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
              <BarChart3 size={24} />
            </div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Tiempos Promedio por Etapa</span>
          </div>

          <div className="space-y-3">
            {metrics.avgStageTimes.length > 0 ? (
              metrics.avgStageTimes.map((item, idx) => {
                // max time to scale bars
                const maxSeconds = Math.max(...metrics.avgStageTimes.map(x => x.seconds), 1);
                const widthPercent = Math.max(Math.round((item.seconds / maxSeconds) * 100), 10);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-gray-300">
                      <span>{item.stage}</span>
                      <span className="text-accent-primary">{item.formatted}</span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-accent-primary h-full rounded-full transition-all duration-700" 
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-gray-500 font-bold text-xs uppercase">
                Sin registros de tiempos de técnicos aún
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
