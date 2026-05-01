import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Settings, Home, Car, Link as LinkIcon, X, LogOut } from 'lucide-react';
import { getTickets, addTicket } from '../services/mockDb';
import Logo from '../components/Logo';
import { useAuth } from '../skills/security';

export default function ShopDashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
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
    <div className="relative min-h-screen flex text-white overflow-hidden selection:bg-accent-primary/30">
      {/* Background */}
      <img 
        src="/assets/bg-internal.png" 
        className="full-screen-bg"
        alt="Dashboard Background"
      />
      <div className="bg-glow" />

      {/* Sidebar */}
      <aside className="w-80 liquid-glass border-r border-white/10 p-8 flex flex-col relative z-10 animate-fade-in">
        <Logo size="sm" className="mb-12" />
        
        <nav className="flex-1 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-accent-primary/20 text-accent-primary border border-accent-primary/30 font-bold transition-all">
            <Car size={20} />
            Vehículos Activos
          </button>
          <button onClick={() => alert('Próximamente')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 transition-all">
            <Users size={20} />
            Clientes
          </button>
          <button onClick={() => alert('Próximamente')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 transition-all">
            <Settings size={20} />
            Configuración
          </button>
        </nav>

        <div className="pt-8 mt-auto border-t border-white/10 space-y-4">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5">
            {user?.picture && <img src={user.picture} className="w-10 h-10 rounded-full border border-accent-primary/30" />}
            <div className="overflow-hidden">
              <p className="font-bold truncate">{user?.name || 'Administrador'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-accent-primary hover:bg-accent-primary/10 transition-all font-medium"
          >
            <Home size={20} />
            Inicio
          </button>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-400/10 transition-all font-medium"
          >
            <LogOut size={20} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-12 overflow-y-auto relative z-10">
        <header className="flex justify-between items-center mb-12 animate-fade-in-up">
          <div>
            <h1 className="text-4xl font-black tracking-tight mb-2">Panel de Control</h1>
            <p className="text-gray-400 font-medium">Gestiona el flujo de trabajo de tu taller en tiempo real.</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="btn-premium flex items-center gap-2 shadow-ui">
            <Plus size={24} />
            Nuevo Ingreso
          </button>
        </header>

        <div className="card-morphism animate-fade-in-up [animation-delay:200ms]">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-sm font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Ticket</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Vehículo</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {tickets.map(ticket => (
                  <tr key={ticket.id} className="group hover:bg-white/5 transition-colors">
                    <td className="px-6 py-6 font-black text-accent-primary">{ticket.id}</td>
                    <td className="px-6 py-6 font-bold">{ticket.client}</td>
                    <td className="px-6 py-6 text-gray-400 font-medium">{ticket.vehicle}</td>
                    <td className="px-6 py-6">
                      <span className="px-3 py-1 rounded-full bg-accent-primary/10 text-accent-primary text-xs font-bold border border-accent-primary/20">
                        {ticket.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <button 
                        onClick={() => navigate(`/tracker/${ticket.id}`)}
                        className="flex items-center gap-2 text-sm font-bold text-accent-primary hover:text-white transition-colors"
                      >
                        <LinkIcon size={16} />
                        TRACKER
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Nuevo Ingreso */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <div className="liquid-glass p-10 rounded-[2.5rem] w-full max-w-xl shadow-ui border-white/20 animate-fade-in-up">
              <header className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-black">Registrar Vehículo</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                  <X size={28} />
                </button>
              </header>
              
              <form onSubmit={handleAddTicket} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 ml-1">NOMBRE DEL CLIENTE</label>
                  <input 
                    type="text" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-accent-primary transition-colors"
                    placeholder="Ej. Juan Pérez" 
                    value={newClient}
                    onChange={(e) => setNewClient(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 ml-1">VEHÍCULO (MARCA, MODELO, AÑO)</label>
                  <input 
                    type="text" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-accent-primary transition-colors"
                    placeholder="Ej. Toyota Corolla 2020" 
                    value={newVehicle}
                    onChange={(e) => setNewVehicle(e.target.value)}
                    required
                  />
                </div>
                
                <button type="submit" className="btn-premium w-full py-4 text-lg mt-4">
                  Generar Orden de Trabajo
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
