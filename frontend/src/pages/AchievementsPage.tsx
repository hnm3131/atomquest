import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { GoalSheet, Achievement, Goal } from '../types/index';
import api from '../api/axios';
import { TrendingUp, Save } from 'lucide-react';

export default function AchievementsPage() {
  const { user } = useAuth();
  const [sheets, setSheets] = useState<GoalSheet[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<GoalSheet | null>(null);
  const [achievements, setAchievements] = useState<Record<string, Achievement>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // For input fields
  const [actualValues, setActualValues] = useState<Record<string, number | string>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [actualDates, setActualDates] = useState<Record<string, string>>({});

  const currentQuarter = 'Q1'; // In a real app, calculate this based on current date and cycle config

  useEffect(() => {
    const ep = user?.role === 'EMPLOYEE' ? '/goal-sheets/my' : '/goal-sheets/team';
    api.get(ep).then(res => {
      // Filter for approved/locked sheets
      const locked = (res.data.data || []).filter((s: GoalSheet) => s.status === 'LOCKED');
      setSheets(locked);
      if (locked.length > 0) setSelectedSheet(locked[0]);
    }).finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (selectedSheet) {
      api.get(`/achievements/goal/${selectedSheet.goals[0]?.id || ''}`).catch(() => {});
      // Fetch achievements for all goals in the sheet (simplified loop)
      const fetchAll = async () => {
        const achMap: Record<string, Achievement> = {};
        for (const goal of selectedSheet.goals) {
          try {
            const res = await api.get(`/achievements/goal/${goal.id}`);
            const achList = res.data.data || [];
            const currentAch = achList.find((a: Achievement) => a.quarter === currentQuarter);
            if (currentAch) {
              achMap[goal.id] = currentAch;
              setActualValues(prev => ({...prev, [goal.id]: currentAch.actualValue || ''}));
              setComments(prev => ({...prev, [goal.id]: currentAch.employeeComment || ''}));
              setStatuses(prev => ({...prev, [goal.id]: currentAch.status || 'NOT_STARTED'}));
              if (currentAch.actualDate) {
                 setActualDates(prev => ({...prev, [goal.id]: currentAch.actualDate}));
              }
            }
          } catch (e) {}
        }
        setAchievements(achMap);
      };
      fetchAll();
    }
  }, [selectedSheet]);

  const handleSave = async (goal: Goal) => {
    setSaving(true);
    try {
      await api.post('/achievements', {
        goalId: goal.id,
        quarter: currentQuarter,
        actualValue: actualValues[goal.id] ? Number(actualValues[goal.id]) : null,
        actualDate: actualDates[goal.id] || null,
        status: statuses[goal.id] || 'NOT_STARTED',
        comment: comments[goal.id] || ''
      });
      alert('Achievement saved successfully!');
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Update Achievements - {currentQuarter}</h1>
      
      {loading ? <div className="text-center py-12 text-[var(--color-text-muted)]">Loading...</div> : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="space-y-2 lg:col-span-1">
             <h2 className="text-sm font-semibold text-[var(--color-text-muted)] mb-3">Locked Goal Sheets</h2>
             {sheets.map(s => (
               <button key={s.id} onClick={() => setSelectedSheet(s)}
                 className={`w-full text-left p-4 rounded-xl border transition-all ${selectedSheet?.id === s.id ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10' : 'border-white/5 hover:bg-white/[0.02]'}`}>
                 <p className="font-medium">{s.employeeName}</p>
                 <p className="text-xs text-[var(--color-text-muted)]">{s.goals.length} goals</p>
               </button>
             ))}
             {sheets.length === 0 && <p className="text-sm text-[var(--color-text-muted)]">No approved goal sheets available.</p>}
          </div>

          <div className="lg:col-span-3 space-y-4">
             {selectedSheet ? selectedSheet.goals.map(g => (
               <div key={g.id} className="glass-card p-5">
                 <div className="flex justify-between items-start mb-4">
                   <div>
                     <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary-light)]">{g.thrustArea}</span>
                     <h3 className="font-semibold text-lg mt-1">{g.title}</h3>
                     <p className="text-sm text-[var(--color-text-muted)] mt-1">
                        Target: <span className="font-medium text-[var(--color-text)]">{g.uomType === 'TIMELINE' ? g.targetDate : g.targetValue}</span> ({g.uomType}) • Weight: {g.weightage}%
                     </p>
                   </div>
                   {achievements[g.id] && (
                     <div className="text-right">
                       <p className="text-sm text-[var(--color-text-muted)]">Score</p>
                       <p className="text-2xl font-bold gradient-text">{achievements[g.id].computedScore}%</p>
                     </div>
                   )}
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 rounded-lg bg-black/20">
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
                        {g.uomType === 'TIMELINE' ? 'Actual Date' : 'Actual Value'}
                      </label>
                      {g.uomType === 'TIMELINE' ? (
                        <input type="date" className="input-field" value={actualDates[g.id] || ''} onChange={e => setActualDates({...actualDates, [g.id]: e.target.value})} disabled={user?.role !== 'EMPLOYEE'} />
                      ) : (
                        <input type="number" className="input-field" value={actualValues[g.id] || ''} onChange={e => setActualValues({...actualValues, [g.id]: e.target.value})} disabled={user?.role !== 'EMPLOYEE'} />
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Status</label>
                      <select className="input-field" value={statuses[g.id] || 'NOT_STARTED'} onChange={e => setStatuses({...statuses, [g.id]: e.target.value})} disabled={user?.role !== 'EMPLOYEE'}>
                        <option value="NOT_STARTED">Not Started</option>
                        <option value="ON_TRACK">On Track</option>
                        <option value="COMPLETED">Completed</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Comments / Updates</label>
                      <textarea className="input-field" rows={2} value={comments[g.id] || ''} onChange={e => setComments({...comments, [g.id]: e.target.value})} disabled={user?.role !== 'EMPLOYEE'}></textarea>
                    </div>
                    {user?.role === 'EMPLOYEE' && (
                      <div className="md:col-span-2 flex justify-end">
                        <button onClick={() => handleSave(g)} disabled={saving} className="btn-primary flex items-center gap-2 py-2 text-sm">
                           <Save size={16} /> Save Update
                        </button>
                      </div>
                    )}
                 </div>
               </div>
             )) : (
               <div className="glass-card p-12 text-center text-[var(--color-text-muted)]">
                  Select a goal sheet to track achievements.
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
}
