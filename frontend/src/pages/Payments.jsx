import React, { useEffect, useState } from 'react';
import { CreditCard, Download, Search, Plus } from 'lucide-react';
import Table from '../components/Table';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    tenant_id: '',
    amount: '',
    payment_method: 'Mobile Money',
    reference_number: '',
    status: 'COMPLETED'
  });

  const fetchPayments = async (currentPage) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/payments?page=${currentPage}&size=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPayments(data.items);
        setPages(data.pages);
      }
    } catch (error) {
      console.error("Error fetching payments", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveTenants = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tenants?page=1&size=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTenants(data.items.filter(t => t.status === 'ACTIVE'));
      }
    } catch (error) {
      console.error("Error fetching tenants", error);
    }
  };

  useEffect(() => {
    fetchPayments(page);
    fetchActiveTenants();
  }, [page]);

  const handleCreatePayment = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          tenant_id: parseInt(formData.tenant_id),
          amount: parseFloat(formData.amount)
        })
      });
      if (response.ok) {
        setShowModal(false);
        setFormData({ tenant_id: '', amount: '', payment_method: 'Mobile Money', reference_number: '', status: 'COMPLETED' });
        fetchPayments(page);
      } else {
        alert("Failed to record payment.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const columns = ['Amount (TZS)', 'Payment Date', 'Method', 'Reference', 'Status'];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Rent Payments</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '4px' }}>Track all incoming rent payments and outstanding balances.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn" style={{ backgroundColor: 'white', border: '1px solid var(--color-border)', color: 'var(--color-text-main)' }}>
            <Download size={18} /> Export
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} style={{ marginRight: '4px' }} /> Record Payment
          </button>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '400px', backgroundColor: 'var(--color-bg-card)', height: '100%', padding: '32px', boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ marginBottom: '8px' }}>Record Payment</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '32px', fontSize: '0.875rem' }}>Manually record a rent payment received from a tenant.</p>
            
            <form onSubmit={handleCreatePayment} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div className="form-group">
                <label className="form-label">Tenant</label>
                <select className="form-input" required value={formData.tenant_id} onChange={e => setFormData({...formData, tenant_id: e.target.value})}>
                  <option value="">Select Tenant</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.full_name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Amount (TZS)</label>
                <input type="number" className="form-input" required placeholder="e.g. 500000" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select className="form-input" value={formData.payment_method} onChange={e => setFormData({...formData, payment_method: e.target.value})}>
                  <option value="Mobile Money">Mobile Money (M-Pesa/TigoPesa)</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Reference Number (Optional)</label>
                <input className="form-input" placeholder="e.g. TXN12345678" value={formData.reference_number} onChange={e => setFormData({...formData, reference_number: e.target.value})} />
              </div>
              
              <div style={{ marginTop: 'auto', display: 'flex', gap: '12px', paddingTop: '24px', borderTop: '1px solid var(--color-border)' }}>
                <button type="button" className="btn btn-outline btn-full" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-full">Record Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="table-container">
        <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)' }}>
          <div className="search-bar" style={{ width: '300px' }}>
            <Search size={18} color="var(--color-text-muted)" />
            <input type="text" placeholder="Search receipts..." />
          </div>
        </div>
        
        {loading ? (
          <div style={{ padding: '24px' }}>
            <div className="skeleton" style={{ height: '32px', width: '100%', marginBottom: '16px' }}></div>
            <div className="skeleton" style={{ height: '32px', width: '100%', marginBottom: '16px' }}></div>
            <div className="skeleton" style={{ height: '32px', width: '100%' }}></div>
          </div>
        ) : (
          <div style={{ borderTop: 'none', borderRadius: '0' }} className="table-container-override">
            <Table 
              columns={columns} 
              data={payments} 
              page={page} 
              pages={pages} 
              onPageChange={setPage}
              renderRow={(payment) => (
                <tr key={payment.id}>
                  <td style={{ fontWeight: 600 }}>{payment.amount.toLocaleString()}</td>
                  <td>{new Date(payment.payment_date).toLocaleDateString()}</td>
                  <td>{payment.payment_method}</td>
                  <td>{payment.reference_number || '-'}</td>
                  <td>
                    <span className={`badge ${payment.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`}>
                      {payment.status}
                    </span>
                  </td>
                </tr>
              )}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Payments;
