import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { GoalSheet, GoalRequest } from '../types/index';
import api from '../api/axios';
import { Plus, Target, Trash2, Send, Edit3, Lock } from 'lucide-react';

export default function GoalsPage() {
  const { user } = useAuth();
  const [sheets, setSheets] = useState<GoalSheet[]>([]);
  const [sel, setSel] = useState<GoalSheet | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<GoalRequest>({ thrustArea:'', title:'', description:'', uomType:'NUMERIC_MIN', targetValue:0, weightage:10 });

  const fetch = () => {
    const ep = user?.role === 'ADMIN' ? '/goal-sheets' : '/goal-sheets/my';
    api.get(ep).then(r => { const d=r.data.data||[]; setSheets(d); if(d.length>0&&!sel)setSel(d[0]); if(sel){const u=d.find((s:GoalSheet)=>s.id===sel.id);if(u)setSel(u);} }).finally(()=>setLoading(false));
  };
  useEffect(()=>{fetch();},[]);

  const canEdit = sel?.status==='DRAFT'||sel?.status==='REJECTED';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{user?.role==='ADMIN'?'All Goal Sheets':'My Goals'}</h1>
        {user?.role!=='ADMIN'&&<button onClick={()=>api.post('/goal-sheets').then(()=>fetch())} className="btn-primary flex items-center gap-2"><Plus size={18}/>New Goal Sheet</button>}
      </div>
      {loading?<div className="text-center py-12 text-[var(--color-text-muted)]">Loading...</div>:(
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          {sheets.map(s=>(
            <button key={s.id} onClick={()=>setSel(s)} className={`w-full text-left glass-card p-4 transition-all ${sel?.id===s.id?'border-[var(--color-primary)]':''}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{s.employeeName||'My Goals'}</span>
                <span className={`status-badge status-${s.status.toLowerCase()}`}>{s.status}</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)]">{s.cycleName} · {s.goals.length} goals</p>
              <div className="mt-3"><div className="flex justify-between text-xs mb-1"><span className="text-[var(--color-text-muted)]">Weightage</span><span className={s.totalWeightage===100?'text-green-400':'text-yellow-400'}>{s.totalWeightage}%</span></div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden"><div className="h-full rounded-full transition-all duration-500" style={{width:`${Math.min(s.totalWeightage,100)}%`,background:s.totalWeightage===100?'#10b981':s.totalWeightage>100?'#ef4444':'#f59e0b'}}/></div></div>
            </button>
          ))}
          {sheets.length===0&&<div className="glass-card p-8 text-center"><Target size={40} className="mx-auto mb-3 opacity-40"/><p className="text-[var(--color-text-muted)]">No goal sheets yet</p></div>}
        </div>
        <div className="lg:col-span-2 space-y-4">
          {sel&&(<>
            <div className="flex items-center gap-3 flex-wrap">
              {canEdit&&(<><button onClick={()=>{setShowForm(true);setEditId(null);setForm({thrustArea:'',title:'',description:'',uomType:'NUMERIC_MIN',targetValue:0,weightage:10});}} className="btn-secondary flex items-center gap-2" disabled={sel.goals.length>=8}><Plus size={16}/>Add Goal</button>
              <button onClick={()=>{api.put(`/goal-sheets/${sel.id}/submit`).then(()=>fetch()).catch((e:any)=>alert(e.response?.data?.message))}} className="btn-primary flex items-center gap-2" disabled={sel.totalWeightage!==100||sel.goals.length===0}><Send size={16}/>Submit</button></>)}
              {sel.status==='LOCKED'&&<span className="flex items-center gap-2 text-sm text-[var(--color-primary-light)]"><Lock size={16}/>Locked</span>}
            </div>
            {sel.rejectionComment&&<div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm"><p className="font-medium text-red-400 mb-1">Manager Feedback:</p><p className="text-red-300">{sel.rejectionComment}</p></div>}
            {sel.goals.length===0?<div className="glass-card p-12 text-center text-[var(--color-text-muted)]">No goals added yet</div>:(
            <div className="space-y-3">{sel.goals.map((g,i)=>(
              <div key={g.id} className="glass-card p-5 animate-slide-in" style={{animationDelay:`${i*0.05}s`}}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary-light)]">{g.thrustArea}</span>
                      {g.isShared&&<span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400">Shared</span>}
                    </div>
                    <h3 className="font-semibold text-lg">{g.title}</h3>
                    {g.description&&<p className="text-sm text-[var(--color-text-muted)] mt-1">{g.description}</p>}
                    <div className="flex items-center gap-4 mt-3 text-sm text-[var(--color-text-muted)]">
                      <span>UoM: <span className="text-[var(--color-text)]">{g.uomType.replace('_',' ')}</span></span>
                      <span>Target: <span className="text-[var(--color-text)]">{g.targetValue??g.targetDate}</span></span>
                      <span>Weight: <span className="text-[var(--color-text)] font-semibold">{g.weightage}%</span></span>
                    </div>
                  </div>
                  {canEdit&&!g.isShared&&<div className="flex items-center gap-2">
                    <button onClick={()=>{setForm({thrustArea:g.thrustArea,title:g.title,description:g.description||'',uomType:g.uomType,targetValue:g.targetValue,weightage:g.weightage,targetDate:g.targetDate});setEditId(g.id);setShowForm(true);}} className="p-2 rounded-lg hover:bg-white/5 text-[var(--color-text-muted)]"><Edit3 size={16}/></button>
                    <button onClick={()=>api.delete(`/goal-sheets/goals/${g.id}`).then(()=>fetch())} className="p-2 rounded-lg hover:bg-red-500/10 text-red-400"><Trash2 size={16}/></button>
                  </div>}
                </div>
              </div>
            ))}</div>)}
          </>)}
        </div>
      </div>)}

      {showForm&&(<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="glass-card p-8 w-full max-w-lg mx-4 animate-fade-in" style={{background:'rgba(26,21,69,0.95)'}}>
          <h2 className="text-xl font-bold mb-6">{editId?'Edit Goal':'Add New Goal'}</h2>
          <div className="space-y-4">
            <div><label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Thrust Area</label>
              <input className="input-field" value={form.thrustArea} onChange={e=>setForm({...form,thrustArea:e.target.value})} placeholder="e.g., Revenue Growth"/></div>
            <div><label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Goal Title</label>
              <input className="input-field" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g., Increase sales by 20%"/></div>
            <div><label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Description</label>
              <textarea className="input-field" rows={2} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">UoM Type</label>
                <select className="input-field" value={form.uomType} onChange={e=>setForm({...form,uomType:e.target.value as any})}>
                  <option value="NUMERIC_MIN">Numeric (Higher=Better)</option><option value="NUMERIC_MAX">Numeric (Lower=Better)</option>
                  <option value="PERCENTAGE">Percentage</option><option value="TIMELINE">Timeline</option><option value="ZERO_BASED">Zero-Based</option>
                </select></div>
              <div><label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">{form.uomType==='TIMELINE'?'Target Date':'Target Value'}</label>
                {form.uomType==='TIMELINE'?<input type="date" className="input-field" value={form.targetDate||''} onChange={e=>setForm({...form,targetDate:e.target.value})}/>
                :<input type="number" className="input-field" value={form.targetValue} onChange={e=>setForm({...form,targetValue:Number(e.target.value)})}/>}</div>
            </div>
            <div><label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Weightage (%)</label>
              <input type="number" className="input-field" min={10} max={100} value={form.weightage} onChange={e=>setForm({...form,weightage:Number(e.target.value)})}/>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">Min 10%. Total must = 100%.</p></div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={()=>{if(!sel)return;const p=editId?api.put(`/goal-sheets/goals/${editId}`,form):api.post(`/goal-sheets/${sel.id}/goals`,form);p.then(()=>{setShowForm(false);setEditId(null);fetch();}).catch((e:any)=>alert(e.response?.data?.message));}} className="btn-primary flex-1">{editId?'Update':'Add'} Goal</button>
            <button onClick={()=>{setShowForm(false);setEditId(null);}} className="btn-secondary flex-1">Cancel</button>
          </div>
        </div>
      </div>)}
    </div>
  );
}
