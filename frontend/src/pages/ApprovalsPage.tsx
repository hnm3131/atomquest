import { useEffect, useState } from 'react';
import { GoalSheet } from '../types/index';
import api from '../api/axios';
import { CheckCircle, XCircle, Edit3, Target } from 'lucide-react';

export default function ApprovalsPage() {
  const [sheets, setSheets] = useState<GoalSheet[]>([]);
  const [sel, setSel] = useState<GoalSheet | null>(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);

  const fetch = () => {
    api.get('/goal-sheets/team').then(r => { setSheets(r.data.data||[]); }).finally(() => setLoading(false));
  };
  useEffect(() => { fetch(); }, []);

  const pending = sheets.filter(s => s.status === 'SUBMITTED');
  const others = sheets.filter(s => s.status !== 'SUBMITTED');

  const approve = async (id: string) => {
    await api.put(`/goal-sheets/${id}/approve`);
    setSel(null); fetch();
  };
  const reject = async (id: string) => {
    if (!comment.trim()) { alert('Please provide a reason'); return; }
    await api.put(`/goal-sheets/${id}/reject`, { comment });
    setComment(''); setSel(null); fetch();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Approval Queue</h1>
      {loading ? <div className="text-center py-12 text-[var(--color-text-muted)]">Loading...</div> : (
        <>
          <div className="glass-card p-4">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-400" /> Pending ({pending.length})
            </h2>
            {pending.length === 0 ? <p className="text-[var(--color-text-muted)] text-sm py-4 text-center">No pending approvals</p> : (
              <div className="space-y-2">
                {pending.map(s => (
                  <button key={s.id} onClick={() => setSel(s)}
                    className={`w-full text-left p-4 rounded-xl border transition-all hover:bg-white/[0.02] ${sel?.id === s.id ? 'border-[var(--color-primary)]' : 'border-white/5'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{s.employeeName}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{s.department} · {s.goals.length} goals · {s.totalWeightage}%</p>
                      </div>
                      <span className="status-badge status-submitted">Review</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {sel && (
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">{sel.employeeName}'s Goals</h2>
                <span className="text-sm text-[var(--color-text-muted)]">{sel.totalWeightage}% allocated</span>
              </div>
              <div className="space-y-3 mb-6">
                {sel.goals.map(g => (
                  <div key={g.id} className="p-4 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary-light)]">{g.thrustArea}</span>
                    </div>
                    <h3 className="font-medium">{g.title}</h3>
                    <div className="flex gap-4 mt-2 text-sm text-[var(--color-text-muted)]">
                      <span>UoM: {g.uomType.replace('_', ' ')}</span>
                      <span>Target: {g.targetValue ?? g.targetDate}</span>
                      <span className="font-semibold text-[var(--color-text)]">{g.weightage}%</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Comment (required for rejection)</label>
                <textarea className="input-field" rows={3} value={comment} onChange={e => setComment(e.target.value)}
                  placeholder="Feedback for the employee..." />
              </div>
              <div className="flex gap-3">
                <button onClick={() => approve(sel.id)} className="btn-primary flex items-center gap-2 flex-1">
                  <CheckCircle size={18} /> Approve & Lock
                </button>
                <button onClick={() => reject(sel.id)} className="btn-danger flex items-center gap-2 flex-1">
                  <XCircle size={18} /> Return for Rework
                </button>
              </div>
            </div>
          )}

          <div className="glass-card p-4">
            <h2 className="text-lg font-semibold mb-3">All Team Sheets ({others.length})</h2>
            <div className="space-y-2">
              {others.map(s => (
                <div key={s.id} className="p-4 rounded-xl border border-white/5 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{s.employeeName}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{s.goals.length} goals · {s.cycleName}</p>
                  </div>
                  <span className={`status-badge status-${s.status.toLowerCase()}`}>{s.status}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
