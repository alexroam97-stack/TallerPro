import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Check, Clock, Wrench, ChevronLeft, Car, Receipt, Download, XCircle } from 'lucide-react';
import { getTicket, updateBudgetStatus } from '../../services/mockDb';
import Logo from '../../components/Logo';
import WhatsAppButton from '../../components/WhatsAppButton';

export default function ClientTracker() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);

  useEffect(() => {
    if (ticketId) {
      setTicket(getTicket(ticketId));
    }
  }, [ticketId]);

  const handleBudgetAction = (status) => {
    updateBudgetStatus(ticketId, status);
    setTicket({ ...ticket, budgetStatus: status });
    
    // Simular notificación al taller vía WhatsApp
    const shopPhone = "526633040096"; // Número del taller
    const actionText = status === 'approved' ? 'ACEPTADO' : 'DECLINADO';
    const message = `Hola, soy el cliente del ticket ${ticketId} (${ticket.vehicle}). He ${actionText} el presupuesto.`;
    window.open(`https://wa.me/${shopPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const mechanicalEvents = [
    { id: 1, title: 'Recepción del Vehículo', time: 'Ingresado', desc: 'El vehículo ha sido recibido y el inventario completado.', icon: <Check size={18} /> },
    { id: 2, title: 'Diagnóstico Técnico', time: 'En Revisión', desc: 'Nuestros técnicos están escaneando y revisando los sistemas del vehículo.', photo: 'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?auto=format&fit=crop&q=80&w=800', icon: <Check size={18} /> },
    { id: 3, title: 'Reparación / Mantenimiento', time: 'En proceso', desc: 'Se están realizando los trabajos mecánicos autorizados.', photo: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=800', icon: <Wrench size={18} /> },
    { id: 4, title: 'Pruebas y QC', time: 'Pendiente', desc: 'Verificación final de sistemas y prueba de manejo.', icon: <Clock size={18} /> },
    { id: 5, title: 'Listo para Entrega', time: 'Completado', desc: 'Vehículo verificado y listo para ser recogido.', icon: <Check size={18} /> }
  ];

  const bodyPaintEvents = [
    { id: 1, title: 'Recepción e Inventario', time: 'Ingresado', desc: 'Vehículo recibido y documentado para proceso de hojalatería.', icon: <Check size={18} /> },
    { id: 2, title: 'Desarmado y Hojalatería', time: 'En proceso', desc: 'Reparación de golpes y alineación de carrocería.', photo: 'https://images.unsplash.com/photo-1513258496099-48168024adb0?auto=format&fit=crop&q=80&w=800', icon: <Wrench size={18} /> },
    { id: 3, title: 'Preparación y Pintura', time: 'Pendiente', desc: 'Aplicación de primarios, base color y transparente en cabina.', photo: 'https://images.unsplash.com/photo-1599256872237-5dcc0fbe9668?auto=format&fit=crop&q=80&w=800', icon: <Check size={18} /> },
    { id: 4, title: 'Armado y Detallado', time: 'Pendiente', desc: 'Reinstalación de piezas, pulido y limpieza profunda.', icon: <Check size={18} /> },
    { id: 5, title: 'Control de Calidad / Listo', time: 'Completado', desc: 'Inspección final de acabados y entrega al cliente.', icon: <Check size={18} /> }
  ];

  const baseEvents = ticket?.serviceType === 'Hojalatería y Pintura' ? bodyPaintEvents : mechanicalEvents;

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

        {/* Budget Section */}
        {ticket?.items && ticket.items.length > 0 && (
          <div className="mt-16 animate-fade-in-up [animation-delay:600ms]">
            <div className="flex items-center gap-3 mb-6">
              <Receipt className="text-accent-primary" size={28} />
              <h2 className="text-2xl font-black tracking-tight">Presupuesto y Conceptos</h2>
            </div>
            
            <div className="card-morphism overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 text-gray-500 font-bold uppercase text-[10px] tracking-widest">
                    <tr>
                      <th className="px-6 py-4">Descripción</th>
                      <th className="px-6 py-4 text-right">Cantidad</th>
                      <th className="px-6 py-4 text-right">Precio</th>
                      <th className="px-6 py-4 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {ticket.items.map(item => (
                      <tr key={item.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold">{item.desc}</div>
                          <div className="text-[10px] text-gray-400">{item.type.toUpperCase()}</div>
                        </td>
                        <td className="px-6 py-4 text-right font-medium">{item.qty}</td>
                        <td className="px-6 py-4 text-right font-medium">${item.price.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right font-bold text-accent-primary">${(item.qty * item.price).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-white/5 font-bold">
                    <tr>
                      <td colSpan="3" className="px-6 py-4 text-right text-gray-400 uppercase tracking-widest text-xs">Subtotal</td>
                      <td className="px-6 py-4 text-right">${ticket.items.reduce((acc, i) => acc + (i.qty * i.price), 0).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td colSpan="3" className="px-6 py-2 text-right text-gray-400 uppercase tracking-widest text-xs">IVA (16%)</td>
                      <td className="px-6 py-2 text-right">${(ticket.items.reduce((acc, i) => acc + (i.qty * i.price), 0) * 0.16).toLocaleString()}</td>
                    </tr>
                    <tr className="text-lg">
                      <td colSpan="3" className="px-6 py-6 text-right text-white uppercase tracking-tighter font-black">Total a Pagar</td>
                      <td className="px-6 py-6 text-right text-accent-primary font-black">
                        ${(ticket.items.reduce((acc, i) => acc + (i.qty * i.price), 0) * 1.16).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              
              <div className="p-6 bg-accent-primary/10 border-t border-white/10 flex flex-col md:flex-row gap-4 items-center justify-between">
                <p className="text-sm text-gray-400 font-medium italic">Precios sujetos a cambios sin previo aviso.</p>
                <button 
                  onClick={() => window.print()}
                  className="btn-premium flex items-center gap-2 text-sm py-3 px-6 shadow-ui"
                >
                  <Download size={18} />
                  DESCARGAR
                </button>
              </div>

              {/* Acciones de Aprobación */}
              <div className="p-6 bg-white/5 flex flex-col items-center justify-center gap-4">
                {ticket.budgetStatus === 'pending' ? (
                  <>
                    <p className="text-gray-300 font-bold mb-2">¿Autorizas este presupuesto?</p>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => handleBudgetAction('approved')}
                        className="btn-premium !bg-accent-success/20 !border-accent-success !text-accent-success !from-transparent !to-transparent border py-3 px-8 text-sm"
                      >
                        <Check size={18} className="inline mr-2" /> ACEPTAR REPARACIÓN
                      </button>
                      <button 
                        onClick={() => handleBudgetAction('declined')}
                        className="btn-secondary !border-red-500/50 !text-red-400 py-3 px-8 text-sm hover:!bg-red-500/10"
                      >
                        <XCircle size={18} className="inline mr-2" /> DECLINAR
                      </button>
                    </div>
                  </>
                ) : (
                  <div className={`px-6 py-4 rounded-xl font-bold border ${ticket.budgetStatus === 'approved' ? 'bg-accent-success/10 border-accent-success text-accent-success' : 'bg-red-500/10 border-red-500 text-red-400'}`}>
                    {ticket.budgetStatus === 'approved' ? 'PRESUPUESTO AUTORIZADO' : 'PRESUPUESTO DECLINADO'}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <WhatsAppButton />
    </div>
  );
}

