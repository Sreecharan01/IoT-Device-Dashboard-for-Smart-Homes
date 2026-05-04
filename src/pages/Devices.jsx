import { useState, useRef, useEffect } from 'react';
import { useDeviceStore } from '../store/deviceStore';
import { Search, Plus, Filter } from 'lucide-react';
import gsap from 'gsap';
import { Flip } from 'gsap/Flip';

gsap.registerPlugin(Flip);

export default function Devices() {
  const { devices } = useDeviceStore();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const gridRef = useRef(null);

  const filteredDevices = devices.filter(d => {
    if (filter !== 'all' && d.type !== filter && d.status !== filter) return false;
    if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleFilter = (newFilter) => {
    // Get current state
    const state = Flip.getState('.device-card');
    
    setFilter(newFilter);
    
    // After state update, animate changes
    setTimeout(() => {
      Flip.from(state, {
        duration: 0.5,
        ease: 'power3.out',
        absolute: true,
        stagger: 0.05
      });
    }, 0);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-heading font-bold text-white mb-2">Device Registry</h1>
          <p className="text-[#8892b0]">Manage your entire fleet of connected devices.</p>
        </div>
        <button className="bg-[#66fcf1] text-black px-6 py-2 rounded-lg font-bold hover:bg-white transition-colors flex items-center gap-2">
          <Plus size={20} /> Add Device
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-black/20 p-4 rounded-xl border border-white/5">
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          {['all', 'light', 'thermostat', 'lock', 'ac', 'online', 'offline'].map(f => (
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

      <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredDevices.map(device => (
          <div key={device.id} className="device-card glass-panel p-5 rounded-xl border border-white/5">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-white truncate">{device.name}</h3>
              <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${device.status === 'online' ? 'bg-[#10b981]' : 'bg-[#ef4444]'}`}></div>
            </div>
            <p className="text-xs text-[#8892b0] mb-4">ID: {device.id} • {device.location}</p>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-white/5 rounded text-xs text-[#8892b0] capitalize">{device.type}</span>
              <span className="px-2 py-1 bg-white/5 rounded text-xs text-[#8892b0] capitalize">{device.connection}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
