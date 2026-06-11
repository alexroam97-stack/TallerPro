import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../skills/security';
import { getTicket } from '../../services/mockDb';
import { CheckCircle, LogIn, Eye, Car, ShieldAlert, ArrowLeft } from 'lucide-react';
import Logo from '../../components/Logo';

export default function ScanRedirect() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (ticketId) {
      setChecking(true);
      getTicket(ticketId)
        .then(found => {
          setTicket(found);
        })
        .catch(err => {
          console.error(err);
          setTicket(null);
        })
        .finally(() => {
          setChecking(false);
        });
    }
  }, [ticketId]);

  useEffect(() => {
    if (!loading && !checking && ticket) {
      if (user) {
        // If logged in as workshop staff, redirect directly to dashboard and auto-trigger detail view
        navigate(`/dashboard?scan=${ticketId}`, { replace: true });
      }
    }
  }, [loading, checking, user, ticket, ticketId, navigate]);

  if (loading || checking) {
    return (
      <div className="min-h-screen bg-[#080b10] flex flex-col items-center justify-center text-white relative">
        <div className="bg-glow" />
        <div className="space-y-4 text-center">
          <div className="w-16 h-16 border-4 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400 font-bold tracking-widest text-xs uppercase animate-pulse">Procesando Escaneo de QR...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-[#080b10] flex flex-col text-white overflow-hidden selection:bg-accent-primary/30 relative justify-center items-center p-6">
        <div className="bg-glow" />
        <div className="liquid-glass p-8 md:p-12 rounded-[2.5rem] w-full max-w-md shadow-ui border-white/20 text-center space-y-6 relative z-10">
          <div className="inline-block p-4 rounded-full bg-red-500/10 text-red-400 mb-2">
            <ShieldAlert size={40} />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">Orden No Encontrada</h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            El código QR escaneado no corresponde a ninguna orden de trabajo activa en nuestro sistema.
          </p>
          <button 
            onClick={() => navigate('/')}
            className="btn-premium w-full py-4 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} /> Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080b10] flex flex-col text-white overflow-hidden selection:bg-accent-primary/30 relative p-6">
      <div className="bg-glow" />
      
      <header className="container mx-auto px-6 py-8 flex justify-center items-center relative z-10 animate-fade-in">
        <Logo size="sm" />
      </header>

      <main className="flex-1 flex items-center justify-center relative z-10 pb-16">
        <div className="liquid-glass p-8 md:p-10 rounded-[2.5rem] w-full max-w-lg shadow-ui border-white/20 text-center space-y-6">
          <div className="inline-block p-4 rounded-full bg-accent-success/10 text-accent-success mb-2 animate-bounce">
            <CheckCircle size={48} />
          </div>
          
          <div>
            <span className="text-[10px] font-black tracking-widest text-accent-success bg-accent-success/10 border border-accent-success/20 px-3 py-1 rounded-full uppercase">
              Escaneo Exitoso
            </span>
            <h1 className="text-3xl font-black tracking-tight mt-4 text-white">Pase QR de Cliente</h1>
            <p className="text-gray-400 text-xs font-bold uppercase mt-1">ID TICKET: {ticket.id}</p>
          </div>

          <div className="card-morphism !bg-white/5 p-6 text-left space-y-3">
            <div className="flex items-start gap-3">
              <Car className="text-accent-primary shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-[9px] text-gray-500 font-bold uppercase">Vehículo</p>
                <p className="font-bold text-white text-sm">{ticket.vehicle}</p>
              </div>
            </div>
            
            <div className="border-t border-white/5 pt-3 flex justify-between items-center text-xs">
              <div>
                <p className="text-[9px] text-gray-500 font-bold uppercase">Cliente</p>
                <p className="font-bold text-gray-300">{ticket.client}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-gray-500 font-bold uppercase">Estatus actual</p>
                <span className="inline-block px-2 py-0.5 rounded bg-accent-primary/10 text-accent-primary text-[10px] font-black border border-accent-primary/20 mt-0.5">
                  {ticket.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <button 
              onClick={() => navigate(`/dashboard?scan=${ticketId}`)}
              className="btn-premium w-full py-4 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-accent-primary/20"
            >
              <LogIn size={16} /> Iniciar Sesión en Taller (Staff)
            </button>
            
            <button 
              onClick={() => navigate(`/tracker/${ticketId}`)}
              className="btn-secondary w-full py-4 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border-white/10 text-gray-300 hover:text-white"
            >
              <Eye size={16} /> Ver en vivo (Rastreador Cliente)
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
