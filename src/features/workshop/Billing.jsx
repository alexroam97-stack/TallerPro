import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Receipt, FileText, Calculator, Copy, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { updateTicketBilling, getSettings, stampInvoice, cancelInvoice } from '../../services/api';

const getSuggestedSatKey = (description, type, serviceType) => {
  const desc = description.toLowerCase();
  
  if (type === 'Mano de Obra') {
    if (serviceType === 'Hojalatería y Pintura' || desc.includes('pintar') || desc.includes('pintura') || desc.includes('hojalat') || desc.includes('hojalateria')) {
      return '73181100'; // Servicios de acabado y pintura de superficies
    }
    return '78181500'; // Servicios de mantenimiento y reparación de vehículos (mecánica)
  } else {
    if (desc.includes('aceite') || desc.includes('lubricante')) {
      return '15121500'; // Aceites y lubricantes
    }
    if (desc.includes('filtro')) {
      return '40161500'; // Filtros
    }
    if (desc.includes('llanta') || desc.includes('neumatic') || desc.includes('rin')) {
      return '25172500'; // Llantas y neumáticos
    }
    if (desc.includes('balata') || desc.includes('freno') || desc.includes('disco') || desc.includes('tambor') || desc.includes('caliper')) {
      return '25171700'; // Sistemas de frenos y componentes
    }
    if (desc.includes('amortiguador') || desc.includes('suspension') || desc.includes('horquilla') || desc.includes('resorte') || desc.includes('bushing')) {
      return '25172400'; // Sistemas de suspensión y componentes
    }
    if (desc.includes('bujia') || desc.includes('bobina') || desc.includes('distribuidor') || desc.includes('cable')) {
      return '25173100'; // Componentes del motor (sistema de encendido)
    }
    if (desc.includes('bateria') || desc.includes('acumulador') || desc.includes('alternador')) {
      return '26101100'; // Fuentes de energía (baterías)
    }
    if (desc.includes('pintura') || desc.includes('barniz') || desc.includes('transparente') || desc.includes('primer') || desc.includes('tinta')) {
      return '31211500'; // Pinturas y recubrimientos
    }
    if (desc.includes('fascia') || desc.includes('defensa') || desc.includes('puerta') || desc.includes('cofre') || desc.includes('salpicadera') || desc.includes('costado') || desc.includes('parachoques') || desc.includes('espejo')) {
      return '25171900'; // Componentes de carrocería
    }
    return '25170000'; // Componentes de transporte / Refacciones generales
  }
};

