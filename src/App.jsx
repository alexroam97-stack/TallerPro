import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import ShopDashboard from './pages/ShopDashboard';
import TechnicianApp from './pages/TechnicianApp';
import ClientTracker from './pages/ClientTracker';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<ShopDashboard />} />
        <Route path="/tech" element={<TechnicianApp />} />
        <Route path="/tracker/:ticketId" element={<ClientTracker />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
