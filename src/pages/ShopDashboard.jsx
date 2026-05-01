import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Settings, LogOut, Car, Link as LinkIcon } from 'lucide-react';

export default function ShopDashboard() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([
    { id: 'TKT-001', client: 'Juan Pérez', vehicle: 'Toyota Corolla 2020', status: 'En Proceso' },
    { id: 'TKT-002', client: 'María Gómez', vehicle: 'Honda Civic 2019', status: 'Pintura' },
  ]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{ width: '250px', backgroundColor: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)', padding: '2rem 1rem', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ marginBottom: '2rem', paddingLeft: '1rem', color: 'var(--accent-primary)' }}>TallerPro Admin</h2>
        
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <a href="#" className="glass-panel" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--accent-primary)' }}>
            <Car size={20} /> Vehículos
          </a>
          <a href="#" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
            <Users size={20} /> Clientes
          </a>
          <a href="#" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
            <Settings size={20} /> Configuración
          </a>
        </nav>

        <button 
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '1rem' }}
        >
          <LogOut size={20} /> Salir
        </button>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem 3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1>Panel de Control</h1>
          <button className="big-btn" style={{ width: 'auto', padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
            <Plus size={20} /> Nuevo Ingreso
          </button>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Vehículos Activos</h3>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Ticket</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Cliente</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Vehículo</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Estado</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(ticket => (
                <tr key={ticket.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem', fontWeight: '500' }}>{ticket.id}</td>
                  <td style={{ padding: '1rem' }}>{ticket.client}</td>
                  <td style={{ padding: '1rem' }}>{ticket.vehicle}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ backgroundColor: 'var(--bg-tertiary)', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.875rem' }}>
                      {ticket.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <button 
                      onClick={() => navigate(`/tracker/${ticket.id}`)}
                      style={{ background: 'none', border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)', padding: '0.5rem', borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <LinkIcon size={16} /> Link Cliente
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
