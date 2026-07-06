import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Building, Home, Users, CreditCard, FileText, Settings, Search, Bell, LogOut } from 'lucide-react';

const Layout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Properties', path: '/properties', icon: Building },
    { name: 'Units', path: '/units', icon: Home },
    { name: 'Tenants', path: '/tenants', icon: Users },
    { name: 'Rent Payments', path: '/payments', icon: CreditCard },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'Users', path: '/users', icon: Users },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <Building size={28} color="var(--color-primary)" />
          <span className="brand-name">Pango</span>
        </div>
        
        <div className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon size={20} />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </div>

        <div className="sidebar-header" style={{ borderTop: '1px solid var(--color-border)', borderBottom: 'none' }}>
          <div className="nav-item" onClick={handleLogout} style={{ width: '100%', margin: 0 }}>
            <LogOut size={20} />
            <span>Logout</span>
          </div>
        </div>
      </div>

      <div className="main-content">
        <div className="top-bar">
          <div className="search-bar">
            <Search size={18} color="var(--color-text-muted)" />
            <input type="text" placeholder="Search properties, units, tenants..." />
          </div>

          <div className="user-profile">
            <Bell size={20} color="var(--color-text-muted)" style={{ marginRight: '16px', cursor: 'pointer' }} />
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Tony Properties Ltd</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Admin</span>
            </div>
            <div className="avatar">
              TP
            </div>
          </div>
        </div>

        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
