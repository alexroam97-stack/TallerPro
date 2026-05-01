import { useNavigate } from 'react-router-dom';
import { Wrench, ShieldCheck, Zap, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="container" style={{ padding: '4rem 1rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4rem' }}>
        <h1 style={{ margin: 0, fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Wrench color="var(--accent-primary)" />
          TallerPro
        </h1>
        <button 
          className="big-btn" 
          style={{ width: 'auto', padding: '0.75rem 1.5rem', fontSize: '1rem' }}
          onClick={() => navigate('/dashboard')}
        >
          Acceso Talleres
        </button>
      </header>

      <main style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '3.5rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, #fff 0%, #a0aabf 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Transparencia Total.<br />Clientes Felices.
        </h2>
        <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '3rem', lineHeight: '1.8' }}>
          La plataforma SaaS para talleres mecánicos que elimina la fricción.
          Tus técnicos suben fotos en segundos, tus clientes ven el progreso en tiempo real.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '5rem' }}>
          <button className="big-btn" style={{ width: 'auto' }} onClick={() => navigate('/dashboard')}>
            Probar Dashboard
            <ArrowRight size={20} />
          </button>
          <button className="big-btn secondary" style={{ width: 'auto' }} onClick={() => navigate('/tech')}>
            Ver App del Técnico
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', textAlign: 'left' }}>
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <Zap color="var(--accent-primary)" size={32} style={{ marginBottom: '1rem' }} />
            <h3>Fricción Cero</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Interfaz "Dirty Hands" diseñada para que el técnico no pierda tiempo.</p>
          </div>
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <ShieldCheck color="var(--success)" size={32} style={{ marginBottom: '1rem' }} />
            <h3>Confianza Absoluta</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>El cliente ve fotos reales del proceso. Adiós a las dudas y quejas.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
