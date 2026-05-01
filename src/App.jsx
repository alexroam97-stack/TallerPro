import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SecurityProvider, ProtectedRoute } from './skills/security';
import LandingPage from './features/client/LandingPage';
import ShopDashboard from './features/workshop/ShopDashboard';
import TechnicianApp from './features/workshop/TechnicianApp';
import ClientTracker from './features/client/ClientTracker';

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
