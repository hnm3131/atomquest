import { useEffect, useState } from 'react';
import { User, Role } from '../types/index';
import api from '../api/axios';
import { Users, Search, Shield, UserCheck, Edit3, Plus, X, AlertCircle, Loader2, Building2 } from 'lucide-react';

const roleColors: Record<Role, string> = {
  EMPLOYEE: '#10b981',
  MANAGER: '#6366f1',
  ADMIN: '#f59e0b',
};

const emptyForm = { name: '', email: '', password: '', role: 'EMPLOYEE' as Role, department: '', designation: '', managerId: '' };
type UserForm = typeof emptyForm;

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filtered, setFiltered] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'ALL'>('ALL');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const managers = users.filter(u => u.role === 'MANAGER' || u.role === 'ADMIN');

  const fetch = async () => {
    const res = await api.get('/users');
    const data = res.data.data || [];
    setUsers(data);
    setFiltered(data);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  useEffect(() => {
    let result = users;
    if (roleFilter !== 'ALL') result = result.filter(u => u.role === roleFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.department || '').toLowerCase().includes(q));
    }
    setFiltered(result);
  }, [search, roleFilter, users]);

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) {
      setError('Name, email, and password are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.post('/auth/register', {
        ...form,
        managerId: form.managerId || null,
      });
      setShowForm(false);
      setForm(emptyForm);
      fetch();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setSaving(false);
    }
  };

  const deptGroups = filtered.reduce((acc, u) => {
    const dept = u.department || 'Unassigned';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(u);
    return acc;
  }, {} as Record<string, User[]>);

  const stats = {
    total: users.length,
    employees: users.filter(u => u.role === 'EMPLOYEE').length,
    managers: users.filter(u => u.role === 'MANAGER').length,
    admins: users.filter(u => u.role === 'ADMIN').length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Manage organizational hierarchy and user roles.</p>
        </div>
        <button onClick={() => { setShowForm(true); setForm(emptyForm); setError(''); }} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Add User
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: stats.total, color: '#6366f1', icon: Users },
          { label: 'Employees', value: stats.employees, color: '#10b981', icon: UserCheck },
          { label: 'Managers', value: stats.managers, color: '#6366f1', icon: Users },
          { label: 'Admins', value: stats.admins, color: '#f59e0b', icon: Shield },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${s.color}20` }}>
              <s.icon size={20} style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input className="input-field pl-10" placeholder="Search by name, email, department..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {(['ALL', 'EMPLOYEE', 'MANAGER', 'ADMIN'] as const).map(r => (
          <button key={r} onClick={() => setRoleFilter(r)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${roleFilter === r ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300' : 'border-white/10 text-[var(--color-text-muted)]'}`}>
            {r === 'ALL' ? 'All Roles' : r}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={32} className="animate-spin text-[var(--color-primary)]" /></div>
      ) : (
        <div className="space-y-6">
          {Object.entries(deptGroups).map(([dept, deptUsers]) => (
            <div key={dept}>
              <div className="flex items-center gap-2 mb-3">
                <Building2 size={16} className="text-[var(--color-text-muted)]" />
                <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">{dept}</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-[var(--color-text-muted)]">{deptUsers.length}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {deptUsers.map(user => {
                  const manager = users.find(u => u.id === user.managerId);
                  return (
                    <div key={user.id} className="glass-card p-4 hover:border-indigo-500/20 transition-all">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                          style={{ background: `linear-gradient(135deg,${roleColors[user.role]},${roleColors[user.role]}88)` }}>
                          {user.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium truncate">{user.name}</p>
                            <span className="text-xs px-2 py-0.5 rounded-full ml-2 flex-shrink-0"
                              style={{ background: `${roleColors[user.role]}20`, color: roleColors[user.role] }}>
                              {user.role}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--color-text-muted)] truncate mt-0.5">{user.email}</p>
                          {user.designation && <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{user.designation}</p>}
                          {manager && <p className="text-xs mt-1.5 text-indigo-300">↑ Reports to: {manager.name}</p>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="glass-card p-12 text-center">
              <Users size={48} className="mx-auto mb-3 opacity-20" />
              <p className="text-[var(--color-text-muted)]">No users match your search criteria.</p>
            </div>
          )}
        </div>
      )}

      {/* Create User Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="glass-card w-full max-w-lg animate-fade-in" style={{ background: 'rgba(22,18,60,0.98)' }}>
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h2 className="text-lg font-bold">Add New User</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-white/10"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle size={16} /> {error}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">Full Name *</label>
                  <input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ananya Patel" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">Email *</label>
                  <input type="email" className="input-field" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="ananya@atomquest.com" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">Temporary Password *</label>
                  <input type="password" className="input-field" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min. 8 characters" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">Role *</label>
                  <select className="input-field" value={form.role} onChange={e => setForm({ ...form, role: e.target.value as Role })}>
                    <option value="EMPLOYEE">Employee</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">Department</label>
                  <input className="input-field" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} placeholder="Engineering" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">Designation</label>
                  <input className="input-field" value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} placeholder="Software Engineer" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">Reporting Manager</label>
                  <select className="input-field" value={form.managerId} onChange={e => setForm({ ...form, managerId: e.target.value })}>
                    <option value="">— None —</option>
                    {managers.map(m => <option key={m.id} value={m.id}>{m.name} ({m.role})</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-white/5">
              <button onClick={handleCreate} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving ? <><Loader2 size={18} className="animate-spin" /> Creating...</> : 'Create User'}
              </button>
              <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
