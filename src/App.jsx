import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SecurityProvider, ProtectedRoute } from './skills/security';
import LandingPage from './features/client/LandingPage';
import ShopDashboard from './features/workshop/ShopDashboard';
import TechnicianApp from './features/workshop/TechnicianApp';
import ClientTracker from './features/client/ClientTracker';
import ScanRedirect from './features/workshop/ScanRedirect';

function App() {
  useEffect(() => {
    const handleMouseMove = (e) => {
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <SecurityProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ShopDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/tech" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'mechanic']}>
                <TechnicianApp />
              </ProtectedRoute>
            } 
          />
          <Route path="/tracker/:ticketId" element={<ClientTracker />} />
          <Route path="/scan/:ticketId" element={<ScanRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </SecurityProvider>
  );
}

export default App;
