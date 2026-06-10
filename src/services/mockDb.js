// Simula una base de datos usando localStorage para la demo

const DB_KEY = 'tallerpro_tickets';

const defaultTickets = [
  { 
    id: 'TKT-X821', 
    client: 'Juan Pérez', 
    vehicle: 'Toyota Corolla 2020', 
    serviceType: 'Mecánica', 
    status: 'Recepción', 
    events: [1], 
    photos: {},
    items: [],
    billingInfo: { rfc: '', zip: '', regime: '601', usage: 'G03' },
    phone: '526633040096',
    budgetStatus: 'pending',
    damagedPanels: [],
    insuranceType: 'particular',
    insuranceCompany: '',
    claimNumber: '',
    signatureIntake: '',
    signatureDelivery: '',
    timeLogs: { "Recepción": 900 },
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    closedAt: null
  },
  { 
    id: 'TKT-Z493', 
    client: 'María Gómez', 
    vehicle: 'Honda Civic 2019', 
    serviceType: 'Hojalatería y Pintura', 
    status: 'Pintura', 
    events: [1, 2, 3], 
    photos: {},
    items: [
      { id: 1, desc: 'Reparación de Fascia Trasera', qty: 1, price: 4500, type: 'Mano de Obra', satKey: '78181500' },
      { id: 2, desc: 'Pintura Bicapa (Color Match)', qty: 1, price: 3200, type: 'Refacción', satKey: '31211500' }
    ],
    billingInfo: { rfc: 'XAXX010101000', zip: '06600', regime: '612', usage: 'G03' },
    phone: '526633040096',
    budgetStatus: 'approved',
    damagedPanels: [{ panelId: 'rear-bumper', damageLevel: 'HIGH' }, { panelId: 'trunk', damageLevel: 'MEDIUM' }],
    insuranceType: 'aseguranza',
    insuranceCompany: 'Qualitas',
    claimNumber: 'SIN-982405',
    signatureIntake: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKAAAAB4CAYAAAB1ov4vAAAABmJLR0QA/wD/AP+gvaeTAAAAcElEQVR42u3BAQ0AAADCoPdPbQ8HFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPgbNbgAAT/547kAAAAASUVORK5CYII=', // mock placeholder signature
    signatureDelivery: '',
    timeLogs: { "Recepción": 1200, "Hojalatería": 3600, "Pintura": 2400 },
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
    closedAt: new Date(Date.now() - 86400000 * 1).toISOString() // 1 day ago (closed)
  },
];

export const getTickets = () => {
  const data = localStorage.getItem(DB_KEY);
  if (!data) {
    localStorage.setItem(DB_KEY, JSON.stringify(defaultTickets));
    return defaultTickets;
  }
  const parsed = JSON.parse(data);
  let migrated = false;
  parsed.forEach(ticket => {
    if (ticket.phone !== '526633040096') {
      ticket.phone = '526633040096';
      migrated = true;
    }
  });
  if (migrated) {
    localStorage.setItem(DB_KEY, JSON.stringify(parsed));
  }
  return parsed;
};

export const addTicket = (client, vehicle, serviceType = 'Mecánica', phone = '', insuranceType = 'particular', insuranceCompany = '', claimNumber = '') => {
  const tickets = getTickets();
  // Generar ID no secuencial para evitar enumeración
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const newId = `TKT-${randomSuffix}`;
  const newTicket = {
    id: newId,
    client: client, // En producción, esto debería estar encriptado
    vehicle,
    phone,
    serviceType,
    status: 'Recepción',
    events: [1], // Start with event 1 completed
    photos: {},
    items: [],
    billingInfo: { rfc: '', zip: '', regime: '601', usage: 'G03' },
    budgetStatus: 'pending',
    damagedPanels: [],
    insuranceType,
    insuranceCompany,
    claimNumber,
    signatureIntake: '',
    signatureDelivery: '',
    timeLogs: {},
    createdAt: new Date().toISOString(),
    closedAt: null
  };
  tickets.push(newTicket);
  localStorage.setItem(DB_KEY, JSON.stringify(tickets));
  return newTicket;
};

