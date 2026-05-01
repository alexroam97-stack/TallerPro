import { useState, useEffect } from 'react';
import { Camera, Upload, CheckCircle2, ChevronLeft, QrCode } from 'lucide-react';
import { getTickets, addEventToTicket, getTicketEvents } from '../services/mockDb';

export default function TechnicianApp() {
  const [step, setStep] = useState(1); // 1: Select/Scan, 2: Camera/Upload, 3: Success
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [mockTickets, setMockTickets] = useState([]);
  const [isScanning, setIsScanning] = useState(false);

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
        // Pick the most recent ticket
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
      addEventToTicket(selectedTicket.id, Math.min(nextEventId, 5));
    }
    
    setStep(3);
    setTimeout(() => {
      setStep(1);
      setSelectedTicket(null);
      // Refresh tickets
      setMockTickets(getTickets());
    }, 3000);
  };

  return (
    <div className="tech-container">
      {step === 1 && (
        <div className="animate-fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '2rem', textAlign: 'center' }}>Seleccionar Vehículo</h2>
          
          <button onClick={handleScanQR} className="big-btn" style={{ marginBottom: '2rem', height: '120px', position: 'relative', overflow: 'hidden' }}>
            <QrCode size={48} />
            {isScanning ? 'Escaneando...' : 'Escanear QR'}
            {isScanning && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: 'white', opacity: 0.5, animation: 'scan 1.5s ease-in-out infinite' }} />
            )}
          </button>

          <style>{`
            @keyframes scan {
              0% { transform: translateY(0); }
              50% { transform: translateY(116px); }
              100% { transform: translateY(0); }
            }
          `}</style>

          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1rem' }}>O selecciona de la lista:</div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {mockTickets.map(t => (
              <button 
                key={t.id} 
                className="big-btn secondary" 
                onClick={() => handleSelectTicket(t)}
                style={{ justifyContent: 'flex-start', padding: '1.5rem' }}
              >
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>{t.id}</div>
                  <div style={{ fontSize: '1rem', fontWeight: '400', color: 'var(--text-secondary)' }}>{t.vehicle}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="animate-fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <button 
            onClick={() => setStep(1)}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem', marginBottom: '2rem', cursor: 'pointer', padding: '1rem 0' }}
          >
            <ChevronLeft size={24} /> Volver
          </button>

          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{selectedTicket?.id}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', marginBottom: '2rem' }}>{selectedTicket?.vehicle}</p>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '2rem' }}>
            {/* The area is big so it's easy to press */}
            <div 
              style={{ 
                height: '300px', 
                backgroundColor: 'var(--bg-tertiary)', 
                borderRadius: '1rem', 
                border: '2px dashed var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)'
              }}
            >
              <Camera size={64} style={{ marginBottom: '1rem' }} />
              <span style={{ fontSize: '1.5rem', fontWeight: '600' }}>Tocar para Capturar</span>
            </div>

            <button className="big-btn success" onClick={handleSimulateUpload} style={{ height: '80px' }}>
              <Upload size={32} />
              Subir Evidencia
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="animate-fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <CheckCircle2 size={120} color="var(--success)" style={{ marginBottom: '2rem' }} />
          <h2 style={{ fontSize: '2.5rem', textAlign: 'center', color: 'var(--success)' }}>¡Foto Subida!</h2>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '1rem' }}>El cliente ha sido notificado.</p>
        </div>
      )}
    </div>
  );
}
