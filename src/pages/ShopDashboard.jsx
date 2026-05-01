import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Settings, LogOut, Car, Link as LinkIcon, X } from 'lucide-react';
import { getTickets, addTicket } from '../services/mockDb';

export default function ShopDashboard() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClient, setNewClient] = useState('');
  const [newVehicle, setNewVehicle] = useState('');

  useEffect(() => {
    setTickets(getTickets());
  }, []);

  const handleAddTicket = (e) => {
    e.preventDefault();
    if (!newClient || !newVehicle) return;
    const newTicket = addTicket(newClient, newVehicle);
    setTickets([...tickets, newTicket]);
    setIsModalOpen(false);
    setNewClient('');
    setNewVehicle('');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{ width: '250px', backgroundColor: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)', padding: '2rem 1rem', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ marginBottom: '2rem', paddingLeft: '1rem', color: 'var(--accent-primary)' }}>TallerPro Admin</h2>
        
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--accent-primary)', borderRadius: '0.5rem', color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
            <Car size={20} /> Vehículos
          </button>
          <button onClick={() => alert('Próximamente: Gestión de Clientes')} style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
            <Users size={20} /> Clientes
          </button>
          <button onClick={() => alert('Próximamente: Configuración')} style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
            <Settings size={20} /> Configuración
          </button>
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
          <button onClick={() => setIsModalOpen(true)} className="big-btn" style={{ width: 'auto', padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
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

        {/* Modal Nuevo Ingreso */}
        {isModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
            <div className="glass-panel" style={{ padding: '2rem', width: '100%', maxWidth: '500px', backgroundColor: 'var(--bg-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0 }}>Registrar Vehículo</h2>
                <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleAddTicket}>
                <div className="input-group">
                  <label className="input-label">Nombre del Cliente</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Ej. Juan Pérez" 
                    value={newClient}
                    onChange={(e) => setNewClient(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                
                <div className="input-group" style={{ marginBottom: '2rem' }}>
                  <label className="input-label">Vehículo</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Ej. Toyota Corolla 2020" 
                    value={newVehicle}
                    onChange={(e) => setNewVehicle(e.target.value)}
                    required
                  />
                </div>
                
                <button type="submit" className="big-btn" style={{ width: '100%', padding: '1rem' }}>
                  Guardar y Generar Ticket
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
