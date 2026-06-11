import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Receipt, FileText, Calculator } from 'lucide-react';
import { updateTicketBilling } from '../../services/mockDb';

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

  useEffect(() => {
    const saved = localStorage.getItem('tallerpro_settings');
    if (saved) {
      setSettings(prev => ({ ...prev, ...JSON.parse(saved) }));
    }
  }, []);

  const [billingInfo, setBillingInfo] = useState(() => {
    const savedSettings = JSON.parse(localStorage.getItem('tallerpro_settings') || '{}');
    const defaultIva = savedSettings.defaultIva || 16;
    return {
      rfc: ticket.billingInfo?.rfc || '',
      zip: ticket.billingInfo?.zip || '',
      regime: ticket.billingInfo?.regime || '601',
      usage: ticket.billingInfo?.usage || 'G03',
      ivaRate: ticket.billingInfo?.ivaRate || defaultIva
    };
  });

  const [newItem, setNewItem] = useState({
    desc: '',
    qty: 1,
    price: 0,
    type: 'Refacción',
    satKey: '25170000'
  });

  const [showInvoice, setShowInvoice] = useState(false);

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

  const saveChanges = (currentItems, currentInfo) => {
    const updated = updateTicketBilling(ticket.id, { items: currentItems, billingInfo: currentInfo });
    if (onUpdate) onUpdate(updated);
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
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Plus size={20} className="text-accent-primary" />
                Añadir Concepto
              </h3>
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
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-500 ml-1 uppercase">RFC del Receptor</label>
                  <input 
                    name="rfc"
                    type="text" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-accent-primary transition-colors text-sm font-mono"
                    placeholder="XAXX010101000" 
                    value={billingInfo.rfc}
                    onChange={handleBillingChange}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-500 ml-1 uppercase">Código Postal Fiscal</label>
                  <input 
                    name="zip"
                    type="text" 
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
                  <label className="text-[10px] font-black text-gray-500 ml-1 uppercase">Tasa de IVA</label>
                  <select 
                    name="ivaRate"
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
                  <span>${subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>IVA ({billingInfo.ivaRate || 16}%)</span>
                  <span>${iva.toLocaleString()}</span>
                </div>
                <div className="pt-4 border-t border-white/10 flex justify-between text-2xl font-black text-white">
                  <span>TOTAL</span>
                  <span className="text-accent-primary">${total.toLocaleString()}</span>
                </div>
              </div>
              <button 
                onClick={() => {
                  if (!billingInfo.rfc || !billingInfo.zip) {
                    alert('Por favor, ingresa los datos fiscales (RFC y Código Postal) de facturación.');
                    return;
                  }
                  setShowInvoice(true);
                }}
                className="w-full btn-premium py-4 mt-4 flex items-center justify-center gap-3"
              >
                <FileText size={20} />
                GENERAR COMPROBANTE
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Factura CFDI */}
      {showInvoice && (
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
                <div>
                  <h3 className="text-xl font-black text-accent-primary uppercase tracking-wider">Comprobante Fiscal Digital (CFDI 4.0)</h3>
                  <p className="text-xs text-gray-500 font-bold mt-1">EMISIÓN SIMULADA - EFECTOS DEMOSTRATIVOS</p>
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
                <p className="font-black text-white text-sm">{ticket.client.toUpperCase()}</p>
                <p className="font-bold text-gray-300 font-mono">RFC: {billingInfo.rfc.toUpperCase()}</p>
                <p className="text-gray-400 font-medium">C.P. Fiscal: {billingInfo.zip}</p>
                <p className="text-gray-400 font-medium">Régimen: {billingInfo.regime} &bull; Uso: {billingInfo.usage}</p>
              </div>
            </div>

            {/* Datos de Timbrado */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 text-[10px] font-medium mb-6">
              <div>
                <p className="text-gray-500 font-bold uppercase">Folio Fiscal (UUID)</p>
                <p className="text-gray-300 font-mono select-all font-bold mt-0.5">834D9A12-CFB0-4A33-87D3-5B20892AC771</p>
              </div>
              <div>
                <p className="text-gray-500 font-bold uppercase">No. Serie Certificado SAT</p>
                <p className="text-gray-300 font-mono font-bold mt-0.5">00001000000504465028</p>
              </div>
              <div>
                <p className="text-gray-500 font-bold uppercase">Fecha y Hora de Certificación</p>
                <p className="text-gray-300 font-bold mt-0.5">{new Date().toLocaleString()}</p>
              </div>
            </div>

            {/* Conceptos en la Factura */}
            <div className="border border-white/10 rounded-2xl overflow-hidden mb-6">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 text-gray-500 font-bold uppercase text-[9px] tracking-wider border-b border-white/10">
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
                      <td className="px-4 py-3 text-right">${item.price.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-white font-bold">${(item.qty * item.price).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-white/5 font-bold text-gray-300 border-t border-white/10">
                  <tr>
                    <td colSpan="4" className="px-4 py-2 text-right text-gray-500 uppercase tracking-wider text-[9px]">Subtotal</td>
                    <td className="px-4 py-2 text-right text-white">${subtotal.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td colSpan="4" className="px-4 py-1.5 text-right text-gray-500 uppercase tracking-wider text-[9px]">
                      IVA ({billingInfo.ivaRate}%)
                    </td>
                    <td className="px-4 py-1.5 text-right text-white">${iva.toLocaleString()}</td>
                  </tr>
                  <tr className="text-sm border-t border-white/5">
                    <td colSpan="4" className="px-4 py-3 text-right text-white font-black uppercase tracking-wider">Total CFDI</td>
                    <td className="px-4 py-3 text-right text-accent-primary font-black">${total.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Bloque Fiscal del SAT */}
            <div className="flex gap-4 items-start p-4 bg-white/5 rounded-2xl border border-white/5 mb-8">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent('https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx?id=834D9A12-CFB0-4A33-87D3-5B20892AC771&re=' + settings.rfc + '&rr=' + billingInfo.rfc + '&tt=' + total)}`} 
                alt="SAT QR Code"
                className="w-20 h-20 bg-white p-1 rounded-lg shrink-0 border border-white/10"
              />
              <div className="space-y-1.5 overflow-hidden text-[9px] font-medium text-gray-500">
                <div>
                  <p className="font-bold text-gray-400 uppercase">Sello Digital del CFDI</p>
                  <p className="truncate font-mono font-bold">dx/g9GskP/P3g0U+58lZkG/M28v2d5q5t7Y6d8r9S0o1N2e3t4y5u6i7o8p9a0s1d2f3g4h5j6k7l8m9n0b1v2c3x4z5q6w7e8r9t0y1u2i3o4p5a6s7d8f9g0h1j2k3l4</p>
                </div>
                <div>
                  <p className="font-bold text-gray-400 uppercase">Sello del SAT</p>
                  <p className="truncate font-mono font-bold">u7i8o9p0a1s2d3f4g5h6j7k8l9z0x1c2v3b4n5m6q7w8e9r0t1y2u3i4o5p6a7s8d9f0g1h2j3k4l5z6x7c8v9b0n1m2q3w4e5r6t7y8u9i0o1p2a3s4d5f6g7h8j9k0l</p>
                </div>
                <div>
                  <p className="font-bold text-gray-400 uppercase">Cadena Original del Complemento de Certificación Digital del SAT</p>
                  <p className="truncate font-mono font-bold">||1.1|834D9A12-CFB0-4A33-87D3-5B20892AC771|{new Date().toISOString()}|MEST800101AA1|dx/g9GskP/P3g0U+58lZkG/M28v2d5q5t7Y6d8r9S0o1N2e3t4y5u6i7o8p9a0s1d2f3g4h5j6k7l8m9n0b1v2c3x4z5q6w7e8r9t0y1u2i3o4p5a6s7d8f9g0h1j2k3l4||</p>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <button 
                onClick={() => window.print()}
                className="btn-secondary text-xs py-3 px-6"
              >
                Imprimir Factura
              </button>
              <button 
                onClick={() => {
                  const msg = `Hola ${ticket.client}, tu comprobante fiscal digital del ticket ${ticket.id} ha sido generado exitosamente por un total de $${total.toLocaleString()} MXN.`;
                  window.open(`https://wa.me/${ticket.phone || settings.phone}?text=${encodeURIComponent(msg)}`, '_blank');
                }}
                className="btn-premium !bg-accent-success/20 !border-accent-success !text-accent-success !from-transparent !to-transparent border text-xs py-3 px-6"
              >
                Enviar al Cliente (WhatsApp)
              </button>
              <button 
                onClick={() => setShowInvoice(false)}
                className="btn-premium text-xs py-3 px-6"
              >
                Entendido
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
