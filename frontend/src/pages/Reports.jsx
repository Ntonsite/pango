import React, { useEffect, useState } from 'react';
import { FileText, Download, TrendingUp } from 'lucide-react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';

const Reports = () => {
  const toast = useToast();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      const data = await api.get(`/reports/financial`);
      setReportData(data);
    } catch (error) {
      console.error("Error fetching reports", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '4px' }}>Generate and export property and financial reports.</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card" style={{ padding: '32px', gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{ padding: '16px', backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)', borderRadius: 'var(--radius-lg)' }}>
              <TrendingUp size={32} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Financial Summary</h2>
              <p style={{ color: 'var(--color-text-muted)' }}>Total lifetime collections overview.</p>
            </div>
          </div>
          
          {loading ? (
             <div className="skeleton" style={{ height: '48px', width: '50%' }}></div>
          ) : (
            <div style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
              TZS {reportData?.total_collections?.toLocaleString() || '0'}
            </div>
          )}
          
          <div style={{ marginTop: '32px', display: 'flex', gap: '12px' }}>
            <button className="btn btn-primary" onClick={() => toast.info('Coming soon', 'PDF export is on its way — check back shortly.')}>
              <Download size={18} style={{ marginRight: '8px' }} /> Download PDF Report
            </button>
            <button className="btn btn-outline" onClick={() => toast.info('Coming soon', 'CSV export is on its way — check back shortly.')}>
              Export CSV
            </button>
          </div>
        </div>

        <div className="stat-card" style={{ padding: '32px' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{ padding: '16px', backgroundColor: 'var(--color-primary-light)', color: 'white', borderRadius: 'var(--radius-lg)' }}>
              <FileText size={32} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Occupancy Report</h2>
              <p style={{ color: 'var(--color-text-muted)' }}>Tenant and Unit statuses.</p>
            </div>
          </div>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '32px' }}>
            Generates a comprehensive breakdown of vacant vs occupied units, current tenant details, and upcoming contract expirations.
          </p>
          <button className="btn btn-outline btn-full" onClick={() => toast.info('Coming soon', 'Occupancy report generation is on its way.')}>
            Generate Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reports;
