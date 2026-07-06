import React, { useEffect, useState } from 'react';
import Table from '../../components/Table';
import { api } from '../../api';

const ACTION_LABELS = {
  'workspace.created': 'Workspace created',
  'workspace.status_changed': 'Workspace status changed',
  'workspace.plan_changed': 'Workspace plan changed',
  'workspace.deleted': 'Workspace deleted',
  'user.password_reset_issued': 'Password reset issued',
  'user.status_changed': 'User status changed',
  'feature_flag.toggled': 'Feature flag toggled',
  'announcement.created': 'Announcement published',
  'announcement.status_changed': 'Announcement status changed',
};

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const fetchLogs = async (currentPage) => {
    setLoading(true);
    try {
      const data = await api.get(`/admin/logs?page=${currentPage}&size=15`);
      setLogs(data.items);
      setPages(data.pages);
    } catch (error) {
      console.error('Error fetching logs', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(page); }, [page]);

  const columns = ['Time', 'Actor', 'Action', 'Detail'];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">System Logs</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '4px' }}>An audit trail of key platform-level actions.</p>
        </div>
      </div>

      {loading ? (
        <div className="table-container" style={{ padding: '24px' }}>
          <div className="skeleton" style={{ height: '32px', width: '100%', marginBottom: '16px' }}></div>
          <div className="skeleton" style={{ height: '32px', width: '100%', marginBottom: '16px' }}></div>
          <div className="skeleton" style={{ height: '32px', width: '100%' }}></div>
        </div>
      ) : (
        <Table
          columns={columns}
          data={logs}
          page={page}
          pages={pages}
          onPageChange={setPage}
          renderRow={(log) => (
            <tr key={log.id}>
              <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{new Date(log.created_at).toLocaleString()}</td>
              <td>{log.actor_email}</td>
              <td><span className="badge badge-secondary">{ACTION_LABELS[log.action] || log.action}</span></td>
              <td style={{ fontSize: '0.875rem' }}>{log.detail || '—'}</td>
            </tr>
          )}
          renderMobileCard={(log) => (
            <div key={log.id} className="mobile-card">
              <div className="mobile-card-row">
                <span className="badge badge-secondary">{ACTION_LABELS[log.action] || log.action}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{new Date(log.created_at).toLocaleString()}</span>
              </div>
              <div className="mobile-card-meta">
                <span>{log.actor_email}</span>
              </div>
              {log.detail && <div className="mobile-card-meta" style={{ marginTop: '4px' }}>{log.detail}</div>}
            </div>
          )}
        />
      )}
    </div>
  );
};

export default Logs;
