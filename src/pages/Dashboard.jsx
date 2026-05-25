import { useEffect, useRef, useState, useCallback } from 'react';
import { useDeviceStore } from '../store/deviceStore';
import { Power, MapPin, Wifi, Satellite, Lock, Unlock, Fan, Navigation, Radio } from 'lucide-react';
import gsap from 'gsap';

export default function Dashboard() {
  const {
    devices, distanceToHome, updateDistance, toggleDevice, toggleGeofence,
    homeLocation, userLocation, isTrackingGPS,
    setHomeLocation, updateUserLocation, setTrackingGPS,
  } = useDeviceStore();

  const statsRef = useRef([]);
  const watchIdRef = useRef(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [gpsError, setGpsError] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);

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
    </div>
  );
}
