import { useState } from 'react';
import { Camera, Upload, CheckCircle2, ChevronLeft, QrCode } from 'lucide-react';

export default function TechnicianApp() {
  const [step, setStep] = useState(1); // 1: Select/Scan, 2: Camera/Upload, 3: Success
  const [selectedTicket, setSelectedTicket] = useState(null);

  const mockTickets = [
    { id: 'TKT-001', vehicle: 'Toyota Corolla 2020' },
    { id: 'TKT-002', vehicle: 'Honda Civic 2019' }
  ];

  const handleSelectTicket = (ticket) => {
    setSelectedTicket(ticket);
    setStep(2);
  };

  const handleSimulateUpload = () => {
    setStep(3);
    setTimeout(() => {
      setStep(1);
      setSelectedTicket(null);
    }, 3000);
  };

  return (
    <div className="tech-container">
      {step === 1 && (
        <div className="animate-fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '2rem', textAlign: 'center' }}>Seleccionar Vehículo</h2>
          
          <button className="big-btn" style={{ marginBottom: '2rem', height: '120px' }}>
            <QrCode size={48} />
            Escanear QR
          </button>

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
