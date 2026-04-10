/**
 * /auth/callback — Google redirects here after OAuth.
 * Extracts the token from URL, stores it, then redirects to inbox.
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getMe } from '../api/auth';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const error = params.get('error');

    if (error || !token) {
      navigate('/login?error=' + (error ?? 'unknown'));
      return;
    }

    localStorage.setItem('access_token', token);

    getMe()
      .then((user) => {
        setUser(user);
        navigate('/inbox');
      })
      .catch(() => {
        localStorage.removeItem('access_token');
        navigate('/login?error=fetch_user_failed');
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full border-4 border-accent-purple border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-slate-400">Signing you in…</p>
      </div>
    </div>
  );
}
