import React, { useMemo } from 'react';
import { getTickets } from '../../services/mockDb';
import { Clock, CheckCircle2, Car, TrendingUp } from 'lucide-react';

export default function Analytics() {
  const tickets = useMemo(() => getTickets(), []);

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

    return { avgCycleTime, approvalRate, occupancyRate, activeCount: activeTickets.length, maxBays };
  }, [tickets]);

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
    </div>
  );
}
