import { useParams } from 'react-router-dom';
import { useDeviceStore } from '../store/deviceStore';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Battery, Signal, Clock } from 'lucide-react';

const data = [
  { time: '00:00', value: 20 }, { time: '04:00', value: 22 }, { time: '08:00', value: 35 },
  { time: '12:00', value: 45 }, { time: '16:00', value: 40 }, { time: '20:00', value: 25 },
  { time: '24:00', value: 21 },
];

export default function DeviceDetail() {
  const { id } = useParams();
  const device = useDeviceStore(state => state.devices.find(d => d.id === id)) || { name: 'Unknown Device', type: 'unknown', status: 'offline' };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-heading font-bold text-white">{device.name}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${device.status === 'online' ? 'bg-[#10b981]/20 text-[#10b981]' : 'bg-[#ef4444]/20 text-[#ef4444]'}`}>
              {device.status}
            </span>
          </div>
          <p className="text-[#8892b0]">Device ID: {id} • Type: {device.type}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-[#66fcf1]/20">
          <h2 className="text-xl font-heading font-semibold text-white mb-6 flex items-center gap-2">
            <Activity className="text-[#66fcf1]" /> Live Sensor Telemetry
          </h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#66fcf1" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#66fcf1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="time" stroke="#8892b0" tick={{fill: '#8892b0'}} axisLine={false} tickLine={false} />
                <YAxis stroke="#8892b0" tick={{fill: '#8892b0'}} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(5,5,5,0.9)', border: '1px solid rgba(102,252,241,0.3)', borderRadius: '8px' }}
                  itemStyle={{ color: '#66fcf1' }}
                />
                <Area type="monotone" dataKey="value" stroke="#66fcf1" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/5">
            <h2 className="text-xl font-heading font-semibold text-white mb-6">Device Health</h2>
            <div className="space-y-4">
              {[
                { label: 'Battery Level', value: '87%', icon: Battery, color: 'text-[#10b981]' },
                { label: 'Signal Strength', value: '-65 dBm', icon: Signal, color: 'text-[#66fcf1]' },
                { label: 'Uptime', value: '45d 12h', icon: Clock, color: 'text-[#aa3bff]' },
              ].map((h, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-black/40 rounded-lg">
                  <div className="flex items-center gap-3">
                    <h.icon className={h.color} size={18} />
                    <span className="text-[#8892b0] text-sm">{h.label}</span>
                  </div>
                  <span className="font-mono text-white font-bold">{h.value}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="glass-panel p-6 rounded-2xl border border-white/5 text-center">
             <button className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg font-bold border border-white/10 transition-colors">
               Run Diagnostics
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
