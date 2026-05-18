import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null, 
  isAuthenticated: false,
  loading: true,

  initAuth: () => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      try {
        set({ user: JSON.parse(userInfo), isAuthenticated: true, loading: false });
      } catch {
        set({ user: null, isAuthenticated: false, loading: false });
      }
    } else {
      set({ user: null, isAuthenticated: false, loading: false });
    }
  },

  login: async (email, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      let data;
      try { data = await res.json(); }
      catch { return { data: null, error: { message: 'Cannot connect to server. Please whitelist your IP in MongoDB Atlas (Network Access).' } }; }
      if (!res.ok) throw new Error(data.message || 'Login failed');
      
      localStorage.setItem('userInfo', JSON.stringify(data));
      set({ user: data, isAuthenticated: true });
      return { data: { user: data }, error: null };
    } catch (error) {
      return { data: null, error: { message: error.message } };
    }
  },

  signUp: async (email, password) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: 'user', subscription: 'free' })
      });
      let data;
      try { data = await res.json(); }
      catch { return { data: null, error: { message: 'Cannot connect to server. Please whitelist your IP in MongoDB Atlas (Network Access).' } }; }
      if (!res.ok) throw new Error(data.message || 'Signup failed');

      localStorage.setItem('userInfo', JSON.stringify(data));
      set({ user: data, isAuthenticated: true });
      return { data: { user: data }, error: null };
    } catch (error) {
      return { data: null, error: { message: error.message } };
    }
  },

  logout: () => {
    localStorage.removeItem('userInfo');
    set({ user: null, isAuthenticated: false });
  },
}));
