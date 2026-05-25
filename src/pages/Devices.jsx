import { useState, useRef } from 'react';
import { useDeviceStore } from '../store/deviceStore';
import { Search, Plus, X, Lightbulb, Lock, Camera, Thermometer, Power, Volume2, Trash2, Tv, Speaker, Wind, Droplet, Plug, Eye, Refrigerator } from 'lucide-react';
import gsap from 'gsap';
import { Flip } from 'gsap/Flip';

gsap.registerPlugin(Flip);

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function Devices() {
  const { devices, addDevice, removeDevice, toggleDevice, updateDeviceState } = useDeviceStore();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [scanState, setScanState] = useState('idle');
  const [newDevice, setNewDevice] = useState({ name: '', type: 'light', location: 'Living Room', connection: 'wifi', status: 'online' });
  const gridRef = useRef(null);

  const [scannedDevices, setScannedDevices] = useState([]);
  const [scanError, setScanError] = useState('');

  const handleStartScan = async () => {
    setScanState('scanning');
    setScanError('');
    setScannedDevices([]);
    
    const found = [];
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    const token = userInfo?.token;

    // 1) Real mDNS/WiFi scan via backend (runs in parallel with BT)
    const networkScanPromise = fetch(`${API_URL}/scan/devices`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(r => r.json())
    .then(data => {
      if (Array.isArray(data)) found.push(...data);
    })
    .catch(() => {}); // Silently fail if no network devices found

    // 2) Real Web Bluetooth scan (browser-native)
    const btScanPromise = (async () => {
      if (!navigator.bluetooth) return;
      try {
        const device = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: ['battery_service', 'device_information']
        });
        // User selected a real Bluetooth device
        let type = 'audio';
        const n = (device.name || '').toLowerCase();
        if (/lock/i.test(n)) type = 'lock';
        else if (/light|bulb|hue/i.test(n)) type = 'light';
        else if (/thermostat|temp|hvac/i.test(n)) type = 'thermostat';
        else if (/camera/i.test(n)) type = 'camera';
        else if (/tv|display/i.test(n)) type = 'tv';

        found.push({ id: device.id, name: device.name || 'Unnamed BT Device', type, protocol: 'bluetooth' });
      } catch {
        // User cancelled Bluetooth picker — that's fine
      }
    })();

    // Wait for both
    await Promise.all([networkScanPromise, btScanPromise]);
    
    if (found.length === 0) {
      setScanError('No devices found on this network. Make sure your smart devices are powered on and connected to the same WiFi. You can also try adding a device manually.');
    }
    setScannedDevices(found);
    setScanState('results');
  };

  const filteredDevices = devices
    .filter(d => {
      if (filter !== 'all' && d.type !== filter && d.status !== filter) return false;
      if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      // Online devices first
      if (a.status === 'online' && b.status !== 'online') return -1;
      if (a.status !== 'online' && b.status === 'online') return 1;
      return 0;
    });

  const handleFilter = (newFilter) => {
    const state = Flip.getState('.device-card');
    setFilter(newFilter);
    setTimeout(() => {
      Flip.from(state, { duration: 0.5, ease: 'power3.out', absolute: true, stagger: 0.05 });
    }, 0);
  };

  const handleAddDevice = async (e) => {
    e.preventDefault();
    const initialState = newDevice.type === 'light' ? { isOn: false, brightness: 100 } :
                         newDevice.type === 'tv' || newDevice.type === 'audio' ? { isOn: false, brightness: 50 } :
                         newDevice.type === 'lock' ? { isLocked: true } :
                         newDevice.type === 'thermostat' || newDevice.type === 'ac' ? { isOn: false, temp: 24, mode: 'cool' } :
                         newDevice.type === 'fridge' ? { isOn: true, temp: 4 } :
                         { isOn: false };
    
    await addDevice({ ...newDevice, id: `dev-${Date.now()}`, state: initialState }); 
    setIsAdding(false);
    setNewDevice({ name: '', type: 'light', location: 'Living Room', connection: 'wifi', status: 'online' });
  };

  const getDeviceIcon = (type) => {
    switch (type) {
      case 'light': return Lightbulb;
      case 'lock': return Lock;
      case 'camera': return Camera;
      case 'thermostat':
      case 'ac': return Thermometer;
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

  return (
    <div className="space-y-8 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-heading font-bold text-white mb-2">Device Registry</h1>
          <p className="text-[#8892b0]">Manage your entire fleet of connected devices.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-[#66fcf1] text-black px-6 py-2 rounded-lg font-bold hover:bg-white transition-colors flex items-center gap-2"
        >
          <Plus size={20} /> Add Device
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-black/20 p-4 rounded-xl border border-white/5">
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          {['all', 'light', 'thermostat', 'lock', 'ac', 'tv', 'audio', 'camera', 'fridge', 'vacuum', 'sprinkler', 'plug', 'sensor', 'online', 'offline'].map(f => (
            <button 
              key={f}
              onClick={() => handleFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-bold capitalize whitespace-nowrap transition-all ${
                filter === f ? 'bg-[#aa3bff] text-white shadow-[0_0_15px_rgba(170,59,255,0.4)]' : 'bg-white/5 text-[#8892b0] hover:bg-white/10'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        
        <div className="relative w-full md:w-64 group glow-border rounded-lg">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-[#8892b0] group-focus-within:text-[#66fcf1]" />
          </div>
          <input 
            type="text" 
            placeholder="Search devices..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black/40 border border-[#66fcf1]/20 rounded-lg py-2 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-[#66fcf1]/50"
          />
        </div>
      </div>

      <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredDevices.map(device => {
          const id = device._id || device.id;
          const Icon = getDeviceIcon(device.type);
          const isOn = device.state?.isOn || !device.state?.isLocked; // For lock, false is open
          
          return (
            <div key={id} className="device-card glass-panel p-6 rounded-2xl border border-white/5 flex flex-col h-full hover:border-[#66fcf1]/30 transition-colors relative group">
              <div className="flex justify-between items-start mb-6">
                <div className={`p-4 rounded-2xl bg-black/40 flex items-center justify-center transition-colors ${isOn ? 'text-[#66fcf1] shadow-[0_0_20px_rgba(102,252,241,0.2)] border border-[#66fcf1]/50' : 'text-[#8892b0] border border-white/5'}`}>
                  <Icon size={32} />
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${device.status === 'online' ? 'bg-[#10b981]/20 text-[#10b981]' : 'bg-[#ef4444]/20 text-[#ef4444]'}`}>
                    {device.status}
                  </div>
                  {(device.type === 'light' || device.type === 'ac' || device.type === 'thermostat' || device.type === 'lock') && (
                    <button 
                      onClick={() => toggleDevice(id)}
                      disabled={device.status === 'offline'}
                      className={`p-2 rounded-full transition-colors disabled:opacity-50 ${isOn ? 'bg-[#aa3bff] text-white shadow-[0_0_10px_rgba(170,59,255,0.6)]' : 'bg-white/10 text-white hover:bg-white/20'}`}
                    >
                      {device.type === 'lock' ? (isOn ? <Lock size={16}/> : <Lock size={16}/> /* wait isOn for lock is unlocked */) : <Power size={16} />}
                    </button>
                  )}
                </div>
              </div>

              <div className="mb-6 flex-1">
                <h3 className="font-bold text-white text-lg truncate mb-1">{device.name}</h3>
                <p className="text-sm text-[#8892b0]">{device.location}</p>
              </div>

              <button
                onClick={() => {
                  if (window.confirm(`Remove "${device.name}" from your devices?`)) {
                    removeDevice(id);
                  }
                }}
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/30 hover:text-red-300"
                title="Remove device"
              >
                <Trash2 size={14} />
              </button>

              {/* Dynamic Controls based on Type */}
              <div className="mt-auto space-y-4 pt-4 border-t border-white/5">
                {device.type === 'light' && (
                  <div className="space-y-4 w-full">
                    {/* Brightness */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-[#8892b0]">
                        <span>Brightness</span>
                        <span>{device.state?.brightness || 0}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="100" 
                        value={device.state?.brightness || 0}
                        onChange={(e) => updateDeviceState(id, { brightness: parseInt(e.target.value) })}
                        disabled={!device.state?.isOn || device.status === 'offline'}
                        className="w-full cursor-pointer disabled:opacity-50"
                        style={{ accentColor: device.state?.color || '#66fcf1' }}
                      />
                    </div>
                    {/* Color */}
                    <div className="space-y-2">
                      <span className="text-xs text-[#8892b0] block">Color</span>
                      <div className="flex gap-2">
                        {[
                          '#66fcf1',
                          '#aa3bff',
                          '#f59e0b',
                          '#ef4444',
                          '#ffffff'
                        ].map(c => (
                          <button
                            key={c}
                            disabled={!device.state?.isOn || device.status === 'offline'}
                            onClick={() => updateDeviceState(id, { color: c })}
                            className={`w-5 h-5 rounded-full border transition-all ${device.state?.color === c ? 'border-white scale-110 shadow-md' : 'border-transparent'}`}
                            style={{ 
                              backgroundColor: c,
                              boxShadow: device.state?.color === c ? `0 0 6px ${c}` : 'none'
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {(device.type === 'tv' || device.type === 'audio') && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-[#8892b0]">
                      <span>Volume</span>
                      <span>{device.state?.brightness || 0}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="100" 
                      value={device.state?.brightness || 0}
                      onChange={(e) => updateDeviceState(id, { brightness: parseInt(e.target.value) })}
                      disabled={!device.state?.isOn || device.status === 'offline'}
                      className="w-full accent-[#66fcf1] cursor-pointer disabled:opacity-50"
                    />
                  </div>
                )}
                
                {(device.type === 'ac' || device.type === 'thermostat') && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-[#8892b0]">
                      <span>Temperature</span>
                      <span>{device.state?.temp || 24}°C</span>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => updateDeviceState(id, { temp: (device.state?.temp || 24) - 1 })}
                        disabled={!device.state?.isOn || device.status === 'offline'}
                        className="flex-1 bg-black/40 border border-white/10 text-white rounded-lg py-1 hover:border-[#66fcf1]/50 disabled:opacity-50"
                      >-</button>
                      <button 
                        onClick={() => updateDeviceState(id, { temp: (device.state?.temp || 24) + 1 })}
                        disabled={!device.state?.isOn || device.status === 'offline'}
                        className="flex-1 bg-black/40 border border-white/10 text-white rounded-lg py-1 hover:border-[#aa3bff]/50 disabled:opacity-50"
                      >+</button>
                    </div>
                  </div>
                )}

                {device.type === 'lock' && (
                  <div className="text-center text-sm font-medium py-2 rounded-lg bg-black/40 border border-white/5">
                    {device.state?.isLocked ? <span className="text-[#10b981]">Secure</span> : <span className="text-red-500 animate-pulse">Unlocked</span>}
                  </div>
                )}

                <div className="flex gap-2 justify-between items-center text-xs text-[#8892b0] pt-2">
                  <span className="capitalize">{device.type}</span>
                  <span className="capitalize">{device.connection}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass-panel p-8 rounded-2xl w-full max-w-md border border-[#66fcf1]/30 relative overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6 relative z-10">
              <h2 className="text-2xl font-bold text-white">Add New Device</h2>
              <button 
                onClick={() => { setIsAdding(false); setScanState('idle'); }} 
                className="text-[#8892b0] hover:text-white"
              ><X size={24} /></button>
            </div>

            {scanState === 'idle' && (
              <div className="space-y-4 text-center py-6 relative z-10">
                <div className="w-20 h-20 mx-auto bg-[#aa3bff]/20 rounded-full flex items-center justify-center border border-[#aa3bff]/50 mb-4">
                  <Search size={32} className="text-[#aa3bff]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Discover Nearby Devices</h3>
                <p className="text-[#8892b0] text-sm mb-6">We will scan for available devices via WiFi, Bluetooth LE, and Zigbee.</p>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleStartScan}
                    className="w-full bg-gradient-to-r from-[#66fcf1] to-[#45a29e] hover:from-[#aa3bff] hover:to-[#8a2be2] text-black hover:text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-[0_0_15px_rgba(102,252,241,0.4)]"
                  >
                    Start Scanning
                  </button>
                  <button 
                    onClick={() => setScanState('manual')}
                    className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                  >
                    Add Manually
                  </button>
                </div>
              </div>
            )}

            {scanState === 'scanning' && (
              <div className="space-y-4 text-center py-10 relative z-10">
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 border-4 border-[#66fcf1]/20 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-[#66fcf1] rounded-full border-t-transparent animate-spin"></div>
                  <Search size={32} className="text-[#66fcf1] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 animate-pulse">Scanning network...</h3>
                <p className="text-[#8892b0] text-sm">Searching for WiFi, Bluetooth, and Zigbee devices nearby.</p>
              </div>
            )}

            {scanState === 'results' && (
              <div className="space-y-4 relative z-10">
                {scanError ? (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-sm text-yellow-300">
                    <p className="font-bold mb-1">No Devices Found</p>
                    <p className="text-yellow-400/70">{scanError}</p>
                  </div>
                ) : (
                  <div className="text-[#10b981] text-sm font-bold mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></div>
                    Found {scannedDevices.length} device{scannedDevices.length !== 1 ? 's' : ''} nearby
                  </div>
                )}
                <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                  {scannedDevices.map(dev => {
                    const DevIcon = getDeviceIcon(dev.type);
                    return (
                      <div 
                        key={dev.id}
                        onClick={() => {
                          setNewDevice({ ...newDevice, name: dev.name, type: dev.type, connection: dev.protocol, status: 'online' });
                          setScanState('manual');
                        }}
                        className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#66fcf1]/50 hover:bg-[#66fcf1]/10 cursor-pointer transition-all group"
                      >
                        <div className="p-2 rounded-lg bg-black/40 text-[#8892b0] group-hover:text-[#66fcf1]">
                          <DevIcon size={24} />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-bold">{dev.name}</h4>
                          <div className="flex gap-2 mt-1">
                            <span className="text-[10px] uppercase tracking-wider text-[#8892b0] bg-black/40 px-2 py-0.5 rounded">{dev.type}</span>
                            <span className="text-[10px] uppercase tracking-wider text-[#aa3bff] bg-[#aa3bff]/10 px-2 py-0.5 rounded">{dev.protocol}</span>
                          </div>
                        </div>
                        <button className="text-[#66fcf1] opacity-0 group-hover:opacity-100 transition-opacity font-bold text-sm bg-black/40 px-3 py-1 rounded">
                          Connect
                        </button>
                      </div>
                    );
                  })}
                </div>
                <button 
                  onClick={() => setScanState('manual')}
                  className="w-full mt-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                >
                  Enter Details Manually
                </button>
              </div>
            )}

            {scanState === 'manual' && (
              <form onSubmit={handleAddDevice} className="space-y-4 relative z-10">
                <div>
                  <label className="block text-sm text-[#8892b0] mb-1">Device Name</label>
                  <input required type="text" value={newDevice.name} onChange={e => setNewDevice({...newDevice, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-[#66fcf1]/50 focus:outline-none" placeholder="e.g. Living Room Main Light" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#8892b0] mb-1">Type</label>
                    <select value={newDevice.type} onChange={e => setNewDevice({...newDevice, type: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-[#66fcf1]/50 focus:outline-none appearance-none">
                      <option value="light">Smart Light</option>
                      <option value="thermostat">Thermostat</option>
                      <option value="ac">Air Conditioner</option>
                      <option value="lock">Smart Lock</option>
                      <option value="camera">Camera</option>
                      <option value="tv">Smart TV</option>
                      <option value="audio">Audio / Speaker</option>
                      <option value="fridge">Smart Fridge</option>
                      <option value="vacuum">Robotic Vacuum</option>
                      <option value="sprinkler">Smart Sprinkler</option>
                      <option value="plug">Smart Plug</option>
                      <option value="sensor">Motion Sensor</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-[#8892b0] mb-1">Location</label>
                    <input required type="text" value={newDevice.location} onChange={e => setNewDevice({...newDevice, location: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-[#66fcf1]/50 focus:outline-none" placeholder="Living Room" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-[#8892b0] mb-1">Connection Protocol</label>
                  <select value={newDevice.connection} onChange={e => setNewDevice({...newDevice, connection: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-[#66fcf1]/50 focus:outline-none appearance-none">
                    <option value="wifi">WiFi 2.4GHz</option>
                    <option value="zigbee">Zigbee</option>
                    <option value="zwave">Z-Wave</option>
                    <option value="bluetooth">Bluetooth LE</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setScanState('idle')} className="w-1/3 bg-white/5 hover:bg-white/10 text-white font-bold py-3 px-4 rounded-lg transition-colors border border-white/10">
                    Back
                  </button>
                  <button type="submit" className="w-2/3 bg-gradient-to-r from-[#66fcf1] to-[#45a29e] hover:from-[#aa3bff] hover:to-[#8a2be2] text-black hover:text-white font-bold py-3 px-4 rounded-lg transition-all duration-300">
                    Connect Device
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
