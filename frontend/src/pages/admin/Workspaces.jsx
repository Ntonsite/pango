import React, { useEffect, useState } from 'react';
import { Building2, Plus, Copy, Check, Pause, Play, Trash2 } from 'lucide-react';
import Table from '../../components/Table';
import { api } from '../../api';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { copyToClipboard } from '../../clipboard';

const PLAN_OPTIONS = ['FREE', 'BASIC', 'PRO'];

const Workspaces = () => {
  const toast = useToast();
  const confirm = useConfirm();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', owner_full_name: '', owner_email: '' });
  const [inviteLink, setInviteLink] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchWorkspaces = async (currentPage) => {
    setLoading(true);
    try {
      const data = await api.get(`/admin/workspaces?page=${currentPage}&size=10`);
      setWorkspaces(data.items);
      setPages(data.pages);
    } catch (error) {
      console.error('Error fetching workspaces', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWorkspaces(page); }, [page]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const data = await api.post('/admin/workspaces', formData);
      setShowModal(false);
      setFormData({ name: '', owner_full_name: '', owner_email: '' });
      fetchWorkspaces(page);
      setInviteLink(`${window.location.origin}${data.invite_link}`);
      toast.success('Workspace created', `${data.workspace.name} is ready. Share the invite link with the owner.`);
    } catch (error) {
      toast.error('Failed to create workspace', error.message);
    }
  };

  const handleToggleStatus = async (workspace) => {
    const suspending = workspace.status === 'ACTIVE';
    const confirmed = await confirm({
      title: suspending ? 'Suspend workspace?' : 'Reactivate workspace?',
      message: suspending
        ? `${workspace.name} and its users will lose access immediately.`
        : `${workspace.name} and its users will regain access.`,
      confirmLabel: suspending ? 'Suspend' : 'Reactivate',
    });
    if (!confirmed) return;
    try {
      await api.patch(`/admin/workspaces/${workspace.id}/status`, { status: suspending ? 'SUSPENDED' : 'ACTIVE' });
      fetchWorkspaces(page);
      toast.success(suspending ? 'Workspace suspended' : 'Workspace reactivated', workspace.name);
    } catch (error) {
      toast.error('Failed to update workspace', error.message);
    }
  };

  const handlePlanChange = async (workspace, plan) => {
    try {
      await api.patch(`/admin/workspaces/${workspace.id}/plan`, { plan });
      fetchWorkspaces(page);
      toast.success('Plan updated', `${workspace.name} is now on the ${plan} plan.`);
    } catch (error) {
      toast.error('Failed to update plan', error.message);
    }
  };

  const handleDelete = async (workspace) => {
    const confirmed = await confirm({
      title: 'Delete workspace permanently?',
      message: `This deletes ${workspace.name} and all of its properties, units, tenants, payments, and users. This cannot be undone.`,
      confirmLabel: 'Delete permanently',
    });
    if (!confirmed) return;
    try {
      await api.delete(`/admin/workspaces/${workspace.id}`);
      fetchWorkspaces(page);
      toast.success('Workspace deleted', `${workspace.name} has been permanently removed.`);
    } catch (error) {
      toast.error('Failed to delete workspace', error.message);
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

  const columns = ['Workspace', 'Owner', 'Plan', 'Status', 'Users', 'Created', 'Actions'];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Workspaces</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '4px' }}>Every customer on the platform runs in an isolated workspace.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} style={{ marginRight: '4px' }} /> New Workspace
        </button>
      </div>

      {showModal && (
        <div className="slide-over-backdrop" onClick={() => setShowModal(false)}>
          <div className="slide-over-panel" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: '8px' }}>Onboard a New Customer</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '32px', fontSize: '0.875rem' }}>
              This creates the workspace and its Owner account. The Owner sets their own password via a one-time invite link.
            </p>
            <form onSubmit={handleCreate} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div className="form-group">
                <label className="form-label">Workspace Name</label>
                <input className="form-input" required placeholder="e.g. Palm Estates Ltd" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Owner Full Name</label>
                <input className="form-input" required placeholder="e.g. Amina Hassan" value={formData.owner_full_name} onChange={(e) => setFormData({ ...formData, owner_full_name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Owner Email</label>
                <input type="email" className="form-input" required placeholder="e.g. amina@palmestates.co.tz" value={formData.owner_email} onChange={(e) => setFormData({ ...formData, owner_email: e.target.value })} />
              </div>
              <div style={{ marginTop: 'auto', display: 'flex', gap: '12px', paddingTop: '24px', borderTop: '1px solid var(--color-border)' }}>
                <button type="button" className="btn btn-outline btn-full" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-full">Create Workspace</button>
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
            <div className="dialog-title">Workspace created</div>
            <p className="dialog-message">
              Share this one-time invite link with the new Owner so they can set their own password. It won't be shown again.
            </p>
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
          data={workspaces}
          page={page}
          pages={pages}
          onPageChange={setPage}
          renderRow={(ws) => (
            <tr key={ws.id}>
              <td style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={16} color="var(--color-text-muted)" />
                {ws.name}
              </td>
              <td>
                <div>{ws.owner_full_name || '—'}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{ws.owner_email}</div>
              </td>
              <td>
                <select className="form-input" style={{ padding: '6px 10px', fontSize: '0.8125rem' }} value={ws.plan} onChange={(e) => handlePlanChange(ws, e.target.value)}>
                  {PLAN_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </td>
              <td>
                <span className={`badge ${ws.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>{ws.status}</span>
              </td>
              <td>{ws.user_count}</td>
              <td>{new Date(ws.created_at).toLocaleDateString()}</td>
              <td>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    title={ws.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                    onClick={() => handleToggleStatus(ws)}
                    style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '6px', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                  >
                    {ws.status === 'ACTIVE' ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                  <button
                    title="Delete"
                    onClick={() => handleDelete(ws)}
                    style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '6px', cursor: 'pointer', color: 'var(--color-danger)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          )}
          renderMobileCard={(ws) => (
            <div key={ws.id} className="mobile-card">
              <div className="mobile-card-row">
                <div className="mobile-card-title">
                  <Building2 size={16} color="var(--color-text-muted)" />
                  <span>{ws.name}</span>
                </div>
                <span className={`badge ${ws.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>{ws.status}</span>
              </div>
              <div className="mobile-card-meta">
                <span>{ws.owner_full_name || '—'} ({ws.owner_email})</span>
                <span>{ws.user_count} users &middot; {ws.plan} plan</span>
                <span>Created {new Date(ws.created_at).toLocaleDateString()}</span>
              </div>
              <div className="mobile-card-actions">
                <select className="form-input" style={{ flex: 1, padding: '8px 10px', fontSize: '0.8125rem' }} value={ws.plan} onChange={(e) => handlePlanChange(ws, e.target.value)}>
                  {PLAN_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <button
                  title={ws.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                  onClick={() => handleToggleStatus(ws)}
                  style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '8px', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                >
                  {ws.status === 'ACTIVE' ? <Pause size={14} /> : <Play size={14} />}
                </button>
                <button
                  title="Delete"
                  onClick={() => handleDelete(ws)}
                  style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '8px', cursor: 'pointer', color: 'var(--color-danger)' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )}
        />
      )}
    </div>
  );
};

export default Workspaces;
