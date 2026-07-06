import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Building, Loader2, ShieldCheck, Crown, Wrench, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DEMO_ACCOUNTS = [
  { role: 'Platform Admin', email: 'admin@platform.com', password: 'Password123!', Icon: ShieldCheck, note: 'Manages the whole SaaS platform' },
  { role: 'Workspace Owner', email: 'owner@tonyproperties.com', password: 'Password123!', Icon: Crown, note: 'Full control of Tony Properties Ltd' },
  { role: 'Workspace Manager', email: 'manager@tonyproperties.com', password: 'Password123!', Icon: Wrench, note: 'Day-to-day operations only' },
];

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDemo, setShowDemo] = useState(false);
  const expired = searchParams.get('expired') === '1';

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await fetch('/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Invalid email or password');
      }

      const data = await response.json();
      const loggedInUser = await login(data.access_token, remember);
      navigate(loggedInUser?.role === 'PLATFORM_ADMIN' ? '/admin/workspaces' : '/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyDemoAccount = (account) => {
    setEmail(account.email);
    setPassword(account.password);
    setShowDemo(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-sidebar">
        <Building size={64} style={{ marginBottom: '24px' }} />
        <h1>Pango</h1>
        <p>Modern SaaS Apartment Rental Management System for Tanzania.</p>
        <p style={{ marginTop: '40px', fontSize: '1rem', opacity: 0.7 }}>
          Manage your properties, track rent, and handle tenant contracts all in one place.
        </p>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="auth-form-container" style={{ borderRadius: 'var(--radius-lg)' }}>
          <h2 style={{ marginBottom: '8px', fontSize: '1.75rem', fontWeight: 700 }}>Welcome Back</h2>
          <p style={{ marginBottom: '24px', color: 'var(--color-text-muted)' }}>Enter your credentials to access your workspace.</p>

          {expired && (
            <div style={{ padding: '12px', backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning)', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '0.875rem' }}>
              Your session has expired. Please sign in again.
            </div>
          )}

          {error && (
            <div style={{ padding: '12px', backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '24px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <button
              type="button"
              onClick={() => setShowDemo(!showDemo)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--color-bg-subtle)', border: 'none', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-main)' }}
            >
              Try a demo account
              <ChevronDown size={16} style={{ transform: showDemo ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
            </button>
            {showDemo && (
              <div style={{ padding: '8px' }}>
                {DEMO_ACCOUNTS.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => applyDemoAccount(account)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', border: 'none', background: 'transparent', borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'left' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-subtle)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-primary-soft)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <account.Icon size={18} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{account.role}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{account.email}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="form-label" style={{ margin: 0 }}>Password</label>
                <Link to="/forgot-password" style={{ fontSize: '0.875rem', color: 'var(--color-primary)', fontWeight: 500 }}>Forgot Password?</Link>
              </div>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" id="remember" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              <label htmlFor="remember" style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Remember Me</label>
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: '16px', height: '48px', fontSize: '1rem' }}>
              {loading ? (<><Loader2 className="spin" size={18} /> Signing in...</>) : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            Multi-tenant SaaS &mdash; every workspace's data stays isolated
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
