import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AcceptInvite from './pages/AcceptInvite';
import Unauthorized from './pages/Unauthorized';
import Properties from './pages/Properties';
import Units from './pages/Units';
import Tenants from './pages/Tenants';
import Payments from './pages/Payments';
import Users from './pages/Users';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Workspaces from './pages/admin/Workspaces';
import AdminUsers from './pages/admin/AdminUsers';
import Analytics from './pages/admin/Analytics';
import PlatformSettings from './pages/admin/PlatformSettings';
import Announcements from './pages/admin/Announcements';
import Logs from './pages/admin/Logs';
import { useAuth } from './context/AuthContext';

function FullScreenLoader() {
  return (
    <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-app)' }}>
      <Loader2 className="spin" size={32} color="var(--color-primary)" />
    </div>
  );
}

const homePathFor = (role) => (role === 'PLATFORM_ADMIN' ? '/admin/workspaces' : '/dashboard');

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (user) return <Navigate to={homePathFor(user.role)} replace />;
  return children;
}

function RequireRole({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!user || !roles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
        <Route path="/signup" element={<PublicOnlyRoute><Signup /></PublicOnlyRoute>} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/accept-invite" element={<AcceptInvite />} />
        <Route path="/unauthorized" element={<ProtectedRoute><Unauthorized /></ProtectedRoute>} />

        <Route path="/" element={<ProtectedRoute><RequireRole roles={['OWNER', 'MANAGER']}><Layout /></RequireRole></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="properties" element={<Properties />} />
          <Route path="units" element={<Units />} />
          <Route path="tenants" element={<Tenants />} />
          <Route path="payments" element={<Payments />} />
          <Route path="users" element={<RequireRole roles={['OWNER']}><Users /></RequireRole>} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<div style={{ padding: '24px' }}><h2>404 Page Not Found</h2><p>The page you are looking for does not exist.</p></div>} />
        </Route>

        <Route path="/admin" element={<ProtectedRoute><RequireRole roles={['PLATFORM_ADMIN']}><AdminLayout /></RequireRole></ProtectedRoute>}>
          <Route index element={<Navigate to="/admin/workspaces" replace />} />
          <Route path="workspaces" element={<Workspaces />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<PlatformSettings />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="logs" element={<Logs />} />
          <Route path="*" element={<div style={{ padding: '24px' }}><h2>404 Page Not Found</h2><p>The page you are looking for does not exist.</p></div>} />
        </Route>

        <Route path="*" element={<div style={{ padding: '24px' }}><h2>404 Page Not Found</h2><p>The page you are looking for does not exist.</p></div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
