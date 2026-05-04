import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const useAuthStore = create((set) => ({
  user: null, // { email, role: 'admin' | 'user', id }
  isAuthenticated: false,
  loading: true,

  // Initialize Auth state from Supabase
  initAuth: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      // Mocking role assignment for now based on email since we don't have a users table yet
      const role = session.user.email.includes('admin') ? 'admin' : 'user';
      set({ user: { email: session.user.email, id: session.user.id, role }, isAuthenticated: true, loading: false });
    } else {
      set({ user: null, isAuthenticated: false, loading: false });
    }

    // Listen for Auth changes
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const role = session.user.email.includes('admin') ? 'admin' : 'user';
        set({ user: { email: session.user.email, id: session.user.id, role }, isAuthenticated: true });
      } else {
        set({ user: null, isAuthenticated: false });
      }
    });
  },

  login: async (email, password) => {
    // For demo purposes when Supabase isn't configured, fallback to local state mock
    if (supabase.supabaseUrl === 'https://placeholder-project.supabase.co') {
      const role = email.includes('admin') ? 'admin' : 'user';
      set({ user: { email, role, id: 'mock-id' }, isAuthenticated: true });
      return { data: { user: { email, role } }, error: null };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  },

  signUp: async (email, password) => {
    if (supabase.supabaseUrl === 'https://placeholder-project.supabase.co') {
      alert("Please configure Supabase first to use real signups.");
      return;
    }
    const { data, error } = await supabase.auth.signUp({ email, password });
    return { data, error };
  },

  logout: async () => {
    if (supabase.supabaseUrl !== 'https://placeholder-project.supabase.co') {
      await supabase.auth.signOut();
    }
    set({ user: null, isAuthenticated: false });
  },
}));
