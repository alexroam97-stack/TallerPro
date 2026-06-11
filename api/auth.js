import { getUserByEmail, getUserByEmailWithPassword, addUser, signToken, hashPassword, comparePassword, generateSecureId } from './db.js';

export default async function handler(req, res) {
  const { action } = req.query;

  try {
    if (req.method === 'POST') {
      const { email, password, name, picture, role } = req.body || {};

      if (action === 'register') {
        if (!email || !password || !name) {
          return res.status(400).json({ error: 'Faltan campos requeridos para el registro' });
        }

        // Validate password strength
        if (password.length < 8) {
          return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({ error: 'Formato de correo electrónico inválido' });
        }

        const existing = await getUserByEmail(email);
        if (existing) {
          return res.status(409).json({ error: 'El correo electrónico ya está registrado' });
        }

        // Hash password before storing
        const hashedPassword = await hashPassword(password);

        const newUser = {
          id: generateSecureId('usr'),
          name: name.trim(),
          email: email.toLowerCase().trim(),
          password: hashedPassword,
          picture: picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=00f2ff&color=000`,
          role: role || 'admin'
        };

        const safeUser = await addUser(newUser);
        const token = signToken(safeUser);
        return res.status(201).json({ ...safeUser, token });
      }

      // Default action: login
      if (!email || !password) {
        return res.status(400).json({ error: 'Correo y contraseña son campos requeridos' });
      }

      // Fetch user WITH password hash for comparison
      const user = await getUserByEmailWithPassword(email.toLowerCase().trim());
      if (!user) {
        // Generic message to prevent user enumeration
        return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
      }

      const passwordValid = await comparePassword(password, user.password);
      if (!passwordValid) {
        return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
      }

      // Strip password and return with signed token
      const { password: _, ...safeUser } = user;
      const token = signToken(safeUser);
      return res.status(200).json({ ...safeUser, token });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (err) {
    console.error('[Auth] Internal error:', err.message);
    return res.status(500).json({ error: 'Error interno del servidor de autenticación' });
  }
}
