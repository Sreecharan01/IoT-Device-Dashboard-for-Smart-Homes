import { useEffect, useRef } from 'react';
import { useDeviceStore } from '../store/deviceStore';
import { Power, MapPin, Wifi, Satellite, Lock, Unlock, Thermometer, Droplets, Fan } from 'lucide-react';
import gsap from 'gsap';

export default function Dashboard() {
  const { devices, distanceToHome, updateDistance, toggleDevice, toggleGeofence } = useDeviceStore();
  const statsRef = useRef([]);

  useEffect(() => {
    gsap.fromTo(statsRef.current, 
      { y: 60, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.12, ease: 'power3.out' }
    );
  }, []);

  const onlineCount = devices.filter(d => d.status === 'online').length;
  
  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-heading font-bold text-white mb-2">Home Dashboard</h1>
          <p className="text-[#8892b0]">System active and monitoring.</p>
        </div>
      </div>

      {/* 4A: Hero Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Devices', value: devices.length },
          { label: 'Online', value: onlineCount, highlight: true },
          { label: 'Active Alerts', value: 0 },
          { label: 'Energy Today', value: '4.2 kWh' }
        ].map((stat, i) => (
          <div 
            key={i} 
            ref={el => statsRef.current[i] = el}
            className="glass-panel p-5 rounded-2xl border-l-4 border-l-[#aa3bff]"
          >
            <p className="text-[#8892b0] text-sm mb-1">{stat.label}</p>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-mono text-white">{stat.value}</span>
              {stat.highlight && (
                <div className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-pulse shadow-[0_0_10px_#10b981]"></div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Geofence Simulator */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden border border-[#66fcf1]/30">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <MapPin size={100} />
        </div>
        <h2 className="text-xl font-heading font-semibold text-white mb-4 flex items-center gap-2">
          <MapPin className="text-[#66fcf1]" /> 
          Auto-Proximity Simulator (1.5km Geofence)
        </h2>
        <p className="text-sm text-[#8892b0] mb-6 max-w-2xl">
          Drag the slider to simulate your distance from home. Devices with Auto-Prox enabled will automatically trigger when you are within range.
        </p>
        
        <div className="flex items-center gap-6">
          <input 
            type="range" 
            min="0" max="10" step="0.1" 
            value={distanceToHome} 
            onChange={(e) => updateDistance(parseFloat(e.target.value))}
            className="w-full max-w-md accent-[#66fcf1] h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="text-2xl font-mono font-bold text-glow w-24">
            {distanceToHome.toFixed(1)} km
          </div>
          <div className={`px-4 py-2 rounded-full text-sm font-bold flex-shrink-0 ${distanceToHome <= 1.5 ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/50' : 'bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/50'}`}>
            {distanceToHome <= 1.5 ? 'Inside Range' : 'Outside Range'}
          </div>
        </div>
      </div>

      {/* 4C: Detailed Device Control Cards */}
      <h2 className="text-2xl font-heading font-bold text-white mt-8 mb-4">Device Controls</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.map(device => {
          const isOff = device.type === 'lock' ? device.state.isLocked : !device.state.isOn;
          const isOnline = device.status === 'online';
          
          return (
            <div key={device.id} className="glass-panel p-6 rounded-2xl group hover:shadow-[0_8px_30px_rgba(102,252,241,0.15)] hover:border-[#66fcf1]/30 transition-all duration-300 flex flex-col min-h-[220px]">
              
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-glow transition-colors">{device.name}</h3>
                  <p className="text-[#8892b0] text-sm">{device.location}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 ${isOnline ? 'bg-[#10b981]/20 text-[#10b981]' : 'bg-[#ef4444]/20 text-[#ef4444]'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-[#10b981]' : 'bg-[#ef4444]'}`}></div>
                    {isOnline ? 'Online' : 'Offline'}
                  </div>
                  {device.connection === 'wifi' ? (
                    <Wifi size={14} className="text-[#8892b0]" title="Wi-Fi Connected"/>
                  ) : (
                    <Satellite size={14} className="text-[#aa3bff]" title="Satellite Connected"/>
                  )}
                </div>
              </div>

              {/* Visual Body / Controls based on Type */}
              <div className="flex-1 flex flex-col justify-center items-center py-4">
                {device.type === 'thermostat' && (
                  <div className="relative w-24 h-24 rounded-full border-4 flex items-center justify-center transition-colors duration-500" 
                       style={{ borderColor: device.state.mode === 'cool' ? '#66fcf1' : '#f59e0b' }}>
                    <div className="text-3xl font-mono text-white">{device.state.temp}°</div>
                  </div>
                )}
                
                {device.type === 'light' && (
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 ${!isOff ? 'bg-[#66fcf1]/20 shadow-[0_0_30px_#66fcf1]' : 'bg-gray-800'}`}>
                    <Power size={32} className={!isOff ? 'text-[#66fcf1]' : 'text-gray-500'} />
                  </div>
                )}

                {device.type === 'ac' && (
                  <div className={`relative transition-transform duration-1000 ${!isOff ? 'animate-spin' : ''}`}>
                    <Fan size={48} className={!isOff ? 'text-[#66fcf1]' : 'text-gray-500'} />
                  </div>
                )}

                {device.type === 'lock' && (
                  <div className={`p-4 rounded-full transition-colors ${!isOff ? 'bg-[#10b981]/20' : 'bg-[#ef4444]/20'}`}>
                    {!isOff ? <Unlock size={36} className="text-[#10b981]" /> : <Lock size={36} className="text-[#ef4444]" />}
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                <label className="flex items-center gap-2 cursor-pointer group/geo">
                  <div className={`relative w-8 h-4 rounded-full transition-colors ${device.geofenceEnabled ? 'bg-[#aa3bff]/50 border border-[#aa3bff]' : 'bg-gray-700'}`}>
                    <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${device.geofenceEnabled ? 'translate-x-4' : 'translate-x-0'}`}></div>
                  </div>
                  <input type="checkbox" className="hidden" checked={device.geofenceEnabled} onChange={() => toggleGeofence(device.id)} />
                  <span className="text-xs font-medium text-[#8892b0] group-hover/geo:text-white transition-colors">Auto-Prox</span>
                </label>

                <button 
                  onClick={() => toggleDevice(device.id)}
                  disabled={!isOnline}
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                    !isOnline ? 'opacity-50 cursor-not-allowed bg-gray-800 text-gray-500' :
                    isOff ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-[#66fcf1]/20 text-[#66fcf1] border border-[#66fcf1]/50'
                  }`}
                >
                  {device.type === 'lock' ? (isOff ? 'Unlock' : 'Lock') : (isOff ? 'Turn On' : 'Turn Off')}
                </button>
              </div>
              
            </div>
          );
        })}
      </div>
    </div>
  );
}
