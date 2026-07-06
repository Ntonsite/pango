import React, { useEffect, useState } from 'react';
import { Home, MoreVertical, Plus } from 'lucide-react';
import Table from '../components/Table';
import { api } from '../api';
import { useToast } from '../context/ToastContext';

const Units = () => {
  const toast = useToast();
  const [units, setUnits] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    property_id: '',
    unit_number: '',
    monthly_rent: '',
    deposit_amount: '0',
    status: 'AVAILABLE'
  });

  const fetchUnits = async (currentPage) => {
    setLoading(true);
    try {
      const data = await api.get(`/units?page=${currentPage}&size=10`);
      setUnits(data.items);
      setPages(data.pages);
    } catch (error) {
      console.error("Error fetching units", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      const data = await api.get(`/properties?page=1&size=100`);
      setProperties(data.items);
    } catch (error) {
      console.error("Error fetching properties", error);
    }
  };

  useEffect(() => {
    fetchUnits(page);
    fetchProperties();
  }, [page]);

  const handleCreateUnit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/units', {
        ...formData,
        property_id: parseInt(formData.property_id),
        monthly_rent: parseFloat(formData.monthly_rent),
        deposit_amount: parseFloat(formData.deposit_amount)
      });
      setShowModal(false);
      setFormData({ property_id: '', unit_number: '', monthly_rent: '', deposit_amount: '0', status: 'AVAILABLE' });
      fetchUnits(page);
      toast.success('Unit added', `${formData.unit_number} is now available in your inventory.`);
    } catch (error) {
      toast.error('Failed to create unit', error.message);
    }
  };

  const columns = ['Unit ID', 'Rent (TZS)', 'Deposit', 'Status', 'Actions'];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Units</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '4px' }}>Manage all individual units across your properties.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} style={{ marginRight: '4px' }} /> Add New Unit
        </button>
      </div>

      {showModal && (
        <div className="slide-over-backdrop" onClick={() => setShowModal(false)}>
          <div className="slide-over-panel" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: '8px' }}>Create New Unit</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '32px', fontSize: '0.875rem' }}>Add a new unit to an existing property location.</p>
            
            <form onSubmit={handleCreateUnit} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div className="form-group">
                <label className="form-label">Property</label>
                <select className="form-input" required value={formData.property_id} onChange={e => setFormData({...formData, property_id: e.target.value})}>
                  <option value="">Select Property</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Unit Number / Name</label>
                <input className="form-input" required placeholder="e.g. Apt 3A" value={formData.unit_number} onChange={e => setFormData({...formData, unit_number: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Monthly Rent (TZS)</label>
                <input type="number" className="form-input" required placeholder="e.g. 500000" value={formData.monthly_rent} onChange={e => setFormData({...formData, monthly_rent: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Deposit Amount (TZS)</label>
                <input type="number" className="form-input" required placeholder="e.g. 1000000" value={formData.deposit_amount} onChange={e => setFormData({...formData, deposit_amount: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Initial Status</label>
                <select className="form-input" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                  <option value="AVAILABLE">Available</option>
                  <option value="MAINTENANCE">Maintenance</option>
                </select>
              </div>
              
              <div style={{ marginTop: 'auto', display: 'flex', gap: '12px', paddingTop: '24px', borderTop: '1px solid var(--color-border)' }}>
                <button type="button" className="btn btn-outline btn-full" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-full">Save Unit</button>
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
          data={units} 
          page={page} 
          pages={pages} 
          onPageChange={setPage}
          renderRow={(unit) => (
            <tr key={unit.id}>
              <td style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Home size={16} color="var(--color-text-muted)" />
                {unit.unit_number}
              </td>
              <td>{unit.monthly_rent.toLocaleString()}</td>
              <td>{unit.deposit_amount.toLocaleString()}</td>
              <td>
                <span className={`badge ${unit.status === 'OCCUPIED' ? 'badge-primary' : unit.status === 'AVAILABLE' ? 'badge-success' : 'badge-warning'}`}>
                  {unit.status}
                </span>
              </td>
              <td>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                  <MoreVertical size={16} />
                </button>
              </td>
            </tr>
          )}
          renderMobileCard={(unit) => (
            <div key={unit.id} className="mobile-card">
              <div className="mobile-card-row">
                <div className="mobile-card-title">
                  <Home size={16} color="var(--color-text-muted)" />
                  <span>{unit.unit_number}</span>
                </div>
                <span className={`badge ${unit.status === 'OCCUPIED' ? 'badge-primary' : unit.status === 'AVAILABLE' ? 'badge-success' : 'badge-warning'}`}>
                  {unit.status}
                </span>
              </div>
              <div className="mobile-card-meta">
                <span>Rent: TZS {unit.monthly_rent.toLocaleString()}</span>
                <span>Deposit: TZS {unit.deposit_amount.toLocaleString()}</span>
              </div>
            </div>
          )}
        />
      )}
    </div>
  );
};

export default Units;
