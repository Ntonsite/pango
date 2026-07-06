import React from 'react';
import { User, Building, Shield, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const { user } = useAuth();
  const profile = user || { full_name: '', email: '', role: '' };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '4px' }}>Manage your personal profile and workspace preferences.</p>
        </div>
      </div>

      <div className="settings-layout">
        {/* Settings Navigation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button className="btn" style={{ justifyContent: 'flex-start', backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-primary)', color: 'var(--color-primary)' }}>
            <User size={18} style={{ marginRight: '8px' }} /> Personal Profile
          </button>
          <button className="btn btn-outline" style={{ justifyContent: 'flex-start', border: 'none', backgroundColor: 'transparent' }}>
            <Building size={18} style={{ marginRight: '8px' }} /> Workspace
          </button>
          <button className="btn btn-outline" style={{ justifyContent: 'flex-start', border: 'none', backgroundColor: 'transparent' }}>
            <Bell size={18} style={{ marginRight: '8px' }} /> Notifications
          </button>
          <button className="btn btn-outline" style={{ justifyContent: 'flex-start', border: 'none', backgroundColor: 'transparent' }}>
            <Shield size={18} style={{ marginRight: '8px' }} /> Security
          </button>
        </div>

        {/* Settings Content */}
        <div className="table-container" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '24px' }}>Profile Information</h2>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
            <div className="avatar" style={{ width: '80px', height: '80px', fontSize: '2rem', backgroundColor: 'var(--color-primary-light)' }}>
              {profile.full_name ? profile.full_name.split(' ').map(n => n[0]).join('').substring(0,2) : 'U'}
            </div>
            <div>
              <button className="btn btn-outline" style={{ marginBottom: '8px' }}>Change Photo</button>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>JPG, GIF or PNG. Max size of 800K</p>
            </div>
          </div>

          <form onSubmit={(e) => e.preventDefault()}>
            <div className="settings-field-grid">
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Full Name</label>
                <input className="form-input" defaultValue={profile.full_name} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Role</label>
                <input className="form-input" defaultValue={profile.role} disabled style={{ backgroundColor: '#F1F5F9', color: 'var(--color-text-muted)' }} />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '32px' }}>
              <label className="form-label">Email Address</label>
              <input type="email" className="form-input" defaultValue={profile.email} disabled style={{ backgroundColor: '#F1F5F9', color: 'var(--color-text-muted)' }} />
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary">Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
