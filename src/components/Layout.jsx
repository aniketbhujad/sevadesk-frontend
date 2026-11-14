import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import {
  LayoutDashboard,
  PlusCircle,
  Users,
  BarChart3,
  FileText,
  CreditCard,
  MessageSquare,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Menu,
  X,
} from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Sidebar navigation order with Reports right after Customers!
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/new-service', label: 'New Service', icon: PlusCircle },
    { to: '/customers', label: 'Customers', icon: Users },
    { to: '/reports', label: 'Reports', icon: BarChart3 }, // Reports right after Customers
    { to: '/service-records', label: 'Service Records', icon: FileText },
    { to: '/payments', label: 'Payments & Balance', icon: CreditCard },
    { to: '/notifications', label: 'SMS Notifications', icon: MessageSquare },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="app-layout">
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="mobile-backdrop"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand-wrapper">
            <div className="sidebar-logo-icon">S</div>
            {!collapsed && (
              <div className="sidebar-brand">
                <h1>SevaDesk</h1>
                <p>CSC Operator CRM</p>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {/* Desktop Collapse button with < or > icon */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="sidebar-collapse-btn desktop-only"
              title={collapsed ? 'Expand Sidebar (>)' : 'Collapse Sidebar (<)'}
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>

            {/* Mobile close button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="sidebar-collapse-btn mobile-only"
              title="Close Menu"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                title={collapsed ? item.label : undefined}
                onClick={() => setMobileOpen(false)}
              >
                <Icon size={20} style={{ minWidth: '20px' }} />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-badge">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  minWidth: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#0f766e',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                }}
              >
                {user?.username?.charAt(0).toUpperCase() || 'A'}
              </div>
              {!collapsed && (
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user?.fullName || user?.username || 'Operator'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {user?.role || 'Admin'}
                  </div>
                </div>
              )}
            </div>
            {!collapsed && (
              <button
                onClick={handleLogout}
                className="btn btn-outline btn-sm"
                style={{ padding: '6px', border: 'none' }}
                title="Logout"
              >
                <LogOut size={16} color="var(--text-muted)" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className={`main-content ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <header className="top-navbar no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Mobile menu trigger */}
            <button
              className="btn btn-outline btn-sm mobile-only"
              onClick={() => setMobileOpen(true)}
              style={{ padding: '6px', display: 'flex', alignItems: 'center' }}
              title="Open Navigation Menu"
            >
              <Menu size={20} />
            </button>

            <ShieldCheck size={18} color="#0f766e" />
            <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              SevaDesk Kendra Management System
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: '600' }} className="desktop-only">
              Logged in as <strong style={{ color: 'var(--primary)' }}>{user?.username}</strong>
            </span>
          </div>
        </header>

        <main className="page-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
