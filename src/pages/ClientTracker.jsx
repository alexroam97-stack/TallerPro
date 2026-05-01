import { useParams, useNavigate } from 'react-router-dom';
import { Check, Clock, Wrench, ChevronLeft } from 'lucide-react';

export default function ClientTracker() {
  const { ticketId } = useParams();
  const navigate = useNavigate();

  // Mock data for the timeline
  const events = [
    {
      id: 1,
      title: 'Recepción del Vehículo',
      time: '10:00 AM - Hoy',
      desc: 'El vehículo ha sido recibido y el inventario completado.',
      status: 'completed', // completed, active, pending
      icon: <Check size={16} color="white" />,
    },
    {
      id: 2,
      title: 'Desarmado y Evaluación',
      time: '11:30 AM - Hoy',
      desc: 'Se han retirado las piezas dañadas y se está preparando el presupuesto.',
      photo: 'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?auto=format&fit=crop&q=80&w=800',
      status: 'completed',
      icon: <Check size={16} color="white" />,
    },
    {
      id: 3,
      title: 'Hojalatería / Mecánica',
      time: 'En proceso',
      desc: 'Nuestros técnicos están trabajando en la reparación de su vehículo.',
      photo: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=800',
      status: 'active',
      icon: <Wrench size={16} color="white" />,
    },
    {
      id: 4,
      title: 'Preparación y Pintura',
      time: 'Pendiente',
      desc: 'Ingreso a cabina de pintura.',
      status: 'pending',
      icon: <Clock size={16} color="var(--text-secondary)" />,
    },
    {
      id: 5,
      title: 'Armado y Entrega',
      time: 'Pendiente',
      desc: 'Detallado final y listo para entrega.',
      status: 'pending',
      icon: <Clock size={16} color="var(--text-secondary)" />,
    }
  ];

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
        <p>Ticket: {ticketId || 'TKT-001'} • Toyota Corolla 2020</p>
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
