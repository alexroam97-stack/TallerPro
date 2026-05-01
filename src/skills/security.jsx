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

  const loginWithGoogle = (credentialResponse) => {
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
      const userData = {
        id: googleUser.sub,
        name: googleUser.name,
        email: googleUser.email,
        picture: googleUser.picture,
        role: 'admin' // In a real app, this would be validated on the backend
      };

      setUser(userData);
      localStorage.setItem('tp_session', JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error('Google Login Error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('tp_session');
  };

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const isClientIdValid = clientId && !clientId.includes('your-client-id-here');

  if (!isClientIdValid) {
    return (
      <AuthContext.Provider value={{ user, loginWithGoogle, logout, loading }}>
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <AuthContext.Provider value={{ user, loginWithGoogle, logout, loading }}>
        {children}
      </AuthContext.Provider>
    </GoogleOAuthProvider>
  );
};

export const useAuth = () => useContext(AuthContext);

export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="flex items-center justify-center h-screen bg-slate-900 text-white">Cargando...</div>;

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};