export const deleteTicket = (ticketId) => {
  const tickets = getTickets();
  const filtered = tickets.filter(t => t.id !== ticketId);
  localStorage.setItem(DB_KEY, JSON.stringify(filtered));
  
  // Clean up linked parts as well
  const parts = getParts();
  const filteredParts = parts.filter(p => p.ticketId !== ticketId);
  saveParts(filteredParts);
  
  return true;
};

export const addEventToTicket = (ticketId, eventId, photoBase64 = null) => {
  const tickets = getTickets();
  const ticketIndex = tickets.findIndex(t => t.id === ticketId);
  if (ticketIndex > -1) {
    const t = tickets[ticketIndex];
    if (!t.events) {
      t.events = [];
    }
    
    // Ensure all preceding events up to eventId are completed
    for (let i = 1; i <= eventId; i++) {
      if (!t.events.includes(i)) {
        t.events.push(i);
      }
    }
    
    if (photoBase64) {
      if (!t.photos) t.photos = {};
      t.photos[eventId] = photoBase64;
    }
    
    // Map event ID to status name dynamically
    const stages = t.serviceType === 'Hojalatería y Pintura'
      ? ['Recepción', 'Hojalatería', 'Pintura', 'Armado', 'Listo']
      : ['Recepción', 'Diagnóstico', 'Reparación', 'Pruebas', 'Listo'];
      
    t.status = stages[eventId - 1] || t.status;
    
    // Auto-close ticket when reaching 'Listo' (step 5)
    if (eventId === 5 && !t.closedAt) {
      t.closedAt = new Date().toISOString();
    }

    localStorage.setItem(DB_KEY, JSON.stringify(tickets));
  }
};

export const getTicketEvents = (ticketId) => {
  const tickets = getTickets();
  const ticket = tickets.find(t => t.id === ticketId);
  return ticket ? (ticket.events || []) : [];
};

export const getTicket = (ticketId) => {
  return getTickets().find(t => t.id === ticketId) || null;
};

export const updateTicketBilling = (ticketId, { items, billingInfo }) => {
  const tickets = getTickets();
  const index = tickets.findIndex(t => t.id === ticketId);
  if (index > -1) {
    if (items) tickets[index].items = items;
    if (billingInfo) tickets[index].billingInfo = billingInfo;
    localStorage.setItem(DB_KEY, JSON.stringify(tickets));
    return tickets[index];
  }
  return null;
};

export const updateBudgetStatus = (ticketId, status) => {
  const tickets = getTickets();
  const index = tickets.findIndex(t => t.id === ticketId);
  if (index > -1) {
    tickets[index].budgetStatus = status;
    localStorage.setItem(DB_KEY, JSON.stringify(tickets));
    return tickets[index];
  }
  return null;
};

export const updateDamagedPanels = (ticketId, panels) => {
  const tickets = getTickets();
  const index = tickets.findIndex(t => t.id === ticketId);
  if (index > -1) {
    tickets[index].damagedPanels = panels;
    localStorage.setItem(DB_KEY, JSON.stringify(tickets));
    return tickets[index];
  }
  return null;
};

export const saveSignature = (ticketId, type, signatureBase64) => {
  const tickets = getTickets();
  const index = tickets.findIndex(t => t.id === ticketId);
  if (index > -1) {
    if (type === 'intake') {
      tickets[index].signatureIntake = signatureBase64;
    } else if (type === 'delivery') {
      tickets[index].signatureDelivery = signatureBase64;
    }
    localStorage.setItem(DB_KEY, JSON.stringify(tickets));
    return tickets[index];
  }
  return null;
};

