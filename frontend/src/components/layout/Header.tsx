import { Bell, Search, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Notification } from '../../types/index';
import api from '../../api/axios';
import { useWebSocket } from '../../hooks/useWebSocket';

const roleColors: Record<string, string> = {
  EMPLOYEE: '#10b981',
  MANAGER: '#6366f1',
  ADMIN: '#f59e0b',
};

interface Toast {
  id: string;
  title: string;
  message: string;
  link?: string;
}

export default function Header() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const [notifRes, countRes] = await Promise.all([
        api.get('/notifications?size=10'),
        api.get('/notifications/count'),
      ]);
      setNotifications(notifRes.data.data || []);
      setUnreadCount(countRes.data.data?.count || 0);
    } catch {}
  }, []);

  useEffect(() => { fetchNotifications(); }, []);

  // Dismiss toast after 5 seconds
  const addToast = useCallback((notification: Notification) => {
    const toast: Toast = { id: notification.id, title: notification.title, message: notification.message, link: notification.link };
    setToasts(prev => [toast, ...prev].slice(0, 3));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toast.id));
    }, 5000);
    // Refresh count
    setUnreadCount(prev => prev + 1);
    setNotifications(prev => [notification, ...prev].slice(0, 10));
  }, []);

  // Real-time WebSocket
  const { connected } = useWebSocket(addToast);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {}
  };

  return (
    <>
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-[100] space-y-2 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="glass-card px-4 py-3 max-w-sm w-full animate-slide-in pointer-events-auto"
            style={{ background: 'rgba(22,18,60,0.98)', borderColor: 'rgba(99,102,241,0.4)' }}>
            <p className="text-sm font-semibold text-[var(--color-text)]">{toast.title}</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5 line-clamp-2">{toast.message}</p>
          </div>
        ))}
      </div>

      <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 sticky top-0 z-40"
        style={{ background: 'rgba(15,10,42,0.9)', backdropFilter: 'blur(20px)' }}>

        {/* Search */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input type="text" placeholder="Search goals, employees..." className="input-field pl-10 py-2 text-sm" />
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {/* WS Status Indicator */}
          <div title={connected ? 'Real-time connected' : 'Offline'} className="p-1.5">
            {connected
              ? <Wifi size={14} className="text-emerald-400" />
              : <WifiOff size={14} className="text-[var(--color-text-muted)]" />}
          </div>

          {/* Notification Bell */}
          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setShowDropdown(v => !v)}
              className="relative p-2 rounded-xl hover:bg-white/5 transition-colors">
              <Bell size={20} className="text-[var(--color-text-muted)]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showDropdown && (
              <div className="absolute right-0 top-12 w-80 glass-card shadow-2xl z-50 overflow-hidden animate-fade-in"
                style={{ background: 'rgba(22,18,60,0.98)' }}>
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">Mark all read</button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-center py-8 text-sm text-[var(--color-text-muted)]">No notifications</p>
                  ) : (
                    notifications.map(n => (
                      <a key={n.id} href={n.link || '#'}
                        className={`flex gap-3 px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors ${!n.isRead ? 'bg-indigo-500/5' : ''}`}>
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.isRead ? 'bg-transparent' : 'bg-indigo-400'}`} />
                        <div>
                          <p className="text-sm font-medium">{n.title}</p>
                          <p className="text-xs text-[var(--color-text-muted)] mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-xs text-[var(--color-text-muted)] mt-1">{new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </a>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Avatar */}
          <div className="flex items-center gap-3 pl-2 border-l border-white/10">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium leading-none">{user?.name}</p>
              <div className="flex items-center gap-1.5 justify-end mt-1">
                <span className="w-2 h-2 rounded-full" style={{ background: roleColors[user?.role || 'EMPLOYEE'] }} />
                <span className="text-xs text-[var(--color-text-muted)]">{user?.role} · {user?.department}</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold"
              style={{ background: `linear-gradient(135deg,${roleColors[user?.role || 'EMPLOYEE']},${roleColors[user?.role || 'EMPLOYEE']}66)` }}>
              {user?.name?.charAt(0)}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
