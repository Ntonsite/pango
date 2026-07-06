import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Building, Home, Users, CreditCard, FileText, Settings, Search, Bell, LogOut, MoreHorizontal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AnnouncementBanner from './AnnouncementBanner';

const ALL_NAV_ITEMS = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Properties', path: '/properties', icon: Building },
  { name: 'Units', path: '/units', icon: Home },
  { name: 'Tenants', path: '/tenants', icon: Users },
  { name: 'Rent Payments', path: '/payments', icon: CreditCard },
  { name: 'Reports', path: '/reports', icon: FileText },
  { name: 'Users', path: '/users', icon: Users, roles: ['OWNER'] },
  { name: 'Settings', path: '/settings', icon: Settings },
];

const MOBILE_PRIMARY_PATHS = ['/dashboard', '/properties', '/tenants', '/payments'];

const initialsOf = (name) => (name ? name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase() : 'U');
const roleLabel = (role) => ({ PLATFORM_ADMIN: 'Platform Admin', OWNER: 'Owner', MANAGER: 'Manager' }[role] || role);

const Layout = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = ALL_NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(user?.role));
  const primaryItems = navItems.filter((item) => MOBILE_PRIMARY_PATHS.includes(item.path));
  const overflowItems = navItems.filter((item) => !MOBILE_PRIMARY_PATHS.includes(item.path));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      <AnnouncementBanner />
      <div className="app-container" style={{ flex: 1, minHeight: 0 }}>
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
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user?.full_name || 'Loading...'}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{roleLabel(user?.role)}</span>
            </div>
            <div className="avatar">
              {initialsOf(user?.full_name)}
            </div>
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
              <NavLink
                key={item.name}
                to={item.path}
                className="sheet-item"
                onClick={() => setMoreOpen(false)}
              >
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
    </div>
  );
};

export default Layout;
