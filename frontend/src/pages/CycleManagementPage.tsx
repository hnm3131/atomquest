import { useEffect, useState } from 'react';
import { Cycle } from '../types/index';
import api from '../api/axios';
import { Plus, Calendar, CheckCircle2, Lock, Edit3, Loader2, X, AlertCircle } from 'lucide-react';

const emptyForm = {
  name: '',
  goalSettingStart: '',
  goalSettingEnd: '',
  q1Start: '',
  q1End: '',
  q2Start: '',
  q2End: '',
  q3Start: '',
  q3End: '',
  q4Start: '',
  q4End: '',
  isActive: false,
};

type CycleForm = typeof emptyForm;

const dateFields = [
  { section: 'Goal Setting', start: 'goalSettingStart', end: 'goalSettingEnd' },
  { section: 'Q1 Check-in (July)', start: 'q1Start', end: 'q1End' },
  { section: 'Q2 Check-in (October)', start: 'q2Start', end: 'q2End' },
  { section: 'Q3 Check-in (January)', start: 'q3Start', end: 'q3End' },
  { section: 'Q4 / Annual (March–April)', start: 'q4Start', end: 'q4End' },
];

const sectionColors = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#a855f7'];

export default function CycleManagementPage() {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CycleForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetch = async () => {
    const res = await api.get('/cycles');
    setCycles(res.data.data || []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError('');
    setShowForm(true);
  };

  const openEdit = (cycle: Cycle) => {
    setForm({
      name: cycle.name,
      goalSettingStart: cycle.goalSettingStart,
      goalSettingEnd: cycle.goalSettingEnd,
      q1Start: cycle.q1Start,
      q1End: cycle.q1End,
      q2Start: cycle.q2Start,
      q2End: cycle.q2End,
      q3Start: cycle.q3Start,
      q3End: cycle.q3End,
      q4Start: cycle.q4Start,
      q4End: cycle.q4End,
      isActive: cycle.isActive,
    });
    setEditingId(cycle.id);
    setError('');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.goalSettingStart || !form.goalSettingEnd) {
      setError('Cycle name and goal-setting window are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await api.put(`/cycles/${editingId}`, form);
      } else {
        await api.post('/cycles', form);
      }
      setShowForm(false);
      fetch();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const activeCycle = cycles.find(c => c.isActive);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cycle Management</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Configure financial year cycles and quarterly check-in windows.</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> New Cycle
        </button>
      </div>

      {/* Active Cycle Banner */}
      {activeCycle && (
        <div className="glass-card p-5 flex items-center gap-4" style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(14,165,233,0.1))' }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.2)' }}>
            <CheckCircle2 size={24} className="text-indigo-400" />
          </div>
          <div>
            <p className="font-semibold text-lg">{activeCycle.name} <span className="text-xs ml-2 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full">Active</span></p>
            <p className="text-sm text-[var(--color-text-muted)]">
              Goal Setting: {activeCycle.goalSettingStart} → {activeCycle.goalSettingEnd}
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={32} className="animate-spin text-[var(--color-primary)]" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {cycles.map(cycle => (
            <div key={cycle.id} className={`glass-card p-6 ${cycle.isActive ? 'border-indigo-500/40' : ''}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)' }}>
                    <Calendar size={20} className="text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{cycle.name}</h3>
                    {cycle.isActive ? (
                      <span className="text-xs font-medium text-emerald-400">● Active</span>
                    ) : (
                      <span className="text-xs text-[var(--color-text-muted)]">Inactive</span>
                    )}
                  </div>
                </div>
                <button onClick={() => openEdit(cycle)} className="p-2 rounded-lg hover:bg-white/5 text-[var(--color-text-muted)] transition-colors">
                  <Edit3 size={16} />
                </button>
              </div>

              {/* Quarter Windows */}
              <div className="space-y-2">
                {dateFields.map((field, idx) => {
                  const start = (cycle as any)[field.start];
                  const end = (cycle as any)[field.end];
                  return (
                    <div key={field.section} className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: sectionColors[idx] }} />
                        <span className="text-xs text-[var(--color-text-muted)]">{field.section}</span>
                      </div>
                      <span className="text-xs font-mono text-[var(--color-text)]">
                        {start && end ? `${start} → ${end}` : <span className="text-[var(--color-text-muted)]">Not configured</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {cycles.length === 0 && (
            <div className="lg:col-span-2 glass-card p-12 text-center">
              <Calendar size={48} className="mx-auto mb-3 opacity-20" />
              <p className="text-[var(--color-text-muted)]">No cycles configured yet. Create your first financial year cycle.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 backdrop-blur-sm py-8 px-4">
          <div className="glass-card w-full max-w-2xl animate-fade-in" style={{ background: 'rgba(22,18,60,0.98)' }}>
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h2 className="text-xl font-bold">{editingId ? 'Edit Cycle' : 'Create New Cycle'}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-white/10"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-6">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1.5">Cycle Name <span className="text-red-400">*</span></label>
                  <input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., FY 2026-27" />
                </div>
                <div className="col-span-2 flex items-center gap-3">
                  <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 accent-indigo-500" />
                  <label htmlFor="isActive" className="text-sm font-medium cursor-pointer">Set as Active Cycle</label>
                </div>
              </div>

              {dateFields.map((field, idx) => (
                <div key={field.section} className="p-4 rounded-xl border border-white/5" style={{ borderLeftColor: sectionColors[idx], borderLeftWidth: '3px' }}>
                  <p className="text-sm font-semibold mb-3" style={{ color: sectionColors[idx] }}>{field.section}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-[var(--color-text-muted)] mb-1">Opens</label>
                      <input type="date" className="input-field text-sm"
                        value={(form as any)[field.start]}
                        onChange={e => setForm({ ...form, [field.start]: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--color-text-muted)] mb-1">Closes</label>
                      <input type="date" className="input-field text-sm"
                        value={(form as any)[field.end]}
                        onChange={e => setForm({ ...form, [field.end]: e.target.value })} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 p-6 border-t border-white/5">
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : <>{editingId ? 'Update Cycle' : 'Create Cycle'}</>}
              </button>
              <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
