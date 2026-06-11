import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Settings, Home, Car, Link as LinkIcon, X, LogOut, QrCode, Receipt, Check, TrendingUp, Package, MessageSquare, Eye, Edit, Menu, ChevronLeft, Trash2, MoreVertical } from 'lucide-react';
import { getTickets, addTicket, saveSignature, getParts, addPart, updatePart, updateBudgetStatus, addEventToTicket, deleteTicket, updateTimeLogs, updateTicket } from '../../services/mockDb';
import Logo from '../../components/Logo';
import SignatureCanvas from '../../components/SignatureCanvas';
import { useAuth } from '../../skills/security';
import { generateWhatsAppLink } from '../../services/notifications';
import Billing from './Billing';
import InteractiveVehicleSVG from './InteractiveVehicleSVG';
import Analytics from './Analytics';
import PartsInventory from './PartsInventory';
import SettingsPanel from './SettingsPanel';

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

export default function ShopDashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('vehiculos'); // vehiculos, clientes
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [scanSimulateId, setScanSimulateId] = useState('');
  const [activeMenuTicketId, setActiveMenuTicketId] = useState(null);
  const [newClient, setNewClient] = useState('');
  const [newVehicle, setNewVehicle] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newServiceType, setNewServiceType] = useState('Mecánica');
  const [newDamagedPanels, setNewDamagedPanels] = useState([]);
  const [selectedBillingTicket, setSelectedBillingTicket] = useState(null);
  const [newInsuranceType, setNewInsuranceType] = useState('particular'); // particular, aseguranza
  const [newInsuranceCompany, setNewInsuranceCompany] = useState('');
  const [newClaimNumber, setNewClaimNumber] = useState('');
  const [newSignatureIntake, setNewSignatureIntake] = useState('');
  const [selectedWhatsAppTicket, setSelectedWhatsAppTicket] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState('ingreso');
  const [customMessage, setCustomMessage] = useState('');
  const [newBudgetItems, setNewBudgetItems] = useState([]);
  const [selectedDetailsTicket, setSelectedDetailsTicket] = useState(null);
  const [detailsParts, setDetailsParts] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEditTicket, setSelectedEditTicket] = useState(null);
  const [editClient, setEditClient] = useState('');
  const [editVehicle, setEditVehicle] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editServiceType, setEditServiceType] = useState('Mecánica');
  const [editInsuranceType, setEditInsuranceType] = useState('particular');
  const [editInsuranceCompany, setEditInsuranceCompany] = useState('');
  const [editClaimNumber, setEditClaimNumber] = useState('');
  const [editDamagedPanels, setEditDamagedPanels] = useState([]);

  useEffect(() => {
    if (selectedDetailsTicket) {
      const allParts = getParts();
      const linkedParts = allParts.filter(p => p.ticketId === selectedDetailsTicket.id);
      setDetailsParts(linkedParts);
    } else {
      setDetailsParts([]);
    }
  }, [selectedDetailsTicket, tickets]);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const scanId = query.get('scan');
    if (scanId && tickets.length > 0) {
      const found = tickets.find(t => t.id === scanId);
      if (found) {
        setSelectedDetailsTicket(found);
        navigate('/dashboard', { replace: true });
      }
    }
  }, [tickets, navigate]);

  useEffect(() => {
    if (isScanModalOpen) {
      if (!window.Html5QrcodeScanner) {
        const script = document.createElement('script');
        script.src = "https://unpkg.com/html5-qrcode";
        script.async = true;
        script.onload = () => {
          initializeScanner();
        };
        document.body.appendChild(script);
      } else {
        setTimeout(initializeScanner, 100);
      }
    }

    let scannerInstance = null;

    function initializeScanner() {
      if (!document.getElementById('qr-reader-workshop')) return;
      try {
        const scanner = new window.Html5QrcodeScanner(
          "qr-reader-workshop", 
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          false
        );
        
        scanner.render((decodedText) => {
          const regex = /\/scan\/(TKT-[A-Z0-9]+)/i;
          const match = decodedText.match(regex);
          if (match && match[1]) {
            const ticketId = match[1];
            const found = tickets.find(t => t.id === ticketId);
            if (found) {
              setSelectedDetailsTicket(found);
              setIsScanModalOpen(false);
              scanner.clear();
            } else {
              alert(`Pase QR escaneado válido (${ticketId}) pero no se encontró la orden en este taller.`);
            }
          } else {
            if (decodedText.startsWith('TKT-')) {
              const found = tickets.find(t => t.id === decodedText);
              if (found) {
                setSelectedDetailsTicket(found);
                setIsScanModalOpen(false);
                scanner.clear();
              }
            } else {
              alert('Formato de código QR inválido. Escanea un Pase de Cliente TallerPro.');
            }
          }
        }, (error) => {
          // Ignore scanning logs
        });
        
        scannerInstance = scanner;
      } catch (err) {
        console.error("Scanner Error:", err);
      }
    }

    return () => {
      if (scannerInstance) {
        try {
          scannerInstance.clear();
        } catch (e) {
          // Already cleared
        }
      }
    };
  }, [isScanModalOpen, tickets]);

  const getWhatsAppTemplateText = (ticket, templateType) => {
    if (!ticket) return '';
    const trackerUrl = `${window.location.origin}/tracker/${ticket.id}`;
    switch(templateType) {
      case 'ingreso':
        return `Hola *${ticket.client}*, te informamos que tu vehículo *${ticket.vehicle}* ha ingresado a taller con el ID de ticket *${ticket.id}*. Puedes consultar el estatus en vivo aquí: ${trackerUrl}`;
      case 'presupuesto':
        return `Hola *${ticket.client}*, el presupuesto para la reparación de tu vehículo *${ticket.vehicle}* está listo para tu revisión y autorización. Por favor revísalo aquí: ${trackerUrl}`;
      case 'reparacion':
        return `Hola *${ticket.client}*, te informamos que hemos comenzado con los trabajos de reparación de tu vehículo *${ticket.vehicle}*. Sigue el avance paso a paso: ${trackerUrl}`;
      case 'listo':
        return `¡Buenas noticias *${ticket.client}*! Tu vehículo *${ticket.vehicle}* ha completado todas las pruebas de calidad y está listo para entrega. Puedes pasar a recogerlo. Ubicación del taller: https://maps.google.com/?q=TallerPro`;
      case 'pase_qr':
        return `Hola *${ticket.client}*, tu vehículo *${ticket.vehicle}* ha sido confirmado para reparación. Aquí tienes tu Pase QR de Cliente oficial para control y entrega en el taller: https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.origin + '/scan/' + ticket.id)}`;
      default:
        return '';
    }
  };

  const handleSendWhatsApp = () => {
    const cleanPhone = selectedWhatsAppTicket.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(customMessage)}`, '_blank');
    setSelectedWhatsAppTicket(null);
  };

  useEffect(() => {
    getTickets().then(all => setTickets(all)).catch(console.error);
  }, []);

  useEffect(() => {
    const handleGlobalClick = () => {
      setActiveMenuTicketId(null);
    };
    document.addEventListener('click', handleGlobalClick);
    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  const handleOpenEditModal = (ticket) => {
    setSelectedEditTicket(ticket);
    setEditClient(ticket.client || '');
    setEditVehicle(ticket.vehicle || '');
    setEditPhone(ticket.phone || '');
    setEditServiceType(ticket.serviceType || 'Mecánica');
    setEditInsuranceType(ticket.insuranceType || 'particular');
    setEditInsuranceCompany(ticket.insuranceCompany || '');
    setEditClaimNumber(ticket.claimNumber || '');
    setEditDamagedPanels(ticket.damagedPanels || []);
    setIsEditModalOpen(true);
  };

  const handleSaveEditTicket = async (e) => {
    e.preventDefault();
    if (!selectedEditTicket) return;
    
    const fields = {
      client: editClient,
      vehicle: editVehicle,
      phone: editPhone,
      serviceType: editServiceType,
      insuranceType: editInsuranceType,
      insuranceCompany: editInsuranceType === 'aseguranza' ? editInsuranceCompany : '',
      claimNumber: editInsuranceType === 'aseguranza' ? editClaimNumber : '',
      damagedPanels: editServiceType === 'Hojalatería y Pintura' ? editDamagedPanels : []
    };

    try {
      await updateTicket(selectedEditTicket.id, fields);
      const allTix = await getTickets();
      setTickets(allTix);
      
      if (selectedDetailsTicket && selectedDetailsTicket.id === selectedEditTicket.id) {
        const updatedDetails = allTix.find(t => t.id === selectedEditTicket.id);
        setSelectedDetailsTicket(updatedDetails);
      }
    } catch (err) {
      console.error(err);
    }
    
    setIsEditModalOpen(false);
    setSelectedEditTicket(null);
  };

  const handleQuickQC = async (partId, status) => {
    let notes = '';
    if (status === 'rejected') {
      notes = prompt('Por favor, ingresa el motivo del rechazo en el control de calidad:');
      if (notes === null) return;
      if (!notes.trim()) {
        alert('Debe ingresar un motivo para rechazar la pieza.');
        return;
      }
    }
    
    try {
      await updatePart(partId, {
        status: status,
        qcNotes: notes,
        inspectedBy: 'Técnico Principal',
        inspectedAt: new Date().toISOString(),
        qcChecked: status === 'approved' 
          ? { visual: true, packaging: true, compatibility: true, functional: true }
          : { visual: false, packaging: false, compatibility: false, functional: false }
      });
      
      const all = await getTickets();
      setTickets(all);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateBudgetStatus = async (ticketId, status) => {
    try {
      await updateBudgetStatus(ticketId, status);
      const all = await getTickets();
      setTickets(all);
      setSelectedDetailsTicket(prev => prev ? { ...prev, budgetStatus: status } : null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdvanceStage = async (ticket) => {
    const currentEvents = ticket.events || [1];
    const nextEventId = currentEvents.length + 1;
    if (nextEventId <= 6) {
      try {
        await addEventToTicket(ticket.id, nextEventId);
        
        const stages = ticket.serviceType === 'Hojalatería y Pintura'
          ? ['Recepción', 'Hojalatería', 'Pintura', 'Armado', 'Listo', 'Entregado']
          : ['Recepción', 'Diagnóstico', 'Reparación', 'Pruebas', 'Listo', 'Entregado'];
        const nextStepName = stages[nextEventId - 1] || ticket.status;
        
        await updateTimeLogs(ticket.id, nextStepName, 300);
        
        const updatedTickets = await getTickets();
        setTickets(updatedTickets);
        
        const updatedTicket = updatedTickets.find(t => t.id === ticket.id);
        if (selectedDetailsTicket && selectedDetailsTicket.id === ticket.id) {
          setSelectedDetailsTicket(updatedTicket);
        }
        
        if (updatedTicket && updatedTicket.phone) {
          const link = generateWhatsAppLink(
            updatedTicket.phone,
            updatedTicket.client,
            updatedTicket.vehicle,
            nextStepName,
            updatedTicket.id
          );
          if (link) {
            window.open(link, '_blank');
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    if (window.confirm(`¿Seguro que deseas eliminar la orden de trabajo ${ticketId}? Esta acción no se puede deshacer y borrará también las piezas del inventario vinculadas.`)) {
      try {
        await deleteTicket(ticketId);
        const all = await getTickets();
        setTickets(all);
        if (selectedDetailsTicket && selectedDetailsTicket.id === ticketId) {
          setSelectedDetailsTicket(null);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleAddTicket = async (e) => {
    e.preventDefault();
    if (!newClient || !newVehicle) return;
    
    try {
      const createdTicket = await addTicket(
        newClient,
        newVehicle,
        newServiceType,
        newPhone,
        newInsuranceType,
        newInsuranceCompany,
        newClaimNumber
      );
      
      if (newSignatureIntake) {
        await saveSignature(createdTicket.id, 'intake', newSignatureIntake);
      }

      for (const item of newBudgetItems) {
        if (item.type === 'Refacción') {
          await addPart({
            name: item.desc,
            brand: item.brand || 'Genérica',
            qty: item.qty || 1,
            vehicleCompatibility: newVehicle,
            ticketId: createdTicket.id,
            status: 'pending',
            cost: item.cost || 0,
            salePrice: item.price || 0,
            qcNotes: '',
            photo: '',
            qcChecked: { visual: false, packaging: false, compatibility: false, functional: false },
            inspectedBy: '',
            inspectedAt: ''
          });
        }
      }
      
      await updateTicket(createdTicket.id, {
        damagedPanels: newDamagedPanels,
        items: newBudgetItems,
        signatureIntake: newSignatureIntake
      });
      
      const allTix = await getTickets();
      setTickets(allTix);
      setIsModalOpen(false);
      
      setNewClient('');
      setNewVehicle('');
      setNewPhone('');
      setNewBudgetItems([]);
      setNewDamagedPanels([]);
      setNewSignatureIntake('');
      setNewServiceType('Mecánica');
      setNewInsuranceType('particular');
      setNewInsuranceCompany('');
      setNewClaimNumber('');
      
      const cleanPhone = newPhone.replace(/\D/g, '');
      if (cleanPhone) {
        const trackerUrl = `${window.location.origin}/tracker/${createdTicket.id}`;
        const autoMessage = `Hola *${newClient}*, te informamos que tu vehículo *${newVehicle}* ha ingresado a taller con el ID de ticket *${createdTicket.id}*. Por favor, ingresa al siguiente enlace para verificar la información de tu vehículo, conceptos y refacciones, y autorizar o rechazar la cotización directamente: ${trackerUrl}`;
        window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(autoMessage)}`, '_blank');
      }
    } catch (err) {
      console.error(err);
      alert('Error al crear la orden de trabajo');
    }
  };

  return (
    <div className="relative min-h-screen flex text-white overflow-hidden selection:bg-accent-primary/30">
      {/* Background */}
      <img 
        src="/assets/bg-internal.png" 
        className="full-screen-bg"
        alt="Dashboard Background"
      />
      <div className="bg-glow" />

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-80 liquid-glass border-r border-white/10 p-8 flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex justify-between items-center mb-12">
          <Logo size="sm" />
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            title="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>
        
        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => { setActiveTab('vehiculos'); setIsSidebarOpen(false); }} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold ${activeTab === 'vehiculos' ? 'bg-accent-primary/20 text-accent-primary border border-accent-primary/30' : 'text-gray-400 hover:bg-white/5 border border-transparent'}`}
          >
            <Car size={20} />
            Vehículos Activos
          </button>
          <button 
            onClick={() => { setActiveTab('clientes'); setIsSidebarOpen(false); }} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold ${activeTab === 'clientes' ? 'bg-accent-primary/20 text-accent-primary border border-accent-primary/30' : 'text-gray-400 hover:bg-white/5 border border-transparent'}`}
          >
            <Users size={20} />
            Clientes
          </button>
          <button 
            onClick={() => { setActiveTab('analiticas'); setIsSidebarOpen(false); }} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold ${activeTab === 'analiticas' ? 'bg-accent-primary/20 text-accent-primary border border-accent-primary/30' : 'text-gray-400 hover:bg-white/5 border border-transparent'}`}
          >
            <TrendingUp size={20} />
            Analíticas
          </button>
          <button 
            onClick={() => { setActiveTab('autopartes'); setIsSidebarOpen(false); }} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold ${activeTab === 'autopartes' ? 'bg-accent-primary/20 text-accent-primary border border-accent-primary/30' : 'text-gray-400 hover:bg-white/5 border border-transparent'}`}
          >
            <Package size={20} />
            Autopartes
          </button>
          <button 
            onClick={() => { setActiveTab('configuracion'); setIsSidebarOpen(false); }} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold ${activeTab === 'configuracion' ? 'bg-accent-primary/20 text-accent-primary border border-accent-primary/30' : 'text-gray-400 hover:bg-white/5 border border-transparent'}`}
          >
            <Settings size={20} />
            Configuración
          </button>
        </nav>

        <div className="pt-8 mt-auto border-t border-white/10 space-y-4">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5">
            {user?.picture && <img src={user.picture} className="w-10 h-10 rounded-full border border-accent-primary/30" />}
            <div className="overflow-hidden">
              <p className="font-bold truncate">{user?.name || 'Administrador'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-accent-primary hover:bg-accent-primary/10 transition-all font-medium"
          >
            <Home size={20} />
            Inicio
          </button>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-400/10 transition-all font-medium"
          >
            <LogOut size={20} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-12 overflow-y-auto relative z-10">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-12 animate-fade-in-up">
          <div className="flex items-center gap-4">
            {/* Hamburger Menu Button for Mobile */}
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all"
              title="Abrir menú"
            >
              <Menu size={24} />
            </button>
            
            {activeTab !== 'vehiculos' && (
              <button 
                onClick={() => setActiveTab('vehiculos')}
                className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-accent-primary/20 hover:text-accent-primary transition-all"
                title="Volver a Vehículos Activos"
              >
                <ChevronLeft size={24} />
              </button>
            )}
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-1">
                {activeTab === 'vehiculos' && 'Vehículos Activos'}
                {activeTab === 'clientes' && 'Clientes'}
                {activeTab === 'analiticas' && 'Rendimiento y Analíticas'}
                {activeTab === 'autopartes' && 'Autopartes e Inventario'}
                {activeTab === 'configuracion' && 'Configuración de Marca'}
              </h1>
              <p className="text-gray-400 text-sm font-medium">
                {activeTab === 'vehiculos' && 'Gestiona el flujo de trabajo de tu taller en tiempo real.'}
                {activeTab === 'clientes' && 'Directorio de clientes y vehículos registrados.'}
                {activeTab === 'analiticas' && 'Estadísticas clave e indicadores de rendimiento.'}
                {activeTab === 'autopartes' && 'Control de refacciones y estado de calidad (QC).'}
                {activeTab === 'configuracion' && 'Personaliza el logotipo, teléfono y datos fiscales de tu taller.'}
              </p>
            </div>
          </div>
          <div className="flex gap-3 self-end sm:self-auto flex-wrap justify-end">
            <button 
              onClick={() => setIsScanModalOpen(true)} 
              className="btn-secondary flex items-center gap-2 !border-accent-primary/30 !text-accent-primary hover:!bg-accent-primary/10 transition-all shadow-ui"
            >
              <QrCode size={18} />
              Escanear QR
            </button>
            <button 
              onClick={() => setIsModalOpen(true)} 
              className="btn-premium flex items-center gap-2 shadow-ui animate-pulse hover:animate-none"
            >
              <Plus size={24} />
              Nuevo Ingreso
            </button>
          </div>
        </header>

        {user?.id === 'demo_admin' && activeTab === 'vehiculos' && (
          <div className="card-morphism bg-accent-primary/10 border border-accent-primary/20 p-6 mb-8 animate-fade-in-up space-y-4">
            <h3 className="text-lg font-black text-accent-primary flex items-center gap-2">
              💡 Guía de Pruebas - Escaneo, Pase QR y Borrado
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-gray-300 font-semibold leading-relaxed">
              <div className="space-y-1">
                <span className="text-[9px] font-black text-accent-primary uppercase tracking-wider block">1. Escáner de Taller</span>
                <p>Haz clic en <strong>Escanear QR</strong> arriba. Puedes usar tu cámara web para escanear el QR del cliente o simular el escaneo seleccionando un auto para ver cómo se abre su orden de inmediato.</p>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-black text-accent-primary uppercase tracking-wider block">2. Confirmar y Generar QR</span>
                <p>Busca la orden en la tabla, dale clic al botón <strong>TRACKER</strong> de un coche (ej. <strong>TKT-X821</strong>), y en la pestaña del cliente haz clic en <strong>Aceptar Reparación</strong> para simular al cliente. Se generará su Pase QR exclusivo.</p>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-black text-accent-primary uppercase tracking-wider block">3. Eliminar Vehículos</span>
                <p>Haz clic en el botón rojo de <strong>ELIMINAR</strong> en la tabla de vehículos o dentro del modal de <strong>DETALLES</strong>. La orden y todas sus piezas vinculadas en "Autopartes" se borrarán del sistema.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vehiculos' ? (
          <div className="card-morphism animate-fade-in-up [animation-delay:200ms]">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 text-sm font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Ticket</th>
                    <th className="px-6 py-4">Cliente</th>
                    <th className="px-6 py-4">Vehículo</th>
                    <th className="px-6 py-4">Tipo</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {tickets.map(ticket => (
                    <tr key={ticket.id} className="group hover:bg-white/5 transition-colors">
                      <td className="px-6 py-6 font-black text-accent-primary">{ticket.id}</td>
                      <td className="px-6 py-6 font-bold">{ticket.client}</td>
                      <td className="px-6 py-6">
                        <div className="font-bold text-white">{ticket.vehicle}</div>
                        {ticket.insuranceType === 'aseguranza' ? (
                          <div className="text-[10px] text-accent-primary font-black mt-1 uppercase flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse" />
                            Aseguradora: {ticket.insuranceCompany} &bull; Siniestro: #{ticket.claimNumber}
                          </div>
                        ) : (
                          <div className="text-[10px] text-gray-500 font-bold mt-1 uppercase">
                            Servicio Particular
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-6 text-xs text-gray-500">{ticket.serviceType || 'Mecánica'}</td>
                      <td className="px-6 py-6">
                        <div className="flex flex-col gap-2 items-start">
                          <span className="px-3 py-1 rounded-full bg-accent-primary/10 text-accent-primary text-xs font-bold border border-accent-primary/20">
                            {ticket.status.toUpperCase()}
                          </span>
                          {(!ticket.events || ticket.events.length < 5) ? (
                            <button
                              onClick={() => handleAdvanceStage(ticket)}
                              className="text-[10px] font-black text-accent-primary hover:text-white transition-colors bg-accent-primary/10 hover:bg-accent-primary/30 border border-accent-primary/30 px-2 py-0.5 rounded flex items-center gap-1 mt-1 uppercase"
                              title="Avanzar de etapa"
                            >
                              Avanzar &rarr;
                            </button>
                          ) : (
                            <span className="text-[9px] font-bold text-accent-success flex items-center gap-1 mt-1 uppercase tracking-wider">
                              <Check size={10}/> Listo / Entregado
                            </span>
                          )}
                          {ticket.budgetStatus === 'approved' && (
                            <span className="text-[10px] font-bold text-accent-success flex items-center gap-1">
                              <Check size={12}/> PRESUPUESTO OK
                            </span>
                          )}
                          {ticket.budgetStatus === 'declined' && (
                            <span className="text-[10px] font-bold text-red-400 flex items-center gap-1">
                              <X size={12}/> DECLINADO
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-6 relative">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setSelectedDetailsTicket(ticket)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent-primary/10 hover:bg-accent-primary text-accent-primary hover:text-black transition-all text-xs font-black uppercase tracking-wider"
                            title="Ver detalles de la orden"
                          >
                            <Eye size={14} />
                            Detalles
                          </button>
                          
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuTicketId(activeMenuTicketId === ticket.id ? null : ticket.id);
                              }}
                              className={`p-2 rounded-xl border transition-all ${activeMenuTicketId === ticket.id ? 'bg-accent-primary/20 border-accent-primary text-accent-primary' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'}`}
                              title="Acciones secundarias"
                            >
                              <MoreVertical size={16} />
                            </button>

                            {activeMenuTicketId === ticket.id && (
                              <div 
                                className="absolute right-0 mt-2 w-48 rounded-2xl border border-white/10 bg-[#0d1117]/95 backdrop-blur-sm shadow-2xl p-2 z-30 space-y-1 animate-fade-in-up"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  onClick={() => {
                                    handleOpenEditModal(ticket);
                                    setActiveMenuTicketId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all text-left"
                                >
                                  <Edit size={14} className="text-gray-500" /> Editar Vehículo
                                </button>
                                <button
                                  onClick={() => {
                                    navigate(`/tracker/${ticket.id}`);
                                    setActiveMenuTicketId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all text-left"
                                >
                                  <LinkIcon size={14} className="text-gray-500" /> Ver Tracker
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedBillingTicket(ticket);
                                    setActiveMenuTicketId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-300 hover:text-accent-success hover:bg-accent-success/10 rounded-xl transition-all text-left"
                                >
                                  <Receipt size={14} className="text-gray-500" /> Facturación
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedWhatsAppTicket(ticket);
                                    setCustomMessage(getWhatsAppTemplateText(ticket, 'ingreso'));
                                    setSelectedTemplate('ingreso');
                                    setActiveMenuTicketId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-300 hover:text-[#25D366] hover:bg-[#25D366]/10 rounded-xl transition-all text-left"
                                >
                                  <MessageSquare size={14} className="text-gray-500" /> Notificar (WhatsApp)
                                </button>
                                <div className="border-t border-white/5 my-1" />
                                <button
                                  onClick={() => {
                                    handleDeleteTicket(ticket.id);
                                    setActiveMenuTicketId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-400 hover:text-white hover:bg-red-500/20 rounded-xl transition-all text-left"
                                >
                                  <Trash2 size={14} /> Eliminar Orden
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'analiticas' ? (
          <Analytics />
        ) : activeTab === 'autopartes' ? (
          <PartsInventory />
        ) : activeTab === 'configuracion' ? (
          <SettingsPanel />
        ) : (
          <div className="card-morphism animate-fade-in-up [animation-delay:200ms]">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 text-sm font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Cliente</th>
                    <th className="px-6 py-4">Vehículo(s)</th>
                    <th className="px-6 py-4">Tickets Activos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {Array.from(new Set(tickets.map(t => t.client))).map(clientName => {
                    const clientTickets = tickets.filter(t => t.client === clientName);
                    return (
                      <tr key={clientName} className="group hover:bg-white/5 transition-colors">
                        <td className="px-6 py-6 font-black text-accent-primary">{clientName}</td>
                        <td className="px-6 py-6 text-gray-400 font-medium">{clientTickets.map(t => t.vehicle).join(', ')}</td>
                        <td className="px-6 py-6 font-bold">{clientTickets.length}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Nuevo Ingreso */}
        {isModalOpen && (
          <div 
            className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex justify-center items-start p-4 md:p-10 cursor-pointer"
            onClick={() => setIsModalOpen(false)}
          >
            <div 
              className="liquid-glass p-8 md:p-10 rounded-[2.5rem] w-full max-w-xl shadow-ui border-white/20 animate-fade-in-up my-auto cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              <header className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-black">Registrar Vehículo</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                  <X size={28} />
                </button>
              </header>
              
              <form onSubmit={handleAddTicket} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 ml-1">NOMBRE DEL CLIENTE</label>
                  <input 
                    type="text" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-accent-primary transition-colors"
                    placeholder="Ej. Juan Pérez" 
                    value={newClient}
                    onChange={(e) => setNewClient(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 ml-1">VEHÍCULO (MARCA, MODELO, AÑO)</label>
                  <input 
                    type="text" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-accent-primary transition-colors"
                    placeholder="Ej. Toyota Corolla 2020" 
                    value={newVehicle}
                    onChange={(e) => setNewVehicle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 ml-1">TELÉFONO DE CONTACTO (WHATSAPP)</label>
                  <input 
                    type="tel" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-accent-primary transition-colors"
                    placeholder="Ej. 521234567890" 
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 ml-1 uppercase">Tipo de Servicio</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      type="button"
                      onClick={() => setNewServiceType('Mecánica')}
                      className={`py-3 rounded-xl font-bold border transition-all ${newServiceType === 'Mecánica' ? 'bg-accent-primary/20 border-accent-primary text-accent-primary' : 'bg-white/5 border-white/10 text-gray-400'}`}
                    >
                      Mecánica
                    </button>
                    <button 
                      type="button"
                      onClick={() => setNewServiceType('Hojalatería y Pintura')}
                      className={`py-3 rounded-xl font-bold border transition-all ${newServiceType === 'Hojalatería y Pintura' ? 'bg-accent-primary/20 border-accent-primary text-accent-primary' : 'bg-white/5 border-white/10 text-gray-400'}`}
                    >
                      Hojalatería y Pintura
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 ml-1 uppercase">Clasificación del Trabajo</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      type="button"
                      onClick={() => setNewInsuranceType('particular')}
                      className={`py-3 rounded-xl font-bold border transition-all ${newInsuranceType === 'particular' ? 'bg-accent-primary/20 border-accent-primary text-accent-primary' : 'bg-white/5 border-white/10 text-gray-400'}`}
                    >
                      Particular
                    </button>
                    <button 
                      type="button"
                      onClick={() => setNewInsuranceType('aseguranza')}
                      className={`py-3 rounded-xl font-bold border transition-all ${newInsuranceType === 'aseguranza' ? 'bg-accent-primary/20 border-accent-primary text-accent-primary' : 'bg-white/5 border-white/10 text-gray-400'}`}
                    >
                      Aseguradora
                    </button>
                  </div>
                </div>

                {newInsuranceType === 'aseguranza' && (
                  <div className="grid grid-cols-2 gap-4 animate-fade-in-up">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-400 ml-1">COMPAÑÍA ASEGURADORA</label>
                      <input 
                        type="text" 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-accent-primary transition-colors text-sm"
                        placeholder="Ej. GNP, Qualitas" 
                        value={newInsuranceCompany}
                        onChange={(e) => setNewInsuranceCompany(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-400 ml-1">NÚMERO DE SINIESTRO</label>
                      <input 
                        type="text" 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-accent-primary transition-colors text-sm"
                        placeholder="Ej. SIN-83924" 
                        value={newClaimNumber}
                        onChange={(e) => setNewClaimNumber(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}

                {newServiceType === 'Hojalatería y Pintura' && (
                  <div className="space-y-2 pt-4 border-t border-white/10 animate-fade-in-up">
                    <label className="text-sm font-bold text-gray-400 ml-1 uppercase">Mapeo de Daños Inicial</label>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                      <InteractiveVehicleSVG 
                        damagedPanels={newDamagedPanels} 
                        onChange={setNewDamagedPanels} 
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-4 pt-4 border-t border-white/10 animate-fade-in-up">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-gray-400 ml-1 uppercase">Presupuesto Inicial (Conceptos y Refacciones)</label>
                    <button 
                      type="button" 
                      onClick={() => {
                        setNewBudgetItems([...newBudgetItems, {
                          id: Date.now() + Math.random(),
                          desc: '',
                          type: 'Mano de Obra',
                          qty: 1,
                          price: 0,
                          cost: 0,
                          brand: 'Genérica',
                          satKey: '78181500'
                        }]);
                      }}
                      className="btn-premium !py-1.5 !px-3 text-xs flex items-center gap-1 font-black"
                    >
                      <Plus size={14} /> Concepto
                    </button>
                  </div>
                  
                  {newBudgetItems.length > 0 ? (
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                      {newBudgetItems.map((item, idx) => (
                        <div key={item.id} className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3 relative animate-fade-in">
                          <button 
                            type="button" 
                            onClick={() => setNewBudgetItems(newBudgetItems.filter(x => x.id !== item.id))} 
                            className="absolute top-2 right-2 text-gray-400 hover:text-red-400 p-1"
                          >
                            <X size={16} />
                          </button>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1 col-span-2">
                              <label className="text-[10px] font-black text-gray-500 ml-1 uppercase">Descripción del concepto</label>
                              <input 
                                type="text"
                                placeholder="Ej. Cambio de Amortiguadores Delanteros"
                                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-accent-primary text-xs font-semibold"
                                value={item.desc}
                                onChange={(e) => {
                                  const desc = e.target.value;
                                  const suggested = getSuggestedSatKey(desc, item.type, newServiceType);
                                  const updated = [...newBudgetItems];
                                  updated[idx] = { ...item, desc, satKey: suggested };
                                  setNewBudgetItems(updated);
                                }}
                                required
                              />
                            </div>
                            
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-gray-500 ml-1 uppercase">Tipo</label>
                              <select
                                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-accent-primary text-xs font-bold"
                                value={item.type}
                                onChange={(e) => {
                                  const type = e.target.value;
                                  const suggested = getSuggestedSatKey(item.desc, type, newServiceType);
                                  const updated = [...newBudgetItems];
                                  updated[idx] = { ...item, type, satKey: suggested };
                                  setNewBudgetItems(updated);
                                }}
                              >
                                <option value="Mano de Obra">Mano de Obra</option>
                                <option value="Refacción">Refacción</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-gray-500 ml-1 uppercase">Cantidad</label>
                              <input 
                                type="number"
                                min="1"
                                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-accent-primary text-xs font-bold"
                                value={item.qty}
                                onChange={(e) => {
                                  const updated = [...newBudgetItems];
                                  updated[idx] = { ...item, qty: parseInt(e.target.value) || 1 };
                                  setNewBudgetItems(updated);
                                }}
                                required
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-gray-500 ml-1 uppercase">P. Venta Unitario ($)</label>
                              <input 
                                type="number"
                                min="0"
                                step="0.01"
                                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-accent-primary text-xs font-bold font-mono"
                                value={item.price || ''}
                                placeholder="0.00"
                                onChange={(e) => {
                                  const updated = [...newBudgetItems];
                                  updated[idx] = { ...item, price: parseFloat(e.target.value) || 0 };
                                  setNewBudgetItems(updated);
                                }}
                                required
                              />
                            </div>

                            {item.type === 'Refacción' && (
                              <>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black text-gray-500 ml-1 uppercase">Costo Unitario ($)</label>
                                  <input 
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-accent-primary text-xs font-bold font-mono"
                                    value={item.cost || ''}
                                    placeholder="0.00"
                                    onChange={(e) => {
                                      const updated = [...newBudgetItems];
                                      updated[idx] = { ...item, cost: parseFloat(e.target.value) || 0 };
                                      setNewBudgetItems(updated);
                                    }}
                                    required
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black text-gray-500 ml-1 uppercase">Marca</label>
                                  <input 
                                    type="text"
                                    placeholder="Ej. Bosch"
                                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-accent-primary text-xs font-semibold"
                                    value={item.brand || ''}
                                    onChange={(e) => {
                                      const updated = [...newBudgetItems];
                                      updated[idx] = { ...item, brand: e.target.value };
                                      setNewBudgetItems(updated);
                                    }}
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-between items-center text-xs font-black text-accent-primary uppercase tracking-wider pt-2">
                        <span>Total de conceptos</span>
                        <span className="font-mono text-sm">${newBudgetItems.reduce((acc, item) => acc + (item.qty * item.price), 0).toLocaleString()}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic ml-1">No hay conceptos agregados aún.</p>
                  )}
                </div>

                <div className="space-y-2 pt-4 border-t border-white/10 animate-fade-in-up">
                  <label className="text-sm font-bold text-gray-400 ml-1 uppercase">Firma del Cliente (Conformidad)</label>
                  <SignatureCanvas 
                    onChange={setNewSignatureIntake} 
                    placeholder="Dibuja la firma del cliente" 
                  />
                </div>
                
                <button type="submit" className="btn-premium w-full py-4 text-lg mt-4">
                  Generar Orden de Trabajo
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Modal Escáner QR de Cliente */}
        {isScanModalOpen && (
          <div 
            className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex justify-center items-start p-4 md:p-10 cursor-pointer"
            onClick={() => setIsScanModalOpen(false)}
          >
            <div 
              className="liquid-glass p-8 md:p-10 rounded-[2.5rem] w-full max-w-md shadow-ui border-white/20 animate-fade-in-up my-auto cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              <header className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black">Escanear QR de Cliente</h2>
                <button onClick={() => setIsScanModalOpen(false)} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                  <X size={24} />
                </button>
              </header>

              <div className="space-y-4">
                <p className="text-xs text-gray-400 font-medium leading-relaxed">
                  Apunta con la cámara al Pase QR de Cliente oficial. El sistema abrirá automáticamente la orden de trabajo.
                </p>

                {/* Container for html5-qrcode scanner */}
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d1117]">
                  <div id="qr-reader-workshop" className="w-full text-white bg-transparent" />
                </div>

                {/* Simulated Scan Selector */}
                <div className="border-t border-white/10 pt-6 mt-6 space-y-4">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Simular Escaneo de Pase QR (Demo)</p>
                  <div className="flex gap-2">
                    <select 
                      className="flex-1 bg-slate-900 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-accent-primary transition-colors text-sm font-semibold"
                      value={scanSimulateId}
                      onChange={(e) => setScanSimulateId(e.target.value)}
                    >
                      <option value="">-- Selecciona un vehículo --</option>
                      {tickets.filter(t => t.budgetStatus === 'approved').map(t => (
                        <option key={t.id} value={t.id}>{t.id} - {t.vehicle} ({t.client})</option>
                      ))}
                      {tickets.filter(t => t.budgetStatus !== 'approved').length > 0 && (
                        <optgroup label="No Autorizados (Demo)">
                          {tickets.filter(t => t.budgetStatus !== 'approved').map(t => (
                            <option key={t.id} value={t.id}>{t.id} - {t.vehicle} ({t.client})</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                    <button 
                      onClick={() => {
                        if (scanSimulateId) {
                          const found = tickets.find(t => t.id === scanSimulateId);
                          if (found) {
                            setSelectedDetailsTicket(found);
                            setIsScanModalOpen(false);
                          }
                        }
                      }}
                      disabled={!scanSimulateId}
                      className="btn-premium !py-3 !px-4 rounded-xl text-xs font-black uppercase"
                    >
                      Simular
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal WhatsApp Templates */}
        {selectedWhatsAppTicket && (
          <div 
            className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex justify-center items-start p-4 md:p-10 cursor-pointer"
            onClick={() => setSelectedWhatsAppTicket(null)}
          >
            <div 
              className="liquid-glass p-8 md:p-10 rounded-[2.5rem] w-full max-w-lg shadow-ui border-white/20 animate-fade-in-up my-auto cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              <header className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black flex items-center gap-2">
                  <MessageSquare className="text-accent-primary" />
                  Notificaciones WhatsApp
                </h2>
                <button onClick={() => setSelectedWhatsAppTicket(null)} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                  <X size={24} />
                </button>
              </header>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase">Selecciona una Plantilla</label>
                  <div className="grid grid-cols-2 gap-2 mt-1.5">
                    {[
                      { id: 'ingreso', label: 'Ingreso Vehículo' },
                      { id: 'presupuesto', label: 'Presupuesto Listo' },
                      { id: 'reparacion', label: 'Reparación Iniciada' },
                      { id: 'listo', label: 'Listo para Entrega' },
                      { id: 'pase_qr', label: 'Pase QR Cliente' }
                    ].map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setSelectedTemplate(t.id);
                          setCustomMessage(getWhatsAppTemplateText(selectedWhatsAppTicket, t.id));
                        }}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all text-center ${selectedTemplate === t.id ? 'bg-accent-primary/20 border-accent-primary text-accent-primary' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">Mensaje a Enviar</label>
                  <textarea
                    className="w-full bg-[#0d1117] border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-accent-primary transition-colors text-sm font-semibold h-36 resize-none leading-relaxed"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                  />
                </div>

                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-xs text-gray-500 leading-snug">
                  <span className="font-bold text-accent-primary uppercase tracking-wider block mb-1">Destinatario</span>
                  {selectedWhatsAppTicket.client} &bull; <span className="font-mono">{selectedWhatsAppTicket.phone}</span>
                </div>

                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="btn-premium w-full py-4 text-sm font-black uppercase tracking-wider mt-4 flex items-center justify-center gap-2"
                >
                  <MessageSquare size={18} />
                  Enviar Mensaje por WhatsApp
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Billing */}
        {selectedBillingTicket && (
          <Billing 
            ticket={selectedBillingTicket} 
            onClose={() => setSelectedBillingTicket(null)} 
            onUpdate={(updated) => {
              setTickets(tickets.map(t => t.id === updated.id ? updated : t));
              setSelectedBillingTicket(updated);
            }}
          />
        )}

        {/* Modal Detalles de Orden */}
        {selectedDetailsTicket && (
          <div 
            className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex justify-center items-start p-4 md:p-10 cursor-pointer"
            onClick={() => setSelectedDetailsTicket(null)}
          >
            <div 
              className="liquid-glass p-8 md:p-10 rounded-[2.5rem] w-full max-w-4xl shadow-ui border-white/20 animate-fade-in-up my-auto cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                  <span className="text-[10px] font-black tracking-widest text-accent-primary uppercase">Detalles de la Orden</span>
                  <h2 className="text-3xl font-black text-white">{selectedDetailsTicket.id}</h2>
                  <p className="text-xs text-gray-400 font-bold uppercase">{selectedDetailsTicket.client} &bull; {selectedDetailsTicket.phone}</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <button 
                    onClick={() => handleOpenEditModal(selectedDetailsTicket)}
                    className="btn-premium !py-1.5 !px-3 text-xs flex items-center gap-1 font-black"
                  >
                    <Edit size={14} /> EDITAR
                  </button>
                  <button 
                    onClick={() => handleDeleteTicket(selectedDetailsTicket.id)}
                    className="btn-secondary !border-red-500/30 !text-red-400 hover:!bg-red-500/10 !py-1.5 !px-3 text-xs flex items-center gap-1 font-black"
                  >
                    <Trash2 size={14} /> ELIMINAR
                  </button>
                  <button 
                    onClick={() => setSelectedDetailsTicket(null)} 
                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                  >
                    <X size={28} />
                  </button>
                </div>
              </header>

              {(() => {
                const stagesList = selectedDetailsTicket.serviceType === 'Hojalatería y Pintura'
                  ? ['Recepción', 'Hojalatería', 'Pintura', 'Armado', 'Listo', 'Entregado']
                  : ['Recepción', 'Diagnóstico', 'Reparación', 'Pruebas', 'Listo', 'Entregado'];
                const currentEventsList = selectedDetailsTicket.events || [1];
                const activeStageNum = currentEventsList.length;
                
                return (
                  <div className="mb-8 p-6 card-morphism !bg-white/5 border-none">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-5 text-center sm:text-left">
                      Progreso del Vehículo (Haz clic en una etapa para cambiarla)
                    </p>
                    <div className="relative flex justify-between items-center w-full px-2">
                      {/* Connecting Line */}
                      <div className="absolute left-6 right-6 h-[2px] bg-white/10 z-0" />
                      
                      {/* Completed connecting line */}
                      <div 
                        className="absolute left-6 h-[2px] bg-accent-primary transition-all duration-500 z-0"
                        style={{
                          width: `calc(${((activeStageNum - 1) / 5) * 100}% - 12px)`
                        }}
                      />
                      
                      {stagesList.map((stageName, index) => {
                        const stageNum = index + 1;
                        const isCompleted = currentEventsList.includes(stageNum);
                        const isActive = stageNum === activeStageNum;
                        
                        return (
                          <button
                            key={stageName}
                            onClick={async () => {
                              const evts = [];
                              for (let i = 1; i <= stageNum; i++) {
                                evts.push(i);
                              }
                              const closedAt = (stageNum === 6 && !selectedDetailsTicket.closedAt)
                                ? new Date().toISOString()
                                : selectedDetailsTicket.closedAt;
                                
                              const fields = {
                                events: evts,
                                status: stageName,
                                closedAt
                              };
                              
                              try {
                                const updated = await updateTicket(selectedDetailsTicket.id, fields);
                                if (updated) {
                                  const all = await getTickets();
                                  setTickets(all);
                                  setSelectedDetailsTicket(updated);
                                  
                                  if (updated.phone) {
                                    const link = generateWhatsAppLink(updated.phone, updated.client, updated.vehicle, stageName, updated.id);
                                    if (link) window.open(link, '_blank');
                                  }
                                }
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                            className="relative z-10 flex flex-col items-center group cursor-pointer focus:outline-none"
                            title={`Cambiar a etapa: ${stageName}`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all duration-300 border
                              ${isCompleted ? 'bg-accent-success border-accent-success text-black scale-110 shadow-[0_0_15px_rgba(0,229,153,0.3)]' :
                                isActive ? 'bg-accent-primary border-accent-primary text-black scale-125 shadow-[0_0_20px_rgba(0,242,255,0.4)] animate-pulse' :
                                'bg-[#080b10] border-white/20 text-gray-500 hover:border-white/40 hover:text-white'}`}
                            >
                              {stageNum}
                            </div>
                            <span className={`hidden sm:inline text-[9px] font-black uppercase tracking-wider mt-2.5 transition-colors duration-300
                              ${isCompleted ? 'text-accent-success' : isActive ? 'text-accent-primary' : 'text-gray-500 group-hover:text-white'}`}
                            >
                              {stageName}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                {/* Left Column: Client & Vehicle Info */}
                <div className="space-y-6">
                  <div className="card-morphism !bg-white/5 p-6 space-y-4">
                    <h3 className="text-lg font-bold text-accent-primary border-b border-white/10 pb-2">Información</h3>
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase">Vehículo</p>
                      <p className="font-bold text-white">{selectedDetailsTicket.vehicle}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase">Tipo de Servicio</p>
                      <p className="font-bold text-white">{selectedDetailsTicket.serviceType || 'Mecánica'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase">Estado Actual</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="inline-block px-3 py-1 rounded-full bg-accent-primary/10 text-accent-primary text-xs font-bold border border-accent-primary/20">
                          {selectedDetailsTicket.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase">Clasificación</p>
                      <p className="font-bold text-white capitalize">{selectedDetailsTicket.insuranceType || 'particular'}</p>
                      {selectedDetailsTicket.insuranceType === 'aseguranza' && (
                        <div className="mt-1 text-xs text-accent-primary font-bold">
                          Compañía: {selectedDetailsTicket.insuranceCompany}<br/>
                          Siniestro: #{selectedDetailsTicket.claimNumber}
                        </div>
                      )}
                    </div>
                    {selectedDetailsTicket.budgetStatus === 'approved' && (
                      <div className="border-t border-white/10 pt-4 flex flex-col items-center text-center space-y-2">
                        <p className="text-[10px] text-gray-500 font-bold uppercase">Pase QR de Cliente (Activo)</p>
                        <div className="bg-white p-2 rounded-2xl inline-block shadow-md">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`${window.location.origin}/scan/${selectedDetailsTicket.id}`)}`}
                            alt="QR Cliente"
                            className="w-24 h-24 block shadow-inner"
                          />
                        </div>
                        <p className="text-[9px] text-gray-400 font-medium">Este QR es exclusivo para el cliente. Escanéalo en el taller para identificar el auto.</p>
                      </div>
                    )}
                  </div>

                  {/* Time spent */}
                  {selectedDetailsTicket.timeLogs && Object.keys(selectedDetailsTicket.timeLogs).length > 0 && (
                    <div className="card-morphism !bg-white/5 p-6">
                      <h3 className="text-sm font-bold text-gray-400 uppercase border-b border-white/10 pb-2 mb-3">Tiempos por Etapa</h3>
                      <div className="space-y-2 text-xs">
                        {Object.entries(selectedDetailsTicket.timeLogs).map(([stage, sec]) => {
                          const mins = Math.floor(sec / 60);
                          const hours = Math.floor(mins / 60);
                          const displayTime = hours > 0 
                            ? `${hours}h ${mins % 60}m` 
                            : `${mins}m ${sec % 60}s`;
                          return (
                            <div key={stage} className="flex justify-between border-b border-white/5 pb-1">
                              <span className="text-gray-400 font-semibold">{stage}</span>
                              <span className="text-white font-mono font-bold">{displayTime}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {/* Checklist Rápido */}
                  {selectedDetailsTicket.inventoryChecklist && (
                    <div className="card-morphism !bg-white/5 p-6 space-y-4">
                      <h3 className="text-sm font-bold text-gray-400 uppercase border-b border-white/10 pb-2">Checklist de Recepción</h3>
                      <div className="space-y-2 text-xs">
                        {Object.entries(selectedDetailsTicket.inventoryChecklist).map(([key, val]) => {
                          const label = key === 'gasolina' ? 'Gasolina (>50%)' : key === 'refaccion' ? 'Llanta Refacción' : key === 'gato' ? 'Gato Hidráulico' : key === 'herramienta' ? 'Herr. Básica' : 'Estéreo / Pantalla';
                          return (
                            <div key={key} className="flex items-center gap-2 font-bold">
                              <span className={`w-2 h-2 rounded-full ${val ? 'bg-accent-success' : 'bg-gray-600'}`} />
                              <span className={val ? 'text-white' : 'text-gray-500 line-through'}>{label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Evidencia Visual (Multiple photos) */}
                  {selectedDetailsTicket.photos && Object.keys(selectedDetailsTicket.photos).some(k => ['frontal', 'trasera', 'lat_izq', 'lat_der', 'odometro'].includes(k)) && (
                    <div className="card-morphism !bg-white/5 p-6 space-y-4">
                      <h3 className="text-sm font-bold text-gray-400 uppercase border-b border-white/10 pb-2">Evidencia Visual</h3>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {['frontal', 'trasera', 'lat_izq', 'lat_der', 'odometro'].map(slotId => {
                          const photoUrl = selectedDetailsTicket.photos[slotId];
                          if (!photoUrl) return null;
                          const label = slotId === 'frontal' ? 'Frontal' : slotId === 'trasera' ? 'Trasera' : slotId === 'lat_izq' ? 'Lateral Izq.' : slotId === 'lat_der' ? 'Lateral Der.' : 'Tablero/Odómetro';
                          return (
                            <div key={slotId} className="relative aspect-square rounded-xl overflow-hidden border border-white/10">
                              <img src={photoUrl} alt={label} className="w-full h-full object-cover" />
                              <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1 text-center backdrop-blur-sm">
                                <span className="text-[8px] font-bold text-accent-primary uppercase truncate block">{label}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Middle Column: Budget & QC parts */}
                <div className="md:col-span-2 space-y-6">
                  {/* Budget items list */}
                  <div className="card-morphism !bg-white/5 p-6 space-y-4">
                    <div className="flex justify-between items-center border-b border-white/10 pb-2">
                      <h3 className="text-lg font-bold text-accent-primary">Conceptos y Presupuesto</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 font-bold">Presupuesto:</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border
                          ${selectedDetailsTicket.budgetStatus === 'approved' ? 'bg-accent-success/10 border-accent-success/20 text-accent-success' : 
                            selectedDetailsTicket.budgetStatus === 'declined' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 
                            'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}
                        >
                          {selectedDetailsTicket.budgetStatus === 'approved' ? 'Aprobado' : 
                           selectedDetailsTicket.budgetStatus === 'declined' ? 'Declinado' : 'Pendiente'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                      {!selectedDetailsTicket.items || selectedDetailsTicket.items.length === 0 ? (
                        <p className="text-xs text-gray-500 italic py-4">No hay conceptos definidos.</p>
                      ) : (
                        selectedDetailsTicket.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                            <div>
                              <p className="font-bold text-white">{item.desc}</p>
                              <p className="text-[10px] text-gray-500">{item.type} &bull; Cant: {item.qty}</p>
                            </div>
                            <span className="font-bold text-accent-primary font-mono">${(item.qty * item.price).toLocaleString()}</span>
                          </div>
                        ))
                      )}
                    </div>

                    {selectedDetailsTicket.items && selectedDetailsTicket.items.length > 0 && (
                      <div className="flex justify-between items-center pt-2 border-t border-white/10 text-sm">
                        <span className="font-bold text-gray-400">Total Estimado</span>
                        <span className="font-black text-white text-base">${selectedDetailsTicket.items.reduce((acc, item) => acc + (item.qty * item.price), 0).toLocaleString()}</span>
                      </div>
                    )}

                    {/* Quick action to approve/decline budget */}
                    <div className="flex gap-2 justify-end pt-2">
                      {selectedDetailsTicket.budgetStatus !== 'approved' && (
                        <button 
                          onClick={() => handleUpdateBudgetStatus(selectedDetailsTicket.id, 'approved')}
                          className="px-3 py-1.5 rounded-lg text-xs font-black bg-accent-success/20 border border-accent-success text-accent-success hover:bg-accent-success hover:text-black transition-all"
                        >
                          Autorizar Presupuesto
                        </button>
                      )}
                      {selectedDetailsTicket.budgetStatus !== 'declined' && (
                        <button 
                          onClick={() => handleUpdateBudgetStatus(selectedDetailsTicket.id, 'declined')}
                          className="px-3 py-1.5 rounded-lg text-xs font-black bg-red-500/20 border border-red-500 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                        >
                          Declinar Presupuesto
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Linked parts inventory with QC controls */}
                  <div className="card-morphism !bg-white/5 p-6 space-y-4">
                    <h3 className="text-lg font-bold text-accent-primary border-b border-white/10 pb-2">Autopartes y Control de Calidad</h3>
                    <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
                      {detailsParts.length === 0 ? (
                        <p className="text-xs text-gray-500 italic py-4">No hay refacciones vinculadas en el inventario.</p>
                      ) : (
                        detailsParts.map(part => (
                          <div key={part.id} className="p-3 bg-white/5 rounded-xl border border-white/10 flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-xs">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[9px] text-accent-primary">{part.id}</span>
                                <span className="font-bold text-white">{part.name}</span>
                              </div>
                              <p className="text-[10px] text-gray-500 uppercase mt-0.5">Marca: {part.brand} &bull; Cantidad: {part.qty}</p>
                              {part.qcNotes && <p className="text-[10px] text-red-400 mt-1 italic">QC: {part.qcNotes}</p>}
                            </div>

                            <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider
                                ${part.status === 'approved' ? 'bg-accent-success/10 border-accent-success/20 text-accent-success' : 
                                  part.status === 'rejected' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 
                                  'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}
                              >
                                {part.status}
                              </span>
                              
                              <div className="flex gap-1.5">
                                <button 
                                  onClick={() => handleQuickQC(part.id, 'approved')}
                                  className="p-1 rounded bg-accent-success/10 hover:bg-accent-success text-accent-success hover:text-black border border-accent-success/30 transition-all"
                                  title="Aprobar QC"
                                >
                                  <Check size={14} />
                                </button>
                                <button 
                                  onClick={() => handleQuickQC(part.id, 'rejected')}
                                  className="p-1 rounded bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 transition-all"
                                  title="Rechazar QC"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Area: Signatures and damage map if Hojalatería */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6 border-t border-white/10">
                <div>
                  <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-3">Mapeo de Daños</h4>
                  {selectedDetailsTicket.damagedPanels && selectedDetailsTicket.damagedPanels.length > 0 ? (
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex justify-center">
                      <InteractiveVehicleSVG 
                        damagedPanels={selectedDetailsTicket.damagedPanels} 
                        readOnly={true} 
                      />
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic">Sin mapeo de daños registrado.</p>
                  )}
                </div>

                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-3">Firma de Conformidad (Ingreso)</h4>
                    {selectedDetailsTicket.signatureIntake ? (
                      <div className="bg-white p-3 rounded-2xl border border-white/10 flex items-center justify-center h-32">
                        <img src={selectedDetailsTicket.signatureIntake} alt="Firma Ingreso" className="max-h-full max-w-full object-contain" />
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 italic">Sin firma de ingreso registrada.</p>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-3">Firma de Entrega (Conformidad)</h4>
                    {selectedDetailsTicket.signatureDelivery ? (
                      <div className="bg-white p-3 rounded-2xl border border-white/10 flex items-center justify-center h-32">
                        <img src={selectedDetailsTicket.signatureDelivery} alt="Firma Entrega" className="max-h-full max-w-full object-contain" />
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 italic">Vehículo no entregado o sin firma.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Editar Vehículo */}
        {isEditModalOpen && selectedEditTicket && (
          <div 
            className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex justify-center items-start p-4 md:p-10 cursor-pointer"
            onClick={() => {
              setIsEditModalOpen(false);
              setSelectedEditTicket(null);
            }}
          >
            <div 
              className="liquid-glass p-8 md:p-10 rounded-[2.5rem] w-full max-w-xl shadow-ui border-white/20 animate-fade-in-up my-auto cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              <header className="flex justify-between items-center mb-10">
                <div>
                  <span className="text-[10px] font-black tracking-widest text-accent-primary uppercase">Modificar Orden</span>
                  <h2 className="text-3xl font-black">Editar Vehículo</h2>
                  <p className="text-xs text-gray-500 font-bold uppercase">TICKET: {selectedEditTicket.id}</p>
                </div>
                <button 
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedEditTicket(null);
                  }} 
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X size={28} />
                </button>
              </header>
              
              <form onSubmit={handleSaveEditTicket} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 ml-1">NOMBRE DEL CLIENTE</label>
                  <input 
                    type="text" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-accent-primary transition-colors font-semibold"
                    placeholder="Ej. Juan Pérez" 
                    value={editClient}
                    onChange={(e) => setEditClient(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 ml-1">VEHÍCULO (MARCA, MODELO, AÑO)</label>
                  <input 
                    type="text" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-accent-primary transition-colors font-semibold"
                    placeholder="Ej. Toyota Corolla 2020" 
                    value={editVehicle}
                    onChange={(e) => setEditVehicle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 ml-1">TELÉFONO DE CONTACTO (WHATSAPP)</label>
                  <input 
                    type="tel" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-accent-primary transition-colors font-semibold"
                    placeholder="Ej. 521234567890" 
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 ml-1 uppercase">Tipo de Servicio</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      type="button"
                      onClick={() => setEditServiceType('Mecánica')}
                      className={`py-3 rounded-xl font-bold border transition-all ${editServiceType === 'Mecánica' ? 'bg-accent-primary/20 border-accent-primary text-accent-primary' : 'bg-white/5 border-white/10 text-gray-400'}`}
                    >
                      Mecánica
                    </button>
                    <button 
                      type="button"
                      onClick={() => setEditServiceType('Hojalatería y Pintura')}
                      className={`py-3 rounded-xl font-bold border transition-all ${editServiceType === 'Hojalatería y Pintura' ? 'bg-accent-primary/20 border-accent-primary text-accent-primary' : 'bg-white/5 border-white/10 text-gray-400'}`}
                    >
                      Hojalatería y Pintura
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 ml-1 uppercase">Clasificación del Trabajo</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      type="button"
                      onClick={() => setEditInsuranceType('particular')}
                      className={`py-3 rounded-xl font-bold border transition-all ${editInsuranceType === 'particular' ? 'bg-accent-primary/20 border-accent-primary text-accent-primary' : 'bg-white/5 border-white/10 text-gray-400'}`}
                    >
                      Particular
                    </button>
                    <button 
                      type="button"
                      onClick={() => setEditInsuranceType('aseguranza')}
                      className={`py-3 rounded-xl font-bold border transition-all ${editInsuranceType === 'aseguranza' ? 'bg-accent-primary/20 border-accent-primary text-accent-primary' : 'bg-white/5 border-white/10 text-gray-400'}`}
                    >
                      Aseguradora
                    </button>
                  </div>
                </div>

                {editInsuranceType === 'aseguranza' && (
                  <div className="grid grid-cols-2 gap-4 animate-fade-in-up">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-400 ml-1">COMPAÑÍA ASEGURADORA</label>
                      <input 
                        type="text" 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-accent-primary transition-colors text-sm font-semibold"
                        placeholder="Ej. GNP, Qualitas" 
                        value={editInsuranceCompany}
                        onChange={(e) => setEditInsuranceCompany(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-400 ml-1">NÚMERO DE SINIESTRO</label>
                      <input 
                        type="text" 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-accent-primary transition-colors text-sm font-semibold"
                        placeholder="Ej. SIN-83924" 
                        value={editClaimNumber}
                        onChange={(e) => setEditClaimNumber(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}

                {editServiceType === 'Hojalatería y Pintura' && (
                  <div className="space-y-2 pt-4 border-t border-white/10 animate-fade-in-up">
                    <label className="text-sm font-bold text-gray-400 ml-1 uppercase">Mapeo de Daños</label>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                      <InteractiveVehicleSVG 
                        damagedPanels={editDamagedPanels} 
                        onChange={setEditDamagedPanels} 
                      />
                    </div>
                  </div>
                )}
                
                <button type="submit" className="btn-premium w-full py-4 text-lg mt-4 uppercase font-black tracking-wider">
                  Guardar Cambios
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
