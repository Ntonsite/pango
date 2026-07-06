import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Building, Loader2, KeyRound } from 'lucide-react';
import { api, ApiError } from '../api';
import { useAuth } from '../context/AuthContext';

const ResetPassword = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const data = await api.post('/auth/reset-password', { token, password });
      const loggedInUser = await login(data.access_token, true);
      navigate(loggedInUser?.role === 'PLATFORM_ADMIN' ? '/admin/workspaces' : '/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
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
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="auth-form-container" style={{ borderRadius: 'var(--radius-lg)' }}>
          <div className="greeting-icon" style={{ backgroundColor: 'var(--color-primary-soft)', color: 'var(--color-primary)', marginBottom: '20px' }}>
            <KeyRound size={26} />
          </div>
          <h2 style={{ marginBottom: '8px', fontSize: '1.75rem', fontWeight: 700 }}>Set a new password</h2>
          <p style={{ marginBottom: '32px', color: 'var(--color-text-muted)' }}>Choose a strong password for your account.</p>

          {!token && (
            <div style={{ padding: '12px', backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '0.875rem' }}>
              This link is missing its reset token. Please request a new one.
            </div>
          )}

          {error && (
            <div style={{ padding: '12px', backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input type="password" className="form-input" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input type="password" className="form-input" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading || !token} style={{ marginTop: '16px', height: '48px', fontSize: '1rem' }}>
              {loading ? (<><Loader2 className="spin" size={18} /> Updating...</>) : 'Update Password & Sign In'}
            </button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.875rem' }}>
            <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 500 }}>Back to Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
