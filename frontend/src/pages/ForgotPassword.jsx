import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building, Loader2, MailCheck } from 'lucide-react';
import { api } from '../api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
    } catch {
      // Endpoint always returns success to avoid leaking which emails are registered.
    } finally {
      setSent(true);
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
          {sent ? (
            <>
              <div className="greeting-icon" style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)', marginBottom: '20px' }}>
                <MailCheck size={26} />
              </div>
              <h2 style={{ marginBottom: '8px', fontSize: '1.5rem', fontWeight: 700 }}>Check your inbox</h2>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                If an account exists for <strong>{email}</strong>, a password reset link has been generated.
              </p>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', marginBottom: '32px' }}>
                This demo environment has no email provider configured — ask your Platform Admin, or check the backend logs (<code>docker logs pango-api</code>) for the reset link.
              </p>
              <Link to="/login" className="btn btn-outline btn-full">Back to Sign In</Link>
            </>
          ) : (
            <>
              <h2 style={{ marginBottom: '8px', fontSize: '1.75rem', fontWeight: 700 }}>Forgot your password?</h2>
              <p style={{ marginBottom: '32px', color: 'var(--color-text-muted)' }}>Enter your email and we'll generate a reset link.</p>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: '16px', height: '48px', fontSize: '1rem' }}>
                  {loading ? (<><Loader2 className="spin" size={18} /> Sending...</>) : 'Send Reset Link'}
                </button>
              </form>
              <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.875rem' }}>
                <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 500 }}>Back to Sign In</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
