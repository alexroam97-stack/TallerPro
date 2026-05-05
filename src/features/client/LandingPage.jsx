import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Zap, ArrowRight, Lock } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../skills/security';
import Logo from '../../components/Logo';
import WhatsAppButton from '../../components/WhatsAppButton';

export default function LandingPage() {
  const navigate = useNavigate();
  const { loginWithGoogle, user } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [ticketSearch, setTicketSearch] = useState('');

  const handleGoogleSuccess = (credentialResponse) => {
    if (loginWithGoogle(credentialResponse)) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden selection:bg-accent-primary/30">
      <img 
        src="/assets/bg-landing.png" 
        className="full-screen-bg"
        alt="Workshop Background"
      />
      <div className="bg-glow" />

      <nav className="container mx-auto px-6 py-8 flex justify-between items-center relative z-10 animate-fade-in-up">
        <Logo size="md" />
        <div className="flex items-center gap-4">
          {user ? (
            <button className="btn-premium flex items-center gap-2" onClick={() => navigate('/dashboard')}>
              Panel de Control
              <ArrowRight size={18} />
            </button>
          ) : (
            <button 
              className="btn-premium"
              onClick={() => setShowLogin(true)}
            >
              Acceso Staff
            </button>
          )}
        </div>
      </nav>

      <main className="container mx-auto px-6 pt-20 pb-32 relative z-10 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="inline-block px-4 py-1.5 rounded-full liquid-glass text-accent-primary font-medium text-sm mb-4 animate-fade-in-up">
            🚀 Nueva Versión 2.0 disponible
          </div>
          
          <h2 className="text-6xl md:text-8xl font-black tracking-tighter leading-none animate-fade-in-up [animation-delay:200ms]">
            TRANSPARENCIA <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary via-white to-accent-secondary">
              SIN LÍMITES.
            </span>
          </h2>
          
          <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto leading-relaxed animate-fade-in-up [animation-delay:400ms]">
            La plataforma de gestión para talleres que redefine la confianza. 
            Técnicos conectados, clientes informados y operaciones optimizadas.
          </p>

          <div className="flex flex-col md:flex-row justify-center gap-6 pt-8 animate-fade-in-up [animation-delay:600ms]">
            <button className="btn-premium text-lg group" onClick={() => navigate('/dashboard')}>
              Comenzar Ahora
              <ArrowRight className="inline-block ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              className="btn-secondary text-lg" 
              onClick={() => user ? navigate('/tech') : setShowLogin(true)}
            >
              App del Técnico
            </button>
          </div>

          {/* Client Search Section */}
          <div className="pt-16 animate-fade-in-up [animation-delay:800ms]">
            <div className="liquid-glass max-w-xl mx-auto p-2 rounded-2xl flex items-center gap-2 border-white/20 shadow-ui group focus-within:border-accent-primary/50 transition-all">
              <input 
                type="text" 
                placeholder="ID de tu Ticket (Ej: TKT-X821)"
                className="flex-1 bg-transparent border-none outline-none px-6 py-3 text-lg font-medium placeholder:text-gray-500 uppercase"
                value={ticketSearch}
                onChange={(e) => setTicketSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && ticketSearch && navigate(`/tracker/${ticketSearch.toUpperCase()}`)}
              />
              <button 
                onClick={() => ticketSearch && navigate(`/tracker/${ticketSearch.toUpperCase()}`)}
                className="bg-accent-primary text-black px-8 py-3 rounded-xl font-black text-sm tracking-widest hover:bg-white transition-all active:scale-95"
              >
                CONSULTAR ESTATUS
              </button>
            </div>
            <p className="text-gray-500 text-sm mt-4 font-medium italic">¿No tienes tu ID? Solicítalo a tu asesor por WhatsApp.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mt-32 animate-fade-in-up [animation-delay:800ms]">
          <div className="card-morphism group">
            <div className="p-4 rounded-2xl bg-accent-primary/10 w-fit mb-6 group-hover:scale-110 transition-transform">
              <Zap className="text-accent-primary" size={32} />
            </div>
            <h3 className="text-2xl font-bold mb-4">Eficiencia Radical</h3>
            <p className="text-gray-400 leading-relaxed text-lg">
              Optimiza el flujo de trabajo con una interfaz diseñada para mecánicos. 
              Menos clics, más reparaciones.
            </p>
          </div>

          <div className="card-morphism group">
            <div className="p-4 rounded-2xl bg-accent-success/10 w-fit mb-6 group-hover:scale-110 transition-transform">
              <ShieldCheck className="text-accent-success" size={32} />
            </div>
            <h3 className="text-2xl font-bold mb-4">Confianza Blindada</h3>
            <p className="text-gray-400 leading-relaxed text-lg">
              Evidencia visual en tiempo real para cada etapa del proceso. 
              Gana la lealtad absoluta de tus clientes.
            </p>
          </div>
        </div>
      </main>

      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="liquid-glass p-12 rounded-[2.5rem] w-full max-w-md text-center shadow-ui border-white/20 animate-fade-in-up">
            <div className="p-5 rounded-full bg-accent-primary/20 w-fit mx-auto mb-8">
              <Lock className="text-accent-primary" size={40} />
            </div>
            <h3 className="text-3xl font-black mb-4">Ingreso Staff</h3>
            <p className="text-gray-400 mb-10 text-lg">Accede a tu cuenta corporativa para gestionar el taller.</p>
            
            <div className="flex flex-col items-center gap-4 mb-8">
              {(!import.meta.env.VITE_GOOGLE_CLIENT_ID || import.meta.env.VITE_GOOGLE_CLIENT_ID.includes('your-client-id')) ? (
                <button 
                  className="btn-premium w-full py-4"
                  onClick={() => handleGoogleSuccess({ credential: 'fake_jwt_for_demo' })}
                >
                  Demo Login (Admin)
                </button>
              ) : (
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => console.log('Login Failed')}
                  theme="filled_black"
                  shape="pill"
                  size="large"
                />
              )}
            </div>

            <button 
              className="text-gray-500 hover:text-white transition-colors font-medium"
              onClick={() => setShowLogin(false)}
            >
              Cerrar Ventana
            </button>
          </div>
        </div>
      )}

      <WhatsAppButton />
    </div>
  );
}
