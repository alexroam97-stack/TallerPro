// Simula una base de datos usando localStorage para la demo

const DB_KEY = 'tallerpro_tickets';

const defaultTickets = [
  { id: 'TKT-001', client: 'Juan Pérez', vehicle: 'Toyota Corolla 2020', status: 'Recepción', events: [1] },
  { id: 'TKT-002', client: 'María Gómez', vehicle: 'Honda Civic 2019', status: 'Pintura', events: [1, 2, 3] },
];

export const getTickets = () => {
  const data = localStorage.getItem(DB_KEY);
  if (!data) {
    localStorage.setItem(DB_KEY, JSON.stringify(defaultTickets));
    return defaultTickets;
  }
  return JSON.parse(data);
};

export const addTicket = (client, vehicle) => {
  const tickets = getTickets();
  const newId = `TKT-${String(tickets.length + 1).padStart(3, '0')}`;
  const newTicket = {
    id: newId,
    client,
    vehicle,
    status: 'Recepción',
    events: [1] // Start with event 1 completed
  };
  tickets.push(newTicket);
  localStorage.setItem(DB_KEY, JSON.stringify(tickets));
  return newTicket;
};

export const addEventToTicket = (ticketId, eventId) => {
  const tickets = getTickets();
  const ticketIndex = tickets.findIndex(t => t.id === ticketId);
  if (ticketIndex > -1) {
    if (!tickets[ticketIndex].events) {
      tickets[ticketIndex].events = [];
    }
    if (!tickets[ticketIndex].events.includes(eventId)) {
      tickets[ticketIndex].events.push(eventId);
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
