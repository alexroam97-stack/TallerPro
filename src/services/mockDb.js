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
    phone: '521234567890',
    budgetStatus: 'pending',
    damagedPanels: [],
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
    phone: '521987654321',
    budgetStatus: 'approved',
    damagedPanels: [{ panelId: 'rear-bumper', damageLevel: 'HIGH' }, { panelId: 'trunk', damageLevel: 'MEDIUM' }],
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
  return JSON.parse(data);
};

export const addTicket = (client, vehicle, serviceType = 'Mecánica', phone = '') => {
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
    createdAt: new Date().toISOString(),
    closedAt: null
  };
  tickets.push(newTicket);
  localStorage.setItem(DB_KEY, JSON.stringify(tickets));
  return newTicket;
};

export const addEventToTicket = (ticketId, eventId, photoBase64 = null) => {
  const tickets = getTickets();
  const ticketIndex = tickets.findIndex(t => t.id === ticketId);
  if (ticketIndex > -1) {
    if (!tickets[ticketIndex].events) {
      tickets[ticketIndex].events = [];
    }
    if (!tickets[ticketIndex].events.includes(eventId)) {
      tickets[ticketIndex].events.push(eventId);
    }
    
    if (photoBase64) {
      if (!tickets[ticketIndex].photos) tickets[ticketIndex].photos = {};
      tickets[ticketIndex].photos[eventId] = photoBase64;
    }
    
    // Update status based on event
    const statusMap = {
      1: 'Recepción',
      2: 'Evaluación',
      3: 'Mecánica',
      4: 'Pintura',
      5: 'Entrega'
    };
    tickets[ticketIndex].status = statusMap[eventId] || tickets[ticketIndex].status;
    
    // Auto-close ticket when reaching 'Entrega' (step 5)
    if (eventId === 5 && !tickets[ticketIndex].closedAt) {
      tickets[ticketIndex].closedAt = new Date().toISOString();
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
