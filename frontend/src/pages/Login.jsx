import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Building, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
          <p style={{ marginBottom: '32px', color: 'var(--color-text-muted)' }}>Enter your credentials to access your workspace.</p>

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
            Don't have a workspace? <Link to="/signup" style={{ color: 'var(--color-primary)', fontWeight: 500 }}>Create one</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
