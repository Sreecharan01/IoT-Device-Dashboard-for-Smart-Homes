import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../store/authStore';

const API = '/api';

export default function MobileTracker() {
  const { user } = useAuthStore();
  const token = (() => {
    try { return JSON.parse(localStorage.getItem('userInfo'))?.token; } catch { return null; }
  })();

  const [status, setStatus]         = useState('idle');      // idle | tracking | inside | outside | error
  const [distance, setDistance]     = useState(null);
  const [accuracy, setAccuracy]     = useState(null);
  const [homeSet, setHomeSet]       = useState(false);
  const [lastPing, setLastPing]     = useState(null);
  const [triggered, setTriggered]   = useState([]);
  const [gpsError, setGpsError]     = useState(null);
  const [coords, setCoords]         = useState(null);
  const [settingHome, setSettingHome] = useState(false);
  const watchRef = useRef(null);
  const intervalRef = useRef(null);
  const latestCoords = useRef(null);

  // Fetch whether home is already set
  useEffect(() => {
    if (!token) return;
    fetch(`${API}/home-location`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.home_lat) setHomeSet(true); })
      .catch(() => {});
  }, [token]);

  const sendLocation = async (lat, lng) => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ lat, lng }),
      });
      const data = await res.json();
      setDistance(data.distance);
      setLastPing(new Date().toLocaleTimeString());
      if (data.status === 'inside')  setStatus('inside');
      if (data.status === 'outside') setStatus('outside');
      if (data.status === 'no_home') setStatus('no_home');
      if (data.triggered?.length)    setTriggered(data.triggered);
    } catch (e) {
      console.error(e);
    }
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation not supported on this device.');
      return;
    }
    setGpsError(null);
    setStatus('tracking');

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, accuracy: acc } = pos.coords;
        setAccuracy(Math.round(acc));
        setCoords({ lat, lng });
        latestCoords.current = { lat, lng };
        setHomeSet(prev => prev); // keep
      },
      (err) => { setGpsError(err.message); setStatus('error'); },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    // Send to server every 5 seconds
    intervalRef.current = setInterval(() => {
      if (latestCoords.current) {
        sendLocation(latestCoords.current.lat, latestCoords.current.lng);
      }
    }, 5000);
  };

  const stopTracking = () => {
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    if (intervalRef.current)       clearInterval(intervalRef.current);
    watchRef.current  = null;
    intervalRef.current = null;
    setStatus('idle');
  };

  const handleSetHome = async () => {
    if (!latestCoords.current) { setGpsError('GPS not ready yet.'); return; }
    setSettingHome(true);
    try {
      await fetch(`${API}/home-location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ lat: latestCoords.current.lat, lng: latestCoords.current.lng }),
      });
      setHomeSet(true);
      setGpsError(null);
    } catch { setGpsError('Failed to save home location.'); }
    setSettingHome(false);
  };

  useEffect(() => () => stopTracking(), []);

  const isTracking = status === 'tracking' || status === 'inside' || status === 'outside';
  const isInside   = status === 'inside';

  const statusColors = {
    idle:     { bg: '#111827', text: '#9ca3af', label: 'Not tracking' },
    tracking: { bg: '#1e3a5f', text: '#60a5fa', label: 'Acquiring location…' },
    inside:   { bg: '#052e16', text: '#4ade80', label: '● Inside Range — Devices ON' },
    outside:  { bg: '#2d1b00', text: '#fbbf24', label: '○ Outside Range' },
    no_home:  { bg: '#1c1917', text: '#a8a29e', label: 'Set your home location first' },
    error:    { bg: '#2d1515', text: '#f87171', label: 'GPS Error' },
  };

  const sc = statusColors[status] || statusColors.idle;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0a0a12, #0d0520)',
      fontFamily: "'Space Grotesk', -apple-system, sans-serif",
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 20px',
      boxSizing: 'border-box',
    }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <img
            src="/syncra-logo.png"
            alt="Syncra"
            style={{ width: '36px', height: '36px', objectFit: 'contain', borderRadius: '8px' }}
          />
          <span style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.5px', color: '#fff' }}>syncra.</span>
        </div>
        <p style={{ fontSize: '12px', color: 'rgba(139,92,246,0.6)', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'monospace' }}>
          Mobile Tracker
        </p>
      </div>

      {/* Status card */}
      <div style={{
        padding: '20px',
        borderRadius: '20px',
        background: sc.bg,
        border: `1px solid ${sc.text}44`,
        marginBottom: '20px',
        transition: 'all 0.4s ease',
      }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: sc.text, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Status
        </p>
        <p style={{ fontSize: '20px', fontWeight: 800, color: sc.text }}>{sc.label}</p>
        {distance !== null && (
          <p style={{ fontSize: '36px', fontWeight: 900, fontFamily: 'monospace', color: isInside ? '#4ade80' : '#fbbf24', marginTop: '8px' }}>
            {distance.toFixed(2)} <span style={{ fontSize: '16px', fontWeight: 400 }}>km</span>
          </p>
        )}
        {lastPing && (
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '6px', fontFamily: 'monospace' }}>
            Last ping: {lastPing}
          </p>
        )}
      </div>

      {/* GPS Coords */}
      {coords && (
        <div style={{
          padding: '14px 18px',
          borderRadius: '14px',
          background: 'rgba(102,252,241,0.05)',
          border: '1px solid rgba(102,252,241,0.15)',
          marginBottom: '16px',
        }}>
          <p style={{ fontSize: '10px', color: '#66fcf1', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'monospace', marginBottom: '6px' }}>
            Your GPS
          </p>
          <p style={{ fontSize: '13px', fontFamily: 'monospace', color: '#e2e8f0' }}>
            {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
          </p>
          {accuracy && (
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
              Accuracy ±{accuracy}m
            </p>
          )}
        </div>
      )}

      {/* Error */}
      {gpsError && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '12px',
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.25)',
          color: '#fca5a5',
          fontSize: '13px',
          marginBottom: '16px',
        }}>
          ⚠ {gpsError}
        </div>
      )}

      {/* Last triggered */}
      {triggered.length > 0 && (
        <div style={{
          padding: '14px 18px',
          borderRadius: '14px',
          background: 'rgba(16,185,129,0.07)',
          border: '1px solid rgba(16,185,129,0.25)',
          marginBottom: '16px',
        }}>
          <p style={{ fontSize: '10px', color: '#10b981', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'monospace', marginBottom: '8px' }}>
            Devices Triggered
          </p>
          {triggered.map((name, i) => (
            <p key={i} style={{ fontSize: '14px', color: '#d1fae5', marginBottom: '2px' }}>
              ✓ {name}
            </p>
          ))}
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'auto', paddingTop: '20px' }}>
        {/* Set Home */}
        <button
          onClick={handleSetHome}
          disabled={settingHome || !coords}
          style={{
            padding: '16px',
            borderRadius: '14px',
            background: coords ? 'rgba(102,252,241,0.12)' : 'rgba(255,255,255,0.04)',
            color: coords ? '#66fcf1' : '#4b5563',
            border: coords ? '1px solid rgba(102,252,241,0.35)' : '1px solid rgba(255,255,255,0.06)',
            fontSize: '15px',
            fontWeight: 700,
            cursor: coords ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit',
            transition: 'all 0.2s',
          }}
        >
          {settingHome ? 'Saving…' : homeSet ? '↺ Update Home Location' : '📍 Set Current Location as Home'}
        </button>

        {/* Start / Stop */}
        {!isTracking ? (
          <button
            onClick={startTracking}
            style={{
              padding: '18px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
              color: '#fff',
              border: 'none',
              fontSize: '16px',
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: '0 0 30px rgba(139,92,246,0.4)',
            }}
          >
            🛰 Start Tracking
          </button>
        ) : (
          <button
            onClick={stopTracking}
            style={{
              padding: '18px',
              borderRadius: '14px',
              background: 'rgba(239,68,68,0.12)',
              color: '#f87171',
              border: '1px solid rgba(239,68,68,0.3)',
              fontSize: '16px',
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            ⏹ Stop Tracking
          </button>
        )}
      </div>

      <p style={{ textAlign: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.2)', marginTop: '24px' }}>
        Keep this page open for live tracking · pings every 5s
      </p>
    </div>
  );
}
