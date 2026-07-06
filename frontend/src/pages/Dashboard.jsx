import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Home, Users, DollarSign, Building, Sunrise, Sun, Sunset, Moon } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const getGreeting = (hour) => {
  if (hour < 5) return { text: 'Good night', Icon: Moon };
  if (hour < 12) return { text: 'Good morning', Icon: Sunrise };
  if (hour < 17) return { text: 'Good afternoon', Icon: Sun };
  if (hour < 21) return { text: 'Good evening', Icon: Sunset };
  return { text: 'Good night', Icon: Moon };
};

const chartData = [
  { name: 'Jan', collected: 12000000 },
  { name: 'Feb', collected: 11500000 },
  { name: 'Mar', collected: 12800000 },
  { name: 'Apr', collected: 13200000 },
  { name: 'May', collected: 14000000 },
  { name: 'Jun', collected: 13800000 },
  { name: 'Jul', collected: 14500000 },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.get('/dashboard/stats');
        setStats(data);
      } catch (error) {
        console.error("Error fetching stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const { text: greetingText, Icon: GreetingIcon } = getGreeting(new Date().getHours());
  const firstName = user?.full_name?.split(' ')[0];

  if (loading || !stats) {
    return (
      <div style={{ padding: '24px' }}>
        <div className="dashboard-grid">
          {[1,2,3,4].map(i => <div key={i} className="stat-card skeleton" style={{ height: '120px' }}></div>)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="greeting-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div className="greeting-icon">
            <GreetingIcon size={26} />
          </div>
          <div>
            <div className="greeting-eyebrow">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
            <div className="greeting-title">{greetingText}{firstName ? `, ${firstName}` : ''}</div>
            <div className="greeting-sub">Here's how your portfolio is performing today.</div>
          </div>
        </div>
      </div>

      <div className="page-header">
        <h1 className="page-title">Dashboard Overview</h1>
        <button className="btn btn-primary" onClick={() => navigate('/properties', { state: { openCreate: true } })}>+ New Property</button>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-card-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
            Monthly Collected
            <DollarSign size={18} color="var(--color-success)" />
          </div>
          <div className="stat-card-value">TZS {(stats.monthlyCollectedIncome / 1000000).toFixed(1)}M</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Out of TZS {(stats.monthlyExpectedIncome / 1000000).toFixed(1)}M Expected
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
            Total Properties
            <Building size={18} color="var(--color-primary)" />
          </div>
          <div className="stat-card-value">{stats.totalProperties}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Active Properties
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
            Occupancy
            <Home size={18} color="var(--color-primary)" />
          </div>
          <div className="stat-card-value">
            {stats.totalUnits > 0 ? Math.round((stats.occupiedUnits / stats.totalUnits) * 100) : 0}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            {stats.vacantUnits} Vacant Units
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
            Contracts Expiring Soon
            <Users size={18} color="var(--color-warning)" />
          </div>
          <div className="stat-card-value">{stats.contractsExpiringSoon}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Within 30 days
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <div className="chart-card">
          <h2 className="chart-title">Rent Collection Trend (TZS)</h2>
          <ResponsiveContainer width="100%" height="85%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${value / 1000000}M`} />
              <Tooltip formatter={(value) => `TZS ${value.toLocaleString()}`} />
              <Area type="monotone" dataKey="collected" stroke="var(--color-primary)" fillOpacity={1} fill="url(#colorCollected)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card" style={{ height: 'auto', overflowY: 'auto' }}>
          <h2 className="chart-title">Action Required</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '12px', borderLeft: '4px solid var(--color-danger)', backgroundColor: 'var(--color-danger-bg)', borderRadius: '0 8px 8px 0' }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>No urgent actions</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>All clear for today.</div>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default Dashboard;
