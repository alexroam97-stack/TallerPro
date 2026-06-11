import React, { createContext, useContext, useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';

const AuthContext = createContext(null);

export const SecurityProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = localStorage.getItem('tp_session');
    if (session) {
      setUser(JSON.parse(session));
    }
    setLoading(false);
  }, []);

  const loginWithGoogle = async (credentialResponse) => {
    try {
      if (credentialResponse.credential === 'fake_jwt_for_demo') {
        const demoUser = {
          id: 'demo_admin',
          name: 'Admin Demo',
          email: 'admin@tallerpro.com',
          picture: 'https://ui-avatars.com/api/?name=Admin+Demo&background=00f2ff&color=000',
          role: 'admin'
        };
        setUser(demoUser);
        localStorage.setItem('tp_session', JSON.stringify(demoUser));
        return true;
      }

      // Decode JWT payload (standard OAuth2 ID Token)
      const base64Url = credentialResponse.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      const googleUser = JSON.parse(jsonPayload);
      
      // Sync Google user with the backend database
      const email = googleUser.email;
      const password = 'google_login_' + googleUser.sub;
      const name = googleUser.name;
      const picture = googleUser.picture;

      // Try registering first
      const regRes = await fetch('/api/auth?action=register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, picture, role: 'admin' })
      });
      
      if (regRes.ok) {
        const user = await regRes.json();
        setUser(user);
        localStorage.setItem('tp_session', JSON.stringify(user));
        return true;
      } else if (regRes.status === 409) {
        // User already exists, try logging in
        const loginRes = await fetch('/api/auth?action=login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        if (loginRes.ok) {
          const user = await loginRes.json();
          setUser(user);
          localStorage.setItem('tp_session', JSON.stringify(user));
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Google Login Error:', error);
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
    const user = await res.json();
    setUser(user);
    localStorage.setItem('tp_session', JSON.stringify(user));
    return user;
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
    const user = await res.json();
    setUser(user);
    localStorage.setItem('tp_session', JSON.stringify(user));
    return user;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('tp_session');
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
