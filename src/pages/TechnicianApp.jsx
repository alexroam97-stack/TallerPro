import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, CheckCircle2, ChevronLeft, QrCode, Home, ArrowRight } from 'lucide-react';
import { getTickets, addEventToTicket, getTicketEvents } from '../services/mockDb';

export default function TechnicianApp() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); 
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [mockTickets, setMockTickets] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [photoBase64, setPhotoBase64] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setMockTickets(getTickets());
  }, []);

  const handleSelectTicket = (ticket) => {
    setSelectedTicket(ticket);
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

  const handleSimulateUpload = () => {
    if (selectedTicket) {
      const currentEvents = getTicketEvents(selectedTicket.id);
      const nextEventId = currentEvents.length + 1;
      addEventToTicket(selectedTicket.id, Math.min(nextEventId, 5), photoBase64);
    }
    
    setStep(3);
    setTimeout(() => {
      setStep(1);
      setSelectedTicket(null);
      setPhotoBase64(null);
      setMockTickets(getTickets());
    }, 3000);
  };

  const handleCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col text-white overflow-hidden selection:bg-accent-primary/30">
      {/* Background */}
      <img 
        src="/assets/bg-internal.png" 
        className="full-screen-bg"
        alt="Tech Background"
      />
      <div className="bg-glow" />

      <main className="flex-1 p-6 flex flex-col relative z-10 max-w-lg mx-auto w-full">
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
              className="relative overflow-hidden w-full aspect-square liquid-glass rounded-[3rem] mb-12 flex flex-col items-center justify-center gap-4 group active:scale-95 transition-transform shadow-ui"
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

            <div className="text-center text-gray-500 font-bold tracking-widest mb-6">O SELECCIONA DE LA LISTA</div>
            
            <div className="space-y-4 pb-12">
              {mockTickets.map(t => (
                <button 
                  key={t.id} 
                  className="w-full card-morphism flex justify-between items-center group active:scale-95" 
                  onClick={() => handleSelectTicket(t)}
                >
                  <div className="text-left">
                    <div className="text-2xl font-black text-accent-primary">{t.id}</div>
                    <div className="text-lg text-gray-400 font-bold">{t.vehicle}</div>
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
              className="flex items-center gap-2 text-gray-400 font-bold mb-8 hover:text-white transition-colors"
            >
              <ChevronLeft size={24} /> VOLVER
            </button>

            <div className="mb-8">
              <h2 className="text-5xl font-black text-accent-primary tracking-tighter">{selectedTicket?.id}</h2>
              <p className="text-xl text-gray-400 font-bold uppercase tracking-tight">{selectedTicket?.vehicle}</p>
            </div>

            <div className="flex-1 flex flex-col gap-8">
              <div 
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                className="flex-1 liquid-glass rounded-[3rem] border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-4 text-gray-500 hover:border-accent-primary/50 hover:bg-white/5 transition-all cursor-pointer group shadow-ui relative overflow-hidden"
              >
                {photoBase64 ? (
                  <img src={photoBase64} alt="Evidencia" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <>
                    <div className="p-10 rounded-full bg-white/5 group-hover:bg-accent-primary/10 transition-colors">
                      <Camera size={100} className="group-hover:text-accent-primary transition-colors" />
                    </div>
                    <span className="text-xl font-black tracking-widest uppercase">CAPTURA DE EVIDENCIA</span>
                  </>
                )}
              </div>

              <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleCapture} 
              />

              <button 
                className={`btn-premium py-8 text-2xl font-black tracking-widest flex items-center justify-center gap-4 shadow-ui transition-all ${!photoBase64 ? 'opacity-50 cursor-not-allowed grayscale' : ''}`} 
                onClick={handleSimulateUpload}
                disabled={!photoBase64}
              >
                <Upload size={32} />
                {photoBase64 ? 'SUBIR ESTADO' : 'TOMA UNA FOTO'}
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
            <p className="text-gray-600 mt-2">El cliente ha sido notificado automáticamente.</p>
          </div>
        )}
      </main>
    </div>
  );
}

