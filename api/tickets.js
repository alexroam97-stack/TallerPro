import { getTickets, getTicket, addTicket, updateTicket, deleteTicket, checkAuth, generateSecureId } from './db.js';

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    if (req.method === 'GET') {
      if (id) {
        // Individual ticket lookup is public (client tracking)
        const ticket = await getTicket(id);
        if (!ticket) {
          return res.status(404).json({ error: 'Ticket no encontrado' });
        }
        return res.status(200).json(ticket);
      } else {
        // Listing all tickets requires staff auth
        const auth = checkAuth(req, ['admin', 'mechanic']);
        if (!auth) {
          return res.status(403).json({ error: 'Acceso denegado' });
        }
        const tickets = await getTickets(auth.workshopId);
        return res.status(200).json(tickets);
      }
    }

    if (req.method === 'POST') {
      const auth = checkAuth(req, ['admin', 'mechanic']);
      if (!auth) {
        return res.status(403).json({ error: 'Acceso denegado' });
      }

      const { client, vehicle, serviceType, phone, insuranceType, insuranceCompany, claimNumber, email, clientPhoto, vehiclePhoto } = req.body || {};
      
      if (!client || !vehicle) {
        return res.status(400).json({ error: 'Cliente y vehículo son campos requeridos' });
      }

      const newTicket = {
        id: generateSecureId('TKT'),
        client,
        vehicle,
        serviceType: serviceType || 'Mecánica',
        status: 'Recepción',
        events: [1],
        photos: {},
        items: [],
        billingInfo: { rfc: '', zip: '', regime: '601', usage: 'G03' },
        phone: phone || '',
        email: email || '',
        clientPhoto: clientPhoto || '',
        vehiclePhoto: vehiclePhoto || '',
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
        closedAt: null,
        workshopId: auth.workshopId
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

      const auth = checkAuth(req, ['admin', 'mechanic']);
      let workshopId = null;
      if (!auth) {
        // Unauthenticated clients may ONLY update budgetStatus, signatureDelivery, or signatureIntake
        const allowedKeys = ['budgetStatus', 'signatureDelivery', 'signatureIntake'];
        const keys = Object.keys(fields);
        const isAllowed = keys.length > 0 && keys.every(key => allowedKeys.includes(key));
        if (!isAllowed) {
          return res.status(403).json({ error: 'Acceso denegado' });
        }
      } else {
        workshopId = auth.workshopId;
      }

      const updated = await updateTicket(targetId, fields, workshopId);
      if (!updated) {
        return res.status(404).json({ error: 'Ticket no encontrado' });
      }
      return res.status(200).json(updated);
    }

    if (req.method === 'DELETE') {
      const auth = checkAuth(req, ['admin']);
      if (!auth) {
        return res.status(403).json({ error: 'Acceso denegado' });
      }

      if (!id) {
        return res.status(400).json({ error: 'El ID del ticket es requerido para eliminar' });
      }

      const success = await deleteTicket(id, auth.workshopId);
      return res.status(200).json({ success });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (err) {
    console.error('[Tickets] Internal error:', err.message);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
