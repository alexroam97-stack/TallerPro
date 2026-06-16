import { getSettings, saveSettings, checkAuth, getTicket } from './db.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { ticketId } = req.query;
      
      // Attempt auth check first
      const auth = checkAuth(req, ['admin', 'mechanic']);
      let workshopId = 'demo_workshop';
      
      if (auth) {
        workshopId = auth.workshopId;
      } else if (ticketId) {
        const ticket = await getTicket(ticketId);
        if (ticket && ticket.workshopId) {
          workshopId = ticket.workshopId;
        }
      }
      
      const settings = await getSettings(workshopId);
      const dbType = process.env.DATABASE_URL ? 'PostgreSQL' : 'Local File';
      return res.status(200).json({ ...settings, dbType });
    }

    if (req.method === 'PUT') {
      const auth = checkAuth(req, ['admin']);
      if (!auth) {
        return res.status(403).json({ error: 'Acceso denegado' });
      }
      const settings = req.body || {};
      const updated = await saveSettings(settings, auth.workshopId);
      return res.status(200).json(updated);
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (err) {
    console.error('[Settings] Internal error:', err.message);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
