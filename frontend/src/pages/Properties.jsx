import React, { useEffect, useState } from 'react';
import { Building, MapPin, MoreVertical, Plus } from 'lucide-react';
import Table from '../components/Table';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const Properties = () => {
  const toast = useToast();
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', address: '', description: '' });

  const fetchProperties = async (currentPage) => {
    setLoading(true);
    try {
      const data = await api.get(`/properties?page=${currentPage}&size=10`);
      setProperties(data.items);
      setPages(data.pages);
    } catch (error) {
      console.error("Error fetching properties", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProperties(page); }, [page]);

  const handleCreateProperty = async (e) => {
    e.preventDefault();
    try {
      await api.post('/properties', formData);
      setShowModal(false);
      setFormData({ name: '', address: '', description: '' });
      fetchProperties(page);
      toast.success('Property added', `${formData.name} is now part of your portfolio.`);
    } catch (error) {
      toast.error('Failed to create property', error.message);
    }
  };

  const canCreate = user?.role !== 'MANAGER';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Properties</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '4px' }}>Manage all your property locations here.</p>
        </div>
        {canCreate && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} style={{ marginRight: '4px' }} /> Add New Property
          </button>
        )}
      </div>

      {showModal && (
        <div className="slide-over-backdrop" onClick={() => setShowModal(false)}>
          <div className="slide-over-panel" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: '8px' }}>Create New Property</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '32px', fontSize: '0.875rem' }}>Enter the details of the new property to add it to your workspace.</p>
            
            <form onSubmit={handleCreateProperty} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div className="form-group">
                <label className="form-label">Property Name</label>
                <input className="form-input" required placeholder="e.g. Palm Residency" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input className="form-input" required placeholder="e.g. Masaki, Dar es Salaam" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <textarea className="form-input" rows="4" placeholder="Additional details..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
              </div>
              
              <div style={{ marginTop: 'auto', display: 'flex', gap: '12px', paddingTop: '24px', borderTop: '1px solid var(--color-border)' }}>
                <button type="button" className="btn btn-outline btn-full" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-full">Save Property</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="dashboard-grid">
          {[1, 2, 3].map(i => (
            <div key={i} className="stat-card" style={{ padding: '24px' }}>
              <div className="skeleton" style={{ height: '40px', width: '40px', borderRadius: '8px', marginBottom: '16px' }}></div>
              <div className="skeleton" style={{ height: '24px', width: '60%', marginBottom: '8px' }}></div>
              <div className="skeleton" style={{ height: '16px', width: '40%' }}></div>
            </div>
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', backgroundColor: 'var(--color-bg-card)', borderRadius: 'var(--radius-lg)' }}>
          <Building size={48} color="var(--color-text-muted)" style={{ margin: '0 auto 16px' }} />
          <h3>No Properties Found</h3>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '8px', marginBottom: '24px' }}>Get started by adding your first property.</p>
          {canCreate && <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Property</button>}
        </div>
      ) : (
        <div className="dashboard-grid">
          {properties.map(property => (
            <div key={property.id} className="stat-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ padding: '12px', backgroundColor: 'var(--color-primary-light)', color: 'white', borderRadius: 'var(--radius-md)' }}>
                    <Building size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{property.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>
                      <MapPin size={14} />
                      {property.address}
                    </div>
                  </div>
                </div>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                  <MoreVertical size={20} />
                </button>
              </div>
              
              <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Status</div>
                  <div style={{ marginTop: '4px' }}>
                    <span className={`badge ${property.status === 'Active' ? 'badge-success' : 'badge-secondary'}`}>
                      {property.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {pages > 1 && !loading && (
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
           <Table columns={[]} data={[]} page={page} pages={pages} onPageChange={setPage} renderRow={() => {}} />
        </div>
      )}
    </div>
  );
};

export default Properties;
