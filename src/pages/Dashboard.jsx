import { useEffect, useRef, useState, useCallback } from 'react';
import { useDeviceStore } from '../store/deviceStore';
import { Power, MapPin, Wifi, Satellite, Lock, Unlock, Fan, Navigation, Radio, Tv, Speaker, Video, Wind, Droplet, Plug, Eye, Refrigerator, Lightbulb } from 'lucide-react';
import FridgeInventoryModal from '../components/FridgeInventoryModal';
import TvRemoteModal from '../components/TvRemoteModal';
import gsap from 'gsap';

const getDeviceIcon = (type) => {
  switch (type) {
    case 'light': return Lightbulb;
    case 'lock': return Lock;
    case 'camera': return Video;
    case 'thermostat':
    case 'ac': return Fan;
    case 'tv': return Tv;
    case 'audio': return Speaker;
    case 'vacuum': return Wind;
    case 'sprinkler': return Droplet;
    case 'plug': return Plug;
    case 'sensor': return Eye;
    case 'fridge': return Refrigerator;
    default: return Lightbulb;
  }
};

export default function Dashboard() {
  const {
    devices, distanceToHome, updateDistance, toggleDevice, toggleGeofence,
    homeLocation, userLocation, isTrackingGPS,
    setHomeLocation, updateUserLocation, setTrackingGPS, updateDeviceState
  } = useDeviceStore();

  const statsRef = useRef([]);
  const watchIdRef = useRef(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [gpsError, setGpsError] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [selectedFridgeId, setSelectedFridgeId] = useState(null);
  const [selectedTvId, setSelectedTvId] = useState(null);

  const selectedFridge = devices.find(d => (d._id || d.id) === selectedFridgeId);
  const selectedTv = devices.find(d => (d._id || d.id) === selectedTvId);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [liveTime, setLiveTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const dateStr = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
      const timeStr = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      setLiveTime(`${dateStr} ${timeStr}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Start GPS watch
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by this browser.');
      return;
    }
    setGpsError(null);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setGpsAccuracy(Math.round(pos.coords.accuracy));
        updateUserLocation(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        setGpsError(err.message);
        setTrackingGPS(false);
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );
    setTrackingGPS(true);
  }, [updateUserLocation, setTrackingGPS]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setTrackingGPS(false);
  }, [setTrackingGPS]);

  // Auto-start tracking on mount
  useEffect(() => {
    startTracking();
    return () => stopTracking();
  }, []);

  useEffect(() => {
    gsap.fromTo(statsRef.current,
      { y: 60, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.12, ease: 'power3.out' }
    );
  }, []);

  const onlineCount = devices.filter(d => d.status === 'online').length;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-end flex-wrap gap-4">
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

      {/* Geofence — Real GPS */}
      {(() => {
        const isInRange = distanceToHome <= 1.5;
        const geofenceDevices = devices.filter(d => d.geofenceEnabled);
        const nonGeofenceDevices = devices.filter(d => !d.geofenceEnabled);


        return (
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden border border-[#66fcf1]/30">
            <div className="absolute top-0 right-0 p-8 opacity-5"><MapPin size={100} /></div>

            {/* Header */}
            <div className="flex items-start justify-between mb-1">
              <h2 className="text-xl font-heading font-semibold text-white flex items-center gap-2">
                <MapPin className="text-[#66fcf1]" />
                Auto-Proximity (1.5km Geofence)
              </h2>
              {/* GPS status pill */}
              <div
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold flex-shrink-0"
                style={isTrackingGPS
                  ? { background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }
                  : { background: 'rgba(239,68,68,0.10)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}
              >
                <Radio size={10} className={isTrackingGPS ? 'animate-pulse' : ''} />
                {isTrackingGPS ? 'GPS Live' : 'GPS Off'}
              </div>
            </div>
            <p className="text-sm text-[#8892b0] mb-5 max-w-2xl">
              Your phone's real GPS location is tracked. Enrolled devices turn on automatically when you're within 1.5km of home.
            </p>

            {/* GPS error banner */}
            {gpsError && (
              <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}>
                ⚠ GPS Error: {gpsError}
              </div>
            )}

            {/* Location status row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              {/* Current Location */}
              <div className="px-4 py-3 rounded-xl" style={{ background: 'rgba(102,252,241,0.05)', border: '1px solid rgba(102,252,241,0.12)' }}>
                <p className="text-[10px] font-mono uppercase tracking-widest text-[#66fcf1] mb-1">Your Location</p>
                {userLocation ? (
                  <>
                    <p className="text-xs text-white font-mono">{userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}</p>
                    {gpsAccuracy && <p className="text-[10px] text-[#8892b0] mt-0.5">Accuracy ±{gpsAccuracy}m</p>}
                  </>
                ) : (
                  <p className="text-xs text-[#8892b0] italic">Waiting for GPS…</p>
                )}
              </div>

              {/* Home Location */}
              <div className="px-4 py-3 rounded-xl" style={{ background: 'rgba(170,59,255,0.05)', border: '1px solid rgba(170,59,255,0.12)' }}>
                <p className="text-[10px] font-mono uppercase tracking-widest text-[#aa3bff] mb-1">Home Location</p>
                {homeLocation ? (
                  <p className="text-xs text-white font-mono">{homeLocation.lat.toFixed(5)}, {homeLocation.lng.toFixed(5)}</p>
                ) : (
                  <p className="text-xs text-[#8892b0] italic">Not set yet</p>
                )}
              </div>

              {/* Distance */}
              <div className="px-4 py-3 rounded-xl" style={isInRange
                ? { background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }
                : { background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}
              >
                <p className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: isInRange ? '#10b981' : '#f59e0b' }}>Distance</p>
                <p className="text-xl font-mono font-bold" style={{ color: isInRange ? '#10b981' : '#f59e0b' }}>
                  {homeLocation && userLocation ? `${distanceToHome.toFixed(2)} km` : '— km'}
                </p>
                <p className="text-[10px] text-[#8892b0] mt-0.5">{isInRange ? '✓ Inside 1.5km — active' : '✗ Beyond 1.5km'}</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 mb-5">
              {/* Set Home */}
              <button
                onClick={() => {
                  if (userLocation) {
                    setHomeLocation(userLocation.lat, userLocation.lng);
                  } else {
                    setGpsError('GPS not yet acquired. Please wait.');
                  }
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ background: 'rgba(102,252,241,0.1)', color: '#66fcf1', border: '1px solid rgba(102,252,241,0.3)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(102,252,241,0.18)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(102,252,241,0.1)'}
              >
                <Navigation size={14} />
                {homeLocation ? 'Update Home Location' : 'Set Current Location as Home'}
              </button>

              {/* GPS toggle */}
              {isTrackingGPS ? (
                <button
                  onClick={stopTracking}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                >
                  <Radio size={14} /> Stop GPS
                </button>
              ) : (
                <button
                  onClick={startTracking}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,0.18)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(16,185,129,0.1)'}
                >
                  <Radio size={14} /> Start GPS
                </button>
              )}

              {/* Manual test toggle (when no home set) */}
              {!homeLocation && (
                <button
                  onClick={() => updateDistance(distanceToHome <= 1.5 ? 5.0 : 0.0)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.25)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.18)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(139,92,246,0.1)'}
                >
                  ⚡ Test Trigger (Manual)
                </button>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-white/5 mb-5" />


            {/* Device management */}
            <div className="flex flex-col lg:flex-row gap-6">

              {/* Enrolled devices */}
              <div className="flex-1">
                <p className="text-xs font-mono uppercase tracking-widest text-[#66fcf1] mb-3 flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#66fcf1]" />
                  Auto-ON Devices ({geofenceDevices.length})
                </p>
                {geofenceDevices.length === 0 ? (
                  <p className="text-xs text-[#8892b0] italic">No devices enrolled. Add from the list →</p>
                ) : (
                  <div className="space-y-2">
                    {geofenceDevices.map(d => (
                      <div
                        key={d.id || d._id}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                        style={{ background: 'rgba(102,252,241,0.05)', border: '1px solid rgba(102,252,241,0.15)' }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: 'rgba(102,252,241,0.1)', border: '1px solid rgba(102,252,241,0.2)' }}
                          >
                            <div className="w-2 h-2 rounded-full bg-[#66fcf1]" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white leading-tight">{d.name}</p>
                            <p className="text-xs text-[#8892b0]">{d.location} · <span className="capitalize">{d.type}</span></p>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleGeofence(d.id || d._id)}
                          className="text-xs px-2.5 py-1 rounded-lg font-medium transition-all"
                          style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Vertical divider */}
              <div className="hidden lg:block w-px bg-white/5" />

              {/* Available devices to add — dropdown */}
              <div className="flex-1">
                <p className="text-xs font-mono uppercase tracking-widest text-[#aa3bff] mb-3 flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#aa3bff]" />
                  Add Device to Auto-ON
                </p>

                {nonGeofenceDevices.length === 0 ? (
                  <div
                    className="px-3 py-2.5 rounded-xl text-xs text-[#10b981] italic"
                    style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}
                  >
                    ✓ All devices are enrolled in auto-proximity
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Dropdown */}
                    <div className="relative">
                      <select
                        value={selectedDeviceId}
                        onChange={e => setSelectedDeviceId(e.target.value)}
                        className="w-full appearance-none px-4 py-3 pr-10 rounded-xl text-sm font-medium focus:outline-none transition-all"
                        style={{
                          background: 'rgba(170,59,255,0.07)',
                          border: '1px solid rgba(170,59,255,0.25)',
                          color: selectedDeviceId ? '#fff' : '#8892b0',
                        }}
                        onFocus={e => e.target.style.borderColor = 'rgba(170,59,255,0.6)'}
                        onBlur={e => e.target.style.borderColor = 'rgba(170,59,255,0.25)'}
                      >
                        <option value="" disabled style={{ background: '#0d0520', color: '#8892b0' }}>
                          — Select a device —
                        </option>
                        {nonGeofenceDevices.map(d => (
                          <option
                            key={d.id || d._id}
                            value={d.id || d._id}
                            style={{ background: '#0d0520', color: '#fff' }}
                          >
                            {d.name} · {d.location}
                          </option>
                        ))}
                      </select>
                      {/* Chevron icon */}
                      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c084fc" strokeWidth="2.5">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </div>
                    </div>

                    {/* Preview selected device */}
                    {selectedDeviceId && (() => {
                      const sel = nonGeofenceDevices.find(d => (d.id || d._id) === selectedDeviceId);
                      return sel ? (
                        <div
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                          style={{ background: 'rgba(170,59,255,0.07)', border: '1px dashed rgba(170,59,255,0.3)' }}
                        >
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: 'rgba(170,59,255,0.12)', border: '1px solid rgba(170,59,255,0.25)' }}
                          >
                            <div className="w-2 h-2 rounded-full bg-[#c084fc]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{sel.name}</p>
                            <p className="text-xs text-[#8892b0]">{sel.location} · <span className="capitalize">{sel.type}</span> · <span className={sel.status === 'online' ? 'text-[#10b981]' : 'text-[#ef4444]'}>{sel.status}</span></p>
                          </div>
                        </div>
                      ) : null;
                    })()}

                    {/* Add button */}
                    <button
                      disabled={!selectedDeviceId}
                      onClick={() => {
                        if (selectedDeviceId) {
                          toggleGeofence(selectedDeviceId);
                          setSelectedDeviceId('');
                        }
                      }}
                      className="w-full py-2.5 rounded-xl text-sm font-bold transition-all"
                      style={{
                        background: selectedDeviceId
                          ? 'linear-gradient(135deg, rgba(170,59,255,0.3), rgba(99,102,241,0.3))'
                          : 'rgba(255,255,255,0.04)',
                        color: selectedDeviceId ? '#c084fc' : '#4b5563',
                        border: selectedDeviceId
                          ? '1px solid rgba(170,59,255,0.4)'
                          : '1px solid rgba(255,255,255,0.06)',
                        cursor: selectedDeviceId ? 'pointer' : 'not-allowed',
                        boxShadow: selectedDeviceId ? '0 0 16px rgba(170,59,255,0.15)' : 'none',
                      }}
                    >
                      + Add to Auto-ON
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        );
      })()}


      {/* 4C: Detailed Device Control Cards */}
      <h2 className="text-2xl font-heading font-bold text-white mt-8 mb-4">Device Controls</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.map(device => {
          const id = device._id || device.id;
          const isOff = device.type === 'lock' ? device.state.isLocked : !device.state.isOn;
          const isOnline = device.status === 'online';

          return (
            <div key={id} className="glass-panel p-6 rounded-2xl group hover:shadow-[0_8px_30px_rgba(102,252,241,0.15)] hover:border-[#66fcf1]/30 transition-all duration-300 flex flex-col min-h-[220px]">

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
                    <Wifi size={14} className="text-[#8892b0]" title="Wi-Fi Connected" />
                  ) : (
                    <Satellite size={14} className="text-[#aa3bff]" title="Satellite Connected" />
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
                  <div className="flex flex-col items-center gap-4 w-full">
                    <div 
                      onClick={() => isOnline && toggleDevice(id)}
                      className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 cursor-pointer"
                      style={{
                        background: !isOff ? `${device.state?.color || '#66fcf1'}22` : '#1f2937',
                        boxShadow: !isOff ? `0 0 30px ${device.state?.color || '#66fcf1'}` : 'none',
                        border: !isOff ? `1.5px solid ${device.state?.color || '#66fcf1'}` : '1.5px solid transparent'
                      }}
                    >
                      <Power size={32} style={{ color: !isOff ? (device.state?.color || '#66fcf1') : '#6b7280' }} />
                    </div>

                    {/* Brightness slider */}
                    <div className="space-y-1 w-full">
                      <div className="flex justify-between text-[10px] font-mono text-[#8892b0]">
                        <span>BRIGHTNESS</span>
                        <span>{device.state?.brightness || 0}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="100" 
                        value={device.state?.brightness || 0}
                        onChange={(e) => updateDeviceState(id, { brightness: parseInt(e.target.value) })}
                        disabled={isOff || !isOnline}
                        className="w-full cursor-pointer disabled:opacity-50 mt-1"
                        style={{ accentColor: device.state?.color || '#66fcf1' }}
                      />
                    </div>

                    {/* Color presets */}
                    <div className="flex justify-center gap-2.5">
                      {[
                        { hex: '#66fcf1', name: 'cyan' },
                        { hex: '#aa3bff', name: 'purple' },
                        { hex: '#f59e0b', name: 'amber' },
                        { hex: '#ef4444', name: 'red' },
                        { hex: '#ffffff', name: 'white' }
                      ].map(color => (
                        <button
                          key={color.hex}
                          disabled={isOff || !isOnline}
                          onClick={() => updateDeviceState(id, { color: color.hex })}
                          className={`w-4 h-4 rounded-full border transition-all active:scale-90 ${device.state?.color === color.hex ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}
                          style={{ 
                            backgroundColor: color.hex,
                            boxShadow: device.state?.color === color.hex ? `0 0 8px ${color.hex}` : 'none'
                          }}
                          title={color.name}
                        />
                      ))}
                    </div>
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

                {device.type === 'camera' && (() => {
                  const cameraFeedUrl = device.name.toLowerCase().includes('patio') ? '/patio_feed.png' : '/living_room_feed.png';
                  return (
                    <div 
                      onClick={() => isOnline && !isOff && setSelectedCamera(device)}
                      className={`relative w-full h-32 rounded-xl overflow-hidden border border-white/10 group-hover:border-[#66fcf1]/40 transition-all cursor-pointer ${isOff || !isOnline ? 'bg-gray-900 flex items-center justify-center' : ''}`}
                    >
                      {isOff || !isOnline ? (
                        <div className="text-center space-y-2">
                           <Video size={36} className="text-gray-500 mx-auto" />
                           <p className="text-xs font-mono tracking-wider text-gray-500 font-bold uppercase">FEED INACTIVE</p>
                        </div>
                      ) : (
                        <>
                          <img src={cameraFeedUrl} alt={device.name} className="w-full h-full object-cover brightness-90 group-hover:scale-105 transition-transform duration-700" />
                          
                          {/* Live overlays */}
                          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/60 border border-white/10 flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                            <span className="text-[9px] font-mono text-white font-bold tracking-wider">REC</span>
                          </div>

                          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 border border-white/10">
                            <span className="text-[9px] font-mono text-[#66fcf1] font-bold uppercase tracking-wider">{device.location}</span>
                          </div>

                          <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/60 border border-white/10">
                            <span className="text-[9px] font-mono text-white/80">{liveTime}</span>
                          </div>

                          <div className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-[#66fcf1] hover:text-black text-[#66fcf1] transition-colors border border-white/10">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                            </svg>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })()}

                {device.type === 'fridge' && (
                  <div className="flex flex-col items-center gap-3 w-full">
                    <div className={`p-4 rounded-full transition-all duration-500 ${!isOff ? 'bg-[#66fcf1]/20 shadow-[0_0_30px_rgba(102,252,241,0.3)]' : 'bg-gray-800'}`}>
                      <Refrigerator size={36} className={!isOff ? 'text-[#66fcf1]' : 'text-gray-500'} />
                    </div>
                    <button
                      onClick={() => !isOff && isOnline && setSelectedFridgeId(id)}
                      disabled={isOff || !isOnline}
                      className="px-4 py-1.5 bg-[#66fcf1]/10 hover:bg-[#66fcf1]/20 border border-[#66fcf1]/30 disabled:opacity-50 text-[#66fcf1] rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      View Inventory
                    </button>
                  </div>
                )}

                {(device.type === 'tv' || device.type === 'audio') && (
                  <div className="flex flex-col items-center gap-4 w-full">
                    <div className={`p-4 rounded-full transition-all duration-500 ${!isOff ? 'bg-[#66fcf1]/20 shadow-[0_0_30px_rgba(102,252,241,0.3)]' : 'bg-gray-800'}`}>
                      {device.type === 'tv' ? (
                        <Tv size={36} className={!isOff ? 'text-[#66fcf1]' : 'text-gray-500'} />
                      ) : (
                        <Speaker size={36} className={!isOff ? 'text-[#66fcf1]' : 'text-gray-500'} />
                      )}
                    </div>
                    {/* Volume Slider */}
                    <div className="space-y-1 w-full">
                      <div className="flex justify-between text-[10px] font-mono text-[#8892b0]">
                        <span>VOLUME</span>
                        <span>{device.state?.brightness || 0}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="100" 
                        value={device.state?.brightness || 0}
                        onChange={(e) => updateDeviceState(id, { brightness: parseInt(e.target.value) })}
                        disabled={isOff || !isOnline}
                        className="w-full cursor-pointer disabled:opacity-50 mt-1"
                        style={{ accentColor: '#66fcf1' }}
                      />
                    </div>
                    {/* TV Universal Remote trigger */}
                    {device.type === 'tv' && (
                      <button
                        onClick={() => !isOff && isOnline && setSelectedTvId(id)}
                        disabled={isOff || !isOnline}
                        className="px-4 py-1.5 bg-[#aa3bff]/10 hover:bg-[#aa3bff]/25 border border-[#aa3bff]/30 disabled:opacity-50 text-[#c084fc] rounded-lg text-[10px] font-bold tracking-wide uppercase transition-colors cursor-pointer mt-1"
                      >
                        Universal Remote
                      </button>
                    )}
                  </div>
                )}

                {!['thermostat', 'light', 'ac', 'lock', 'camera', 'fridge', 'tv', 'audio'].includes(device.type) && (() => {
                  const Icon = getDeviceIcon(device.type);
                  return (
                    <div className={`p-4 rounded-full transition-all duration-500 ${!isOff ? 'bg-[#66fcf1]/20 shadow-[0_0_30px_rgba(102,252,241,0.3)]' : 'bg-gray-800'}`}>
                      <Icon size={36} className={!isOff ? 'text-[#66fcf1]' : 'text-gray-500'} />
                    </div>
                  );
                })()}
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                <label className="flex items-center gap-2 cursor-pointer group/geo">
                  <div className={`relative w-8 h-4 rounded-full transition-colors ${device.geofenceEnabled ? 'bg-[#aa3bff]/50 border border-[#aa3bff]' : 'bg-gray-700'}`}>
                    <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${device.geofenceEnabled ? 'translate-x-4' : 'translate-x-0'}`}></div>
                  </div>
                  <input type="checkbox" className="hidden" checked={device.geofenceEnabled} onChange={() => toggleGeofence(id)} />
                  <span className="text-xs font-medium text-[#8892b0] group-hover/geo:text-white transition-colors">Auto-Prox</span>
                </label>

                <button
                  onClick={() => toggleDevice(id)}
                  disabled={!isOnline}
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${!isOnline ? 'opacity-50 cursor-not-allowed bg-gray-800 text-gray-500' :
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

      {/* Selected Camera Modal */}
      {selectedCamera && (() => {
        const cameraFeedUrl = selectedCamera.name.toLowerCase().includes('patio') ? '/patio_feed.png' : '/living_room_feed.png';
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="glass-panel p-6 rounded-2xl w-full max-w-4xl border border-[#66fcf1]/30 relative overflow-hidden flex flex-col md:flex-row gap-6">
              
              {/* Camera Feed Column */}
              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                    {selectedCamera.name}
                  </h3>
                  <span className="text-xs font-mono text-[#8892b0]">{liveTime}</span>
                </div>
                
                {/* Image Container with overlays */}
                <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 bg-black">
                  <img src={cameraFeedUrl} alt={selectedCamera.name} className="w-full h-full object-cover" />
                  
                  {/* Scanlines / Overlay */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] pointer-events-none opacity-40" />
                  
                  {/* Grid Lines */}
                  <div className="absolute inset-0 border border-[#66fcf1]/10 flex pointer-events-none">
                    <div className="w-1/3 border-r border-[#66fcf1]/10 h-full" />
                    <div className="w-1/3 border-r border-[#66fcf1]/10 h-full" />
                  </div>
                  <div className="absolute inset-0 flex flex-col pointer-events-none">
                    <div className="h-1/3 border-b border-[#66fcf1]/10 w-full" />
                    <div className="h-1/3 border-b border-[#66fcf1]/10 w-full" />
                  </div>

                  {/* Corner notches */}
                  <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-white/40 pointer-events-none" />
                  <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-white/40 pointer-events-none" />
                  <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-white/40 pointer-events-none" />
                  <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-white/40 pointer-events-none" />

                  {/* Lens overlay tag */}
                  <div className="absolute top-4 left-4 bg-black/60 px-2 py-1 rounded text-[10px] font-mono text-[#66fcf1] border border-white/10 ml-5 mt-5 font-bold">
                    CH01 - UHD 4K - 30FPS
                  </div>
                </div>
              </div>
              
              {/* Controls Column */}
              <div className="w-full md:w-80 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-sm font-mono font-bold tracking-wider text-[#66fcf1]">SURVEILLANCE CONTROL</span>
                    <button 
                      onClick={() => setSelectedCamera(null)}
                      className="text-gray-400 hover:text-white transition-colors"
                      aria-label="Close"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>

                  {/* Pan Tilt Zoom (PTZ) controls */}
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-xs font-mono uppercase tracking-widest text-[#8892b0]">PTZ Pan / Tilt</label>
                      <div className="relative w-32 h-32 mx-auto bg-black/40 rounded-full border border-white/10 flex items-center justify-center">
                        <button className="absolute top-2 text-[#8892b0] hover:text-[#66fcf1] active:scale-95 transition-all text-sm font-bold">▲</button>
                        <button className="absolute bottom-2 text-[#8892b0] hover:text-[#66fcf1] active:scale-95 transition-all text-sm font-bold">▼</button>
                        <button className="absolute left-2 text-[#8892b0] hover:text-[#66fcf1] active:scale-95 transition-all text-sm font-bold">◀</button>
                        <button className="absolute right-2 text-[#8892b0] hover:text-[#66fcf1] active:scale-95 transition-all text-sm font-bold">▶</button>
                        <div className="w-12 h-12 rounded-full bg-black/60 border border-[#66fcf1]/30 flex items-center justify-center text-xs font-mono text-[#66fcf1] shadow-[0_0_10px_rgba(102,252,241,0.2)] font-bold">
                          PTZ
                        </div>
                      </div>
                    </div>

                    {/* Camera properties */}
                    <div className="space-y-3 pt-4 border-t border-white/5">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-[#8892b0]">Signal Quality</span>
                        <span className="text-[#10b981] font-bold">98% (Excellent)</span>
                      </div>
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-[#8892b0]">Bitrate</span>
                        <span className="text-white">4.82 Mbps</span>
                      </div>
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-[#8892b0]">Storage Mode</span>
                        <span className="text-white">Continuous Cloud</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 flex gap-3">
                  <button 
                    onClick={() => alert('Initiating warning siren sound...')}
                    className="flex-1 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs font-mono font-bold transition-all"
                  >
                    🚨 SIREN ALERT
                  </button>
                  <button 
                    onClick={() => setSelectedCamera(null)}
                    className="flex-1 py-2.5 rounded-xl bg-[#66fcf1] text-black hover:bg-white text-xs font-mono font-bold transition-all"
                  >
                    CLOSE MONITOR
                  </button>
                </div>
              </div>
              
            </div>
          </div>
        );
      })()}

      {selectedFridge && (
        <FridgeInventoryModal 
          device={selectedFridge} 
          onClose={() => setSelectedFridgeId(null)} 
        />
      )}

      {selectedTv && (
        <TvRemoteModal 
          device={selectedTv} 
          onClose={() => setSelectedTvId(null)} 
        />
      )}
    </div>
  );
}
