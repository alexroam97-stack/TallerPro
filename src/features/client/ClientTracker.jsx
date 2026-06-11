import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Check, Clock, Wrench, ChevronLeft, Car, Receipt, Download, XCircle, Package, Shield, MapPin, Phone } from 'lucide-react';
import { getTicket, updateBudgetStatus, getParts, saveSignature, addEventToTicket } from '../../services/mockDb';
import Logo from '../../components/Logo';
import WhatsAppButton from '../../components/WhatsAppButton';
import InteractiveVehicleSVG from '../workshop/InteractiveVehicleSVG';
import SignatureCanvas from '../../components/SignatureCanvas';
import { useAuth } from '../../skills/security';
import { generateWhatsAppLink } from '../../services/notifications';

export default function ClientTracker() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [parts, setParts] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [deliverySignature, setDeliverySignature] = useState('');
  const [signatureSaved, setSignatureSaved] = useState(false);
  const [shopPhone, setShopPhone] = useState('526633040096');
  const [shopInfo, setShopInfo] = useState({
    name: 'TallerPro',
    logo: '',
    phone: '526633040096',
    address: 'Av. de la Reforma 123, Ciudad de México'
  });
  
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [verificationError, setVerificationError] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('tallerpro_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setShopInfo(prev => ({ ...prev, ...parsed }));
        if (parsed.phone) {
          setShopPhone(parsed.phone);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
    if (ticketId) {
      const found = getTicket(ticketId);
      setTicket(found);
      const allParts = getParts();
      setParts(allParts.filter(p => p.ticketId === ticketId));
      
      // Staff automatically bypasses the client verification gate
      if (user) {
        setIsUnlocked(true);
      }
    }
  }, [ticketId, user]);

  const handleVerifyPhone = (e) => {
    e.preventDefault();
    if (!ticket) return;
    
    const ticketPhone = ticket.phone || '';
    const cleanTicketPhone = ticketPhone.replace(/\D/g, '');
    const cleanInput = phoneInput.replace(/\D/g, '');
    
    if (cleanInput.length < 4) {
      setVerificationError('Por favor ingresa los 4 dígitos.');
      return;
    }
    
    const last4 = cleanTicketPhone.slice(-4);
    if (cleanInput === last4) {
      setIsUnlocked(true);
      setVerificationError('');
    } else {
      setVerificationError('Número incorrecto. Por favor, verifica con el personal del taller.');
    }
  };

  const handleBudgetAction = (status) => {
    updateBudgetStatus(ticketId, status);
    setTicket({ ...ticket, budgetStatus: status });
    
    // Simular notificación al taller vía WhatsApp
    const cleanShopPhone = shopPhone.replace(/\D/g, '');
    const actionText = status === 'approved' ? 'ACEPTADO' : 'DECLINADO';
    
    let message = `Hola, soy el cliente del ticket ${ticketId} (${ticket.vehicle}). He ${actionText} el presupuesto.`;
    if (status === 'approved') {
      const scanUrl = `${window.location.origin}/scan/${ticketId}`;
      const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(scanUrl)}`;
      message = `Hola, he confirmado la reparación de mi vehículo *${ticket.vehicle}* (Ticket: *${ticketId}*). Aquí está mi Pase QR de Cliente para el taller: ${qrImageUrl}`;
    }
    
    window.open(`https://wa.me/${cleanShopPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const mechanicalEvents = [
    { id: 1, title: 'Recepción del Vehículo', time: 'Ingresado', desc: 'El vehículo ha sido recibido y el inventario completado.', icon: <Check size={18} /> },
    { id: 2, title: 'Diagnóstico Técnico', time: 'En Revisión', desc: 'Nuestros técnicos están escaneando y revisando los sistemas del vehículo.', photo: 'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?auto=format&fit=crop&q=80&w=800', icon: <Check size={18} /> },
    { id: 3, title: 'Reparación / Mantenimiento', time: 'En proceso', desc: 'Se están realizando los trabajos mecánicos autorizados.', photo: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=800', icon: <Wrench size={18} /> },
    { id: 4, title: 'Pruebas y QC', time: 'Pendiente', desc: 'Verificación final de sistemas y prueba de manejo.', icon: <Clock size={18} /> },
    { id: 5, title: 'Listo para Entrega', time: 'Completado', desc: 'Vehículo verificado y listo para ser recogido.', icon: <Check size={18} /> },
    { id: 6, title: 'Entregado al Cliente', time: 'Entregado', desc: 'Vehículo entregado bajo firma de conformidad.', icon: <Check size={18} /> }
  ];

  const bodyPaintEvents = [
    { id: 1, title: 'Recepción e Inventario', time: 'Ingresado', desc: 'Vehículo recibido y documentado para proceso de hojalatería.', icon: <Check size={18} /> },
    { id: 2, title: 'Desarmado y Hojalatería', time: 'En proceso', desc: 'Reparación de golpes y alineación de carrocería.', photo: 'https://images.unsplash.com/photo-1513258496099-48168024adb0?auto=format&fit=crop&q=80&w=800', icon: <Wrench size={18} /> },
    { id: 3, title: 'Preparación y Pintura', time: 'Pendiente', desc: 'Aplicación de primarios, base color y transparente en cabina.', photo: 'https://images.unsplash.com/photo-1599256872237-5dcc0fbe9668?auto=format&fit=crop&q=80&w=800', icon: <Check size={18} /> },
    { id: 4, title: 'Armado y Detallado', time: 'Pendiente', desc: 'Reinstalación de piezas, pulido y limpieza profunda.', icon: <Check size={18} /> },
    { id: 5, title: 'Control de Calidad / Listo', time: 'Completado', desc: 'Inspección final de acabados y listo para entrega.', icon: <Check size={18} /> },
    { id: 6, title: 'Entregado al Cliente', time: 'Entregado', desc: 'Vehículo entregado bajo firma de conformidad.', icon: <Check size={18} /> }
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

  if (ticketId && !ticket) {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center text-white overflow-hidden">
        <div className="bg-glow" />
        <div className="card-morphism max-w-md text-center p-8 space-y-6">
          <Logo size="md" />
          <h2 className="text-2xl font-black text-red-400">Orden no encontrada</h2>
          <p className="text-gray-400 text-sm">El ticket ID <strong>{ticketId}</strong> no coincide con ninguna orden en nuestro sistema.</p>
          <button onClick={() => navigate('/')} className="btn-premium w-full py-3">Volver al Inicio</button>
        </div>
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center text-white overflow-hidden">
        <div className="bg-glow" />
        <main className="w-full max-w-md p-4 relative z-10">
          <div className="text-center mb-8">
            <Logo size="md" />
          </div>
          <div className="liquid-glass p-8 md:p-10 rounded-[2.5rem] shadow-ui border-white/20 text-center space-y-6">
            <div className="inline-block p-4 rounded-full bg-accent-primary/10">
              <Shield className="text-accent-primary" size={36} />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-white">Verificación de Cliente</h2>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Por motivos de privacidad y protección de datos, ingresa los últimos 4 dígitos del número telefónico registrado para el ticket <strong>{ticketId}</strong>.
              </p>
            </div>
            
            <form onSubmit={handleVerifyPhone} className="space-y-4">
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Últimos 4 dígitos</label>
                <input
                  type="text"
                  maxLength={4}
                  pattern="\d{4}"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center text-xl font-bold tracking-widest text-white focus:outline-none focus:border-accent-primary transition-colors"
                  placeholder="••••"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ''))}
                />
              </div>

              {verificationError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-bold leading-normal">
                  {verificationError}
                </div>
              )}

              <button type="submit" className="btn-premium w-full py-4 text-xs font-black uppercase tracking-wider shadow-lg shadow-accent-primary/20">
                Verificar y Entrar
              </button>
            </form>

            <button 
              onClick={() => navigate('/')}
              className="text-xs text-gray-500 hover:text-white transition-colors uppercase font-bold tracking-wider"
            >
              Cancelar
            </button>
          </div>
        </main>
      </div>
    );
  }

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
          onClick={() => navigate(user ? '/dashboard' : '/')}
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
           <p className="text-accent-primary font-black tracking-widest text-lg mb-3">ID TICKET: {ticketId}</p>
           {ticket?.insuranceType === 'aseguranza' ? (
             <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-accent-primary/10 border border-accent-primary/20 text-accent-primary animate-fade-in mx-auto">
               <Shield size={16} className="shrink-0" />
               <span className="text-xs font-bold uppercase tracking-wider text-gray-200">
                 Aseguradora: <span className="text-accent-primary">{ticket.insuranceCompany}</span> &bull; Siniestro: <span className="font-mono text-accent-primary">#{ticket.claimNumber}</span>
               </span>
             </div>
           ) : ticket?.insuranceType === 'particular' ? (
             <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-gray-400 animate-fade-in mx-auto">
               <span className="text-xs font-bold uppercase tracking-wider">
                 Servicio Particular
               </span>
             </div>
           ) : null}
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
                
                {event.id === 1 && ticket?.photos && Object.keys(ticket.photos).some(k => ['frontal', 'trasera', 'lat_izq', 'lat_der', 'odometro'].includes(k)) ? (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {['frontal', 'trasera', 'lat_izq', 'lat_der', 'odometro'].map(slotId => {
                      const photoUrl = ticket.photos[slotId];
                      if (!photoUrl) return null;
                      const label = slotId === 'frontal' ? 'Frontal' : slotId === 'trasera' ? 'Trasera' : slotId === 'lat_izq' ? 'Lateral Izq.' : slotId === 'lat_der' ? 'Lateral Der.' : 'Tablero/Odómetro';
                      return (
                        <div 
                          key={slotId} 
                          className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group cursor-pointer"
                          onClick={() => setSelectedPhoto(photoUrl)}
                        >
                          <img src={photoUrl} alt={label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1 text-center backdrop-blur-sm">
                            <span className="text-[9px] font-bold text-accent-primary uppercase truncate block">{label}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : event.photo && event.status !== 'pending' ? (
                  <div className="rounded-2xl overflow-hidden border border-white/10 shadow-lg group">
                    <img src={event.photo} alt={event.title} className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-700" />
                  </div>
                ) : null}

                {event.id === 1 && ticket?.inventoryChecklist && (
                  <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/5 text-xs">
                    <p className="text-[10px] font-black text-accent-primary uppercase tracking-wider mb-2">Checklist de Recepción</p>
                    <div className="grid grid-cols-2 gap-2 text-gray-300">
                      {Object.entries(ticket.inventoryChecklist).map(([key, val]) => {
                        const label = key === 'gasolina' ? 'Gasolina (>50%)' : key === 'refaccion' ? 'Llanta Refacción' : key === 'gato' ? 'Gato Hidráulico' : key === 'herramienta' ? 'Herr. Básica' : 'Estéreo / Pantalla';
                        return (
                          <div key={key} className="flex items-center gap-1.5 font-bold">
                            <span className={`w-2 h-2 rounded-full ${val ? 'bg-accent-success' : 'bg-gray-600'}`} />
                            <span className={val ? 'text-white' : 'text-gray-500 line-through'}>{label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Mapeo de Daños del Vehículo */}
        {ticket?.damagedPanels && ticket.damagedPanels.length > 0 && (
          <div className="mt-16 animate-fade-in-up [animation-delay:200ms]">
            <div className="flex items-center gap-3 mb-6">
              <Car className="text-accent-primary" size={28} />
              <h2 className="text-2xl font-black tracking-tight">Daños Registrados al Ingresar</h2>
            </div>
            <div className="card-morphism !bg-white/5 border-none p-6 shadow-ui">
              <InteractiveVehicleSVG 
                damagedPanels={ticket.damagedPanels} 
                readOnly={true} 
              />
            </div>
          </div>
        )}

        {/* Parts Section */}
        {parts.length > 0 && (
          <div className="mt-16 animate-fade-in-up [animation-delay:400ms]">
            <div className="flex items-center gap-3 mb-6">
              <Package className="text-accent-primary" size={28} />
              <h2 className="text-2xl font-black tracking-tight">Refacciones y Control de Calidad</h2>
            </div>
            
            <div className="space-y-4">
              {parts.map(part => {
                const total = part.qcChecked ? Object.keys(part.qcChecked).length : 0;
                const active = part.qcChecked ? Object.values(part.qcChecked).filter(Boolean).length : 0;
                const score = total > 0 ? Math.round((active / total) * 100) : 0;

                return (
                  <div key={part.id} className="card-morphism !bg-white/5 border-none p-6 shadow-ui relative overflow-hidden">
                    {/* Background indicator */}
                    <div className={`absolute top-0 right-0 w-24 h-24 rounded-full filter blur-3xl opacity-5 pointer-events-none -mr-8 -mt-8
                      ${part.status === 'approved' ? 'bg-accent-success' : part.status === 'rejected' ? 'bg-red-500' : 'bg-amber-500'}`} 
                    />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 relative z-10">
                      <div>
                        <span className="text-[10px] font-bold text-accent-primary tracking-widest uppercase">{part.id}</span>
                        <h3 className="text-lg font-black tracking-tight mt-0.5">{part.name}</h3>
                        <p className="text-xs text-gray-400 font-bold uppercase">{part.brand}</p>
                      </div>

                      <span className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider self-start sm:self-center
                        ${part.status === 'approved' ? 'bg-accent-success/10 border-accent-success/20 text-accent-success' : 
                          part.status === 'rejected' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 
                          'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}
                      >
                        {part.status === 'approved' ? 'CALIDAD APROBADA' : 
                         part.status === 'rejected' ? 'RECHAZADA / REORDENANDO' : 
                         'EN CAMINO / PENDIENTE'}
                      </span>
                    </div>

                    {part.status !== 'pending' && (
                      <div className="space-y-4 pt-4 border-t border-white/5 animate-fade-in relative z-10">
                        <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                          <div>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Cumplimiento QC</p>
                            <p className={`font-black ${part.status === 'approved' ? 'text-accent-success' : 'text-red-400'}`}>{score}% de Puntos Aprobados</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Inspeccionado Por</p>
                            <p className="font-bold text-gray-300">{part.inspectedBy || 'Taller Técnico'}</p>
                          </div>
                        </div>

                        {part.qcNotes && (
                          <div className="p-3 bg-white/5 rounded-xl text-xs text-gray-300 border border-white/5 leading-relaxed font-medium">
                            <p className="text-[9px] font-black text-accent-primary uppercase tracking-wider mb-1">Notas del Inspector</p>
                            "{part.qcNotes}"
                          </div>
                        )}

                        {part.photo && (
                          <div className="space-y-1.5">
                            <p className="text-[9px] font-black text-accent-primary uppercase tracking-wider">Evidencia de Arribo</p>
                            <div className="relative rounded-2xl overflow-hidden border border-white/10 group cursor-pointer max-w-sm">
                              <img 
                                src={part.photo} 
                                alt={part.name} 
                                className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500" 
                                onClick={() => setSelectedPhoto(part.photo)}
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="px-3 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-[10px] font-bold tracking-wider border border-white/10">AMPLIAR FOTO</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
                      <td colSpan="3" className="px-6 py-2 text-right text-gray-400 uppercase tracking-widest text-xs">
                        IVA ({ticket.billingInfo?.ivaRate !== undefined ? ticket.billingInfo.ivaRate : 16}%)
                      </td>
                      <td className="px-6 py-2 text-right">
                        ${(ticket.items.reduce((acc, i) => acc + (i.qty * i.price), 0) * ((ticket.billingInfo?.ivaRate !== undefined ? ticket.billingInfo.ivaRate : 16) / 100)).toLocaleString()}
                      </td>
                    </tr>
                    <tr className="text-lg">
                      <td colSpan="3" className="px-6 py-6 text-right text-white uppercase tracking-tighter font-black">Total a Pagar</td>
                      <td className="px-6 py-6 text-right text-accent-primary font-black">
                        ${(ticket.items.reduce((acc, i) => acc + (i.qty * i.price), 0) * (1 + ((ticket.billingInfo?.ivaRate !== undefined ? ticket.billingInfo.ivaRate : 16) / 100))).toLocaleString()}
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
                  <div className="flex flex-col items-center gap-6 w-full">
                    <div className={`px-6 py-4 rounded-xl font-bold border w-full text-center ${ticket.budgetStatus === 'approved' ? 'bg-accent-success/10 border-accent-success text-accent-success' : 'bg-red-500/10 border-red-500 text-red-400'}`}>
                      {ticket.budgetStatus === 'approved' ? 'PRESUPUESTO AUTORIZADO' : 'PRESUPUESTO DECLINADO'}
                    </div>
                    {ticket.budgetStatus === 'approved' && (
                      <div className="flex flex-col items-center text-center p-6 bg-accent-success/5 border border-accent-success/20 rounded-2xl w-full max-w-sm space-y-4 animate-fade-in-up">
                        <div>
                          <p className="text-[10px] text-accent-success font-black tracking-widest uppercase">Tu Pase QR de Cliente</p>
                          <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">EXCLUSIVO PARA TI</p>
                        </div>
                        <div className="bg-white p-4 rounded-3xl shadow-[0_0_30px_rgba(0,242,255,0.1)]">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location.origin}/scan/${ticket.id}`)}`}
                            alt="Pase QR Cliente"
                            className="w-40 h-40 block"
                          />
                        </div>
                        <p className="text-xs text-gray-300 font-medium leading-relaxed">
                          El personal del taller escaneará este código para identificar tu auto y actualizar su estatus instantáneamente.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {/* Firmas de Conformidad */}
        <div className="mt-16 animate-fade-in-up [animation-delay:600ms]">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="text-accent-primary" size={28} />
            <h2 className="text-2xl font-black tracking-tight">Firmas de Conformidad</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Firma de Recepción */}
            <div className="card-morphism !bg-white/5 border-none p-6 shadow-ui text-center flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-4">Firma de Recepción (Ingreso)</h3>
                {ticket?.signatureIntake ? (
                  <div className="bg-white/10 rounded-2xl p-4 border border-white/10 flex items-center justify-center h-32">
                    <img src={ticket.signatureIntake} alt="Firma de Ingreso" className="max-h-full max-w-full object-contain" />
                  </div>
                ) : (
                  <div className="rounded-2xl p-4 border border-white/5 bg-white/5 flex items-center justify-center h-32 text-gray-500 text-xs font-bold uppercase">
                    Sin firma de ingreso registrada
                  </div>
                )}
              </div>
              <p className="text-[10px] text-gray-500 mt-4 leading-normal">
                Firma plasmada por el cliente al entregar las llaves en recepción del taller.
              </p>
            </div>

            {/* Firma de Entrega */}
            <div className="card-morphism !bg-white/5 border-none p-6 shadow-ui text-center flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-4">Firma de Entrega (Conformidad)</h3>
                {ticket?.signatureDelivery || signatureSaved ? (
                  <div className="bg-white/10 rounded-2xl p-4 border border-white/10 flex items-center justify-center h-32">
                    <img src={ticket?.signatureDelivery || deliverySignature} alt="Firma de Entrega" className="max-h-full max-w-full object-contain" />
                  </div>
                ) : ticket?.status === 'Listo' ? (
                  <div className="space-y-4">
                    <SignatureCanvas 
                      onChange={setDeliverySignature} 
                      placeholder="Firma para autorizar retiro del auto" 
                    />
                    <button
                      type="button"
                      disabled={!deliverySignature}
                      onClick={() => {
                        saveSignature(ticketId, 'delivery', deliverySignature);
                        addEventToTicket(ticketId, 6); // advance to stage 6 (Entregado)
                        setSignatureSaved(true);
                        setTicket(getTicket(ticketId));
                      }}
                      className={`btn-premium w-full py-3 text-xs font-black uppercase tracking-wider ${!deliverySignature ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      Confirmar de Recibido y Finalizar
                    </button>
                  </div>
                ) : (
                  <div className="rounded-2xl p-4 border border-white/5 bg-white/5 flex items-center justify-center h-32 text-gray-500 text-xs font-bold uppercase leading-normal">
                    {ticket?.status === 'Entregado' || ticket?.closedAt 
                      ? 'Entregado'
                      : 'Firma disponible cuando el auto esté listo'}
                  </div>
                )}
              </div>
              <p className="text-[10px] text-gray-500 mt-4 leading-normal">
                Firma digital de conformidad del cliente al recibir el coche finalizado.
              </p>
            </div>
          </div>
        </div>

        {/* Información y Contacto del Taller */}
        <div className="mt-16 animate-fade-in-up [animation-delay:800ms]">
          <div className="flex items-center gap-3 mb-6">
            <MapPin className="text-accent-primary" size={28} />
            <h2 className="text-2xl font-black tracking-tight">Contacto y Ubicación</h2>
          </div>
          
          <div className="card-morphism !bg-white/5 border-none p-6 shadow-ui relative overflow-hidden flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
            <div className="space-y-3">
              <h3 className="text-xl font-black text-white">{shopInfo.name.toUpperCase()}</h3>
              {shopInfo.address && (
                <div className="text-xs text-gray-400 font-bold uppercase leading-normal">
                  <span className="text-[10px] text-gray-500 block">Dirección</span>
                  {shopInfo.address}
                </div>
              )}
              {shopInfo.phone && (
                <div className="text-xs text-gray-400 font-bold uppercase">
                  <span className="text-[10px] text-gray-500 block">Teléfono de Soporte</span>
                  {shopInfo.phone}
                </div>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
              {shopInfo.address && (
                <a 
                  href={`https://maps.google.com/?q=${encodeURIComponent(shopInfo.address)}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-premium py-3.5 px-6 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 text-center"
                >
                  <MapPin size={16} /> Cómo Llegar
                </a>
              )}
              {shopInfo.phone && (
                <a 
                  href={`tel:${shopInfo.phone}`} 
                  className="btn-secondary py-3.5 px-6 text-xs font-black uppercase tracking-wider border-white/10 text-gray-300 hover:text-white flex items-center justify-center gap-2 text-center"
                >
                  <Phone size={16} /> Llamar al Taller
                </a>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Zoom Photo Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-3xl w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <button 
              className="absolute top-4 right-4 p-2 bg-black/60 rounded-full border border-white/10 text-white hover:bg-white/10 transition-colors"
              onClick={() => setSelectedPhoto(null)}
            >
              <XCircle size={28} />
            </button>
            <img src={selectedPhoto} alt="Refacción Zoom" className="max-h-[80vh] object-contain rounded-2xl border border-white/20 shadow-2xl" />
          </div>
        </div>
      )}

      <WhatsAppButton />
    </div>
  );
}

