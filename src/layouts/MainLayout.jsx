import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, LayoutGrid, Shield, BarChart3, Bell, LogOut, User, ChevronRight, Mic } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import VoiceAssistant from '../components/VoiceAssistant';

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [voiceOpen, setVoiceOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Home, adminOnly: false },
    { name: 'Devices', path: '/devices', icon: LayoutGrid, adminOnly: false },
    { name: 'Analytics', path: '/analytics', icon: BarChart3, adminOnly: false },
    { name: 'Alerts', path: '/alerts', icon: Bell, adminOnly: false },
    { name: 'Profile', path: '/profile', icon: User, adminOnly: false },
    { name: 'Admin Panel', path: '/admin', icon: Shield, adminOnly: true },
  ];

  const visibleItems = navItems.filter(item => !item.adminOnly || user?.role === 'admin');

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-deep)' }}>
      {/* Sidebar */}
      <aside className="w-64 flex flex-col z-20 flex-shrink-0" style={{
        background: 'rgba(10, 8, 20, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(139,92,246,0.1)',
      }}>
        {/* Logo */}
        <div className="p-6 flex items-center gap-3">
          <img
            src="/syncra-logo.png"
            alt="Syncra"
            style={{ width: '36px', height: '36px', objectFit: 'contain', borderRadius: '8px' }}
          />
          <div>
            <h1 className="font-heading font-black text-lg tracking-tight leading-none text-white">
              Syn<span className="text-violet-400">cra</span>
            </h1>
            <p className="text-[10px] font-mono tracking-widest uppercase mt-0.5" style={{ color: 'rgba(139,92,246,0.5)' }}>Smart Home</p>
          </div>
        </div>

        {/* User badge */}
        <div className="px-4 pb-4 mb-2">
          <div className="p-3 rounded-2xl" style={{
            background: 'rgba(139,92,246,0.07)',
            border: '1px solid rgba(139,92,246,0.15)',
          }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{
                background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(236,72,153,0.2))',
                border: '1px solid rgba(139,92,246,0.3)',
              }}>
                <User size={15} className="text-violet-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate leading-tight">{user?.email?.split('@')[0] || 'User'}</p>
                <p className="text-xs font-mono uppercase tracking-wider" style={{ color: user?.role === 'admin' ? '#f59e0b' : '#10b981' }}>
                  {user?.role === 'admin' ? '⚡ Admin' : '● Active'}
                </p>
              </div>
            </div>
            {user?.subscription && (
              <div className="mt-2 text-center">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full" style={{
                  background: 'rgba(139,92,246,0.15)',
                  color: '#a78bfa',
                  border: '1px solid rgba(139,92,246,0.2)',
                }}>
                  {user.subscription} plan
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Nav label */}
        <div className="px-6 mb-2">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: 'rgba(139,92,246,0.4)' }}>Navigation</p>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.name}
                to={item.path}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative"
                style={isActive ? {
                  background: 'rgba(139,92,246,0.12)',
                  color: '#a78bfa',
                  border: '1px solid rgba(139,92,246,0.25)',
                  boxShadow: '0 0 15px rgba(139,92,246,0.08)',
                } : {
                  color: '#8892b0',
                  border: '1px solid transparent',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(139,92,246,0.05)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-violet-400" />
                )}
                <Icon size={18} className={isActive ? 'text-violet-400' : 'text-current'} />
                <span className="font-medium text-sm flex-1">{item.name}</span>
                {isActive && <ChevronRight size={14} className="text-violet-400/50" />}
              </Link>
            );
          })}
        </nav>

        {/* Divider + Logout */}
        <div className="p-3 mt-2" style={{ borderTop: '1px solid rgba(139,92,246,0.08)' }}>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium transition-all duration-200"
            style={{ color: '#8892b0', border: '1px solid transparent' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8892b0'; e.currentTarget.style.borderColor = 'transparent'; }}
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 relative overflow-y-auto overflow-x-hidden">
        {/* Ambient background glows */}
        <div className="fixed top-[-15%] right-[-5%] w-[40vw] h-[40vw] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)', zIndex: 0 }} />
        <div className="fixed bottom-[-15%] left-[10%] w-[35vw] h-[35vw] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.04) 0%, transparent 70%)', zIndex: 0 }} />

        <div className="p-8 relative max-w-7xl mx-auto" style={{ zIndex: 1 }}>
          <Outlet />
        </div>
      </main>

      {/* Floating Voice Assistant button */}
      <button
        onClick={() => setVoiceOpen(true)}
        className="fixed bottom-7 right-7 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-full font-bold text-sm transition-all duration-300"
        style={{
          background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
          color: '#fff',
          border: 'none',
          boxShadow: '0 0 30px rgba(139,92,246,0.5), 0 4px 20px rgba(99,102,241,0.4)',
          cursor: 'pointer',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <Mic size={18} />
        <span>Syncra Voice</span>
      </button>

      {/* Voice Assistant Overlay */}
      {voiceOpen && <VoiceAssistant onClose={() => setVoiceOpen(false)} />}
    </div>
  );
}
