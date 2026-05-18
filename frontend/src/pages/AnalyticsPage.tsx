import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Download, TrendingUp, Target, BarChart2, Bot, Send, Loader2, Sparkles } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import api from '../api/axios';

const CHART_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b'];

const customTooltipStyle = {
  contentStyle: {
    backgroundColor: 'rgba(22,18,60,0.98)',
    border: '1px solid rgba(99,102,241,0.3)',
    borderRadius: '12px',
    color: '#f1f5f9',
    fontSize: '12px',
  }
};

interface ChatMessage { role: 'user' | 'assistant'; content: string; }

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [trends, setTrends] = useState<any[]>([]);
  const [heatmap, setHeatmap] = useState<any[]>([]);
  const [distribution, setDistribution] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // AI Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hi! I\'m the AtomQuest HR assistant. Ask me anything about goal-setting rules, check-in policies, or how scores are calculated.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // SMART suggest
  const [smartTitle, setSmartTitle] = useState('');
  const [smartResult, setSmartResult] = useState('');
  const [smartLoading, setSmartLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/trends'),
      api.get('/analytics/heatmap'),
      api.get('/analytics/distribution'),
    ]).then(([t, h, d]) => {
      setTrends(t.data.data || []);
      setHeatmap(h.data.data || []);
      setDistribution(d.data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleExport = (type: 'csv' | 'excel') => {
    const link = document.createElement('a');
    link.href = `/api/export/${type}`;
    link.download = `achievements.${type === 'excel' ? 'xlsx' : 'csv'}`;
    link.click();
  };

  const handleChat = async () => {
    const q = chatInput.trim();
    if (!q) return;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: q }]);
    setChatLoading(true);
    try {
      const res = await api.post('/ai/hr-assistant', { question: q });
      setChatMessages(prev => [...prev, { role: 'assistant', content: res.data.data }]);
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, the AI assistant is unavailable. Please ensure your OpenAI key is configured.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSmartSuggest = async () => {
    if (!smartTitle.trim()) return;
    setSmartLoading(true);
    setSmartResult('');
    try {
      const res = await api.post('/ai/smart-suggest', { title: smartTitle });
      setSmartResult(res.data.data);
    } catch {
      setSmartResult('AI suggestion unavailable. Please configure your OpenAI API key.');
    } finally {
      setSmartLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Analytics & AI Tools</h1>
        {user?.role === 'ADMIN' && (
          <div className="flex gap-3">
            <button onClick={() => handleExport('csv')} className="btn-secondary flex items-center gap-2">
              <Download size={16} /> CSV
            </button>
            <button onClick={() => handleExport('excel')} className="btn-primary flex items-center gap-2">
              <Download size={16} /> Excel
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={32} className="animate-spin text-[var(--color-primary)]" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* QoQ Trend Line Chart */}
          <div className="glass-card p-6">
            <h2 className="text-base font-semibold mb-5 flex items-center gap-2">
              <TrendingUp size={18} className="text-indigo-400" /> Quarter-on-Quarter Trends
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
                  <XAxis dataKey="quarter" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#94a3b8" domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
                  <Tooltip {...customTooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="Engineering" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 7 }} />
                  <Line type="monotone" dataKey="Sales" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="HR" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Donut Chart */}
          <div className="glass-card p-6">
            <h2 className="text-base font-semibold mb-5 flex items-center gap-2">
              <Target size={18} className="text-sky-400" /> Goal Distribution by UoM
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={distribution} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={4} dataKey="value">
                    {distribution.map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip {...customTooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Heatmap Bar */}
          <div className="glass-card p-6 lg:col-span-2">
            <h2 className="text-base font-semibold mb-5 flex items-center gap-2">
              <BarChart2 size={18} className="text-emerald-400" /> Check-in Completion by Department
            </h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={heatmap} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
                  <XAxis dataKey="department" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#94a3b8" domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
                  <Tooltip {...customTooltipStyle} />
                  <Bar dataKey="completionRate" label={{ position: 'top', fontSize: 11, fill: '#94a3b8' }} radius={[8, 8, 0, 0]}>
                    {heatmap.map((entry, idx) => (
                      <Cell key={idx} fill={entry.completionRate >= 90 ? '#10b981' : entry.completionRate >= 60 ? '#f59e0b' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI SMART Goal Suggester */}
          <div className="glass-card p-6">
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
              <Sparkles size={18} className="text-yellow-400" /> SMART Goal Suggester
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">Your draft goal</label>
                <input className="input-field" value={smartTitle} onChange={e => setSmartTitle(e.target.value)}
                  placeholder="e.g., Improve customer satisfaction" onKeyDown={e => e.key === 'Enter' && handleSmartSuggest()} />
              </div>
              <button onClick={handleSmartSuggest} disabled={smartLoading || !smartTitle.trim()} className="btn-primary flex items-center gap-2 w-full justify-center">
                {smartLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {smartLoading ? 'Generating...' : 'Suggest SMART Goal'}
              </button>
              {smartResult && (
                <div className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20 text-sm text-[var(--color-text)] whitespace-pre-line leading-relaxed">
                  {smartResult}
                </div>
              )}
            </div>
          </div>

          {/* HR RAG Chat */}
          <div className="glass-card p-6 flex flex-col h-96">
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
              <Bot size={18} className="text-indigo-400" /> HR Policy Assistant
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 ml-1">AI-powered</span>
            </h2>
            <div className="flex-1 overflow-y-auto space-y-3 mb-3">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600/30 text-[var(--color-text)] rounded-br-sm'
                      : 'bg-white/5 text-[var(--color-text-muted)] rounded-bl-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 px-4 py-2.5 rounded-2xl rounded-bl-sm">
                    <Loader2 size={16} className="animate-spin text-[var(--color-text-muted)]" />
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>
            <div className="flex gap-2">
              <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleChat()}
                placeholder="Ask about goal rules, scoring..." className="input-field flex-1 py-2 text-sm" />
              <button onClick={handleChat} disabled={chatLoading || !chatInput.trim()} className="btn-primary px-3 flex items-center">
                <Send size={16} />
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
