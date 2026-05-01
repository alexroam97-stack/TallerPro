// Simula una base de datos usando localStorage para la demo

const DB_KEY = 'tallerpro_tickets';

const defaultTickets = [
  { id: 'TKT-X821', client: 'Juan Pérez', vehicle: 'Toyota Corolla 2020', serviceType: 'Mecánica', status: 'Recepción', events: [1], photos: {} },
  { id: 'TKT-Z493', client: 'María Gómez', vehicle: 'Honda Civic 2019', serviceType: 'Hojalatería y Pintura', status: 'Pintura', events: [1, 2, 3], photos: {} },
];

export const getTickets = () => {
  const data = localStorage.getItem(DB_KEY);
  if (!data) {
    localStorage.setItem(DB_KEY, JSON.stringify(defaultTickets));
    return defaultTickets;
  }
  return JSON.parse(data);
};

export const addTicket = (client, vehicle, serviceType = 'Mecánica') => {
  const tickets = getTickets();
  // Generar ID no secuencial para evitar enumeración
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const newId = `TKT-${randomSuffix}`;
  const newTicket = {
    id: newId,
    client: client, // En producción, esto debería estar encriptado
    vehicle,
    serviceType,
    status: 'Recepción',
    events: [1], // Start with event 1 completed
    photos: {}
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
