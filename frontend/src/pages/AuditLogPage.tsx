import { useEffect, useState } from 'react';
import { AuditLog } from '../types/index';
import api from '../api/axios';
import { Shield, Search, Clock, ArrowRight, Filter, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

const actionColors: Record<string, string> = {
  APPROVED: '#10b981',
  REJECTED: '#ef4444',
  UNLOCKED: '#f59e0b',
  MANAGER_EDIT: '#6366f1',
  GOAL_SUBMITTED: '#0ea5e9',
  CREATED: '#10b981',
  UPDATED: '#6366f1',
  DELETED: '#ef4444',
};

const getActionColor = (action: string) => actionColors[action] || '#94a3b8';

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const PAGE_SIZE = 20;

  const fetch = async (p = page) => {
    setLoading(true);
    const res = await api.get(`/audit-logs?page=${p}&size=${PAGE_SIZE}`);
    const data = res.data.data;
    setLogs(data?.content || []);
    setTotal(data?.totalElements || 0);
    setLoading(false);
  };

  useEffect(() => { fetch(0); }, []);

  const filtered = logs.filter(log => {
    const matchSearch = !search || log.changedByName?.toLowerCase().includes(search.toLowerCase()) || log.action?.toLowerCase().includes(search.toLowerCase()) || log.entityType?.toLowerCase().includes(search.toLowerCase());
    const matchEntity = !entityFilter || log.entityType === entityFilter;
    return matchSearch && matchEntity;
  });

  const entityTypes = [...new Set(logs.map(l => l.entityType))];
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Shield size={24} className="text-indigo-400" /> Audit Trail</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">All post-lock goal modifications and status changes with before/after tracking.</p>
      </div>

      {/* Stats */}
      <div className="glass-card p-4 flex items-center gap-6">
        <div>
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-[var(--color-text-muted)]">Total Events</p>
        </div>
        <div className="h-10 w-px bg-white/10" />
        {['APPROVED', 'REJECTED', 'UNLOCKED', 'MANAGER_EDIT'].map(action => {
          const count = logs.filter(l => l.action === action).length;
          return count > 0 ? (
            <div key={action}>
              <p className="text-xl font-bold" style={{ color: getActionColor(action) }}>{count}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{action.replace('_', ' ')}</p>
            </div>
          ) : null;
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input className="input-field pl-10" placeholder="Search by user, action, entity type..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="relative">
          <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <select className="input-field pl-10 min-w-[160px]" value={entityFilter} onChange={e => setEntityFilter(e.target.value)}>
            <option value="">All Entity Types</option>
            {entityTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Log Table */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={32} className="animate-spin text-[var(--color-primary)]" /></div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {['Timestamp', 'Actor', 'Entity Type', 'Action', 'Field', 'Before → After'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-[var(--color-text-muted)]">No audit logs found.</td></tr>
                ) : (
                  filtered.map((log, idx) => (
                    <tr key={log.id} className={`border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors ${idx % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                          <Clock size={12} />
                          <span>{new Date(log.changedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-indigo-500/20 text-indigo-300 flex-shrink-0">
                            {log.changedByName?.charAt(0) || '?'}
                          </div>
                          <span className="text-sm font-medium">{log.changedByName || 'System'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-[var(--color-text-muted)]">{log.entityType}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: `${getActionColor(log.action)}20`, color: getActionColor(log.action) }}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-[var(--color-text-muted)]">{log.fieldName || '—'}</td>
                      <td className="px-5 py-3.5">
                        {log.oldValue || log.newValue ? (
                          <div className="flex items-center gap-2 text-xs">
                            {log.oldValue && <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-300 max-w-[100px] truncate" title={log.oldValue}>{log.oldValue}</span>}
                            {log.oldValue && log.newValue && <ArrowRight size={12} className="text-[var(--color-text-muted)] flex-shrink-0" />}
                            {log.newValue && <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 max-w-[100px] truncate" title={log.newValue}>{log.newValue}</span>}
                          </div>
                        ) : <span className="text-xs text-[var(--color-text-muted)]">—</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-white/5">
              <p className="text-xs text-[var(--color-text-muted)]">Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total} entries</p>
              <div className="flex items-center gap-2">
                <button onClick={() => { setPage(p => p - 1); fetch(page - 1); }} disabled={page === 0} className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-40 transition-colors"><ChevronLeft size={16} /></button>
                <span className="text-sm">{page + 1} / {totalPages}</span>
                <button onClick={() => { setPage(p => p + 1); fetch(page + 1); }} disabled={page >= totalPages - 1} className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-40 transition-colors"><ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
