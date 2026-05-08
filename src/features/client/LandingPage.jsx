import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Zap, ArrowRight, Lock, CheckCircle2, Camera, MessageSquare, Smartphone, X } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../skills/security';
import Logo from '../../components/Logo';
import WhatsAppButton from '../../components/WhatsAppButton';

const pricingPlans = [
  { 
    name: 'Básico', 
    price: '$499/mes', 
    features: [
      'Órdenes ilimitadas (Mecánica y Carrocería)',
      'Módulo de Presupuestos',
      'Fotos de evidencia (5 max por orden)',
      'Soporte por email'
    ],
    limitations: [
      'Sin facturación electrónica'
    ]
  },
  { 
    name: 'TallerPro', 
    price: '$999/mes', 
    features: [
      'Todo lo del plan Básico, además:', 
      'Facturación Electrónica automatizada',
      'Módulo avanzado de Hojalatería (SVG)', 
      'Notificaciones automáticas (WhatsApp)', 
      'Fotos ilimitadas y Dashboard Analítico'
    ], 
    popular: true 
  },
  { 
    name: 'Multi-Taller', 
    price: 'Personalizado', 
    features: [
      'Todo lo del plan TallerPro, además:',
      'Gestión de múltiples sucursales', 
      'Reportes de rentabilidad avanzados', 
      'Soporte técnico prioritario 24/7', 
      'Integración vía API'
    ] 
  }
];

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

      {/* Navigation */}
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

      {/* 1. Hero Section */}
      <main className="container mx-auto px-6 pt-16 pb-20 relative z-10 text-center">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="inline-block px-4 py-1.5 rounded-full liquid-glass text-accent-primary font-medium text-sm mb-2 animate-fade-in-up">
            🚀 Nueva Versión 2.0 disponible
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-tight animate-fade-in-up [animation-delay:200ms]">
            La plataforma modular para gestionar tu taller <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary via-white to-accent-secondary">
              mecánico o de carrocería.
            </span>
          </h1>
          
          <p className="text-lg md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed animate-fade-in-up [animation-delay:400ms]">
            Digitaliza tus órdenes, protege tu negocio con registros fotográficos de entrada y aumenta la confianza de tus clientes con evidencia visual en tiempo real.
          </p>

          <div className="flex flex-col md:flex-row justify-center gap-6 pt-8 animate-fade-in-up [animation-delay:600ms]">
            <button 
              className="btn-premium text-lg group py-4 px-10 shadow-[0_0_40px_rgba(0,242,255,0.4)] hover:shadow-[0_0_60px_rgba(0,242,255,0.6)]" 
              onClick={() => user ? navigate('/dashboard') : setShowLogin(true)}
            >
              Comienza tu Prueba Gratis
              <ArrowRight className="inline-block ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Client Search Section */}
          <div className="pt-12 animate-fade-in-up [animation-delay:800ms]">
            <div className="liquid-glass max-w-xl mx-auto p-2 rounded-2xl flex items-center gap-2 border-white/20 shadow-ui group focus-within:border-accent-primary/50 transition-all">
              <input 
                type="text" 
                placeholder="Soy cliente: ID de Ticket (Ej: TKT-X821)"
                className="flex-1 bg-transparent border-none outline-none px-6 py-3 text-lg font-medium placeholder:text-gray-500 uppercase"
                value={ticketSearch}
                onChange={(e) => setTicketSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && ticketSearch && navigate(`/tracker/${ticketSearch.toUpperCase()}`)}
              />
              <button 
                onClick={() => ticketSearch && navigate(`/tracker/${ticketSearch.toUpperCase()}`)}
                className="bg-accent-primary text-black px-8 py-3 rounded-xl font-black text-sm tracking-widest hover:bg-white transition-all active:scale-95"
              >
                BUSCAR
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* 2. Product Showcase ("Foto y Click") */}
      <section className="relative z-10 py-20 bg-black/40 border-y border-white/5">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 animate-fade-in-up">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight">
                Operación <span className="text-accent-primary">"Foto y Click"</span>
              </h2>
              <p className="text-xl text-gray-400 leading-relaxed">
                Tus técnicos no tienen tiempo para llenar formularios extensos. Nuestra app móvil les permite documentar el estado del vehículo en segundos.
              </p>
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-accent-primary/20 text-accent-primary shrink-0"><Camera size={24} /></div>
                  <div>
                    <h4 className="text-xl font-bold mb-1">Cámara Nativa Optimizada</h4>
                    <p className="text-gray-500">Captura evidencia instantánea. Las fotos se comprimen automáticamente para no consumir tus datos.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-accent-secondary/20 text-accent-secondary shrink-0"><CheckCircle2 size={24} /></div>
                  <div>
                    <h4 className="text-xl font-bold mb-1">Inventario a un toque</h4>
                    <p className="text-gray-500">Switches rápidos para registrar gasolina, llanta de refacción y más. Sin teclear una sola palabra.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-accent-success/20 text-accent-success shrink-0"><MessageSquare size={24} /></div>
                  <div>
                    <h4 className="text-xl font-bold mb-1">Notificaciones WhatsApp</h4>
                    <p className="text-gray-500">Un botón envía el reporte visual directamente al cliente, aumentando la transparencia y confianza.</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="relative animate-fade-in-up [animation-delay:200ms] flex justify-center">
              <div className="relative w-full max-w-sm">
                <div className="absolute inset-0 bg-accent-primary/20 blur-[40px] rounded-full"></div>
                {/* Mockup Image */}
                <img 
                  src="/assets/app_mockup.png" 
                  loading="lazy"
                  alt="TallerPro Mobile App Interface" 
                  className="relative z-10 w-full h-auto shadow-[0_20px_50px_rgba(0,242,255,0.2)] rounded-3xl hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Seguridad Legal y Características */}
      <section className="container mx-auto px-6 py-32 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in-up">
          <h2 className="text-4xl md:text-5xl font-black mb-6">Blindaje <span className="text-accent-secondary">Digital</span> para tu Taller</h2>
          <p className="text-xl text-gray-400">Protege tu negocio de reclamos injustificados y profesionaliza tu imagen ante el cliente.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <div className="card-morphism group">
            <div className="p-4 rounded-2xl bg-accent-secondary/10 w-fit mb-6 group-hover:scale-110 transition-transform">
              <ShieldCheck className="text-accent-secondary" size={32} />
            </div>
            <h3 className="text-2xl font-bold mb-4">Protección Legal Total</h3>
            <p className="text-gray-400 leading-relaxed text-lg">
              El registro fotográfico obligatorio de recepción sella el estado inicial del vehículo. Se acabó el "ese rayón no lo traía".
            </p>
          </div>
          <div className="card-morphism group">
            <div className="p-4 rounded-2xl bg-accent-primary/10 w-fit mb-6 group-hover:scale-110 transition-transform">
              <Zap className="text-accent-primary" size={32} />
            </div>
            <h3 className="text-2xl font-bold mb-4">Módulos Especializados</h3>
            <p className="text-gray-400 leading-relaxed text-lg">
              Tanto si haces afinaciones como si reconstruyes carrocerías, el flujo se adapta. (Mapeo de piezas interactivo para hojalatería).
            </p>
          </div>
        </div>
      </section>

      {/* 4. Pricing Component */}
      <section className="relative z-10 py-20 bg-black/60 border-t border-white/5">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">Inversión Transparente</h2>
            <p className="text-xl text-gray-400">Escala tu negocio con la herramienta correcta.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
            {pricingPlans.map((plan, index) => (
              <div 
                key={index} 
                className={`card-morphism flex flex-col h-full ${plan.popular ? 'border-accent-primary shadow-[0_0_30px_rgba(0,242,255,0.15)] scale-105 z-10' : 'border-white/10 opacity-90'}`}
              >
                {plan.popular && (
                  <div className="bg-accent-primary text-black text-xs font-black uppercase tracking-widest py-1 px-4 rounded-full w-fit mx-auto -mt-10 mb-6">
                    MÁS POPULAR
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-2 text-center">{plan.name}</h3>
                <div className="text-4xl font-black text-center mb-8 text-white">
                  {plan.price}
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-gray-300">
                      <CheckCircle2 size={20} className="text-accent-primary shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                  {plan.limitations && plan.limitations.map((limit, i) => (
                    <li key={`lim-${i}`} className="flex items-start gap-3 text-gray-500">
                      <X size={20} className="text-red-500/50 shrink-0 mt-0.5" />
                      <span className="line-through">{limit}</span>
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-4 rounded-xl font-bold transition-all ${plan.popular ? 'bg-accent-primary text-black hover:bg-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                  Elegir Plan
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-fade-in">
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
