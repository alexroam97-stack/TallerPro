import { getParts, getPartsByTicket, addPart, updatePart, deletePart, checkAuth, generateSecureId } from './db.js';

export default async function handler(req, res) {
  const { id, ticketId } = req.query;

  try {
    if (req.method === 'GET') {
      if (ticketId) {
        // Public lookup filtered by ticketId
        const parts = await getPartsByTicket(ticketId);
        return res.status(200).json(parts);
      } else {
        // Listing all parts requires staff auth
        const auth = checkAuth(req, ['admin', 'mechanic']);
        if (!auth) {
          return res.status(403).json({ error: 'Acceso denegado' });
        }
        const parts = await getParts(auth.workshopId);
        if (id) {
          const part = parts.find(p => p.id === id);
          if (!part) {
            return res.status(404).json({ error: 'Repuesto no encontrado' });
          }
          return res.status(200).json(part);
        }
        return res.status(200).json(parts);
      }
    }

    // Write operations require admin or mechanic roles
    const auth = checkAuth(req, ['admin', 'mechanic']);
    if (!auth) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    if (req.method === 'POST') {
      const partData = req.body || {};
      
      if (!partData.name) {
        return res.status(400).json({ error: 'El nombre de la refacción es requerido' });
      }

      const newPart = {
        id: generateSecureId('PRT'),
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

      const result = await addPart(newPart, auth.workshopId);
      return res.status(201).json(result);
    }

    if (req.method === 'PUT') {
      const { id: bodyId, ...fields } = req.body || {};
      const targetId = id || bodyId;

      if (!targetId) {
        return res.status(400).json({ error: 'El ID de la refacción es requerido para actualizar' });
      }

      const updated = await updatePart(targetId, fields, auth.workshopId);
      if (!updated) {
        return res.status(404).json({ error: 'Refacción no encontrada o acceso denegado' });
      }
      return res.status(200).json(updated);
    }

    if (req.method === 'DELETE') {
      if (!id) {
        return res.status(400).json({ error: 'El ID de la refacción es requerido para eliminar' });
      }

      const success = await deletePart(id, auth.workshopId);
      return res.status(200).json({ success });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (err) {
    console.error('[Parts] Internal error:', err.message);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
