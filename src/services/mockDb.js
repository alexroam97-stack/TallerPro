// Cliente de API para sincronizar con la base de datos del backend

const apiFetch = async (url, options = {}) => {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error desconocido' }));
    throw new Error(err.error || `Error de red: ${res.status}`);
  }
  return res.json();
};

export const getTickets = async () => {
  return apiFetch('/api/tickets');
};

export const getTicket = async (ticketId) => {
  return apiFetch(`/api/tickets?id=${ticketId}`);
};

export const addTicket = async (client, vehicle, serviceType = 'Mecánica', phone = '', insuranceType = 'particular', insuranceCompany = '', claimNumber = '') => {
  return apiFetch('/api/tickets', {
    method: 'POST',
    body: JSON.stringify({
      client,
      vehicle,
      serviceType,
      phone,
      insuranceType,
      insuranceCompany,
      claimNumber
    })
  });
};

export const deleteTicket = async (ticketId) => {
  return apiFetch(`/api/tickets?id=${ticketId}`, {
    method: 'DELETE'
  });
};

export const updateTicket = async (ticketId, fields) => {
  return apiFetch('/api/tickets', {
    method: 'PUT',
    body: JSON.stringify({ id: ticketId, ...fields })
  });
};

export const addEventToTicket = async (ticketId, eventId, photoBase64 = null, photosMap = null, checklist = null) => {
  const ticket = await getTicket(ticketId);
  if (!ticket) throw new Error('Ticket no encontrado');

  const currentEvents = ticket.events || [];
  const nextEvents = [...currentEvents];
  for (let i = 1; i <= eventId; i++) {
    if (!nextEvents.includes(i)) {
      nextEvents.push(i);
    }
  }

  const nextPhotos = { ...(ticket.photos || {}) };
  if (photoBase64) {
    nextPhotos[eventId] = photoBase64;
  }
  if (photosMap) {
    Object.assign(nextPhotos, photosMap);
  }

  const stages = ticket.serviceType === 'Hojalatería y Pintura'
    ? ['Recepción', 'Hojalatería', 'Pintura', 'Armado', 'Listo', 'Entregado']
    : ['Recepción', 'Diagnóstico', 'Reparación', 'Pruebas', 'Listo', 'Entregado'];

  const nextStatus = stages[eventId - 1] || ticket.status;
  const closedAt = (eventId === 6 && !ticket.closedAt) ? new Date().toISOString() : ticket.closedAt;

  const fields = {
    events: nextEvents,
    photos: nextPhotos,
    status: nextStatus,
    closedAt
  };

  if (checklist) {
    fields.inventoryChecklist = checklist;
  }

  return apiFetch('/api/tickets', {
    method: 'PUT',
    body: JSON.stringify({ id: ticketId, ...fields })
  });
};

export const getTicketEvents = async (ticketId) => {
  const ticket = await getTicket(ticketId);
  return ticket ? (ticket.events || []) : [];
};

export const updateTicketBilling = async (ticketId, { items, billingInfo }) => {
  const body = { id: ticketId };
  if (items) body.items = items;
  if (billingInfo) body.billingInfo = billingInfo;
  
  return apiFetch('/api/tickets', {
    method: 'PUT',
    body: JSON.stringify(body)
  });
};

export const updateBudgetStatus = async (ticketId, status) => {
  return apiFetch('/api/tickets', {
    method: 'PUT',
    body: JSON.stringify({ id: ticketId, budgetStatus: status })
  });
};

export const updateDamagedPanels = async (ticketId, panels) => {
  return apiFetch('/api/tickets', {
    method: 'PUT',
    body: JSON.stringify({ id: ticketId, damagedPanels: panels })
  });
};

export const saveSignature = async (ticketId, type, signatureBase64) => {
  const fields = {};
  if (type === 'intake') {
    fields.signatureIntake = signatureBase64;
  } else if (type === 'delivery') {
    fields.signatureDelivery = signatureBase64;
  }
  return apiFetch('/api/tickets', {
    method: 'PUT',
    body: JSON.stringify({ id: ticketId, ...fields })
  });
};

export const updateTimeLogs = async (ticketId, stageName, elapsedSeconds) => {
  const ticket = await getTicket(ticketId);
  if (!ticket) return null;
  const timeLogs = { ...(ticket.timeLogs || {}) };
  timeLogs[stageName] = (timeLogs[stageName] || 0) + elapsedSeconds;
  return apiFetch('/api/tickets', {
    method: 'PUT',
    body: JSON.stringify({ id: ticketId, timeLogs })
  });
};

export const getParts = async () => {
  return apiFetch('/api/parts');
};

export const addPart = async (partData) => {
  return apiFetch('/api/parts', {
    method: 'POST',
    body: JSON.stringify(partData)
  });
};

export const updatePart = async (partId, updatedFields) => {
  return apiFetch('/api/parts', {
    method: 'PUT',
    body: JSON.stringify({ id: partId, ...updatedFields })
  });
};

export const deletePart = async (partId) => {
  return apiFetch(`/api/parts?id=${partId}`, {
    method: 'DELETE'
  });
};

export const getSettings = async () => {
  return apiFetch('/api/settings');
};

export const saveSettings = async (settings) => {
  return apiFetch('/api/settings', {
    method: 'PUT',
    body: JSON.stringify(settings)
  });
};
