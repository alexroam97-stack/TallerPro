import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SecurityProvider, ProtectedRoute } from './skills/security';
import LandingPage from './pages/LandingPage';
import ShopDashboard from './pages/ShopDashboard';
import TechnicianApp from './pages/TechnicianApp';
import ClientTracker from './pages/ClientTracker';

function App() {
  return (
    <SecurityProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <ShopDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/tech" 
            element={
              <ProtectedRoute>
                <TechnicianApp />
              </ProtectedRoute>
            } 
          />
          <Route path="/tracker/:ticketId" element={<ClientTracker />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </SecurityProvider>
  );
}

export default App;
