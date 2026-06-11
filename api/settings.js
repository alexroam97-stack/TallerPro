import { getSettings, saveSettings, checkAuth } from './db.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const settings = await getSettings();
      return res.status(200).json(settings);
    }

    if (req.method === 'PUT') {
      if (!checkAuth(req, ['admin'])) {
        return res.status(403).json({ error: 'Acceso denegado: Privilegios de administrador requeridos' });
      }
      const settings = req.body || {};
      const updated = await saveSettings(settings);
      return res.status(200).json(updated);
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
