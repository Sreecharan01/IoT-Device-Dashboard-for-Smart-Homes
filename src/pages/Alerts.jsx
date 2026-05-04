import { BellRing, AlertTriangle, Info, ShieldAlert } from 'lucide-react';

export default function Alerts() {
  const alerts = [
    { id: 1, type: 'critical', message: 'Main Gate Lock tampered with. Intrusion detected.', time: '2 mins ago', icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/50', glow: 'shadow-[0_0_15px_rgba(239,68,68,0.2)]' },
    { id: 2, type: 'warning', message: 'Bedroom AC filter needs replacement.', time: '1 hour ago', icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', glow: '' },
    { id: 3, type: 'info', message: 'Firmware update available for Smart Thermostat v2.1.', time: '5 hours ago', icon: Info, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/30', glow: '' },
    { id: 4, type: 'info', message: 'Living Room Lights automatically triggered by Geofence.', time: 'Yesterday', icon: BellRing, color: 'text-[#66fcf1]', bg: 'bg-[#66fcf1]/10', border: 'border-[#66fcf1]/30', glow: '' },
  ];

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-4xl font-heading font-bold text-white mb-2">Alerts & Notifications</h1>
        <p className="text-[#8892b0]">System-wide events and critical warnings.</p>
      </div>

      <div className="space-y-4">
        {alerts.map(alert => {
          const Icon = alert.icon;
          return (
            <div 
              key={alert.id} 
              className={`glass-panel p-5 rounded-xl border flex items-start gap-4 transition-all hover:-translate-x-1 cursor-pointer ${alert.bg} ${alert.border} ${alert.glow} ${alert.type === 'critical' ? 'animate-[pulse_3s_ease-in-out_infinite]' : ''}`}
            >
              <div className={`p-2 rounded-lg bg-black/40 ${alert.color}`}>
                <Icon size={24} />
              </div>
              <div className="flex-1 pt-1">
                <p className="text-white font-medium mb-1">{alert.message}</p>
                <p className="text-xs text-[#8892b0]">{alert.time}</p>
              </div>
              <button className="text-[#8892b0] hover:text-white transition-colors text-sm px-3 py-1 bg-black/40 rounded-lg">
                Dismiss
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
