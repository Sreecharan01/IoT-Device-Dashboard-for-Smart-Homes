import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Flip } from 'gsap/Flip';
import { TextPlugin } from 'gsap/TextPlugin';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Devices from './pages/Devices';
import DeviceDetail from './pages/DeviceDetail';
import AdminPanel from './pages/AdminPanel';
import Analytics from './pages/Analytics';
import Alerts from './pages/Alerts';
import Profile from './pages/Profile';
import MobileTracker from './pages/MobileTracker';
import MainLayout from './layouts/MainLayout';
import { useAuthStore } from './store/authStore';
import { useDeviceStore } from './store/deviceStore';

gsap.registerPlugin(ScrollTrigger, Flip, TextPlugin);

const ProtectedRoute = ({ children, requireAdmin }) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  const initAuth = useAuthStore(state => state.initAuth);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const loading = useAuthStore(state => state.loading);
  const fetchDevices = useDeviceStore(state => state.fetchDevices);

  // First initialize auth from localStorage
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Only fetch devices once auth is resolved and user is logged in
  useEffect(() => {
    if (!loading && isAuthenticated) {
      fetchDevices();
    }
  }, [loading, isAuthenticated, fetchDevices]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/tracker" element={<MobileTracker />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="devices" element={<Devices />} />
          <Route path="device/:id" element={<DeviceDetail />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="profile" element={<Profile />} />
          <Route path="admin" element={
            <ProtectedRoute requireAdmin={true}>
              <AdminPanel />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
