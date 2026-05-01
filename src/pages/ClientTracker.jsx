import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Check, Clock, Wrench, ChevronLeft } from 'lucide-react';
import { getTicket } from '../services/mockDb';

export default function ClientTracker() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);

  useEffect(() => {
    if (ticketId) {
      setTicket(getTicket(ticketId));
    }
  }, [ticketId]);

  // Base events data
  const baseEvents = [
    { id: 1, title: 'Recepción del Vehículo', time: 'Ingresado', desc: 'El vehículo ha sido recibido y el inventario completado.', icon: <Check size={16} color="white" /> },
    { id: 2, title: 'Desarmado y Evaluación', time: 'En Revisión', desc: 'Se han retirado las piezas dañadas y se está preparando el presupuesto.', photo: 'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?auto=format&fit=crop&q=80&w=800', icon: <Check size={16} color="white" /> },
    { id: 3, title: 'Hojalatería / Mecánica', time: 'En proceso', desc: 'Nuestros técnicos están trabajando en la reparación de su vehículo.', photo: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=800', icon: <Wrench size={16} color="white" /> },
    { id: 4, title: 'Preparación y Pintura', time: 'Pendiente', desc: 'Ingreso a cabina de pintura.', icon: <Clock size={16} color="var(--text-secondary)" /> },
    { id: 5, title: 'Armado y Entrega', time: 'Pendiente', desc: 'Detallado final y listo para entrega.', icon: <Clock size={16} color="var(--text-secondary)" /> }
  ];

  const currentEvents = ticket?.events || [1];

  const events = baseEvents.map((evt, index) => {
    const isCompleted = currentEvents.includes(evt.id);
    const isActive = !isCompleted && currentEvents.length === index;
    const isPending = !isCompleted && !isActive;

    return {
      ...evt,
      status: isCompleted ? 'completed' : isActive ? 'active' : 'pending',
      icon: isPending ? <Clock size={16} color="var(--text-secondary)" /> : evt.icon
    };
  });

  return (
    <div className="tracker-container">
      <div className="tracker-header animate-fade-in" style={{ position: 'relative' }}>
        <button 
          onClick={() => navigate('/')}
          style={{ position: 'absolute', left: 0, top: 0, background: 'none', border: 'none', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '1rem', fontWeight: '500' }}
        >
          <ChevronLeft size={20} /> Volver
        </button>
        <h1>Tu Vehículo</h1>
        <p>Ticket: {ticketId} • {ticket?.vehicle || 'Buscando vehículo...'}</p>
      </div>

      <div className="timeline">
        {events.map((event, index) => (
          <div 
            key={event.id} 
            className={`timeline-item animate-fade-in ${event.status}`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="timeline-dot" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {event.status !== 'pending' && event.icon}
            </div>
            
            <div className="timeline-content">
              <div className="timeline-title">
                {event.title}
                <span className="timeline-time">{event.time}</span>
              </div>
              <p className="timeline-desc">{event.desc}</p>
              
              {event.photo && (
                <img src={event.photo} alt={event.title} className="timeline-photo" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
