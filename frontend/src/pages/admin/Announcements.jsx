import React, { useEffect, useState } from 'react';
import { Megaphone, Plus } from 'lucide-react';
import { api } from '../../api';
import { useToast } from '../../context/ToastContext';

const Announcements = () => {
  const toast = useToast();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await api.get('/admin/announcements');
      setAnnouncements(data);
    } catch (error) {
      console.error('Error fetching announcements', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    try {
      await api.post('/admin/announcements', { message, is_active: true });
      setMessage('');
      fetchAnnouncements();
      toast.success('Announcement published', 'It now shows to every signed-in user.');
    } catch (error) {
      toast.error('Failed to publish announcement', error.message);
    }
  };

  const handleToggle = async (announcement) => {
    try {
      await api.patch(`/admin/announcements/${announcement.id}/status`, { enabled: !announcement.is_active });
      fetchAnnouncements();
      toast.success(announcement.is_active ? 'Announcement hidden' : 'Announcement activated');
    } catch (error) {
      toast.error('Failed to update announcement', error.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Announcements</h1>
      </div>

      <div className="table-container" style={{ padding: '32px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div style={{ padding: '14px', backgroundColor: 'var(--color-primary-soft)', color: 'var(--color-primary)', borderRadius: 'var(--radius-lg)' }}>
            <Megaphone size={26} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Broadcast a message</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Publishing a new one replaces whatever is currently active.</p>
          </div>
        </div>
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: '12px' }}>
          <input className="form-input" placeholder="e.g. Scheduled maintenance this Saturday, 10pm-12am EAT." value={message} onChange={(e) => setMessage(e.target.value)} />
          <button type="submit" className="btn btn-primary" style={{ flexShrink: 0 }}>
            <Plus size={18} style={{ marginRight: '4px' }} /> Publish
          </button>
        </form>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: '120px', width: '100%' }}></div>
      ) : announcements.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', backgroundColor: 'var(--color-bg-card)', borderRadius: 'var(--radius-lg)', color: 'var(--color-text-muted)' }}>
          No announcements yet.
        </div>
      ) : (
        <div className="table-container">
          {announcements.map((a) => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid var(--color-border)' }}>
              <div>
                <div style={{ fontSize: '0.9375rem' }}>{a.message}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>{new Date(a.created_at).toLocaleString()}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                <span className={`badge ${a.is_active ? 'badge-success' : 'badge-secondary'}`}>{a.is_active ? 'Live' : 'Hidden'}</span>
                <button className="btn btn-outline" onClick={() => handleToggle(a)} style={{ padding: '6px 12px', fontSize: '0.8125rem' }}>
                  {a.is_active ? 'Hide' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Announcements;
