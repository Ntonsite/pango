import React, { useEffect, useState } from 'react';
import { Megaphone, X } from 'lucide-react';
import { api } from '../api';

const AnnouncementBanner = () => {
  const [announcement, setAnnouncement] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    api.get('/announcements/active').then(setAnnouncement).catch(() => setAnnouncement(null));
  }, []);

  if (!announcement || dismissed) return null;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 20px',
      background: 'linear-gradient(120deg, var(--color-secondary-dark), var(--color-primary-dark))',
      color: 'white', fontSize: '0.8125rem', fontWeight: 500,
    }}>
      <Megaphone size={16} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{announcement.message}</span>
      <button onClick={() => setDismissed(true)} aria-label="Dismiss" style={{ background: 'none', border: 'none', color: 'white', opacity: 0.75, cursor: 'pointer', flexShrink: 0 }}>
        <X size={16} />
      </button>
    </div>
  );
};

export default AnnouncementBanner;
