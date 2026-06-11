export default function handler(req, res) {
  if (req.method === 'POST') {
    const { email, password } = req.body || {};

    if (email === 'admin@tallerpro.com' && password === 'tallerpro2026') {
      return res.status(200).json({
        id: 'demo_admin',
        name: 'Admin Demo',
        email: 'admin@tallerpro.com',
        picture: 'https://ui-avatars.com/api/?name=Admin+Demo&background=00f2ff&color=000',
        role: 'admin'
      });
    } else if (email === 'tech@tallerpro.com' && password === 'techpro2026') {
      return res.status(200).json({
        id: 'demo_tech',
        name: 'Técnico Demo',
        email: 'tech@tallerpro.com',
        picture: 'https://ui-avatars.com/api/?name=Tecnico+Demo&background=b512fa&color=fff',
        role: 'mechanic'
      });
    }

    // Direct social/google login bypass
    if (email && !password) {
      return res.status(200).json({
        id: 'social_' + Math.random().toString(36).substring(7),
        name: email.split('@')[0],
        email: email,
        picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(email)}`,
        role: 'admin'
      });
    }

    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
