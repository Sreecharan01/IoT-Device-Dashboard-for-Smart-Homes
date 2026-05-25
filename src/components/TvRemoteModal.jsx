import { useState, useEffect, useRef } from 'react';
import { X, Power, Volume2, VolumeX, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Home, ArrowLeft, Menu, PlaySquare, Film, Tv, Info } from 'lucide-react';
import { useDeviceStore } from '../store/deviceStore';

const MOCK_CHANNELS = {
  1: "Local Broadcast",
  2: "BBC News",
  3: "NBC Universal",
  4: "ESPN Sports",
  5: "Disney Channel",
  7: "HBO Movies",
  9: "Discovery Channel",
  11: "Netflix Hub",
  12: "YouTube Video",
  13: "Prime Video",
  14: "Disney+",
  15: "CNN World",
  20: "Cartoon Network"
};

export default function TvRemoteModal({ device, onClose }) {
  const updateDeviceState = useDeviceStore(state => state.updateDeviceState);
  
  const id = device._id || device.id;
  const isOn = device.state?.isOn ?? false;
  const volume = device.state?.brightness || 35; // brightness acts as volume
  const channel = device.state?.channel || 2;

  const [inputChannel, setInputChannel] = useState('');
  const [activeInputSource, setActiveInputSource] = useState('HDMI 1');
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(volume);
  const [lastRemoteAction, setLastRemoteAction] = useState('Standby');

  const commitTimeoutRef = useRef(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (commitTimeoutRef.current) clearTimeout(commitTimeoutRef.current);
    };
  }, []);

  const triggerActionMessage = (msg) => {
    setLastRemoteAction(msg);
    // Reset message after 2 seconds
    setTimeout(() => {
      setLastRemoteAction('');
    }, 2000);
  };

  // Toggle TV Power
  const togglePower = () => {
    updateDeviceState(id, { isOn: !isOn });
    triggerActionMessage(!isOn ? 'TV turned ON' : 'TV turned OFF');
  };

  // Toggle Mute
  const toggleMute = () => {
    if (isMuted) {
      updateDeviceState(id, { brightness: prevVolume });
      setIsMuted(false);
      triggerActionMessage(`Volume restored: ${prevVolume}%`);
    } else {
      setPrevVolume(volume);
      updateDeviceState(id, { brightness: 0 });
      setIsMuted(true);
      triggerActionMessage('Audio Muted');
    }
  };

  // Volume Rockers
  const adjustVolume = (amount) => {
    if (!isOn) return;
    if (isMuted) setIsMuted(false);
    const nextVolume = Math.max(0, Math.min(100, volume + amount));
    updateDeviceState(id, { brightness: nextVolume });
    triggerActionMessage(`Volume: ${nextVolume}%`);
  };

  // Channel Rockers
  const adjustChannel = (amount) => {
    if (!isOn) return;
    const nextChannel = Math.max(1, Math.min(99, channel + amount));
    updateDeviceState(id, { channel: nextChannel });
    triggerActionMessage(`Channel: ${nextChannel}`);
  };

  // Commit direct channel entry
  const commitChannel = (chNum) => {
    const ch = parseInt(chNum);
    if (!isNaN(ch) && ch >= 1 && ch <= 99) {
      updateDeviceState(id, { channel: ch });
      triggerActionMessage(`Switched to Channel ${ch}`);
    }
    setInputChannel('');
  };

  // Number Button Clicks
  const handleNumberClick = (num) => {
    if (!isOn) return;
    const nextInput = (inputChannel + num).slice(0, 2); // Max 2 digits
    setInputChannel(nextInput);
    
    // Auto commit after 1.5 seconds of no typing
    if (commitTimeoutRef.current) clearTimeout(commitTimeoutRef.current);
    commitTimeoutRef.current = setTimeout(() => {
      commitChannel(nextInput);
    }, 1500);
  };

  // Immediate Enter channel click
  const handleEnterClick = () => {
    if (!isOn) return;
    if (commitTimeoutRef.current) clearTimeout(commitTimeoutRef.current);
    if (inputChannel) {
      commitChannel(inputChannel);
    }
  };

  // App Shortcut Clicks
  const launchApp = (appName, chNumber) => {
    if (!isOn) return;
    updateDeviceState(id, { channel: chNumber });
    triggerActionMessage(`Launching ${appName}...`);
  };

  // Retrieve channel label
  const channelLabel = MOCK_CHANNELS[channel] || "Custom Channel";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      
      {/* Outer Remote Wrapper */}
      <div className="relative bg-gradient-to-b from-[#181528] to-[#0c0a14] p-6 rounded-[3rem] w-full max-w-[340px] border-2 border-white/10 shadow-[0_15px_50px_rgba(0,0,0,0.8),inset_0_2px_10px_rgba(255,255,255,0.05)] flex flex-col items-center">
        
        {/* Sleek Remote Top Deco */}
        <div className="w-16 h-1 rounded-full bg-white/20 mb-4" />

        {/* Modal Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-6 p-1.5 rounded-full bg-white/5 hover:bg-white/15 text-[#8892b0] hover:text-white transition-colors"
          title="Exit Remote"
        >
          <X size={16} />
        </button>

        {/* Remote Head: Status Screen */}
        <div className="w-full bg-[#0a0812] border border-white/5 rounded-2xl p-4 mb-6 shadow-inner flex flex-col items-center justify-center min-h-[90px] relative overflow-hidden">
          {/* Futuristic Scanlines */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%)] bg-[length:100%_4px] pointer-events-none opacity-40" />
          
          {!isOn ? (
            <span className="text-red-500 font-mono font-bold tracking-widest text-xs uppercase animate-pulse">
              [ STANDBY ]
            </span>
          ) : (
            <div className="w-full text-center space-y-1 relative z-10">
              <div className="flex justify-between items-center text-[9px] font-mono text-[#66fcf1] font-semibold tracking-wider">
                <span>{activeInputSource}</span>
                <span>VOL: {isMuted ? 'MUTED' : `${volume}%`}</span>
              </div>
              <div className="text-white font-mono font-bold text-sm tracking-wide truncate">
                {inputChannel ? (
                  <span className="text-[#aa3bff] animate-pulse">CH {inputChannel}_</span>
                ) : (
                  `CH ${channel}: ${channelLabel}`
                )}
              </div>
              {lastRemoteAction && (
                <div className="text-[9px] font-mono text-white/55 animate-fade-in uppercase">
                  {lastRemoteAction}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section 1: Power & Source & Mute */}
        <div className="w-full flex justify-between items-center px-2 mb-6">
          {/* Source Select */}
          <select 
            disabled={!isOn}
            value={activeInputSource}
            onChange={(e) => {
              setActiveInputSource(e.target.value);
              triggerActionMessage(`Input: ${e.target.value}`);
            }}
            className="bg-white/5 border border-white/10 hover:border-white/20 rounded-xl px-2.5 py-1.5 text-[10px] font-bold text-[#8892b0] focus:outline-none disabled:opacity-40"
          >
            <option value="HDMI 1" className="bg-[#100d1f]">HDMI 1</option>
            <option value="HDMI 2" className="bg-[#100d1f]">HDMI 2</option>
            <option value="TV / ANT" className="bg-[#100d1f]">TV / ANT</option>
            <option value="AV Source" className="bg-[#100d1f]">AV Input</option>
          </select>

          {/* Power Button */}
          <button 
            onClick={togglePower}
            className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all active:scale-95 cursor-pointer ${
              isOn 
                ? 'bg-red-500/20 border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
                : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
            }`}
          >
            <Power size={20} />
          </button>

          {/* Mute Button */}
          <button 
            onClick={toggleMute}
            disabled={!isOn}
            className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors active:scale-95 cursor-pointer ${
              isMuted 
                ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500' 
                : 'bg-white/5 border-white/10 hover:border-white/20 text-[#8892b0] hover:text-white disabled:opacity-40'
            }`}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>

        {/* Section 2: Volume & Channel Rockers */}
        <div className="w-full grid grid-cols-2 gap-4 px-2 mb-6">
          {/* Volume Rocker Container */}
          <div className="bg-black/30 border border-white/5 rounded-2xl py-2 px-3 flex flex-col items-center justify-between min-h-[95px]">
            <button 
              onClick={() => adjustVolume(5)}
              disabled={!isOn}
              className="p-1 rounded-lg text-[#8892b0] hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30 cursor-pointer"
            >
              <ChevronUp size={18} />
            </button>
            <span className="text-[9px] font-mono font-bold text-white/45 tracking-wider uppercase">VOL</span>
            <button 
              onClick={() => adjustVolume(-5)}
              disabled={!isOn}
              className="p-1 rounded-lg text-[#8892b0] hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30 cursor-pointer"
            >
              <ChevronDown size={18} />
            </button>
          </div>

          {/* Channel Rocker Container */}
          <div className="bg-black/30 border border-white/5 rounded-2xl py-2 px-3 flex flex-col items-center justify-between min-h-[95px]">
            <button 
              onClick={() => adjustChannel(1)}
              disabled={!isOn}
              className="p-1 rounded-lg text-[#8892b0] hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30 cursor-pointer"
            >
              <ChevronUp size={18} />
            </button>
            <span className="text-[9px] font-mono font-bold text-white/45 tracking-wider uppercase">CH</span>
            <button 
              onClick={() => adjustChannel(-1)}
              disabled={!isOn}
              className="p-1 rounded-lg text-[#8892b0] hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30 cursor-pointer"
            >
              <ChevronDown size={18} />
            </button>
          </div>
        </div>

        {/* Section 3: Navigation D-Pad */}
        <div className="relative w-40 h-40 rounded-full bg-black/40 border border-white/10 p-2 flex items-center justify-center mb-6 shadow-inner">
          {/* Navigation Keys */}
          <button 
            onClick={() => isOn && triggerActionMessage('Nav Up')}
            disabled={!isOn}
            className="absolute top-2 w-10 h-10 flex items-center justify-center text-[#8892b0] hover:text-white disabled:opacity-30 cursor-pointer"
            title="Up"
          >
            <ChevronUp size={22} />
          </button>
          <button 
            onClick={() => isOn && triggerActionMessage('Nav Down')}
            disabled={!isOn}
            className="absolute bottom-2 w-10 h-10 flex items-center justify-center text-[#8892b0] hover:text-white disabled:opacity-30 cursor-pointer"
            title="Down"
          >
            <ChevronDown size={22} />
          </button>
          <button 
            onClick={() => isOn && triggerActionMessage('Nav Left')}
            disabled={!isOn}
            className="absolute left-2 w-10 h-10 flex items-center justify-center text-[#8892b0] hover:text-white disabled:opacity-30 cursor-pointer"
            title="Left"
          >
            <ChevronLeft size={22} />
          </button>
          <button 
            onClick={() => isOn && triggerActionMessage('Nav Right')}
            disabled={!isOn}
            className="absolute right-2 w-10 h-10 flex items-center justify-center text-[#8892b0] hover:text-white disabled:opacity-30 cursor-pointer"
            title="Right"
          >
            <ChevronRight size={22} />
          </button>
          
          {/* Center OK Button */}
          <button 
            onClick={() => isOn && triggerActionMessage('Select OK')}
            disabled={!isOn}
            className="w-16 h-16 rounded-full bg-gradient-to-b from-[#aa3bff]/30 to-[#8a2be2]/30 hover:from-[#aa3bff]/50 hover:to-[#8a2be2]/50 border border-[#aa3bff]/40 hover:border-[#aa3bff]/60 text-white font-mono font-bold text-xs flex items-center justify-center active:scale-95 transition-all shadow-md disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            OK
          </button>
        </div>

        {/* Section 4: Keypad Grid */}
        <div className="grid grid-cols-3 gap-2 px-2 w-full mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleNumberClick(num)}
              disabled={!isOn}
              className="py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-white font-mono font-bold text-sm flex items-center justify-center active:scale-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              {num}
            </button>
          ))}
          <button 
            onClick={() => setInputChannel('')}
            disabled={!isOn}
            className="py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-[#8892b0] font-mono text-xs flex items-center justify-center active:scale-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            Clear
          </button>
          <button 
            onClick={() => handleNumberClick(0)}
            disabled={!isOn}
            className="py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-white font-mono font-bold text-sm flex items-center justify-center active:scale-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            0
          </button>
          <button 
            onClick={handleEnterClick}
            disabled={!isOn || !inputChannel}
            className="py-2.5 rounded-xl bg-[#66fcf1]/10 hover:bg-[#66fcf1]/20 border border-[#66fcf1]/20 hover:border-[#66fcf1]/40 text-[#66fcf1] font-mono font-bold text-xs flex items-center justify-center active:scale-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            Enter
          </button>
        </div>

        {/* Section 5: App Shortcuts */}
        <div className="w-full border-t border-white/10 pt-4 flex flex-col gap-2">
          <div className="text-[9px] font-mono text-white/35 text-center uppercase tracking-wider mb-1">Quick Apps</div>
          <div className="grid grid-cols-2 gap-2 w-full">
            <button 
              onClick={() => launchApp('Netflix', 11)}
              disabled={!isOn}
              className="py-2 bg-red-600/20 hover:bg-red-600/35 border border-red-600/40 text-red-500 rounded-xl text-[10px] font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-35"
            >
              <Film size={10} /> Netflix
            </button>
            <button 
              onClick={() => launchApp('YouTube', 12)}
              disabled={!isOn}
              className="py-2 bg-red-500/10 hover:bg-red-500/25 border border-red-500/30 text-white rounded-xl text-[10px] font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-35"
            >
              <PlaySquare size={10} className="text-red-500" /> YouTube
            </button>
            <button 
              onClick={() => launchApp('Prime Video', 13)}
              disabled={!isOn}
              className="py-2 bg-blue-500/10 hover:bg-blue-500/25 border border-blue-500/30 text-blue-400 rounded-xl text-[10px] font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-35"
            >
              <Tv size={10} /> Prime
            </button>
            <button 
              onClick={() => launchApp('Disney+', 14)}
              disabled={!isOn}
              className="py-2 bg-sky-600/10 hover:bg-sky-600/25 border border-sky-600/30 text-sky-300 rounded-xl text-[10px] font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-35"
            >
              <Info size={10} /> Disney+
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
