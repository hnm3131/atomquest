import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Target, TrendingUp, Users, Shield,
  Calendar, FileText, Bell, Settings, LogOut, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useState } from 'react';

const navItems = {
  EMPLOYEE: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/goals', icon: Target, label: 'My Goals' },
    { to: '/achievements', icon: TrendingUp, label: 'Achievements' },
  ],
  MANAGER: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/goals', icon: Target, label: 'My Goals' },
    { to: '/team', icon: Users, label: 'Team Goals' },
    { to: '/approvals', icon: FileText, label: 'Approvals' },
    { to: '/checkins', icon: Calendar, label: 'Check-ins' },
    { to: '/achievements', icon: TrendingUp, label: 'Achievements' },
  ],
  ADMIN: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/goals', icon: Target, label: 'All Goals' },
    { to: '/team', icon: Users, label: 'All Employees' },
    { to: '/approvals', icon: FileText, label: 'Approvals' },
    { to: '/cycles', icon: Calendar, label: 'Cycles' },
    { to: '/audit', icon: Shield, label: 'Audit Logs' },
    { to: '/analytics', icon: TrendingUp, label: 'Analytics' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  if (!user) return null;
  const items = navItems[user.role] || navItems.EMPLOYEE;

  return (
    <aside className={`h-screen sticky top-0 flex flex-col transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-[260px]'}`}
      style={{ background: 'linear-gradient(180deg, #1a1545 0%, #0f0a2a 100%)', borderRight: '1px solid rgba(99,102,241,0.1)' }}>
      
      {/* Logo */}
      <div className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg"
          style={{ background: 'linear-gradient(135deg, #6366f1, #0ea5e9)' }}>
          A
        </div>
        {!collapsed && <span className="text-lg font-bold gradient-text">AtomQuest</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={`sidebar-link ${location.pathname === item.to ? 'active' : ''}`}
          >
            <item.icon size={20} />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User + Collapse */}
      <div className="p-3 border-t border-white/5">
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-[var(--color-text-muted)] truncate">{user.role}</p>
            </div>
          </div>
        )}
        <button onClick={logout} className="sidebar-link w-full text-red-400 hover:text-red-300">
          <LogOut size={20} />
          {!collapsed && <span>Logout</span>}
        </button>
        <button onClick={() => setCollapsed(!collapsed)} className="sidebar-link w-full mt-1">
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
