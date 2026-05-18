import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { GoalSheet, CheckIn } from '../types/index';
import api from '../api/axios';
import {
  MessageSquare, User, Clock, CheckCircle2,
  ChevronRight, Star, AlertCircle, Loader2
} from 'lucide-react';

const QUARTER_LABELS = {
  Q1: 'Q1 (July)',
  Q2: 'Q2 (October)',
  Q3: 'Q3 (January)',
  Q4: 'Q4 (March–April)',
};

const RATING_OPTIONS = ['Exceptional', 'Meets Expectations', 'Needs Improvement', 'Below Expectations'];

const ratingColor = (rating?: string) => {
  if (!rating) return '#94a3b8';
  if (rating === 'Exceptional') return '#10b981';
  if (rating === 'Meets Expectations') return '#6366f1';
  if (rating === 'Needs Improvement') return '#f59e0b';
  return '#ef4444';
};

export default function CheckInsPage() {
  const { user } = useAuth();
  const [teamSheets, setTeamSheets] = useState<GoalSheet[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<GoalSheet | null>(null);
  const [existingCheckIn, setExistingCheckIn] = useState<CheckIn | null>(null);
  const [activeQuarter, setActiveQuarter] = useState<string | null>(null);
  const [quarterError, setQuarterError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // For employees — view their received check-ins
  const [receivedCheckIns, setReceivedCheckIns] = useState<CheckIn[]>([]);

  const fetchTeamSheets = useCallback(async () => {
    const res = await api.get('/goal-sheets/team');
    const locked = (res.data.data || []).filter((s: GoalSheet) => s.status === 'LOCKED');
    setTeamSheets(locked);
  }, []);

  const fetchReceivedCheckIns = useCallback(async () => {
    const res = await api.get('/checkins/received');
    setReceivedCheckIns(res.data.data || []);
  }, []);

  useEffect(() => {
    setLoading(true);
    if (user?.role === 'EMPLOYEE') {
      fetchReceivedCheckIns().finally(() => setLoading(false));
    } else {
      fetchTeamSheets().finally(() => setLoading(false));
    }
  }, [user]);

  const selectSheet = async (sheet: GoalSheet) => {
    setSelectedSheet(sheet);
    setExistingCheckIn(null);
    setActiveQuarter(null);
    setQuarterError(null);
    setFeedback('');
    setRating('');
    setSuccessMsg('');

    // Resolve active quarter from backend
    try {
      const qRes = await api.get(`/checkins/active-quarter/${sheet.id}`);
      const quarter: string = qRes.data.data;
      setActiveQuarter(quarter);

      // Check if check-in already submitted for this quarter
      const existingRes = await api.get(`/checkins/employee/${sheet.employeeId}`);
      const existing = (existingRes.data.data || []).find((c: CheckIn) => c.quarter === quarter && c.goalSheetId === sheet.id);
      if (existing) {
        setExistingCheckIn(existing);
        setFeedback(existing.feedback || '');
        setRating(existing.overallRating || '');
      }
    } catch (err: any) {
      setQuarterError(err.response?.data?.message || 'Unable to determine active quarter');
    }
  };

  const handleSubmit = async () => {
    if (!selectedSheet || !feedback.trim()) {
      alert('Please provide feedback before submitting.');
      return;
    }
    setSubmitting(true);
    setSuccessMsg('');
    try {
      const res = await api.post('/checkins', {
        goalSheetId: selectedSheet.id,
        feedback,
        overallRating: rating || null,
      });
      setExistingCheckIn(res.data.data);
      setSuccessMsg(existingCheckIn ? 'Check-in updated successfully!' : 'Check-in submitted successfully!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit check-in');
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Employee View ----
  if (user?.role === 'EMPLOYEE') {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold">My Check-ins</h1>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 size={32} className="animate-spin text-[var(--color-primary)]" /></div>
        ) : receivedCheckIns.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <MessageSquare size={48} className="mx-auto mb-3 opacity-30" />
            <p className="text-[var(--color-text-muted)]">No check-ins received yet. Your manager will submit feedback during active quarterly windows.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {receivedCheckIns.map(ci => (
              <div key={ci.id} className="glass-card p-6 animate-slide-in">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.1)' }}>
                      <MessageSquare size={20} style={{ color: '#818cf8' }} />
                    </div>
                    <div>
                      <p className="font-semibold">{(QUARTER_LABELS as any)[ci.quarter] || ci.quarter} Check-in</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{new Date(ci.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>
                  {ci.overallRating && (
                    <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: `${ratingColor(ci.overallRating)}20`, color: ratingColor(ci.overallRating) }}>
                      {ci.overallRating}
                    </span>
                  )}
                </div>
                <p className="text-sm text-[var(--color-text-muted)] leading-relaxed bg-black/20 rounded-xl p-4 mt-2">{ci.feedback}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ---- Manager / Admin View ----
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Quarterly Check-ins</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">Submit structured quarterly feedback for your team members.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={32} className="animate-spin text-[var(--color-primary)]" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Team Member List */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-3">Team Members ({teamSheets.length})</h2>
            {teamSheets.length === 0 ? (
              <div className="glass-card p-6 text-center">
                <User size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm text-[var(--color-text-muted)]">No locked goal sheets. Approve team goals first.</p>
              </div>
            ) : (
              teamSheets.map(sheet => (
                <button key={sheet.id} onClick={() => selectSheet(sheet)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${selectedSheet?.id === sheet.id ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10' : 'border-white/5 hover:bg-white/[0.02]'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                        {sheet.employeeName?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{sheet.employeeName}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{sheet.department}</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-[var(--color-text-muted)]" />
                  </div>
                  <div className="mt-2 flex gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300">{sheet.goals.length} goals</span>
                    <span className="status-badge status-locked text-xs">Locked</span>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Check-in Form */}
          <div className="lg:col-span-2">
            {!selectedSheet ? (
              <div className="glass-card p-12 text-center">
                <MessageSquare size={48} className="mx-auto mb-3 opacity-20" />
                <p className="text-[var(--color-text-muted)]">Select a team member to submit their quarterly check-in.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Quarter Status Banner */}
                {quarterError ? (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-red-400 text-sm">Outside Check-in Window</p>
                      <p className="text-xs text-red-300 mt-0.5">{quarterError}</p>
                    </div>
                  </div>
                ) : activeQuarter ? (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <CheckCircle2 size={20} className="text-emerald-400 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-emerald-400 text-sm">Active Window: {(QUARTER_LABELS as any)[activeQuarter]}</p>
                      <p className="text-xs text-emerald-300 mt-0.5">
                        {existingCheckIn ? 'A check-in was previously submitted. You can update it below.' : 'Submit your structured feedback for this quarter.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-4 rounded-xl bg-white/5">
                    <Loader2 size={16} className="animate-spin text-[var(--color-text-muted)]" />
                    <p className="text-sm text-[var(--color-text-muted)]">Checking active quarter...</p>
                  </div>
                )}

                {/* Employee Goals Summary */}
                <div className="glass-card p-5">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <User size={18} className="text-indigo-400" /> {selectedSheet.employeeName}'s Goals
                  </h3>
                  <div className="space-y-2">
                    {selectedSheet.goals.map(g => (
                      <div key={g.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                        <div>
                          <p className="text-sm font-medium">{g.title}</p>
                          <p className="text-xs text-[var(--color-text-muted)]">{g.thrustArea} · {g.uomType.replace('_', ' ')}</p>
                        </div>
                        <span className="text-xs font-bold text-indigo-300">{g.weightage}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Feedback Form */}
                {activeQuarter && !quarterError && (
                  <div className="glass-card p-6 space-y-5">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Star size={18} className="text-yellow-400" />
                      {existingCheckIn ? 'Update' : 'Submit'} {(QUARTER_LABELS as any)[activeQuarter]} Feedback
                    </h3>

                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">Overall Rating</label>
                      <div className="grid grid-cols-2 gap-2">
                        {RATING_OPTIONS.map(opt => (
                          <button key={opt} onClick={() => setRating(opt)}
                            className={`py-2 px-3 rounded-xl text-sm font-medium border transition-all ${rating === opt ? 'border-transparent' : 'border-white/10 text-[var(--color-text-muted)]'}`}
                            style={rating === opt ? { background: `${ratingColor(opt)}20`, color: ratingColor(opt), borderColor: `${ratingColor(opt)}40` } : {}}>
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">
                        Structured Feedback <span className="text-red-400">*</span>
                      </label>
                      <textarea rows={6} value={feedback} onChange={e => setFeedback(e.target.value)}
                        placeholder={`Provide specific, constructive feedback for ${selectedSheet.employeeName}.\n\nInclude:\n• Key achievements this quarter\n• Areas needing improvement\n• Goals for next quarter`}
                        className="input-field leading-relaxed" />
                      <p className="text-xs text-[var(--color-text-muted)] mt-1">{feedback.length} characters</p>
                    </div>

                    {successMsg && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                        <CheckCircle2 size={16} /> {successMsg}
                      </div>
                    )}

                    <button onClick={handleSubmit} disabled={submitting || !feedback.trim() || !!quarterError}
                      className="btn-primary w-full flex items-center justify-center gap-2">
                      {submitting ? <><Loader2 size={18} className="animate-spin" /> Submitting...</> : <><MessageSquare size={18} /> {existingCheckIn ? 'Update Check-in' : 'Submit Check-in'}</>}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
