import React, { useEffect, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { api } from '../../api';
import { useToast } from '../../context/ToastContext';

const PlatformSettings = () => {
  const toast = useToast();
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFlags = async () => {
    try {
      const data = await api.get('/admin/feature-flags');
      setFlags(data);
    } catch (error) {
      console.error('Error fetching feature flags', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFlags(); }, []);

  const handleToggle = async (flag) => {
    try {
      await api.patch(`/admin/feature-flags/${flag.key}`, { enabled: !flag.enabled });
      setFlags((prev) => prev.map((f) => (f.key === flag.key ? { ...f, enabled: !flag.enabled } : f)));
      toast.success('Feature flag updated', `${flag.label} is now ${!flag.enabled ? 'on' : 'off'}.`);
    } catch (error) {
      toast.error('Failed to update flag', error.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Settings &amp; Feature Flags</h1>
      </div>

      <div className="table-container" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <div style={{ padding: '14px', backgroundColor: 'var(--color-primary-soft)', color: 'var(--color-primary)', borderRadius: 'var(--radius-lg)' }}>
            <SlidersHorizontal size={26} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Global Feature Flags</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Toggle experimental or platform-wide behavior for every workspace.</p>
          </div>
        </div>

        {loading ? (
          <div className="skeleton" style={{ height: '80px', width: '100%' }}></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {flags.map((flag) => (
              <label key={flag.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{flag.label}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{flag.description}</div>
                </div>
                <input type="checkbox" checked={flag.enabled} onChange={() => handleToggle(flag)} style={{ width: '20px', height: '20px', accentColor: 'var(--color-primary)', flexShrink: 0 }} />
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlatformSettings;
