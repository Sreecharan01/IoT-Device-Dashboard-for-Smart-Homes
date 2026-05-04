import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, List, Shield, Activity, Bell, LogOut, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Home, adminOnly: false },
    { name: 'Devices', path: '/devices', icon: List, adminOnly: false },
    { name: 'Analytics', path: '/analytics', icon: Activity, adminOnly: false },
    { name: 'Alerts', path: '/alerts', icon: Bell, adminOnly: false },
    { name: 'Admin', path: '/admin', icon: Shield, adminOnly: true },
  ];

  return (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 glass-panel border-r border-[#66fcf1]/10 flex flex-col z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#66fcf1]/20 border border-[#66fcf1]/50 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-[#66fcf1] animate-pulse"></div>
          </div>
          <h1 className="font-heading font-bold text-xl tracking-tight text-glow">Nexus<span className="text-[#8892b0]">Home</span></h1>
        </div>
        
        <div className="px-6 pb-4 mb-2 border-b border-white/5">
          <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
            <div className="bg-[#aa3bff]/20 p-2 rounded-full border border-[#aa3bff]/30">
               <User size={16} className="text-[#aa3bff]" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{user?.email || 'Unknown User'}</p>
              <p className="text-xs text-[#10b981] font-mono uppercase tracking-wider">{user?.role || 'user'}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-2">
          {navItems.filter(item => !item.adminOnly || user?.role === 'admin').map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                  isActive 
                    ? 'bg-[#66fcf1]/10 text-[#66fcf1] border border-[#66fcf1]/30 shadow-[0_0_15px_rgba(102,252,241,0.15)]' 
                    : 'text-[#8892b0] hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={20} className={isActive ? 'drop-shadow-[0_0_8px_rgba(102,252,241,0.8)]' : ''} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#66fcf1]/10">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-[#8892b0] hover:bg-red-500/10 hover:text-red-400 transition-colors">
            <LogOut size={20} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-y-auto overflow-x-hidden">
        {/* Background ambient glow */}
        <div className="fixed top-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#66fcf1]/5 blur-[120px] pointer-events-none"></div>
        <div className="fixed bottom-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#aa3bff]/5 blur-[120px] pointer-events-none"></div>
        
        <div className="p-8 relative z-10 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
