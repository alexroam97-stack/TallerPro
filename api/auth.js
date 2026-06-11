import { getUserByEmail, addUser } from './db.js';

export default async function handler(req, res) {
  const { action } = req.query;

  try {
    if (req.method === 'POST') {
      const { email, password, name, picture, role } = req.body || {};

      if (action === 'register') {
        if (!email || !password || !name) {
          return res.status(400).json({ error: 'Faltan campos requeridos para el registro' });
        }

        const existing = await getUserByEmail(email);
        if (existing) {
          return res.status(409).json({ error: 'El correo electrónico ya está registrado' });
        }

        const newUser = {
          id: 'usr_' + Math.random().toString(36).substring(2, 9),
          name,
          email,
          password, // En producción se encriptaría con bcrypt
          picture: picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=00f2ff&color=000`,
          role: role || 'admin'
        };

        const result = await addUser(newUser);
        // Retornar datos seguros
        const { password: _, ...safeUser } = result;
        return res.status(201).json(safeUser);
      }

      // Acción de login predeterminada
      if (!email || !password) {
        return res.status(400).json({ error: 'Correo y contraseña son campos requeridos' });
      }

      const user = await getUserByEmail(email);
      if (user && user.password === password) {
        const { password: _, ...safeUser } = user;
        return res.status(200).json(safeUser);
      }

      return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor de autenticación' });
  }
}
