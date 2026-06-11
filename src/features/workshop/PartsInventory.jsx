import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Check, X, AlertTriangle, Camera, Package, Trash2, ClipboardCheck, FileText, CheckCircle2 } from 'lucide-react';
import { getParts, addPart, updatePart, deletePart, getTickets } from '../../services/mockDb';
import { compressImage } from '../../skills/imageUtils';

export default function PartsInventory() {
  const [parts, setParts] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, approved, rejected
  
  // Modales
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isQCModalOpen, setIsQCModalOpen] = useState(false);
  
  // State para agregar pieza
  const [newPart, setNewPart] = useState({
    name: '',
    brand: '',
    qty: 1,
    vehicleCompatibility: '',
    ticketId: '',
    status: 'pending',
    qcNotes: '',
    photo: '',
    cost: 0,
    salePrice: 0
  });
  
  // State para inspección de calidad
  const [selectedPart, setSelectedPart] = useState(null);
  const [qcChecked, setQcChecked] = useState({
    visual: false,
    packaging: false,
    compatibility: false,
    functional: false
  });
  const [qcStatus, setQcStatus] = useState('pending');
  const [qcNotes, setQcNotes] = useState('');
  const [qcPhoto, setQcPhoto] = useState('');
  const [inspectedBy, setInspectedBy] = useState('Técnico Principal');
  const [qcTicketId, setQcTicketId] = useState('');
  const [qcVehicleCompatibility, setQcVehicleCompatibility] = useState('');
  const [qcCost, setQcCost] = useState(0);
  const [qcSalePrice, setQcSalePrice] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    getParts().then(allParts => setParts(allParts)).catch(console.error);
    getTickets().then(allTix => setTickets(allTix.filter(t => t.status !== 'Entrega'))).catch(console.error);
  }, []);

  const refreshData = async () => {
    try {
      const allParts = await getParts();
      setParts(allParts);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreatePart = async (e) => {
    e.preventDefault();
    if (!newPart.name) return;
    
    try {
      await addPart({
        ...newPart,
        qcChecked: { visual: false, packaging: false, compatibility: false, functional: false },
        inspectedBy: '',
        inspectedAt: ''
      });
      
      setIsAddModalOpen(false);
      setNewPart({
        name: '',
        brand: '',
        qty: 1,
        vehicleCompatibility: '',
        ticketId: '',
        status: 'pending',
        qcNotes: '',
        photo: '',
        cost: 0,
        salePrice: 0
      });
      await refreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePart = async (id) => {
    if (window.confirm('¿Seguro que deseas eliminar esta pieza del inventario?')) {
      try {
        await deletePart(id);
        await refreshData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleOpenQC = (part) => {
    setSelectedPart(part);
    setQcChecked(part.qcChecked || { visual: false, packaging: false, compatibility: false, functional: false });
    setQcStatus(part.status || 'pending');
    setQcNotes(part.qcNotes || '');
    setQcPhoto(part.photo || '');
    setInspectedBy(part.inspectedBy || 'Técnico Principal');
    setQcTicketId(part.ticketId || '');
    setQcVehicleCompatibility(part.vehicleCompatibility || '');
    setQcCost(part.cost || 0);
    setQcSalePrice(part.salePrice || 0);
    setIsQCModalOpen(true);
  };

  const handleQCCheckboxChange = (key) => {
    setQcChecked(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      const allChecked = Object.values(updated).every(v => v === true);
      if (allChecked) {
        setQcStatus('approved');
      }
      return updated;
    });
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      const compressed = await compressImage(file);
      setQcPhoto(compressed);
    } catch (error) {
      console.error(error);
      alert('Error al procesar la imagen');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveQC = async () => {
    if (qcStatus === 'rejected' && !qcNotes.trim()) {
      alert('Por favor, ingresa una nota explicando el motivo del rechazo en el control de calidad.');
      return;
    }

    try {
      await updatePart(selectedPart.id, {
        status: qcStatus,
        qcNotes,
        photo: qcPhoto,
        qcChecked,
        inspectedBy,
        inspectedAt: new Date().toISOString(),
        ticketId: qcTicketId,
        vehicleCompatibility: qcVehicleCompatibility,
        cost: qcCost,
        salePrice: qcSalePrice
      });

      setIsQCModalOpen(false);
      setSelectedPart(null);
      await refreshData();
    } catch (err) {
      console.error(err);
    }
  };

  // Calcular score de calidad
  const calculateQCScore = (checked) => {
    const total = Object.keys(checked).length;
    const active = Object.values(checked).filter(Boolean).length;
    return Math.round((active / total) * 100);
  };

  const filteredParts = parts.filter(part => {
    const matchesSearch = 
      part.name.toLowerCase().includes(search.toLowerCase()) || 
      part.brand.toLowerCase().includes(search.toLowerCase()) ||
      part.ticketId.toLowerCase().includes(search.toLowerCase()) ||
      part.vehicleCompatibility.toLowerCase().includes(search.toLowerCase());
      
    const matchesStatus = statusFilter === 'all' ? true : part.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Barra de Búsqueda y Filtros */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text"
            placeholder="Buscar refacción, marca, auto o ticket..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent-primary transition-colors text-sm font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button 
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all shrink-0 ${statusFilter === 'all' ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-transparent text-gray-400 hover:text-white'}`}
          >
            Todos
          </button>
          <button 
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all shrink-0 ${statusFilter === 'pending' ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' : 'bg-transparent border-transparent text-gray-400 hover:text-white'}`}
          >
            Pendientes
          </button>
          <button 
            onClick={() => setStatusFilter('approved')}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all shrink-0 ${statusFilter === 'approved' ? 'bg-accent-success/20 border-accent-success/30 text-accent-success' : 'bg-transparent border-transparent text-gray-400 hover:text-white'}`}
          >
            Aprobados QC
          </button>
          <button 
            onClick={() => setStatusFilter('rejected')}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all shrink-0 ${statusFilter === 'rejected' ? 'bg-red-500/20 border-red-500/30 text-red-400' : 'bg-transparent border-transparent text-gray-400 hover:text-white'}`}
          >
            Rechazados QC
          </button>
          
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="btn-premium flex items-center gap-2 py-2 px-4 text-xs font-bold ml-auto shrink-0 shadow-ui"
          >
            <Plus size={16} />
            Agregar Pieza
          </button>
        </div>
      </div>

      {/* Grid de Piezas */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filteredParts.length > 0 ? (
          filteredParts.map(part => {
            const score = calculateQCScore(part.qcChecked || {});
            return (
              <div 
                key={part.id} 
                className="card-morphism relative overflow-hidden flex flex-col justify-between group !p-6"
              >
                {/* Glow decorativo según estatus */}
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full filter blur-3xl opacity-10 pointer-events-none -mr-12 -mt-12 transition-colors duration-500
                  ${part.status === 'approved' ? 'bg-accent-success' : part.status === 'rejected' ? 'bg-red-500' : 'bg-amber-500'}`} 
                />

                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-[10px] font-black tracking-widest text-accent-primary uppercase">{part.id}</span>
                      <h3 className="text-xl font-black tracking-tight text-white mt-1 group-hover:text-accent-primary transition-colors">{part.name}</h3>
                      <p className="text-xs text-gray-400 font-bold uppercase mt-0.5">{part.brand}</p>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider
                      ${part.status === 'approved' ? 'bg-accent-success/10 border-accent-success/20 text-accent-success' : 
                        part.status === 'rejected' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 
                        'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}
                    >
                      {part.status === 'approved' ? 'APROBADO QC' : part.status === 'rejected' ? 'RECHAZADO QC' : 'PENDIENTE QC'}
                    </span>
                  </div>

                  {/* Detalles técnicos */}
                  <div className="grid grid-cols-2 gap-4 py-3 border-y border-white/5 text-sm mb-4">
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Compatibilidad</p>
                      <p className="font-bold text-gray-300 truncate">{part.vehicleCompatibility || 'Universal'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Orden Vinculada</p>
                      <p className="font-bold text-accent-primary truncate">
                        {tickets.find(t => t.id === part.ticketId) 
                          ? `${part.ticketId} - ${tickets.find(t => t.id === part.ticketId).client}` 
                          : (part.ticketId || 'Sin vincular')}
                      </p>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-white/5 grid grid-cols-3 gap-2">
                      <div>
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Costo</p>
                        <p className="font-bold text-gray-300">${(part.cost || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">P. Venta</p>
                        <p className="font-bold text-accent-primary">${(part.salePrice || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Margen</p>
                        <p className="font-bold text-accent-success">
                          {part.salePrice > 0 
                            ? `${Math.round(((part.salePrice - part.cost) / part.salePrice) * 100)}%` 
                            : '0%'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Calidad Checklist y Score */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-xs font-bold text-gray-400">
                      <span>Control de Calidad:</span>
                      <span className={part.status === 'approved' ? 'text-accent-success' : part.status === 'rejected' ? 'text-red-400' : 'text-amber-400'}>
                        {score}% Completado
                      </span>
                    </div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-700 rounded-full
                          ${part.status === 'approved' ? 'bg-accent-success' : part.status === 'rejected' ? 'bg-red-500' : 'bg-amber-500'}`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>

                  {/* Notas cortas */}
                  {part.qcNotes && (
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs text-gray-400 font-medium mb-4 italic flex gap-2 items-start">
                      <FileText size={14} className="shrink-0 text-accent-primary mt-0.5" />
                      <span className="line-clamp-2">{part.qcNotes}</span>
                    </div>
                  )}

                  {part.photo && (
                    <div className="flex items-center gap-2 text-xs font-bold text-accent-success mb-4">
                      <CheckCircle2 size={14} />
                      Foto de arribo adjunta
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex justify-between items-center pt-2 mt-auto border-t border-white/5">
                  <div className="text-xs text-gray-500 font-bold">CANTIDAD: {part.qty} pza(s)</div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleOpenQC(part)}
                      className="liquid-glass border border-white/10 hover:border-accent-primary/50 text-accent-primary hover:text-white px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5"
                    >
                      <ClipboardCheck size={14} />
                      CONTROL DE CALIDAD
                    </button>
                    <button 
                      onClick={() => handleDeletePart(part.id)}
                      className="p-2 rounded-xl border border-white/10 hover:border-red-500/50 hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-all"
                      title="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full card-morphism text-center py-12 flex flex-col items-center justify-center gap-4">
            <Package size={48} className="text-gray-600 animate-pulse" />
            <div>
              <p className="text-xl font-black text-gray-400">Sin autopartes registradas</p>
              <p className="text-sm text-gray-500 mt-1 font-medium">No se encontraron piezas que coincidan con la búsqueda o filtro.</p>
            </div>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="btn-premium py-2 px-6 text-sm"
            >
              Registrar Primera Pieza
            </button>
          </div>
        )}
      </div>

      {/* Modal Agregar Pieza */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="liquid-glass p-10 rounded-[2.5rem] w-full max-w-lg shadow-ui border-white/20 animate-fade-in-up">
            <header className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black flex items-center gap-2">
                <Package className="text-accent-primary" />
                Registrar Refacción / Pieza
              </h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                <X size={24} />
              </button>
            </header>
            
            <form onSubmit={handleCreatePart} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 ml-1 uppercase">Nombre de la refacción</label>
                <input 
                  type="text" 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-accent-primary transition-colors text-sm font-semibold"
                  placeholder="Ej. Balatas Delanteras, Soporte de Motor, etc." 
                  value={newPart.name}
                  onChange={(e) => setNewPart({...newPart, name: e.target.value})}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 ml-1 uppercase">Marca / Distribuidor</label>
                  <input 
                    type="text" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-accent-primary transition-colors text-sm font-semibold"
                    placeholder="Ej. Bosch, ACDelco" 
                    value={newPart.brand}
                    onChange={(e) => setNewPart({...newPart, brand: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 ml-1 uppercase">Cantidad</label>
                  <input 
                    type="number" 
                    min="1"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-accent-primary transition-colors text-sm font-semibold"
                    value={newPart.qty}
                    onChange={(e) => setNewPart({...newPart, qty: parseInt(e.target.value) || 1})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 ml-1 uppercase">Costo de Compra ($)</label>
                  <input 
                    type="number" 
                    min="0"
                    step="0.01"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-accent-primary transition-colors text-sm font-semibold"
                    placeholder="0.00"
                    value={newPart.cost || ''}
                    onChange={(e) => setNewPart({...newPart, cost: parseFloat(e.target.value) || 0})}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 ml-1 uppercase">Precio de Venta ($)</label>
                  <input 
                    type="number" 
                    min="0"
                    step="0.01"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-accent-primary transition-colors text-sm font-semibold"
                    placeholder="0.00"
                    value={newPart.salePrice || ''}
                    onChange={(e) => setNewPart({...newPart, salePrice: parseFloat(e.target.value) || 0})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 ml-1 uppercase">Compatibilidad de Vehículo</label>
                <input 
                  type="text" 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-accent-primary transition-colors text-sm font-semibold"
                  placeholder="Ej. Toyota Corolla 2020 (o dejar en blanco si es genérico)" 
                  value={newPart.vehicleCompatibility}
                  onChange={(e) => setNewPart({...newPart, vehicleCompatibility: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 ml-1 uppercase">Vincular a Orden Activa (Ticket)</label>
                <select 
                  className="w-full bg-[#0d1117] border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-accent-primary transition-colors text-sm font-semibold"
                  value={newPart.ticketId}
                  onChange={(e) => {
                    const ticket = tickets.find(t => t.id === e.target.value);
                    setNewPart({
                      ...newPart, 
                      ticketId: e.target.value,
                      vehicleCompatibility: ticket ? ticket.vehicle : newPart.vehicleCompatibility
                    });
                  }}
                >
                  <option value="">-- No vincular a ticket (inventario general) --</option>
                  {tickets.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.id} - {t.client} ({t.vehicle})
                    </option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn-premium w-full py-4 text-sm font-black mt-4 uppercase tracking-wider">
                Registrar e Ingresar a Inventario
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Control de Calidad Superior */}
      {isQCModalOpen && selectedPart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="liquid-glass p-8 md:p-10 rounded-[2.5rem] w-full max-w-2xl shadow-ui border-white/20 animate-fade-in-up my-8">
            <header className="flex justify-between items-center mb-6">
              <div>
                <span className="text-[10px] font-black tracking-widest text-accent-primary uppercase">Inspección de Arribo</span>
                <h2 className="text-2xl font-black text-white">{selectedPart.name}</h2>
                <p className="text-xs text-gray-400 font-bold uppercase">{selectedPart.brand} &bull; Cantidad: {selectedPart.qty}</p>
              </div>
              <button 
                onClick={() => {
                  setIsQCModalOpen(false);
                  setSelectedPart(null);
                }} 
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X size={24} />
              </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Lado izquierdo: Checklist */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-2">Checklist de Calidad de 4 Puntos</h3>
                
                {/* Visual */}
                <div 
                  onClick={() => handleQCCheckboxChange('visual')}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex gap-3 items-start ${qcChecked.visual ? 'bg-accent-success/5 border-accent-success/30 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                >
                  <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center border transition-all ${qcChecked.visual ? 'bg-accent-success border-accent-success text-black' : 'border-white/20'}`}>
                    {qcChecked.visual && <Check size={14} className="stroke-[3]" />}
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${qcChecked.visual ? 'text-accent-success' : 'text-gray-300'}`}>1. Inspección Estética</p>
                    <p className="text-[10px] text-gray-500 leading-snug mt-0.5">La refacción no presenta golpes, dobladuras, rayaduras graves o defectos físicos.</p>
                  </div>
                </div>

                {/* Empaque */}
                <div 
                  onClick={() => handleQCCheckboxChange('packaging')}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex gap-3 items-start ${qcChecked.packaging ? 'bg-accent-success/5 border-accent-success/30 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                >
                  <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center border transition-all ${qcChecked.packaging ? 'bg-accent-success border-accent-success text-black' : 'border-white/20'}`}>
                    {qcChecked.packaging && <Check size={14} className="stroke-[3]" />}
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${qcChecked.packaging ? 'text-accent-success' : 'text-gray-300'}`}>2. Sellos y Empaque</p>
                    <p className="text-[10px] text-gray-500 leading-snug mt-0.5">Caja original intacta, sellos de seguridad cerrados y sin marcas de humedad.</p>
                  </div>
                </div>

                {/* Compatibilidad */}
                <div 
                  onClick={() => handleQCCheckboxChange('compatibility')}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex gap-3 items-start ${qcChecked.compatibility ? 'bg-accent-success/5 border-accent-success/30 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                >
                  <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center border transition-all ${qcChecked.compatibility ? 'bg-accent-success border-accent-success text-black' : 'border-white/20'}`}>
                    {qcChecked.compatibility && <Check size={14} className="stroke-[3]" />}
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${qcChecked.compatibility ? 'text-accent-success' : 'text-gray-300'}`}>3. Número de Parte y Modelo</p>
                    <p className="text-[10px] text-gray-500 leading-snug mt-0.5">El número de parte coincide al 100% con la orden y la ficha técnica del vehículo.</p>
                  </div>
                </div>

                {/* Funcional */}
                <div 
                  onClick={() => handleQCCheckboxChange('functional')}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex gap-3 items-start ${qcChecked.functional ? 'bg-accent-success/5 border-accent-success/30 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                >
                  <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center border transition-all ${qcChecked.functional ? 'bg-accent-success border-accent-success text-black' : 'border-white/20'}`}>
                    {qcChecked.functional && <Check size={14} className="stroke-[3]" />}
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${qcChecked.functional ? 'text-accent-success' : 'text-gray-300'}`}>4. Integridad de Conectores/Móviles</p>
                    <p className="text-[10px] text-gray-500 leading-snug mt-0.5">Los pines, terminales o partes articuladas se mueven libremente y sin holguras críticas.</p>
                  </div>
                </div>
              </div>

              {/* Lado derecho: Notas, fotos y Estatus */}
              <div className="space-y-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-2">Evidencia Fotográfica</h3>
                  
                  <div 
                    onClick={() => !isUploading && fileInputRef.current.click()}
                    className="relative aspect-video rounded-2xl border-2 border-dashed border-white/20 bg-white/5 hover:bg-white/10 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all overflow-hidden"
                  >
                    {qcPhoto ? (
                      <>
                        <img src={qcPhoto} alt="Refacción" className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Camera size={20} className="text-white" />
                          <span className="text-xs font-bold text-white uppercase">Cambiar Foto</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <Camera size={28} className="text-gray-500" />
                        <span className="text-xs font-bold text-gray-500 uppercase">
                          {isUploading ? 'Procesando...' : 'Tomar/Subir Foto'}
                        </span>
                      </>
                    )}
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handlePhotoUpload} 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">Vincular a Vehículo / Orden</label>
                  <select 
                    className="w-full bg-[#0d1117] border border-white/10 rounded-2xl p-3 text-white focus:outline-none focus:border-accent-primary transition-colors text-xs font-semibold"
                    value={qcTicketId}
                    onChange={(e) => {
                      const newTktId = e.target.value;
                      setQcTicketId(newTktId);
                      const ticket = tickets.find(t => t.id === newTktId);
                      if (ticket) {
                        setQcVehicleCompatibility(ticket.vehicle);
                      } else {
                        setQcVehicleCompatibility('');
                      }
                    }}
                  >
                    <option value="">-- No vincular a ticket (inventario general) --</option>
                    {tickets.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.id} - {t.client} ({t.vehicle})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">Notas e Inspector</label>
                  <textarea 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 text-white focus:outline-none focus:border-accent-primary transition-colors text-xs font-medium h-24 placeholder-gray-500 resize-none"
                    placeholder="Describe observaciones sobre la calidad, empaque o arribo..."
                    value={qcNotes}
                    onChange={(e) => setQcNotes(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Costo ($)</label>
                    <input 
                      type="number" 
                      min="0"
                      step="0.01"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-accent-primary transition-colors text-xs font-semibold"
                      value={qcCost}
                      onChange={(e) => setQcCost(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">P. Venta ($)</label>
                    <input 
                      type="number" 
                      min="0"
                      step="0.01"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-accent-primary transition-colors text-xs font-semibold"
                      value={qcSalePrice}
                      onChange={(e) => setQcSalePrice(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1 col-span-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Inspector</label>
                    <input 
                      type="text" 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-accent-primary transition-colors text-xs font-semibold"
                      value={inspectedBy}
                      onChange={(e) => setInspectedBy(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Score y Selector de Estado de Calidad */}
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Cumplimiento Técnico</p>
                <p className="text-2xl font-black text-white">{calculateQCScore(qcChecked)}%</p>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => setQcStatus('pending')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black border transition-all ${qcStatus === 'pending' ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-transparent border-white/10 text-gray-400 hover:text-white'}`}
                >
                  PENDIENTE
                </button>
                <button 
                  onClick={() => setQcStatus('approved')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black border transition-all ${qcStatus === 'approved' ? 'bg-accent-success/20 border-accent-success text-accent-success' : 'bg-transparent border-white/10 text-gray-400 hover:text-white'}`}
                >
                  APROBAR
                </button>
                <button 
                  onClick={() => setQcStatus('rejected')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black border transition-all ${qcStatus === 'rejected' ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-transparent border-white/10 text-gray-400 hover:text-white'}`}
                >
                  RECHAZAR
                </button>
              </div>
            </div>

            {/* Alerta de rechazo si aplica */}
            {qcStatus === 'rejected' && !qcNotes.trim() && (
              <div className="flex gap-2 items-center p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold mb-6 animate-pulse">
                <AlertTriangle size={16} />
                <span>Atención: Debes escribir una nota técnica de rechazo antes de guardar.</span>
              </div>
            )}

            <button 
              onClick={handleSaveQC}
              className="btn-premium w-full py-4 text-sm font-black uppercase tracking-wider"
            >
              Guardar Reporte de Calidad
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