export const updateTimeLogs = (ticketId, stageName, elapsedSeconds) => {
  const tickets = getTickets();
  const index = tickets.findIndex(t => t.id === ticketId);
  if (index > -1) {
    if (!tickets[index].timeLogs) {
      tickets[index].timeLogs = {};
    }
    tickets[index].timeLogs[stageName] = (tickets[index].timeLogs[stageName] || 0) + elapsedSeconds;
    localStorage.setItem(DB_KEY, JSON.stringify(tickets));
    return tickets[index];
  }
  return null;
};

const PARTS_DB_KEY = 'tallerpro_parts';

const defaultParts = [
  {
    id: 'PRT-W912',
    name: 'Amortiguadores Delanteros (Par)',
    brand: 'Bilstein',
    qty: 1,
    vehicleCompatibility: 'Toyota Corolla 2020',
    ticketId: 'TKT-X821',
    status: 'approved',
    qcNotes: 'Llegó en excelentes condiciones, empaque original sellado. Verificado con número de serie.',
    photo: '',
    qcChecked: { visual: true, packaging: true, compatibility: true, functional: true },
    inspectedBy: 'Técnico Principal',
    inspectedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    cost: 1800,
    salePrice: 2800
  },
  {
    id: 'PRT-K302',
    name: 'Faro Principal Izquierdo',
    brand: 'TYC',
    qty: 1,
    vehicleCompatibility: 'Honda Civic 2019',
    ticketId: 'TKT-Z493',
    status: 'rejected',
    qcNotes: 'El faro llegó quebrado en el soporte inferior derecho. Se solicita devolución al proveedor.',
    photo: '',
    qcChecked: { visual: false, packaging: true, compatibility: true, functional: false },
    inspectedBy: 'Técnico Carrocería',
    inspectedAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    cost: 950,
    salePrice: 1600
  },
  {
    id: 'PRT-H741',
    name: 'Bomba de Agua y empaque',
    brand: 'Gates',
    qty: 1,
    vehicleCompatibility: 'Toyota Corolla 2020',
    ticketId: 'TKT-X821',
    status: 'pending',
    qcNotes: '',
    photo: '',
    qcChecked: { visual: false, packaging: false, compatibility: false, functional: false },
    inspectedBy: '',
    inspectedAt: '',
    cost: 550,
    salePrice: 1100
  }
];

export const getParts = () => {
  const data = localStorage.getItem(PARTS_DB_KEY);
  if (!data) {
    localStorage.setItem(PARTS_DB_KEY, JSON.stringify(defaultParts));
    return defaultParts;
  }
  return JSON.parse(data);
};

export const saveParts = (parts) => {
  localStorage.setItem(PARTS_DB_KEY, JSON.stringify(parts));
};

export const addPart = (partData) => {
  const parts = getParts();
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const newId = `PRT-${randomSuffix}`;
  const newPart = {
    id: newId,
    name: partData.name,
    brand: partData.brand || 'Genérica',
    qty: parseInt(partData.qty) || 1,
    vehicleCompatibility: partData.vehicleCompatibility || '',
    ticketId: partData.ticketId || '',
    status: partData.status || 'pending',
    qcNotes: partData.qcNotes || '',
    photo: partData.photo || '',
    qcChecked: partData.qcChecked || { visual: false, packaging: false, compatibility: false, functional: false },
    inspectedBy: partData.inspectedBy || '',
    inspectedAt: partData.inspectedAt || '',
    cost: parseFloat(partData.cost) || 0,
    salePrice: parseFloat(partData.salePrice) || 0
  };
  parts.push(newPart);
  saveParts(parts);
  return newPart;
};

export const updatePart = (partId, updatedFields) => {
  const parts = getParts();
  const index = parts.findIndex(p => p.id === partId);
  if (index > -1) {
    parts[index] = { ...parts[index], ...updatedFields };
    saveParts(parts);
    return parts[index];
  }
  return null;
};

export const deletePart = (partId) => {
  const parts = getParts();
  const filtered = parts.filter(p => p.id !== partId);
  saveParts(filtered);
  return true;
};
