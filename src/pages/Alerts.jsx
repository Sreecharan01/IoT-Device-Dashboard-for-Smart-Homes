import { useState, useEffect } from 'react';
import { BellRing, AlertTriangle, Info, ShieldAlert, Send } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function Alerts() {
  const { user } = useAuthStore();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newAlert, setNewAlert] = useState({ title: '', message: '', type: 'news' });

  const fetchAlerts = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const res = await fetch(`${API_URL}/alerts`, {
        headers: { Authorization: `Bearer ${userInfo?.token}` }
      });
      const data = await res.json();
      if (res.ok) setAlerts(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const postAlert = async (e) => {
    e.preventDefault();
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const res = await fetch(`${API_URL}/alerts`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo?.token}` 
        },
        body: JSON.stringify(newAlert)
      });
      if (res.ok) {
        setNewAlert({ title: '', message: '', type: 'news' });
        fetchAlerts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getIconAndStyle = (type) => {
    switch (type) {
      case 'critical': return { icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/50', glow: 'shadow-[0_0_15px_rgba(239,68,68,0.2)]' };
      case 'warning': return { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', glow: '' };
      case 'info': return { icon: Info, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/30', glow: '' };
      case 'news':
      default: return { icon: BellRing, color: 'text-[#66fcf1]', bg: 'bg-[#66fcf1]/10', border: 'border-[#66fcf1]/30', glow: '' };
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-4xl font-heading font-bold text-white mb-2">Platform News & Alerts</h1>
        <p className="text-[#8892b0]">Real-time updates, security events, and platform news.</p>
      </div>

      {user?.role === 'admin' && (
        <div className="glass-panel p-6 rounded-2xl border border-[#aa3bff]/30 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Post Global Update (Admin)</h2>
          <form onSubmit={postAlert} className="space-y-4">
            <input 
              type="text" 
              placeholder="Update Title" 
              value={newAlert.title}
              onChange={e => setNewAlert({...newAlert, title: e.target.value})}
              className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-[#aa3bff]/50 focus:outline-none"
              required
            />
            <textarea 
              placeholder="Write the real-time news or update here..." 
              value={newAlert.message}
              onChange={e => setNewAlert({...newAlert, message: e.target.value})}
              className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-[#aa3bff]/50 focus:outline-none h-24"
              required
            />
            <div className="flex gap-4 items-center">
              <select 
                value={newAlert.type}
                onChange={e => setNewAlert({...newAlert, type: e.target.value})}
                className="bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-[#aa3bff]/50 focus:outline-none"
              >
                <option value="news">News / Update</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>
              <button 
                type="submit"
                className="flex items-center gap-2 bg-[#aa3bff] hover:bg-[#902be2] text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                <Send size={18} /> Broadcast
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {loading ? <p className="text-[#8892b0]">Loading alerts...</p> : alerts.length === 0 ? <p className="text-[#8892b0]">No news or alerts yet.</p> : null}
        {alerts.map(alert => {
          const style = getIconAndStyle(alert.type);
          const Icon = style.icon;
          return (
            <div 
              key={alert._id} 
              className={`glass-panel p-5 rounded-xl border flex items-start gap-4 transition-all hover:-translate-x-1 ${style.bg} ${style.border} ${style.glow} ${alert.type === 'critical' ? 'animate-[pulse_3s_ease-in-out_infinite]' : ''}`}
            >
              <div className={`p-2 rounded-lg bg-black/40 ${style.color}`}>
                <Icon size={24} />
              </div>
              <div className="flex-1 pt-1">
                <h3 className="text-white font-bold mb-1">{alert.title}</h3>
                <p className="text-[#8892b0] mb-2">{alert.message}</p>
                <p className="text-xs text-[#8892b0]/60">{new Date(alert.createdAt).toLocaleString()}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