export default function Billing({ ticket, onClose, onUpdate }) {
  const [items, setItems] = useState(ticket.items || []);
  
  const [settings, setSettings] = useState({
    name: 'TallerPro',
    rfc: 'TPRO120409AA1',
    address: 'Av. de la Reforma 123, Ciudad de México',
    phone: '526633040096',
    defaultIva: 16
  });

  const [billingInfo, setBillingInfo] = useState({
    rfc: ticket.billingInfo?.rfc || '',
    legalName: ticket.billingInfo?.legalName || ticket.client || '',
    zip: ticket.billingInfo?.zip || '',
    regime: ticket.billingInfo?.regime || '601',
    usage: ticket.billingInfo?.usage || 'G03',
    paymentForm: ticket.billingInfo?.paymentForm || '03',
    ivaRate: ticket.billingInfo?.ivaRate || 16,
    invoice: ticket.billingInfo?.invoice || null
  });

  // Stamping States
  const [isStamping, setIsStamping] = useState(false);
  const [stampingStep, setStampingStep] = useState(0);
  const [stampingError, setStampingError] = useState('');
  const [copiedUuid, setCopiedUuid] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  useEffect(() => {
    getSettings()
      .then(saved => {
        if (saved) {
          setSettings(prev => ({ ...prev, ...saved }));
          setBillingInfo(prev => ({
            ...prev,
            ivaRate: ticket.billingInfo?.ivaRate !== undefined ? ticket.billingInfo.ivaRate : (saved.defaultIva || 16)
          }));
        }
      })
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [newItem, setNewItem] = useState({
    desc: '',
    qty: 1,
    price: 0,
    type: 'Refacción',
    satKey: '25170000'
  });

  const [showInvoice, setShowInvoice] = useState(false);

  const handleStampInvoice = async () => {
    if (!billingInfo.rfc || !billingInfo.legalName || !billingInfo.zip) {
      alert('Por favor, completa los campos obligatorios: RFC, Razón Social y Código Postal.');
      return;
    }
    if (items.length === 0) {
      alert('No se puede facturar una orden sin conceptos agregados.');
      return;
    }

    setStampingError('');
    setIsStamping(true);
    setStampingStep(1); // Connecting to PAC

    try {
      // Step-by-step loading animation to simulate SAT connections
      await new Promise(r => setTimeout(r, 900));
      setStampingStep(2); // Validating RFC/CP

      await new Promise(r => setTimeout(r, 900));
      setStampingStep(3); // Stamping XML

      await new Promise(r => setTimeout(r, 800));
      setStampingStep(4); // Stamped!

      await new Promise(r => setTimeout(r, 500));

      const invoiceData = await stampInvoice(ticket.id, billingInfo);
      
      const updatedBilling = {
        ...billingInfo,
        invoice: invoiceData
      };
      setBillingInfo(updatedBilling);
      
      // Update parent component
      const updatedTicket = { ...ticket, billingInfo: updatedBilling };
      if (onUpdate) onUpdate(updatedTicket);

      setShowInvoice(true);
    } catch (err) {
      console.error(err);
      setStampingError(err.message || 'Error al conectar con el servidor de facturación SAT.');
    } finally {
      setIsStamping(false);
      setStampingStep(0);
    }
  };

  const handleCancelInvoice = async () => {
    if (!window.confirm('¿Estás completamente seguro de cancelar esta factura ante el SAT? Esta acción no se puede deshacer.')) {
      return;
    }

    setIsCanceling(true);
    try {
      await cancelInvoice(ticket.id);
      
      const updatedBilling = {
        ...billingInfo,
        invoice: null
      };
      setBillingInfo(updatedBilling);
      setShowInvoice(false);

      // Update parent component
      const updatedTicket = { ...ticket, billingInfo: updatedBilling };
      if (onUpdate) onUpdate(updatedTicket);

      alert('La factura ha sido cancelada exitosamente ante el SAT.');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error al cancelar la factura ante el SAT.');
    } finally {
      setIsCanceling(false);
    }
  };

  const handleCopyUuid = (uuid) => {
    navigator.clipboard.writeText(uuid);
    setCopiedUuid(true);
    setTimeout(() => setCopiedUuid(false), 2000);
  };

  const subtotal = items.reduce((acc, item) => acc + (item.qty * item.price), 0);
  const iva = subtotal * ((billingInfo.ivaRate || 16) / 100);
  const total = subtotal + iva;

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItem.desc || newItem.price <= 0) return;
    const itemWithId = { ...newItem, id: Date.now() };
    const updatedItems = [...items, itemWithId];
    setItems(updatedItems);
    setNewItem({ desc: '', qty: 1, price: 0, type: 'Refacción', satKey: '25170000' });
    saveChanges(updatedItems, billingInfo);
  };

  const handleApplyTemplate = (e) => {
    const template = e.target.value;
    if (!template) return;
    
    let templateItems = [];
    const timestamp = Date.now();
    
    if (template === 'afinacion') {
      templateItems = [
        { id: timestamp + 1, desc: 'Kit de Filtros y Bujías', qty: 1, price: 2800, type: 'Refacción', satKey: '25173100' },
        { id: timestamp + 2, desc: 'Aceite Sintético 5W30 (Litro)', qty: 4, price: 280, type: 'Refacción', satKey: '15121500' },
        { id: timestamp + 3, desc: 'Mano de Obra Afinación Completa', qty: 1, price: 1200, type: 'Mano de Obra', satKey: '78181500' }
      ];
    } else if (template === 'frenos') {
      templateItems = [
        { id: timestamp + 1, desc: 'Juego de Balatas Delanteras', qty: 1, price: 1400, type: 'Refacción', satKey: '25171700' },
        { id: timestamp + 2, desc: 'Disco de Freno Delantero', qty: 2, price: 950, type: 'Refacción', satKey: '25171700' },
        { id: timestamp + 3, desc: 'Mano de Obra Reemplazo y Rectificación', qty: 1, price: 850, type: 'Mano de Obra', satKey: '78181500' }
      ];
    } else if (template === 'pintura') {
      templateItems = [
        { id: timestamp + 1, desc: 'Material de Pintura y Acabado Bicapa', qty: 1, price: 1800, type: 'Refacción', satKey: '31211500' },
        { id: timestamp + 2, desc: 'Mano de Obra Reparación y Pintura por Pieza', qty: 1, price: 2500, type: 'Mano de Obra', satKey: '73181100' }
      ];
    } else if (template === 'diagnostico') {
      templateItems = [
        { id: timestamp + 1, desc: 'Escaneo y Diagnóstico Computarizado OBD-II', qty: 1, price: 600, type: 'Mano de Obra', satKey: '78181500' }
      ];
    }
    
    if (templateItems.length > 0) {
      const updatedItems = [...items, ...templateItems];
      setItems(updatedItems);
      saveChanges(updatedItems, billingInfo);
    }
    
    e.target.value = '';
  };

  const handleRemoveItem = (id) => {
    const updatedItems = items.filter(item => item.id !== id);
    setItems(updatedItems);
    saveChanges(updatedItems, billingInfo);
  };

  const handleBillingChange = (e) => {
    const { name, value } = e.target;
    const parsedValue = name === 'ivaRate' ? (parseInt(value) || 16) : value;
    const updatedInfo = { ...billingInfo, [name]: parsedValue };
    setBillingInfo(updatedInfo);
    saveChanges(items, updatedInfo);
  };

  const saveChanges = async (currentItems, currentInfo) => {
    try {
      const updated = await updateTicketBilling(ticket.id, { items: currentItems, billingInfo: currentInfo });
      if (onUpdate) onUpdate(updated);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex justify-center items-start p-4 md:p-10 cursor-pointer animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="liquid-glass p-8 rounded-[2.5rem] w-full max-w-4xl shadow-ui border-white/20 animate-fade-in-up my-auto cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-accent-primary/20 text-accent-primary shrink-0">
              <Receipt size={32} />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Presupuesto y Facturación</h2>
              <p className="text-gray-400 font-bold tracking-widest text-xs uppercase">TICKET: {ticket.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors self-end sm:self-auto">
            <X size={28} />
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Items Management */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card-morphism !bg-white/5 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-white/5 pb-4">
                <h3 className="text-xl font-bold flex items-center gap-2 mb-0">
                  <Plus size={20} className="text-accent-primary" />
                  Añadir Concepto
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Plantillas rápidas:</span>
                  <select 
                    onChange={handleApplyTemplate}
                    defaultValue=""
                    className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-accent-primary font-bold focus:outline-none focus:border-accent-primary transition-colors cursor-pointer"
                  >
                    <option value="" disabled>Cargar servicio...</option>
                    <option value="afinacion">Afinación Mayor Completa</option>
                    <option value="frenos">Cambio de Balatas y Discos</option>
                    <option value="pintura">Hojalatería y Pintura de Pieza</option>
                    <option value="diagnostico">Diagnóstico Computarizado (OBD-II)</option>
                  </select>
                </div>
              </div>
              <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-black text-gray-500 ml-1 uppercase">Descripción</label>
                  <input 
                    type="text" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-accent-primary transition-colors text-sm"
                    placeholder="Ej. Kit de Afinación" 
                    value={newItem.desc}
                    onChange={(e) => {
                      const newDesc = e.target.value;
                      const suggested = getSuggestedSatKey(newDesc, newItem.type, ticket.serviceType);
                      setNewItem({ ...newItem, desc: newDesc, satKey: suggested });
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-500 ml-1 uppercase">Tipo</label>
                  <select 
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-accent-primary transition-colors text-sm"
                    value={newItem.type}
                    onChange={(e) => {
                      const newType = e.target.value;
                      const suggested = getSuggestedSatKey(newItem.desc, newType, ticket.serviceType);
                      setNewItem({ ...newItem, type: newType, satKey: suggested });
                    }}
                  >
                    <option value="Refacción">Refacción</option>
                    <option value="Mano de Obra">Mano de Obra</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-500 ml-1 uppercase">Cantidad</label>
                  <input 
                    type="number" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-accent-primary transition-colors text-sm"
                    value={newItem.qty}
                    onChange={(e) => setNewItem({...newItem, qty: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-500 ml-1 uppercase">Precio Unitario ($)</label>
                  <input 
                    type="number" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-accent-primary transition-colors text-sm"
                    value={newItem.price}
                    onChange={(e) => setNewItem({...newItem, price: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div className="md:col-span-3 space-y-1">
                  <label className="text-[10px] font-black text-gray-500 ml-1 uppercase">Clave SAT (Sugerida)</label>
                  <input 
                    type="text" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-accent-primary transition-colors text-sm"
                    value={newItem.satKey}
                    onChange={(e) => setNewItem({...newItem, satKey: e.target.value})}
                  />
                </div>
                <button type="submit" className="md:mt-5 btn-premium py-3 rounded-xl flex items-center justify-center gap-2">
                  <Plus size={18} /> AGREGAR
                </button>
              </form>
            </div>

            <div className="card-morphism !bg-white/5 p-0 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-gray-500 font-bold uppercase text-[10px] tracking-widest">
                  <tr>
                    <th className="px-4 py-3">Concepto</th>
                    <th className="px-4 py-3">Clave</th>
                    <th className="px-4 py-3 text-center">Cant.</th>
                    <th className="px-4 py-3 text-right">Precio</th>
                    <th className="px-4 py-3 text-right">Subtotal</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-12 text-center text-gray-600 font-bold">No hay conceptos agregados todavía.</td>
                    </tr>
                  ) : (
                    items.map(item => (
                      <tr key={item.id} className="group hover:bg-white/5 transition-colors">
                        <td className="px-4 py-4">
                          <div className="font-bold">{item.desc}</div>
                          <div className="text-[10px] text-gray-500">{item.type.toUpperCase()}</div>
                        </td>
                        <td className="px-4 py-4 text-xs font-mono">{item.satKey}</td>
                        <td className="px-4 py-4 text-center">{item.qty}</td>
                        <td className="px-4 py-4 text-right">${item.price.toLocaleString()}</td>
                        <td className="px-4 py-4 text-right font-bold text-accent-primary">${(item.qty * item.price).toLocaleString()}</td>
                        <td className="px-4 py-4 text-right">
                          <button onClick={() => handleRemoveItem(item.id)} className="text-gray-600 hover:text-red-400 transition-colors">
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Tax Info & Totals */}
          <div className="space-y-6">
            <div className="card-morphism !bg-white/5 p-6 space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-2">
                <FileText size={20} className="text-accent-primary" />
                Datos Fiscales (SAT)
              </h3>
              {billingInfo.invoice && (
                <div className="p-3.5 rounded-xl bg-accent-primary/10 border border-accent-primary/20 text-xs text-accent-primary font-bold flex items-start gap-2 leading-relaxed">
                  <Check size={18} className="shrink-0 mt-0.5" />
                  <div>
                    Factura emitida bajo el régimen CFDI 4.0. Edición deshabilitada.
                  </div>
                </div>
              )}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-500 ml-1 uppercase">RFC del Receptor</label>
                  <input 
                    name="rfc"
                    type="text" 
                    disabled={!!billingInfo.invoice}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-accent-primary transition-colors text-sm font-mono uppercase"
                    placeholder="XAXX010101000" 
                    value={billingInfo.rfc}
                    onChange={handleBillingChange}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-500 ml-1 uppercase">Nombre / Razón Social (SAT)</label>
                  <input 
                    name="legalName"
                    type="text" 
                    disabled={!!billingInfo.invoice}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-accent-primary transition-colors text-sm uppercase"
                    placeholder="JUAN PEREZ LOPEZ" 
                    value={billingInfo.legalName}
                    onChange={handleBillingChange}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-500 ml-1 uppercase">Código Postal Fiscal</label>
                  <input 
                    name="zip"
                    type="text" 
                    disabled={!!billingInfo.invoice}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-accent-primary transition-colors text-sm"
                    placeholder="06600" 
                    value={billingInfo.zip}
                    onChange={handleBillingChange}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-500 ml-1 uppercase">Régimen Fiscal</label>
                  <select 
                    name="regime"
                    disabled={!!billingInfo.invoice}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-accent-primary transition-colors text-sm"
                    value={billingInfo.regime}
                    onChange={handleBillingChange}
                  >
                    <option value="601">601 - General de Ley P.M.</option>
                    <option value="612">612 - P.F. Actividades Emp.</option>
                    <option value="626">626 - RESICO</option>
                    <option value="605">605 - Sueldos y Salarios</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-500 ml-1 uppercase">Uso de CFDI</label>
                  <select 
                    name="usage"
                    disabled={!!billingInfo.invoice}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-accent-primary transition-colors text-sm"
                    value={billingInfo.usage}
                    onChange={handleBillingChange}
                  >
                    <option value="G03">G03 - Gastos en general</option>
                    <option value="S01">S01 - Sin efectos fiscales</option>
                    <option value="I08">I08 - Otros (Inversión)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-500 ml-1 uppercase">Forma de Pago</label>
                  <select 
                    name="paymentForm"
                    disabled={!!billingInfo.invoice}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-accent-primary transition-colors text-sm"
                    value={billingInfo.paymentForm}
                    onChange={handleBillingChange}
                  >
                    <option value="03">03 - Transferencia electrónica</option>
                    <option value="01">01 - Efectivo</option>
                    <option value="04">04 - Tarjeta de crédito</option>
                    <option value="28">28 - Tarjeta de débito</option>
                    <option value="02">02 - Cheque nominativo</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-500 ml-1 uppercase">Tasa de IVA</label>
                  <select 
                    name="ivaRate"
                    disabled={!!billingInfo.invoice}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-accent-primary transition-colors text-sm font-semibold"
                    value={billingInfo.ivaRate}
                    onChange={handleBillingChange}
                  >
                    <option value="16">16% (Nacional General)</option>
                    <option value="8">8% (Región Fronteriza)</option>
                    <option value="0">0% (Tasa Cero / Exento)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="card-morphism bg-accent-primary/5 border-accent-primary/20 p-6 space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-2">
                <Calculator size={20} className="text-accent-primary" />
                Resumen de Cuenta
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal</span>
                  <span>${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>IVA ({billingInfo.ivaRate || 16}%)</span>
                  <span>${iva.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="pt-4 border-t border-white/10 flex justify-between text-2xl font-black text-white">
                  <span>TOTAL</span>
                  <span className="text-accent-primary">${total.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
              
              {billingInfo.invoice ? (
                <div className="space-y-3 pt-2">
                  <button 
                    onClick={() => setShowInvoice(true)}
                    className="w-full btn-premium py-3 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider"
                  >
                    <FileText size={16} />
                    Ver Factura Timbrada
                  </button>
                  <a 
                    href={billingInfo.invoice.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full btn-secondary py-3 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider text-center"
                  >
                    <FileText size={16} />
                    Imprimir / Guardar PDF
                  </a>
                  <button 
                    onClick={handleCancelInvoice}
                    disabled={isCanceling}
                    className="w-full bg-red-950/20 border border-red-500/30 text-red-400 hover:bg-red-950/40 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider transition-colors disabled:opacity-50"
                  >
                    {isCanceling ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <X size={16} />
                    )}
                    Cancelar Factura SAT
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleStampInvoice}
                  disabled={isStamping || items.length === 0}
                  className="w-full btn-premium py-4 mt-4 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  <FileText size={20} />
                  TIMBRAR FACTURA (SANDBOX)
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Factura CFDI */}
      {showInvoice && billingInfo.invoice && (
        <div 
          className="fixed inset-0 z-[60] overflow-y-auto bg-black/80 backdrop-blur-sm flex justify-center items-start p-4 md:p-10 cursor-pointer"
          onClick={() => setShowInvoice(false)}
        >
          <div 
            className="bg-[#0b0e14] p-8 md:p-10 rounded-[2.5rem] w-full max-w-3xl border border-white/10 shadow-ui animate-fade-in-up text-left text-white relative my-auto cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowInvoice(false)} 
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X size={24} />
            </button>
            
            <header className="border-b border-white/10 pb-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-accent-success/20 text-accent-success">
                    <Receipt size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">Comprobante Fiscal Digital (CFDI)</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Emitido en Modo de Pruebas (Sandbox)</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 rounded-lg bg-accent-success/10 border border-accent-success/20 text-accent-success text-xs font-black">
                    TIMBRADO EXITOSO
                  </span>
                </div>
              </div>
            </header>

            {/* Grid de Emisor/Receptor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs mb-6 pb-6 border-b border-white/5">
              <div className="space-y-1">
                <p className="text-[10px] text-gray-500 font-black uppercase">Emisor</p>
                <p className="font-black text-white text-sm">{settings.name.toUpperCase()}</p>
                <p className="font-bold text-gray-300 font-mono">RFC: {settings.rfc.toUpperCase()}</p>
                <p className="text-gray-400 font-medium">{settings.address}</p>
                <p className="text-gray-400 font-medium">Régimen: 601 - General de Ley Personas Morales</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-gray-500 font-black uppercase">Receptor</p>
                <p className="font-black text-white text-sm">{(billingInfo.legalName || ticket.client).toUpperCase()}</p>
                <p className="font-bold text-gray-300 font-mono">RFC: {billingInfo.rfc.toUpperCase()}</p>
                <p className="text-gray-400 font-medium">C.P. Fiscal: {billingInfo.zip}</p>
                <p className="text-gray-400 font-medium">
                  Régimen: {billingInfo.regime} &bull; Uso: {billingInfo.usage}
                </p>
              </div>
            </div>

            {/* Datos de Timbrado */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 text-[10px] font-medium mb-6">
              <div>
                <p className="text-gray-500 font-bold uppercase flex items-center gap-1">
                  Folio Fiscal (UUID)
                  <button 
                    onClick={() => handleCopyUuid(billingInfo.invoice.uuid)}
                    className="text-accent-primary hover:text-white transition-colors"
                    title="Copiar UUID"
                  >
                    {copiedUuid ? <Check size={10} /> : <Copy size={10} />}
                  </button>
                </p>
                <p className="text-gray-300 font-mono select-all font-bold mt-0.5 truncate">{billingInfo.invoice.uuid}</p>
              </div>
              <div>
                <p className="text-gray-500 font-bold uppercase">No. Serie Certificado SAT</p>
                <p className="text-gray-300 font-mono font-bold mt-0.5">00001000000504465028</p>
              </div>
              <div>
                <p className="text-gray-500 font-bold uppercase">Fecha y Hora de Certificación</p>
                <p className="text-gray-300 font-bold mt-0.5">
                  {new Date(billingInfo.invoice.stampedAt).toLocaleString('es-MX', {
                    year: 'numeric', month: '2-digit', day: '2-digit',
                    hour: '2-digit', minute: '2-digit', second: '2-digit'
                  })}
                </p>
              </div>
            </div>

            {/* Conceptos en la Factura */}
            <div className="border border-white/10 rounded-2xl overflow-hidden mb-6 max-h-48 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 text-gray-500 font-bold uppercase text-[9px] tracking-wider border-b border-white/10 sticky top-0">
                  <tr>
                    <th className="px-4 py-2">Clave SAT</th>
                    <th className="px-4 py-2">Concepto</th>
                    <th className="px-4 py-2 text-center">Cant.</th>
                    <th className="px-4 py-2 text-right">Precio</th>
                    <th className="px-4 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium text-gray-300">
                  {items.map(item => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 font-mono text-[10px]">{item.satKey}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-white">{item.desc}</div>
                        <div className="text-[9px] text-gray-500">{item.type.toUpperCase()}</div>
                      </td>
                      <td className="px-4 py-3 text-center">{item.qty}</td>
                      <td className="px-4 py-3 text-right">${item.price.toLocaleString('es-MX')}</td>
                      <td className="px-4 py-3 text-right text-white font-bold">${(item.qty * item.price).toLocaleString('es-MX')}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-white/5 font-bold text-gray-300 border-t border-white/10">
                  <tr>
                    <td colSpan="4" className="px-4 py-2 text-right text-gray-500 uppercase tracking-wider text-[9px]">Subtotal</td>
                    <td className="px-4 py-2 text-right text-white">${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td colSpan="4" className="px-4 py-1.5 text-right text-gray-500 uppercase tracking-wider text-[9px]">
                      IVA ({billingInfo.ivaRate || 16}%)
                    </td>
                    <td className="px-4 py-1.5 text-right text-white">${iva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr className="text-sm border-t border-white/5">
                    <td colSpan="4" className="px-4 py-3 text-right text-white font-black uppercase tracking-wider">Total CFDI</td>
                    <td className="px-4 py-3 text-right text-accent-primary font-black">${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Bloque Fiscal del SAT */}
            <div className="flex gap-4 items-start p-4 bg-white/5 rounded-2xl border border-white/5 mb-8">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent('https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx?id=' + billingInfo.invoice.uuid + '&re=' + settings.rfc + '&rr=' + billingInfo.rfc + '&tt=' + total.toFixed(2))}`} 
                alt="SAT QR Code"
                className="w-20 h-20 bg-white p-1 rounded-lg shrink-0 border border-white/10"
              />
              <div className="space-y-1.5 overflow-hidden text-[9px] font-medium text-gray-500">
                <div>
                  <p className="font-bold text-gray-400 uppercase">Sello Digital del CFDI</p>
                  <p className="truncate font-mono font-bold">{billingInfo.invoice.selloCFD}</p>
                </div>
                <div>
                  <p className="font-bold text-gray-400 uppercase">Sello del SAT</p>
                  <p className="truncate font-mono font-bold">{billingInfo.invoice.selloSAT}</p>
                </div>
                <div>
                  <p className="font-bold text-gray-400 uppercase">Cadena Original del Complemento de Certificación Digital del SAT</p>
                  <p className="truncate font-mono font-bold">||1.1|${billingInfo.invoice.uuid}|${billingInfo.invoice.stampedAt}|SAT970701NN3|${billingInfo.invoice.selloCFD.substring(0, 40)}...|00001000000504465028||</p>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <a 
                href={billingInfo.invoice.pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary text-xs py-3 px-6 text-center font-bold"
              >
                Imprimir / PDF
              </a>
              <a 
                href={billingInfo.invoice.xmlUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary text-xs py-3 px-6 text-center font-bold"
              >
                Descargar XML
              </a>
              <button 
                onClick={() => {
                  const cleanPhone = (ticket.phone || settings.phone).replace(/\D/g, '');
                  const trackerUrl = `${window.location.origin}/tracker/${ticket.id}`;
                  const msg = `Hola *${ticket.client}*, tu factura fiscal (CFDI 4.0) del ticket *${ticket.id}* ha sido generada exitosamente. Puedes ver y descargar tus archivos XML y PDF oficiales aquí: ${trackerUrl}`;
                  window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
                }}
                className="btn-premium !bg-accent-success/20 !border-accent-success !text-accent-success !from-transparent !to-transparent border text-xs py-3 px-6 font-bold"
              >
                Compartir por WhatsApp
              </button>
              <button 
                onClick={() => setShowInvoice(false)}
                className="btn-premium text-xs py-3 px-6 font-bold"
              >
                Cerrar Vista
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Loading Timbrado SAT Overlay */}
      {isStamping && (
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="card-morphism max-w-sm w-full p-8 text-center space-y-6 border border-white/10 animate-fade-in-up">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 border-4 border-white/5 rounded-full" />
              <div className="absolute inset-0 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-accent-primary">
                <FileText size={28} />
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-black text-white">Timbrando Comprobante</h4>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Servicio SAT CFDI 4.0 Sandbox</p>
            </div>
            <div className="space-y-3 pt-2">
              {[
                { id: 1, text: 'Conectando con PAC de pruebas...' },
                { id: 2, text: 'Validando RFC y CP ante lista del SAT...' },
                { id: 3, text: 'Firmando y sellando comprobante fiscal...' },
                { id: 4, text: '¡Factura timbrada con éxito!' }
              ].map(step => {
                const isDone = stampingStep > step.id;
                const isCurrent = stampingStep === step.id;
                return (
                  <div key={step.id} className="flex items-center gap-3 text-left text-xs font-semibold">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                      isDone 
                        ? 'bg-accent-success/20 border-accent-success text-accent-success' 
                        : isCurrent 
                          ? 'bg-accent-primary/20 border-accent-primary text-accent-primary animate-pulse'
                          : 'bg-white/5 border-white/10 text-gray-500'
                    }`}>
                      {isDone ? <Check size={10} strokeWidth={3} /> : <span className="text-[9px]">{step.id}</span>}
                    </div>
                    <span className={isDone ? 'text-gray-400 line-through' : isCurrent ? 'text-accent-primary font-black' : 'text-gray-500'}>
                      {step.text}
                    </span>
                  </div>
                );
              })}
            </div>
            {stampingError && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-bold leading-relaxed flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <div className="text-left">{stampingError}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
