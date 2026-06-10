import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, CheckCircle2, ChevronLeft, QrCode, Home, ArrowRight, MessageSquare, Image as ImageIcon, Play, Pause, Timer } from 'lucide-react';
import { getTickets, addEventToTicket, getTicketEvents, updateTimeLogs } from '../../services/mockDb';
import { generateWhatsAppLink } from '../../services/notifications';
import { compressImage } from '../../skills/imageUtils';

const INVENTORY_ITEMS = [
  { id: 'gasolina', label: 'Gasolina (>50%)' },
  { id: 'refaccion', label: 'Llanta Refacción' },
  { id: 'gato', label: 'Gato Hidráulico' },
  { id: 'herramienta', label: 'Herr. Básica' },
  { id: 'estereo', label: 'Estéreo / Pantalla' }
];

const PHOTO_SLOTS = [
  { id: 'frontal', label: 'Frontal' },
  { id: 'trasera', label: 'Trasera' },
  { id: 'lat_izq', label: 'Lateral Izq.' },
  { id: 'lat_der', label: 'Lateral Der.' },
  { id: 'odometro', label: 'Tablero/Odómetro' }
];

export default function TechnicianApp() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); 
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [mockTickets, setMockTickets] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  
  const [photos, setPhotos] = useState({});
  const [inventory, setInventory] = useState({});
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(true);
  
  const fileInputRef = useRef(null);
  const [activeSlot, setActiveSlot] = useState(null);

  useEffect(() => {
    let interval = null;
    if (step === 2 && isTimerActive) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [step, isTimerActive]);

  const formatTime = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return [
      hrs > 0 ? String(hrs).padStart(2, '0') : null,
      String(mins).padStart(2, '0'),
      String(secs).padStart(2, '0')
    ].filter(Boolean).join(':');
  };

  useEffect(() => {
    setMockTickets(getTickets());
  }, []);

  const handleSelectTicket = (ticket) => {
    setSelectedTicket(ticket);
    setPhotos({});
    setInventory(INVENTORY_ITEMS.reduce((acc, item) => ({...acc, [item.id]: false}), {}));
    setElapsedSeconds(0);
    setIsTimerActive(true);
    setStep(2);
  };

  const handleScanQR = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      if (mockTickets.length > 0) {
        handleSelectTicket(mockTickets[mockTickets.length - 1]);
      } else {
        alert('No hay vehículos registrados para escanear.');
      }
    }, 1500);
  };

  const handleSlotClick = (slotId) => {
    setActiveSlot(slotId);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleCapture = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeSlot) return;

    setIsCompressing(true);
    try {
      const compressedBase64 = await compressImage(file);
      setPhotos(prev => ({ ...prev, [activeSlot]: compressedBase64 }));
    } catch (error) {
      console.error("Error compressing image", error);
      alert("Error al procesar la imagen.");
    } finally {
      setIsCompressing(false);
      setActiveSlot(null);
    }
  };

  const toggleInventory = (id) => {
    setInventory(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSimulateUpload = () => {
    if (selectedTicket) {
      const currentEvents = getTicketEvents(selectedTicket.id);
      const nextEventId = currentEvents.length + 1;
      const firstAvailablePhoto = Object.values(photos)[0] || null;
      addEventToTicket(selectedTicket.id, Math.min(nextEventId, 5), firstAvailablePhoto);
      
      // Save elapsed seconds to timeLogs
      updateTimeLogs(selectedTicket.id, getNextStepName(), elapsedSeconds);
    }
    
    setStep(3);
    setTimeout(() => {
      setStep(1);
      setSelectedTicket(null);
      setMockTickets(getTickets());
    }, 4000);
  };

  const getNextStepName = () => {
    if (!selectedTicket) return '';
    const currentEvents = getTicketEvents(selectedTicket.id);
    const nextEventId = Math.min(currentEvents.length + 1, 5);
    
    const stages = selectedTicket.serviceType === 'Hojalatería y Pintura' 
      ? ['Recepción', 'Hojalatería', 'Pintura', 'Armado', 'Listo']
      : ['Recepción', 'Diagnóstico', 'Reparación', 'Pruebas', 'Listo'];
      
    return stages[nextEventId - 1];
  };

  const isUploadReady = Object.keys(photos).length > 0;

  return (
    <div className="relative min-h-screen flex flex-col text-white overflow-hidden selection:bg-accent-primary/30">
      <img 
        src="/assets/bg-internal.png" 
        className="full-screen-bg"
        alt="Tech Background"
      />
      <div className="bg-glow" />

      <main className="flex-1 p-4 md:p-6 flex flex-col relative z-10 max-w-lg mx-auto w-full">
        {step === 1 && (
          <div className="animate-fade-in flex flex-col h-full">
            <button 
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-accent-primary font-bold mb-8 hover:opacity-80 transition-opacity"
            >
              <Home size={24} /> INICIO
            </button>
            
            <h2 className="text-4xl font-black mb-8 tracking-tighter">ORDEN DE TRABAJO</h2>
            
            <button 
              onClick={handleScanQR} 
              className="relative overflow-hidden w-full aspect-square liquid-glass rounded-[3rem] mb-8 flex flex-col items-center justify-center gap-4 group active:scale-95 transition-transform shadow-ui"
            >
              <div className="p-8 rounded-full bg-accent-primary/20 group-hover:bg-accent-primary/30 transition-colors">
                <QrCode size={80} className="text-accent-primary" />
              </div>
              <span className="text-2xl font-black tracking-widest uppercase">
                {isScanning ? 'ESCANEANDO...' : 'ESCANEAR QR'}
              </span>
              {isScanning && (
                <div className="absolute inset-x-0 h-1 bg-accent-primary/50 shadow-[0_0_15px_rgba(0,242,255,0.8)] animate-[scan_1.5s_ease-in-out_infinite]" />
              )}
            </button>

            <style>{`
              @keyframes scan {
                0% { top: 0%; }
                100% { top: 100%; }
              }
            `}</style>

            <div className="text-center text-gray-500 font-bold tracking-widest mb-4">O SELECCIONA DE LA LISTA</div>
            
            <div className="space-y-4 pb-12">
              {mockTickets.map(t => (
                <button 
                  key={t.id} 
                  className="w-full card-morphism flex justify-between items-center group active:scale-95 text-left" 
                  onClick={() => handleSelectTicket(t)}
                >
                  <div>
                    <div className="text-2xl font-black text-accent-primary">{t.id}</div>
                    <div className="text-sm text-gray-400 font-bold">{t.vehicle}</div>
                  </div>
                  <ArrowRight className="text-gray-600 group-hover:text-accent-primary transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in flex flex-col h-full">
            <button 
              onClick={() => setStep(1)}
              className="flex items-center gap-2 text-gray-400 font-bold mb-4 hover:text-white transition-colors"
            >
              <ChevronLeft size={24} /> VOLVER
            </button>

            <div className="mb-6">
              <h2 className="text-4xl font-black text-accent-primary tracking-tighter">{selectedTicket?.id}</h2>
              <p className="text-lg text-gray-400 font-bold uppercase tracking-tight">{selectedTicket?.vehicle}</p>
            </div>

            {/* Cronómetro Card */}
            <div className="card-morphism !bg-white/5 border-white/10 p-5 flex items-center justify-between mb-6 shadow-ui">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${isTimerActive ? 'bg-accent-primary/20 text-accent-primary animate-pulse' : 'bg-white/5 text-gray-400'}`}>
                  <Timer size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Cronómetro de etapa ({getNextStepName()})</p>
                  <p className="text-3xl font-black font-mono tracking-tight text-white mt-0.5">
                    {formatTime(elapsedSeconds)}
                  </p>
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => setIsTimerActive(!isTimerActive)}
                className={`p-3.5 rounded-xl border font-bold transition-all ${isTimerActive ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20' : 'bg-accent-success/10 border-accent-success/20 text-accent-success hover:bg-accent-success/20'}`}
              >
                {isTimerActive ? <Pause size={18} /> : <Play size={18} />}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pb-24 space-y-8">
              
              {/* Photo Grid */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-black tracking-tight uppercase">Evidencia Visual</h3>
                  {isCompressing && <span className="text-xs text-accent-primary animate-pulse font-bold">Procesando...</span>}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {PHOTO_SLOTS.map(slot => (
                    <div 
                      key={slot.id}
                      onClick={() => !isCompressing && handleSlotClick(slot.id)}
                      className={`relative aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all overflow-hidden ${photos[slot.id] ? 'border-accent-primary border-solid' : 'border-dashed border-white/20 bg-white/5 hover:bg-white/10'}`}
                    >
                      {photos[slot.id] ? (
                        <>
                          <img src={photos[slot.id]} alt={slot.label} className="absolute inset-0 w-full h-full object-cover" />
                          <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1 text-center backdrop-blur-sm">
                            <span className="text-[10px] font-bold text-accent-primary uppercase truncate block px-1">{slot.label}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <Camera size={24} className="text-gray-500" />
                          <span className="text-xs font-bold text-gray-500 uppercase px-2 text-center leading-tight">{slot.label}</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* Binary Toggles Inventory */}
              <section className="card-morphism !bg-white/5 !border-white/10">
                <h3 className="text-xl font-black tracking-tight uppercase mb-4">Checklist Rápido</h3>
                <div className="space-y-1">
                  {INVENTORY_ITEMS.map(item => (
                    <div 
                      key={item.id} 
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => toggleInventory(item.id)}
                    >
                      <span className="font-bold text-gray-300 text-sm">{item.label}</span>
                      <div className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${inventory[item.id] ? 'bg-accent-success' : 'bg-gray-700'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${inventory[item.id] ? 'translate-x-7' : 'translate-x-1'}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

            </div>

            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleCapture} 
            />

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#050B14] via-[#050B14] to-transparent z-20">
              <button 
                className={`btn-premium w-full max-w-lg mx-auto py-5 text-xl font-black tracking-widest flex items-center justify-center gap-3 shadow-ui transition-all ${!isUploadReady ? 'opacity-50 cursor-not-allowed grayscale' : ''}`} 
                onClick={handleSimulateUpload}
                disabled={!isUploadReady || isCompressing}
              >
                <CheckCircle2 size={24} />
                {isUploadReady ? 'GUARDAR Y AVANZAR' : 'FALTAN FOTOS'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in flex-1 flex flex-col items-center justify-center text-center">
            <div className="p-12 rounded-full bg-accent-success/10 mb-8 animate-bounce">
              <CheckCircle2 size={120} className="text-accent-success" />
            </div>
            <h2 className="text-5xl font-black text-accent-success tracking-tighter mb-4">¡ÉXITO!</h2>
            <p className="text-xl text-gray-400 font-bold uppercase tracking-widest">Estado Actualizado</p>
            
            {selectedTicket?.phone && (
              <a 
                href={generateWhatsAppLink(
                  selectedTicket.phone, 
                  selectedTicket.client, 
                  selectedTicket.vehicle, 
                  getNextStepName(), 
                  selectedTicket.id
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 btn-premium bg-accent-success/20 border-accent-success text-accent-success py-4 px-8 flex items-center gap-3 animate-pulse"
              >
                <MessageSquare size={24} />
                NOTIFICAR POR WHATSAPP
              </a>
            )}
            
            <p className="text-gray-600 mt-6 font-medium">Redirigiendo al inicio...</p>
          </div>
        )}
      </main>
    </div>
  );
}
