import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Unauthorized = () => {
  const { user } = useAuth();
  const homePath = user?.role === 'PLATFORM_ADMIN' ? '/admin/workspaces' : '/dashboard';

  return (
    <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-app)', padding: '24px' }}>
      <div style={{ textAlign: 'center', maxWidth: '380px' }}>
        <div className="dialog-icon" style={{ margin: '0 auto 20px' }}>
          <ShieldAlert size={22} />
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px' }}>Access Restricted</h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '28px' }}>
          Your role doesn't have permission to view this page. If you believe this is a mistake, contact your workspace Owner.
        </p>
        <Link to={homePath} className="btn btn-primary">Back to Dashboard</Link>
      </div>
    </div>
  );
};

export default Unauthorized;
