import React, { useEffect, useState } from 'react';
import { Plus, Copy, Check, Pencil, Ban, PlayCircle, Trash2 } from 'lucide-react';
import Table from '../components/Table';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { copyToClipboard } from '../clipboard';

const UsersManagement = () => {
  const toast = useToast();
  const confirm = useConfirm();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ email: '', full_name: '' });
  const [inviteLink, setInviteLink] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchUsers = async (currentPage) => {
    setLoading(true);
    try {
      const data = await api.get(`/users?page=${currentPage}&size=10`);
      setUsers(data.items);
      setPages(data.pages);
    } catch (error) {
      console.error("Error fetching users", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(page); }, [page]);

  const openInvite = () => {
    setEditingUser(null);
    setFormData({ email: '', full_name: '' });
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setFormData({ email: user.email, full_name: user.full_name });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, { full_name: formData.full_name });
        toast.success('User updated', formData.full_name);
        setShowModal(false);
        fetchUsers(page);
      } else {
        const data = await api.post('/users', { email: formData.email, full_name: formData.full_name });
        setShowModal(false);
        fetchUsers(page);
        setInviteLink(`${window.location.origin}${data.invite_link}`);
        toast.success('Manager invited', `Share the invite link with ${formData.full_name}.`);
      }
    } catch (error) {
      toast.error(editingUser ? 'Failed to update user' : 'Failed to invite user', error.message);
    }
  };

  const handleToggleActive = async (user) => {
    const deactivating = user.is_active;
    const confirmed = await confirm({
      title: deactivating ? 'Deactivate user?' : 'Reactivate user?',
      message: `${user.full_name} will ${deactivating ? 'lose' : 'regain'} access to this workspace immediately.`,
      confirmLabel: deactivating ? 'Deactivate' : 'Reactivate',
    });
    if (!confirmed) return;
    try {
      await api.patch(`/users/${user.id}/status`, { is_active: !deactivating });
      fetchUsers(page);
      toast.success(deactivating ? 'User deactivated' : 'User reactivated', user.full_name);
    } catch (error) {
      toast.error('Failed to update user', error.message);
    }
  };

  const handleDelete = async (user) => {
    const confirmed = await confirm({
      title: 'Delete user?',
      message: `This permanently removes ${user.full_name} from your workspace.`,
      confirmLabel: 'Delete',
    });
    if (!confirmed) return;
    try {
      await api.delete(`/users/${user.id}`);
      fetchUsers(page);
      toast.success('User deleted', user.full_name);
    } catch (error) {
      toast.error('Failed to delete user', error.message);
    }
  };

  const copyLink = async () => {
    const success = await copyToClipboard(inviteLink);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('Copy failed', 'Select and copy the link manually.');
    }
  };

  const columns = ['Full Name', 'Email', 'Role', 'Status', 'Joined', 'Actions'];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '4px' }}>Invite and manage the Managers in your workspace.</p>
        </div>
        <button className="btn btn-primary" onClick={openInvite}>
          <Plus size={18} style={{ marginRight: '4px' }} /> Invite Manager
        </button>
      </div>

      {showModal && (
        <div className="dialog-backdrop" onClick={() => setShowModal(false)}>
          <div className="dialog-card" style={{ width: '400px', textAlign: 'left' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: '8px' }}>{editingUser ? 'Edit User' : 'Invite a Manager'}</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px', fontSize: '0.875rem' }}>
              {editingUser ? 'Update this user\'s display name.' : 'They set their own password via a one-time invite link — no password to share.'}
            </p>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" required value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-input" required disabled={!!editingUser} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn btn-outline btn-full" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-full">{editingUser ? 'Save' : 'Send Invite'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {inviteLink && (
        <div className="dialog-backdrop" onClick={() => setInviteLink(null)}>
          <div className="dialog-card" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'left', width: '440px' }}>
            <div className="dialog-icon" style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
              <Check size={22} />
            </div>
            <div className="dialog-title">Invite ready to share</div>
            <p className="dialog-message">This one-time link lets them set their own password. It won't be shown again.</p>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <input className="form-input" readOnly value={inviteLink} onClick={(e) => e.target.select()} style={{ fontSize: '0.75rem' }} />
              <button className="btn btn-outline" onClick={copyLink} style={{ flexShrink: 0 }}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
            <button className="btn btn-primary btn-full" onClick={() => setInviteLink(null)}>Done</button>
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
          renderRow={(user) => (
            <tr key={user.id}>
              <td style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '0.75rem' }}>
                  {user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </div>
                {user.full_name}
              </td>
              <td>{user.email}</td>
              <td>
                <span className={`badge ${user.role === 'OWNER' ? 'badge-warning' : 'badge-secondary'}`}>
                  {user.role}
                </span>
              </td>
              <td>
                <span className={`badge ${user.is_active ? 'badge-success' : 'badge-danger'}`}>
                  {user.is_active ? 'Active' : 'Invite pending'}
                </span>
              </td>
              <td>{new Date(user.created_at).toLocaleDateString()}</td>
              <td>
                {user.role !== 'OWNER' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button title="Edit" onClick={() => openEdit(user)} style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '6px', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                      <Pencil size={14} />
                    </button>
                    <button title={user.is_active ? 'Deactivate' : 'Reactivate'} onClick={() => handleToggleActive(user)} style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '6px', cursor: 'pointer', color: user.is_active ? 'var(--color-danger)' : 'var(--color-success)' }}>
                      {user.is_active ? <Ban size={14} /> : <PlayCircle size={14} />}
                    </button>
                    <button title="Delete" onClick={() => handleDelete(user)} style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '6px', cursor: 'pointer', color: 'var(--color-danger)' }}>
                      <Trash2 size={14} />
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

export default UsersManagement;
