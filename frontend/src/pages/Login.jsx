import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Loader2 } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@pango.co.tz');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      localStorage.setItem('token', data.access_token);
      navigate('/dashboard');
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
                <a href="#" style={{ fontSize: '0.875rem', color: 'var(--color-primary)', fontWeight: 500 }}>Forgot Password?</a>
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
              <input type="checkbox" id="remember" />
              <label htmlFor="remember" style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Remember Me</label>
            </div>
            
            <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: '16px', height: '48px', fontSize: '1rem' }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          
          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            Admin Scope - Full Platform Management
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
