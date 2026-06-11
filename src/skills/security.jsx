import React, { createContext, useContext, useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';

const AuthContext = createContext(null);

const SESSION_KEY = 'tp_session';
const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

export const SecurityProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const session = JSON.parse(raw);
        // Enforce session expiry
        if (session._loginAt && (Date.now() - session._loginAt) > SESSION_MAX_AGE_MS) {
          localStorage.removeItem(SESSION_KEY);
        } else if (session.token) {
          setUser(session);
        } else {
          // Legacy session without token — force re-login
          localStorage.removeItem(SESSION_KEY);
        }
      }
    } catch {
      localStorage.removeItem(SESSION_KEY);
    }
    setLoading(false);
  }, []);

  const persistSession = (userData) => {
    const session = { ...userData, _loginAt: Date.now() };
    setUser(session);
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  };

  const loginWithGoogle = async (credentialResponse) => {
    try {
      // Decode JWT payload (standard OAuth2 ID Token)
      const base64Url = credentialResponse.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      const googleUser = JSON.parse(jsonPayload);
      
      const email = googleUser.email;
      const password = 'google_oauth_' + googleUser.sub;
      const name = googleUser.name;
      const picture = googleUser.picture;

      // Try registering first
      const regRes = await fetch('/api/auth?action=register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, picture, role: 'admin' })
      });
      
      if (regRes.ok) {
        const data = await regRes.json();
        persistSession(data);
        return true;
      } else if (regRes.status === 409) {
        // User already exists, log in
        const loginRes = await fetch('/api/auth?action=login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        if (loginRes.ok) {
          const data = await loginRes.json();
          persistSession(data);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Google Login failed');
      return false;
    }
  };

  const loginWithCredentials = async (email, password) => {
    const res = await fetch('/api/auth?action=login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Error de autenticación' }));
      throw new Error(err.error || 'Credenciales incorrectas');
    }
    const data = await res.json();
    return persistSession(data);
  };

  const registerUser = async (userData) => {
    const res = await fetch('/api/auth?action=register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Error al registrar' }));
      throw new Error(err.error || 'No se pudo crear la cuenta');
    }
    const data = await res.json();
    return persistSession(data);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "dummy-client-id";

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <AuthContext.Provider value={{ user, loginWithGoogle, loginWithCredentials, registerUser, logout, loading }}>
        {children}
      </AuthContext.Provider>
    </GoogleOAuthProvider>
  );
};

export const useAuth = () => useContext(AuthContext);

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="flex items-center justify-center h-screen bg-[#0a0c10] text-white">Cargando...</div>;

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};
