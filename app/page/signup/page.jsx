"use client";
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import './signup.css';
import Navbar from '../navbar/page';

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

function AuthPageInner() {
  const searchParams = useSearchParams();
  const [isLogin, setIsLogin] = useState(false);
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [showSignupPw, setShowSignupPw] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  useEffect(() => {
    if (searchParams.get('tab') === 'login') {
      setIsLogin(true);
    }
  }, [searchParams]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    console.log(isLogin ? 'Login attempt' : 'Signup attempt', data);
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    console.log('Password reset for:', forgotEmail);
    setForgotSent(true);
  };

  const handleGoogle = () => alert('Google Sign-In → redirecting...');

  if (showForgotPassword) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-tabs">
            <button className="tab active" type="button">Reset Password</button>
          </div>
          <div className="auth-content">
            {forgotSent ? (
              <div className="forgot-success">
                <div className="success-icon">✉️</div>
                <h2>Check your email</h2>
                <p>We sent a reset link to <strong>{forgotEmail}</strong></p>
                <button
                  type="button"
                  className="btn primary"
                  style={{ marginTop: '16px' }}
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotSent(false);
                    setForgotEmail('');
                  }}
                >
                  Back to Log In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="auth-form">
                <h2>Forgot Password</h2>
                <p className="forgot-subtitle">Enter your email and we&apos;ll send you a reset link.</p>
                <div className="form-group">
                  <label htmlFor="forgot-email">Email</label>
                  <input
                    id="forgot-email"
                    type="email"
                    placeholder="name@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn primary">Send Reset Link</button>
                <p className="toggle-text" style={{ marginTop: '14px' }}>
                  <button type="button" className="text-link" onClick={() => setShowForgotPassword(false)}>
                    ← Back to Log In
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-tabs">
            <button
              className={`tab ${!isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(false)}
              type="button"
            >
              Sign Up
            </button>
            <button
              className={`tab ${isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(true)}
              type="button"
            >
              Log In
            </button>
          </div>

          <div className="auth-content">
            {isLogin ? (
              <form onSubmit={handleSubmit} className="auth-form">
                <h2>Log In</h2>

                <div className="form-group">
                  <label htmlFor="login-email">Email</label>
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <div className="label-row">
                    <label htmlFor="login-password">Password</label>
                    <button
                      type="button"
                      className="text-link forgot-inline"
                      onClick={() => setShowForgotPassword(true)}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="input-wrapper">
                    <input
                      id="login-password"
                      name="password"
                      type={showLoginPw ? 'text' : 'password'}
                      placeholder="••••••"
                      required
                    />
                    <button
                      type="button"
                      className="eye-btn"
                      onClick={() => setShowLoginPw((v) => !v)}
                      aria-label={showLoginPw ? 'Hide password' : 'Show password'}
                    >
                      {showLoginPw ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn primary">Log In</button>
                <div className="divider"><span>or</span></div>
                <button type="button" onClick={handleGoogle} className="btn google">
                  <GoogleIcon /> Continue with Google
                </button>
                <p className="toggle-text">
                  No account?{' '}
                  <button type="button" className="text-link" onClick={() => setIsLogin(false)}>
                    Sign up
                  </button>
                </p>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="auth-form">
                <h2>Sign Up</h2>

                <div className="form-group">
                  <label htmlFor="signup-name">Name</label>
                  <input
                    id="signup-name"
                    name="name"
                    type="text"
                    placeholder="Your name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="signup-email">Email</label>
                  <input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="signup-password">Password</label>
                  <div className="input-wrapper">
                    <input
                      id="signup-password"
                      name="password"
                      type={showSignupPw ? 'text' : 'password'}
                      placeholder="••••••"
                      required
                    />
                    <button
                      type="button"
                      className="eye-btn"
                      onClick={() => setShowSignupPw((v) => !v)}
                      aria-label={showSignupPw ? 'Hide password' : 'Show password'}
                    >
                      {showSignupPw ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn primary">Create Account</button>
                <div className="divider"><span>or</span></div>
                <button type="button" onClick={handleGoogle} className="btn google">
                  <GoogleIcon /> Continue with Google
                </button>
                <p className="toggle-text">
                  Already have an account?{' '}
                  <button type="button" className="text-link" onClick={() => setIsLogin(true)}>
                    Log in
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthPageInner />
    </Suspense>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.51h5.84c-.25 1.31-.98 2.42-2.07 3.16v2.63h3.35c1.96-1.81 3.09-4.47 3.09-7.25z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.99 7.28-2.73l-3.35-2.63c-1.01.68-2.29 1.08-3.93 1.08-3.02 0-5.58-2.04-6.49-4.79H.96v2.67C2.75 20.19 6.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.51 14.21c-.23-.68-.36-1.41-.36-2.21s.13-1.53.36-2.21V7.34H.96C.35 8.85 0 10.39 0 12s.35 3.15.96 4.66l4.55-2.45z"/>
      <path fill="#EA4335" d="M12 4.98c1.64 0 3.11.56 4.27 1.66l3.19-3.19C17.46 1.01 14.97 0 12 0 6.7 0 2.75 2.81.96 7.34l4.55 2.45C6.42 7.02 8.98 4.98 12 4.98z"/>
    </svg>
  );
}