import { useState, useEffect, useRef } from 'react';
import { Settings, Save, Upload, HelpCircle, RefreshCw, Check } from 'lucide-react';
import { compressImage } from '../../skills/imageUtils';
import { getSettings, saveSettings } from '../../services/api';

export default function SettingsPanel() {
  const [settings, setSettings] = useState({
    name: 'TallerPro',
    logo: '',
    phone: '526633040096',
    address: 'Av. de la Reforma 123, Ciudad de México',
    rfc: 'TPRO120409AA1',
    defaultIva: 16,
    maxBays: 10
  });

  const [isUploading, setIsUploading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [dbType, setDbType] = useState('Local File');
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    getSettings()
      .then(saved => {
        if (saved) {
          setSettings(prev => ({ ...prev, ...saved }));
          if (saved.dbType) {
            setDbType(saved.dbType);
          }
        }
      })
      .catch(console.error);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const compressed = await compressImage(file, 200, 0.8); // Smaller width for logo
      setSettings(prev => ({ ...prev, logo: compressed }));
    } catch (error) {
      console.error(error);
      alert('Error al cargar y procesar la imagen del logotipo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await saveSettings(settings);
      setIsSaved(true);
      
      // Dispatch a custom event to notify the rest of the application to reload settings (like Logo component)
      window.dispatchEvent(new Event('storage'));
      
      setTimeout(() => {
        setIsSaved(false);
        // Reload page to apply branding immediately throughout the app
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error(err);
      alert('Error al guardar la configuración');
    }
  };

  const handleReset = async () => {
    if (window.confirm('¿Seguro que deseas restaurar la marca predeterminada (TallerPro)?')) {
      const defaults = {
        name: 'TallerPro',
        logo: '',
        phone: '526633040096',
        address: 'Av. de la Reforma 123, Ciudad de México',
        rfc: 'TPRO120409AA1',
        defaultIva: 16,
        maxBays: 10
      };
      
      try {
        await saveSettings(defaults);
        setSettings(defaults);
        window.location.reload();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in-up">
      <div className="card-morphism !bg-[#0f1219] p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-accent-primary filter blur-3xl opacity-5 pointer-events-none -mr-10 -mt-10" />
        
        <header className="flex justify-between items-center mb-8 pb-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <Settings className="text-accent-primary" size={24} />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-white">Configuración del Negocio</h2>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${dbType === 'PostgreSQL' ? 'bg-accent-success/10 border-accent-success/20 text-accent-success' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                  DB: {dbType}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-bold uppercase mt-0.5">Personaliza tu marca y facturación</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs font-bold text-red-400 hover:text-red-300 transition-colors p-2 rounded-lg hover:bg-red-400/5"
            title="Restaurar valores de fábrica"
          >
            <RefreshCw size={14} />
            Restaurar
          </button>
        </header>

        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Logo Customization */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-white/5 rounded-2xl border border-white/5">
            <div 
              onClick={() => !isUploading && fileInputRef.current.click()}
              className="relative w-24 h-24 rounded-2xl border-2 border-dashed border-white/20 bg-black/30 hover:bg-black/50 flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden shrink-0 group"
            >
              {settings.logo ? (
                <>
                  <img src={settings.logo} alt="Logo Empresa" className="w-full h-full object-contain p-2" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Upload size={18} className="text-white" />
                  </div>
                </>
              ) : (
                <div className="text-center p-2 flex flex-col items-center gap-1.5">
                  <Upload size={20} className="text-gray-500 group-hover:text-accent-primary transition-colors" />
                  <span className="text-[9px] font-black text-gray-500 uppercase">Subir Logo</span>
                </div>
              )}
            </div>
            
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleLogoUpload} 
            />

            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-sm font-black text-white">Logotipo de la Empresa</h3>
              <p className="text-xs text-gray-500 font-medium max-w-sm">Recomendado formato PNG transparente cuadrado. Se actualizará en el Dashboard, cotizaciones, facturas e interfaz del cliente.</p>
              {isUploading && <span className="text-xs text-accent-primary animate-pulse font-bold block">Comprimiendo logotipo...</span>}
              {settings.logo && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSettings(prev => ({ ...prev, logo: '' }));
                  }}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-[10px] font-black uppercase text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all cursor-pointer"
                >
                  Quitar Logotipo
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {/* Nombre del Taller */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 ml-1 uppercase">Nombre Comercial del Taller</label>
              <input 
                name="name"
                type="text" 
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-accent-primary transition-colors text-sm font-semibold"
                placeholder="Ej. Taller Mecánico Especializado" 
                value={settings.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* RFC del Emisor */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 ml-1 uppercase">RFC de la Empresa (Emisor)</label>
                <input 
                  name="rfc"
                  type="text" 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-accent-primary transition-colors text-sm font-mono uppercase"
                  placeholder="Ej. MEST800101AA1" 
                  value={settings.rfc}
                  onChange={handleInputChange}
                />
              </div>
              
              {/* Teléfono Comercial */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 ml-1 uppercase">Teléfono Comercial (WhatsApp)</label>
                <input 
                  name="phone"
                  type="tel" 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-accent-primary transition-colors text-sm font-semibold"
                  placeholder="Ej. 521234567890" 
                  value={settings.phone}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Dirección */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 ml-1 uppercase">Dirección Física del Taller</label>
              <input 
                name="address"
                type="text" 
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-accent-primary transition-colors text-sm font-semibold"
                placeholder="Calle, Número, Colonia, C.P., Ciudad" 
                value={settings.address}
                onChange={handleInputChange}
              />
            </div>

            {/* IVA & Capacidad de Bahías */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* IVA Predeterminado */}
              <div className="space-y-1">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">Tasa de IVA Predeterminada</label>
                  <div className="group relative cursor-pointer text-gray-500 hover:text-white">
                    <HelpCircle size={14} />
                    <div className="absolute right-0 bottom-6 hidden group-hover:block bg-slate-900 border border-white/10 p-3 rounded-lg text-[10px] w-64 shadow-xl z-20 font-medium normal-case leading-relaxed">
                      Usa 16% para la mayor parte del país. Usa 8% si tu negocio está en la franja fronteriza norte o sur de México (Estímulo Fiscal Región Fronteriza).
                    </div>
                  </div>
                </div>
                <select 
                  name="defaultIva"
                  className="w-full bg-[#0d1117] border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-accent-primary transition-colors text-sm font-semibold"
                  value={settings.defaultIva}
                  onChange={(e) => setSettings(prev => ({ ...prev, defaultIva: parseInt(e.target.value) || 16 }))}
                >
                  <option value="16">16% (Nacional General)</option>
                  <option value="8">8% (Región Fronteriza Norte/Sur)</option>
                  <option value="0">0% (Tasa Cero / Exento)</option>
                </select>
              </div>

              {/* Capacidad de Bahías */}
              <div className="space-y-1">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">Capacidad de Bahías</label>
                  <div className="group relative cursor-pointer text-gray-500 hover:text-white">
                    <HelpCircle size={14} />
                    <div className="absolute right-0 bottom-6 hidden group-hover:block bg-slate-900 border border-white/10 p-3 rounded-lg text-[10px] w-64 shadow-xl z-20 font-medium normal-case leading-relaxed">
                      Número máximo de bahías de servicio activas simultáneamente. Se utiliza para calcular el porcentaje de ocupación en Analíticas.
                    </div>
                  </div>
                </div>
                <input 
                  name="maxBays"
                  type="number"
                  min="1"
                  max="100"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-accent-primary transition-colors text-sm font-semibold font-mono"
                  placeholder="Ej. 10"
                  value={settings.maxBays || 10}
                  onChange={(e) => setSettings(prev => ({ ...prev, maxBays: parseInt(e.target.value) || 10 }))}
                  required
                />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              className={`btn-premium w-full py-4 text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${isSaved ? '!bg-accent-success/20 !border-accent-success text-accent-success' : ''}`}
              disabled={isUploading}
            >
              {isSaved ? (
                <>
                  <Check className="stroke-[3]" size={18} />
                  ¡Configuración Guardada!
                </>
              ) : (
                <>
                  <Save size={18} />
                  Guardar Cambios de Marca
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}


