import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ShieldCheck, Building2, Users, BarChart3, SlidersHorizontal, Megaphone, ScrollText, LogOut, MoreHorizontal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ALL_NAV_ITEMS = [
  { name: 'Workspaces', path: '/admin/workspaces', icon: Building2 },
  { name: 'All Users', path: '/admin/users', icon: Users },
  { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
  { name: 'Settings & Flags', path: '/admin/settings', icon: SlidersHorizontal },
  { name: 'Announcements', path: '/admin/announcements', icon: Megaphone },
  { name: 'System Logs', path: '/admin/logs', icon: ScrollText },
];

const MOBILE_PRIMARY_PATHS = ['/admin/workspaces', '/admin/users', '/admin/analytics'];

const initialsOf = (name) => (name ? name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase() : 'A');

const AdminLayout = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const primaryItems = ALL_NAV_ITEMS.filter((item) => MOBILE_PRIMARY_PATHS.includes(item.path));
  const overflowItems = ALL_NAV_ITEMS.filter((item) => !MOBILE_PRIMARY_PATHS.includes(item.path));

  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <ShieldCheck size={28} color="var(--color-primary)" />
          <span className="brand-name">Pango Admin</span>
        </div>

        <div className="sidebar-nav">
          {ALL_NAV_ITEMS.map((item) => (
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
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
            Platform-wide console &mdash; outside any workspace
          </div>

          <div className="user-profile">
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user?.full_name || 'Loading...'}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Platform Admin</span>
            </div>
            <div className="avatar">{initialsOf(user?.full_name)}</div>
          </div>
        </div>

        <div className="page-content">
          <Outlet />
        </div>
      </div>

      <nav className="mobile-tab-bar">
        {primaryItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => `mobile-tab-item ${isActive ? 'active' : ''}`}
          >
            <item.icon size={22} />
            <span>{item.name.split(' ')[0]}</span>
          </NavLink>
        ))}
        <button className="mobile-tab-item" onClick={() => setMoreOpen(true)} style={{ background: 'none', border: 'none' }}>
          <MoreHorizontal size={22} />
          <span>More</span>
        </button>
      </nav>

      {moreOpen && (
        <div className="sheet-backdrop" onClick={() => setMoreOpen(false)}>
          <div className="sheet-panel" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            {overflowItems.map((item) => (
              <NavLink key={item.name} to={item.path} className="sheet-item" onClick={() => setMoreOpen(false)}>
                <item.icon size={20} />
                <span>{item.name}</span>
              </NavLink>
            ))}
            <div className="sheet-item danger" onClick={() => { setMoreOpen(false); handleLogout(); }}>
              <LogOut size={20} />
              <span>Logout</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;
