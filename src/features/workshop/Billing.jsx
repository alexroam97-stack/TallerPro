import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Receipt, FileText, Calculator } from 'lucide-react';
import { updateTicketBilling } from '../../services/mockDb';

export default function Billing({ ticket, onClose, onUpdate }) {
  const [items, setItems] = useState(ticket.items || []);
  const [billingInfo, setBillingInfo] = useState(ticket.billingInfo || {
    rfc: '',
    zip: '',
    regime: '601',
    usage: 'G03'
  });

  const [newItem, setNewItem] = useState({
    desc: '',
    qty: 1,
    price: 0,
    type: 'Refacción',
    satKey: '78181500'
  });

  const subtotal = items.reduce((acc, item) => acc + (item.qty * item.price), 0);
  const iva = subtotal * 0.16;
  const total = subtotal + iva;

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItem.desc || newItem.price <= 0) return;
    const itemWithId = { ...newItem, id: Date.now() };
    const updatedItems = [...items, itemWithId];
    setItems(updatedItems);
    setNewItem({ desc: '', qty: 1, price: 0, type: 'Refacción', satKey: '78181500' });
    saveChanges(updatedItems, billingInfo);
  };

  const handleRemoveItem = (id) => {
    const updatedItems = items.filter(item => item.id !== id);
    setItems(updatedItems);
    saveChanges(updatedItems, billingInfo);
  };

  const handleBillingChange = (e) => {
    const { name, value } = e.target;
    const updatedInfo = { ...billingInfo, [name]: value };
    setBillingInfo(updatedInfo);
    saveChanges(items, updatedInfo);
  };

  const saveChanges = (currentItems, currentInfo) => {
    const updated = updateTicketBilling(ticket.id, { items: currentItems, billingInfo: currentInfo });
    if (onUpdate) onUpdate(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="liquid-glass p-8 rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-ui border-white/20 animate-fade-in-up">
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-accent-primary/20 text-accent-primary">
              <Receipt size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight">Presupuesto y Facturación</h2>
              <p className="text-gray-400 font-bold tracking-widest text-xs uppercase">TICKET: {ticket.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
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
                    onChange={(e) => setNewItem({...newItem, desc: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-500 ml-1 uppercase">Tipo</label>
                  <select 
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-accent-primary transition-colors text-sm"
                    value={newItem.type}
                    onChange={(e) => setNewItem({...newItem, type: e.target.value})}
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
                  <span>IVA (16%)</span>
                  <span>${iva.toLocaleString()}</span>
                </div>
                <div className="pt-4 border-t border-white/10 flex justify-between text-2xl font-black text-white">
                  <span>TOTAL</span>
                  <span className="text-accent-primary">${total.toLocaleString()}</span>
                </div>
              </div>
              <button className="w-full btn-premium py-4 mt-4 flex items-center justify-center gap-3">
                <FileText size={20} />
                GENERAR COMPROBANTE
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
