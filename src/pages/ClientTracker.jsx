import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Check, Clock, Wrench, ChevronLeft, Car } from 'lucide-react';
import { getTicket } from '../services/mockDb';
import Logo from '../components/Logo';
import WhatsAppButton from '../components/WhatsAppButton';

export default function ClientTracker() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);

  useEffect(() => {
    if (ticketId) {
      setTicket(getTicket(ticketId));
    }
  }, [ticketId]);

  const baseEvents = [
    { id: 1, title: 'Recepción del Vehículo', time: 'Ingresado', desc: 'El vehículo ha sido recibido y el inventario completado.', icon: <Check size={18} /> },
    { id: 2, title: 'Evaluación Técnica', time: 'En Revisión', desc: 'Se han retirado las piezas dañadas y se está preparando el presupuesto.', photo: 'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?auto=format&fit=crop&q=80&w=800', icon: <Check size={18} /> },
    { id: 3, title: 'Mecánica / Carrocería', time: 'En proceso', desc: 'Nuestros técnicos están trabajando en la reparación de su vehículo.', photo: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=800', icon: <Wrench size={18} /> },
    { id: 4, title: 'Detallado y Limpieza', time: 'Pendiente', desc: 'Ingreso a cabina de pintura o limpieza profunda.', icon: <Clock size={18} /> },
    { id: 5, title: 'Control de Calidad', time: 'Pendiente', desc: 'Prueba de manejo final y listo para entrega.', icon: <Clock size={18} /> }
  ];

  const currentEvents = ticket?.events || [1];

  const events = baseEvents.map((evt, index) => {
    const isCompleted = currentEvents.includes(evt.id);
    const isActive = !isCompleted && currentEvents.length === index;
    const isPending = !isCompleted && !isActive;

    // Get real photo from ticket if available, else use fallback
    const realPhoto = ticket?.photos?.[evt.id];

    return {
      ...evt,
      photo: realPhoto || evt.photo, // Real photo overrides stock photo
      status: isCompleted ? 'completed' : isActive ? 'active' : 'pending'
    };
  });

  return (
    <div className="relative min-h-screen flex flex-col text-white overflow-hidden selection:bg-accent-primary/30">
      <img 
        src="/assets/bg-internal.png" 
        className="full-screen-bg opacity-40"
        alt="Tracker Background"
      />
      <div className="bg-glow" />

      <header className="container mx-auto px-6 py-8 flex justify-between items-center relative z-10 animate-fade-in">
        <Logo size="sm" />
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-400 font-bold hover:text-white transition-colors"
        >
          <ChevronLeft size={20} /> VOLVER
        </button>
      </header>

      <main className="container mx-auto px-6 pb-32 relative z-10 max-w-2xl">
        <div className="card-morphism mb-12 text-center animate-fade-in-up">
           <div className="inline-block p-4 rounded-full bg-accent-primary/10 mb-4">
              <Car size={40} className="text-accent-primary" />
           </div>
           <h1 className="text-4xl font-black tracking-tighter mb-2">{ticket?.vehicle || 'Buscando vehículo...'}</h1>
           <p className="text-accent-primary font-black tracking-widest text-lg">ID TICKET: {ticketId}</p>
        </div>

        <div className="space-y-12 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-[2px] before:bg-white/10">
          {events.map((event, index) => (
            <div 
              key={event.id} 
              className={`relative pl-12 animate-fade-in-up`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Dot */}
              <div className={`absolute left-0 top-1 w-9 h-9 rounded-full flex items-center justify-center z-10 transition-all duration-500 shadow-lg
                ${event.status === 'completed' ? 'bg-accent-success text-black scale-110' : 
                  event.status === 'active' ? 'bg-accent-primary text-black animate-pulse scale-125' : 
                  'bg-gray-800 text-gray-500 border border-white/10'}`}>
                {event.icon}
              </div>
              
              <div className={`card-morphism border-none !bg-white/5 transition-all duration-500
                ${event.status === 'pending' ? 'opacity-40 grayscale' : 'opacity-100 shadow-ui'}`}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-black tracking-tight">{event.title}</h3>
                  <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider
                    ${event.status === 'completed' ? 'bg-accent-success/20 text-accent-success' : 
                      event.status === 'active' ? 'bg-accent-primary/20 text-accent-primary' : 
                      'bg-gray-800 text-gray-400'}`}>
                    {event.time}
                  </span>
                </div>
                <p className="text-gray-400 font-medium leading-relaxed mb-4">{event.desc}</p>
                
                {event.photo && event.status !== 'pending' && (
                  <div className="rounded-2xl overflow-hidden border border-white/10 shadow-lg group">
                    <img src={event.photo} alt={event.title} className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-700" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      <WhatsAppButton />
    </div>
  );
}

