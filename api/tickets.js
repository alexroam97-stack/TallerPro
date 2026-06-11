import { getTickets, getTicket, addTicket, updateTicket, deleteTicket } from './db.js';

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    if (req.method === 'GET') {
      if (id) {
        const ticket = await getTicket(id);
        if (!ticket) {
          return res.status(404).json({ error: 'Ticket no encontrado' });
        }
        return res.status(200).json(ticket);
      } else {
        const tickets = await getTickets();
        return res.status(200).json(tickets);
      }
    }

    if (req.method === 'POST') {
      const { client, vehicle, serviceType, phone, insuranceType, insuranceCompany, claimNumber } = req.body || {};
      
      if (!client || !vehicle) {
        return res.status(400).json({ error: 'Cliente y vehículo son campos requeridos' });
      }

      // Generate secure 4-character suffix for ID to prevent sequential enumeration attacks
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const newId = `TKT-${randomSuffix}`;

      const newTicket = {
        id: newId,
        client,
        vehicle,
        serviceType: serviceType || 'Mecánica',
        status: 'Recepción',
        events: [1],
        photos: {},
        items: [],
        billingInfo: { rfc: '', zip: '', regime: '601', usage: 'G03' },
        phone: phone || '',
        budgetStatus: 'pending',
        damagedPanels: [],
        insuranceType: insuranceType || 'particular',
        insuranceCompany: insuranceCompany || '',
        claimNumber: claimNumber || '',
        signatureIntake: '',
        signatureDelivery: '',
        timeLogs: {},
        inventoryChecklist: {},
        createdAt: new Date().toISOString(),
        closedAt: null
      };

      const result = await addTicket(newTicket);
      return res.status(201).json(result);
    }

    if (req.method === 'PUT') {
      const { id: bodyId, ...fields } = req.body || {};
      const targetId = id || bodyId;

      if (!targetId) {
        return res.status(400).json({ error: 'El ID del ticket es requerido para actualizar' });
      }

      const updated = await updateTicket(targetId, fields);
      if (!updated) {
        return res.status(404).json({ error: 'Ticket no encontrado para actualizar' });
      }
      return res.status(200).json(updated);
    }

    if (req.method === 'DELETE') {
      if (!id) {
        return res.status(400).json({ error: 'El ID del ticket es requerido para eliminar' });
      }

      const success = await deleteTicket(id);
      return res.status(200).json({ success });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
