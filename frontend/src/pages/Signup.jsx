import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building, Loader2 } from 'lucide-react';
import { api, ApiError } from '../api';
import { useAuth } from '../context/AuthContext';

const Signup = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ workspace_name: '', full_name: '', email: '', password: '' });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const data = await api.post('/auth/signup', formData);
      await login(data.access_token, true);
      navigate('/dashboard');
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
        <p style={{ marginTop: '40px', fontSize: '1rem', opacity: 0.7 }}>
          Create your own workspace in seconds — manage properties, track rent, and handle tenant contracts, all in one place.
        </p>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
        <div className="auth-form-container" style={{ borderRadius: 'var(--radius-lg)' }}>
          <h2 style={{ marginBottom: '8px', fontSize: '1.75rem', fontWeight: 700 }}>Create your workspace</h2>
          <p style={{ marginBottom: '32px', color: 'var(--color-text-muted)' }}>You'll be the Owner &mdash; full control from day one.</p>

          {error && (
            <div style={{ padding: '12px', backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Workspace Name</label>
              <input
                className="form-input"
                placeholder="e.g. Palm Estates Ltd"
                value={formData.workspace_name}
                onChange={(e) => setFormData({ ...formData, workspace_name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={8}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: '16px', height: '48px', fontSize: '1rem' }}>
              {loading ? (<><Loader2 className="spin" size={18} /> Creating workspace...</>) : 'Create Workspace'}
            </button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            Already have a workspace? <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 500 }}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
