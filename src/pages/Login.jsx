import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore(state => state.login);
  const signUp = useAuthStore(state => state.signUp);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setError(null);
    setIsLoading(true);

    let result;
    if (isSignUp) {
      result = await signUp(email, password);
    } else {
      result = await login(email, password);
    }

    setIsLoading(false);

    if (result.error) {
      setError(result.error.message || 'Authentication failed.');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div style={styles.page}>
      {/* Top-left logo */}
      <div style={styles.logoWrap}>
        <div style={styles.logoIcon}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span style={styles.logoText}>syncra.</span>
      </div>

      {/* Centered content */}
      <div style={styles.center}>
        <div style={styles.card}>
          <h1 style={styles.heading}>
            {isSignUp ? 'Create your account' : 'Welcome to Syncra'}
          </h1>
          <p style={styles.subheading}>
            {isSignUp
              ? 'Start managing your smart home today'
              : 'Smart home control for everyone'}
          </p>

          <form onSubmit={handleAuth} style={styles.form}>
            {error && (
              <div style={styles.errorBox}>
                {error}
              </div>
            )}

            {/* Email */}
            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Type your email"
                required
                style={styles.input}
                onFocus={e => e.target.style.borderColor = '#111'}
                onBlur={e => e.target.style.borderColor = '#d1d5db'}
              />
            </div>

            {/* Password */}
            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={styles.input}
                onFocus={e => e.target.style.borderColor = '#111'}
                onBlur={e => e.target.style.borderColor = '#d1d5db'}
              />
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={isLoading}
              style={{
                ...styles.submitBtn,
                opacity: isLoading ? 0.6 : 1,
                cursor: isLoading ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={e => { if (!isLoading) e.target.style.background = '#333'; }}
              onMouseLeave={e => { if (!isLoading) e.target.style.background = '#111'; }}
            >
              {isLoading
                ? 'Please wait...'
                : isSignUp
                  ? 'Create account'
                  : 'Continue with email'}
            </button>
          </form>

          <div style={styles.divider}>
            <span style={styles.dividerLine} />
            <span style={styles.dividerText}>or</span>
            <span style={styles.dividerLine} />
          </div>

          <button
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
            style={styles.switchBtn}
            onMouseEnter={e => e.target.style.background = '#f3f4f6'}
            onMouseLeave={e => e.target.style.background = 'transparent'}
          >
            {isSignUp
              ? 'Already have an account? Sign in'
              : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>

      {/* Bottom hint */}
      <p style={styles.footerHint}>
        Admin access: use an email containing "admin"
      </p>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#ffffff',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  logoWrap: {
    position: 'absolute',
    top: '24px',
    left: '28px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  logoImg: {
    width: '34px',
    height: '34px',
    objectFit: 'contain',
    borderRadius: '8px',
  },
  logoText: {
    fontSize: '17px',
    fontWeight: '700',
    color: '#111',
    letterSpacing: '-0.5px',
  },
  center: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 24px 40px',
  },
  card: {
    width: '100%',
    maxWidth: '380px',
  },
  heading: {
    fontSize: '26px',
    fontWeight: '700',
    color: '#111',
    textAlign: 'center',
    margin: '0 0 8px 0',
    letterSpacing: '-0.5px',
    lineHeight: 1.2,
  },
  subheading: {
    fontSize: '14px',
    color: '#6b7280',
    textAlign: 'center',
    margin: '0 0 28px 0',
    lineHeight: 1.5,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#374151',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1.5px solid #d1d5db',
    borderRadius: '8px',
    outline: 'none',
    color: '#111',
    background: '#fff',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s ease',
  },
  submitBtn: {
    width: '100%',
    padding: '11px 16px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#fff',
    background: '#111',
    border: 'none',
    borderRadius: '8px',
    marginTop: '4px',
    transition: 'background 0.15s ease',
  },
  errorBox: {
    padding: '10px 14px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#dc2626',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    margin: '20px 0 4px',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    background: '#e5e7eb',
  },
  dividerText: {
    fontSize: '12px',
    color: '#9ca3af',
  },
  switchBtn: {
    width: '100%',
    padding: '10px 16px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#374151',
    background: 'transparent',
    border: '1.5px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background 0.15s ease',
  },
  footerHint: {
    textAlign: 'center',
    fontSize: '11px',
    color: '#9ca3af',
    padding: '0 0 20px',
  },
};
