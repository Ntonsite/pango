import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Building2, Users, Landmark, TrendingUp } from 'lucide-react';
import { api } from '../../api';

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const result = await api.get('/admin/analytics');
        setData(result);
      } catch (error) {
        console.error('Error fetching analytics', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading || !data) {
    return (
      <div className="dashboard-grid">
        {[1, 2, 3, 4].map((i) => <div key={i} className="stat-card skeleton" style={{ height: '120px' }}></div>)}
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Platform Analytics</h1>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-card-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
            Workspaces
            <Building2 size={18} color="var(--color-primary)" />
          </div>
          <div className="stat-card-value">{data.total_workspaces}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            {data.active_workspaces} active &middot; {data.suspended_workspaces} suspended
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
            Total Users
            <Users size={18} color="var(--color-primary)" />
          </div>
          <div className="stat-card-value">{data.total_users}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            {data.total_owners} owners &middot; {data.total_managers} managers
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
            Properties Managed
            <Landmark size={18} color="var(--color-primary)" />
          </div>
          <div className="stat-card-value">{data.total_properties}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            {data.total_units} units &middot; {data.total_tenants} tenants
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
            Total Collected
            <TrendingUp size={18} color="var(--color-success)" />
          </div>
          <div className="stat-card-value">TZS {(data.total_collected / 1000000).toFixed(1)}M</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Across all workspaces</div>
        </div>
      </div>

      <div className="chart-card">
        <h2 className="chart-title">New Workspaces (last 6 months)</h2>
        {data.workspaces_by_month.length === 0 ? (
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No new workspaces in this period.</div>
        ) : (
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={data.workspaces_by_month} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default Analytics;
