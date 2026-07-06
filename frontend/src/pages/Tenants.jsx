import React, { useEffect, useState } from 'react';
import { Users, MoreVertical, Plus } from 'lucide-react';
import Table from '../components/Table';

const Tenants = () => {
  const [tenants, setTenants] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    email: '',
    unit_id: '',
    contract_start: '',
    contract_end: '',
    status: 'ACTIVE'
  });

  const fetchTenants = async (currentPage) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tenants?page=${currentPage}&size=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTenants(data.items);
        setPages(data.pages);
      }
    } catch (error) {
      console.error("Error fetching tenants", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableUnits = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/units?page=1&size=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        // Filter only available units for assignment
        setUnits(data.items.filter(u => u.status === 'AVAILABLE'));
      }
    } catch (error) {
      console.error("Error fetching units", error);
    }
  };

  useEffect(() => {
    fetchTenants(page);
    fetchAvailableUnits();
  }, [page]);

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          unit_id: parseInt(formData.unit_id),
          contract_start: new Date(formData.contract_start).toISOString(),
          contract_end: new Date(formData.contract_end).toISOString()
        })
      });
      if (response.ok) {
        setShowModal(false);
        setFormData({ full_name: '', phone_number: '', email: '', unit_id: '', contract_start: '', contract_end: '', status: 'ACTIVE' });
        fetchTenants(page);
        fetchAvailableUnits();
      } else {
        alert("Failed to create tenant. Ensure unit is selected.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleMoveOut = async (tenantId) => {
    if (!confirm("Are you sure this tenant has moved out? This will release the unit.")) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tenants/${tenantId}/status?status_in=MOVED_OUT`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        fetchTenants(page);
        fetchAvailableUnits();
      }
    } catch (error) {
      console.error("Error updating status", error);
    }
  };

  const columns = ['Tenant Name', 'Phone Number', 'Contract Start', 'Contract End', 'Status', 'Actions'];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tenants</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '4px' }}>View and manage your active and past tenants.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} style={{ marginRight: '4px' }} /> Add New Tenant
        </button>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '400px', backgroundColor: 'var(--color-bg-card)', height: '100%', padding: '32px', boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ marginBottom: '8px' }}>Add New Tenant</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '32px', fontSize: '0.875rem' }}>Assign a tenant to an available unit and establish their contract terms.</p>
            
            <form onSubmit={handleCreateTenant} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" required placeholder="e.g. Aisha Juma" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input className="form-input" required placeholder="e.g. +255 712 345 678" value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address (Optional)</label>
                <input type="email" className="form-input" placeholder="e.g. aisha@gmail.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Assigned Unit</label>
                <select className="form-input" required value={formData.unit_id} onChange={e => setFormData({...formData, unit_id: e.target.value})}>
                  <option value="">Select Unit</option>
                  {units.map(u => (
                    <option key={u.id} value={u.id}>{u.unit_number} (Rent: TZS {u.monthly_rent.toLocaleString()})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Contract Start Date</label>
                <input type="date" className="form-input" required value={formData.contract_start} onChange={e => setFormData({...formData, contract_start: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Contract End Date</label>
                <input type="date" className="form-input" required value={formData.contract_end} onChange={e => setFormData({...formData, contract_end: e.target.value})} />
              </div>
              
              <div style={{ marginTop: 'auto', display: 'flex', gap: '12px', paddingTop: '24px', borderTop: '1px solid var(--color-border)' }}>
                <button type="button" className="btn btn-outline btn-full" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-full">Save Tenant</button>
              </div>
            </form>
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
          data={tenants} 
          page={page} 
          pages={pages} 
          onPageChange={setPage}
          renderRow={(tenant) => (
            <tr key={tenant.id}>
              <td style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '0.75rem' }}>
                  {tenant.full_name.split(' ').map(n => n[0]).join('').substring(0,2)}
                </div>
                {tenant.full_name}
              </td>
              <td>{tenant.phone_number}</td>
              <td>{new Date(tenant.contract_start).toLocaleDateString()}</td>
              <td>{new Date(tenant.contract_end).toLocaleDateString()}</td>
              <td>
                <span className={`badge ${tenant.status === 'ACTIVE' ? 'badge-success' : 'badge-secondary'}`}>
                  {tenant.status}
                </span>
              </td>
              <td>
                {tenant.status === 'ACTIVE' && (
                  <button 
                    onClick={() => handleMoveOut(tenant.id)}
                    style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--color-primary)' }}
                  >
                    Move Out
                  </button>
                )}
              </td>
            </tr>
          )}
        />
      )}
    </div>
  );
};

export default Tenants;
