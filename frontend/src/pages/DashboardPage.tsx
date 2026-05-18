import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Target, Users, CheckCircle, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import api from '../api/axios';
import { GoalSheet } from '../types/index';

export default function DashboardPage() {
  const { user } = useAuth();
  const [sheets, setSheets] = useState<GoalSheet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const endpoint = user?.role === 'EMPLOYEE' ? '/goal-sheets/my'
      : user?.role === 'MANAGER' ? '/goal-sheets/team'
      : '/goal-sheets';
    api.get(endpoint).then(res => setSheets(res.data.data || []))
      .catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  const stats = {
    total: sheets.length,
    draft: sheets.filter(s => s.status === 'DRAFT').length,
    submitted: sheets.filter(s => s.status === 'SUBMITTED').length,
    locked: sheets.filter(s => s.status === 'LOCKED').length,
    rejected: sheets.filter(s => s.status === 'REJECTED').length,
  };

  const statCards = [
    { label: 'Total Goal Sheets', value: stats.total, icon: Target, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
    { label: 'Pending Approval', value: stats.submitted, icon: Clock, color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)' },
    { label: 'Approved & Locked', value: stats.locked, icon: CheckCircle, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    { label: 'Needs Rework', value: stats.rejected, icon: AlertTriangle, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  ];

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="glass-card p-6" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(14,165,233,0.1))' }}>
        <h1 className="text-2xl font-bold">{greeting()}, {user?.name?.split(' ')[0]}! 👋</h1>
        <p className="text-[var(--color-text-muted)] mt-1">
          {user?.role === 'EMPLOYEE' ? 'Track your goals and achievements' :
           user?.role === 'MANAGER' ? 'Review team goals and conduct check-ins' :
           'Manage cycles, users, and organization-wide goals'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="glass-card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: stat.bg }}>
              <stat.icon size={24} style={{ color: stat.color }} />
            </div>
            <div>
              <p className="text-2xl font-bold">{loading ? '...' : stat.value}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Goal Sheets */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">
          {user?.role === 'EMPLOYEE' ? 'My Goal Sheets' : 'Recent Goal Sheets'}
        </h2>
        {loading ? (
          <div className="text-center py-8 text-[var(--color-text-muted)]">Loading...</div>
        ) : sheets.length === 0 ? (
          <div className="text-center py-12">
            <Target size={48} className="mx-auto mb-3 text-[var(--color-text-muted)] opacity-40" />
            <p className="text-[var(--color-text-muted)]">No goal sheets found</p>
            {user?.role === 'EMPLOYEE' && (
              <a href="/goals" className="btn-primary inline-block mt-4">Create Goal Sheet</a>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {sheets.slice(0, 5).map((sheet) => (
              <a key={sheet.id} href={`/goals/${sheet.id}`}
                className="flex items-center justify-between p-4 rounded-xl border border-white/5 hover:border-[var(--color-primary)]/20 transition-all hover:bg-white/[0.02]">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                    <Target size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="font-medium">{sheet.employeeName}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {sheet.cycleName} · {sheet.goals.length} goals · {sheet.totalWeightage}% allocated
                    </p>
                  </div>
                </div>
                <span className={`status-badge status-${sheet.status.toLowerCase()}`}>
                  {sheet.status}
                </span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
