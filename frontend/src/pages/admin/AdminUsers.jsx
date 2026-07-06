import React, { useEffect, useState } from 'react';
import { KeyRound, Copy, Check, Ban, PlayCircle } from 'lucide-react';
import Table from '../../components/Table';
import { api } from '../../api';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';

const roleBadge = (role) => ({ PLATFORM_ADMIN: 'badge-primary', OWNER: 'badge-warning', MANAGER: 'badge-secondary' }[role] || 'badge-secondary');

const AdminUsers = () => {
  const toast = useToast();
  const confirm = useConfirm();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [resetLink, setResetLink] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchUsers = async (currentPage) => {
    setLoading(true);
    try {
      const data = await api.get(`/admin/users?page=${currentPage}&size=10`);
      setUsers(data.items);
      setPages(data.pages);
    } catch (error) {
      console.error('Error fetching users', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(page); }, [page]);

  const handleResetPassword = async (user) => {
    const confirmed = await confirm({
      title: 'Reset password?',
      message: `This invalidates ${user.email}'s current password and generates a one-time reset link.`,
      confirmLabel: 'Generate reset link',
    });
    if (!confirmed) return;
    try {
      const data = await api.post(`/admin/users/${user.id}/reset-password`);
      setResetLink(`${window.location.origin}${data.reset_link}`);
      toast.success('Reset link generated', `Share it with ${user.email}.`);
    } catch (error) {
      toast.error('Failed to generate reset link', error.message);
    }
  };

  const handleToggleActive = async (user) => {
    const deactivating = user.is_active;
    const confirmed = await confirm({
      title: deactivating ? 'Deactivate user?' : 'Reactivate user?',
      message: `${user.full_name} (${user.email}) will ${deactivating ? 'lose' : 'regain'} access immediately.`,
      confirmLabel: deactivating ? 'Deactivate' : 'Reactivate',
    });
    if (!confirmed) return;
    try {
      await api.patch(`/admin/users/${user.id}/status`, { is_active: !deactivating });
      fetchUsers(page);
      toast.success(deactivating ? 'User deactivated' : 'User reactivated', user.email);
    } catch (error) {
      toast.error('Failed to update user', error.message);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(resetLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const columns = ['Name', 'Email', 'Workspace', 'Role', 'Status', 'Actions'];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">All Users</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '4px' }}>Every user across every workspace on the platform.</p>
        </div>
      </div>

      {resetLink && (
        <div className="dialog-backdrop" onClick={() => setResetLink(null)}>
          <div className="dialog-card" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'left', width: '440px' }}>
            <div className="dialog-icon" style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
              <KeyRound size={22} />
            </div>
            <div className="dialog-title">Password reset link ready</div>
            <p className="dialog-message">Share this one-time link. It won't be shown again.</p>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <input className="form-input" readOnly value={resetLink} style={{ fontSize: '0.75rem' }} />
              <button className="btn btn-outline" onClick={copyLink} style={{ flexShrink: 0 }}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
            <button className="btn btn-primary btn-full" onClick={() => setResetLink(null)}>Done</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="table-container" style={{ padding: '24px' }}>
          <div className="skeleton" style={{ height: '32px', width: '100%', marginBottom: '16px' }}></div>
          <div className="skeleton" style={{ height: '32px', width: '100%', marginBottom: '16px' }}></div>
          <div className="skeleton" style={{ height: '32px', width: '100%' }}></div>
        </div>
      ) : (
        <Table
          columns={columns}
          data={users}
          page={page}
          pages={pages}
          onPageChange={setPage}
          renderRow={(u) => (
            <tr key={u.id}>
              <td style={{ fontWeight: 500 }}>{u.full_name}</td>
              <td>{u.email}</td>
              <td>{u.workspace_name || '—'}</td>
              <td><span className={`badge ${roleBadge(u.role)}`}>{u.role.replace('_', ' ')}</span></td>
              <td><span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
              <td>
                {u.role !== 'PLATFORM_ADMIN' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button title="Reset password" onClick={() => handleResetPassword(u)} style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '6px', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                      <KeyRound size={14} />
                    </button>
                    <button title={u.is_active ? 'Deactivate' : 'Reactivate'} onClick={() => handleToggleActive(u)} style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '6px', cursor: 'pointer', color: u.is_active ? 'var(--color-danger)' : 'var(--color-success)' }}>
                      {u.is_active ? <Ban size={14} /> : <PlayCircle size={14} />}
                    </button>
                  </div>
                )}
              </td>
            </tr>
          )}
        />
      )}
    </div>
  );
};

export default AdminUsers;
