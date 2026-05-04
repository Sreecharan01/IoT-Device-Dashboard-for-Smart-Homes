import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as random from 'maath/random/dist/maath-random.esm';
import gsap from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin';
import { Activity, Lock, Mail } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

gsap.registerPlugin(TextPlugin);

function ParticleBackground() {
  const ref = useRef();
  const sphere = random.inSphere(new Float32Array(5000), { radius: 1.5 });

  useFrame((state, delta) => {
    ref.current.rotation.x -= delta / 10;
    ref.current.rotation.y -= delta / 15;
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
        <PointMaterial transparent color="#66fcf1" size={0.005} sizeAttenuation={true} depthWrite={false} />
      </Points>
    </group>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore(state => state.login);
  const [email, setEmail] = useState('admin@nexushome.io');
  const [password, setPassword] = useState('password');

  const logoRef = useRef(null);
  const taglineRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline();
    gsap.set(logoRef.current, { opacity: 0, y: -20 });
    gsap.set(cardRef.current, { opacity: 0, y: 100 });
    
    tl.to(logoRef.current, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' })
      .to(taglineRef.current, { 
        text: 'Intelligent Control. Infinite Possibilities.',
        duration: 1.5,
        ease: 'none'
      }, '-=0.4')
      .to(cardRef.current, { 
        opacity: 1, 
        y: 0, 
        duration: 1.2, 
        ease: 'elastic.out(1, 0.5)' 
      }, '-=0.5');
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    const btn = e.currentTarget;
    
    gsap.to(btn, {
      scale: 0.95,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      onComplete: async () => {
        await login(email, password);
        navigate('/dashboard');
      }
    });
  };

  return (
    <div className="relative w-screen h-screen bg-[#050505] overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 z-0 opacity-60">
        <Canvas camera={{ position: [0, 0, 1] }}>
          <ParticleBackground />
        </Canvas>
      </div>

      <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] rounded-full bg-[#66fcf1]/10 blur-[100px] pointer-events-none z-0"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[40vw] h-[40vw] rounded-full bg-[#aa3bff]/10 blur-[100px] pointer-events-none z-0"></div>

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="text-center mb-10">
          <div ref={logoRef} className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#66fcf1]/20 to-[#aa3bff]/20 border border-[#66fcf1]/50 flex items-center justify-center shadow-[0_0_20px_rgba(102,252,241,0.2)]">
              <Activity className="text-[#66fcf1]" size={28} />
            </div>
            <h1 className="text-4xl font-heading font-bold text-white tracking-tight">
              Nexus<span className="text-[#8892b0]">Home</span>
            </h1>
          </div>
          <p ref={taglineRef} className="text-[#66fcf1] font-mono h-6 text-sm"></p>
        </div>

        <div ref={cardRef} className="glass-panel p-8 rounded-2xl">
          <form className="space-y-6">
            <div className="space-y-2 relative">
              <label className="text-sm font-medium text-[#8892b0]">Email Address</label>
              <div className="relative group glow-border rounded-lg transition-all duration-300">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={18} className="text-[#8892b0] group-focus-within:text-[#66fcf1] transition-colors" />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/40 border border-[#66fcf1]/20 rounded-lg py-3 pl-11 pr-4 text-white focus:outline-none focus:border-[#66fcf1]/50 transition-colors"
                  placeholder="admin@nexushome.io"
                />
              </div>
            </div>

            <div className="space-y-2 relative">
              <label className="text-sm font-medium text-[#8892b0]">Password</label>
              <div className="relative group glow-border rounded-lg transition-all duration-300">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={18} className="text-[#8892b0] group-focus-within:text-[#66fcf1] transition-colors" />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/40 border border-[#66fcf1]/20 rounded-lg py-3 pl-11 pr-4 text-white focus:outline-none focus:border-[#66fcf1]/50 transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              onClick={handleLogin}
              type="submit"
              className="w-full mt-8 bg-gradient-to-r from-[#66fcf1] to-[#45a29e] hover:from-[#aa3bff] hover:to-[#8a2be2] text-black font-bold py-3 px-4 rounded-lg transition-all duration-500 shadow-[0_0_20px_rgba(102,252,241,0.4)] hover:shadow-[0_0_25px_rgba(170,59,255,0.6)]"
            >
              Access System
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
