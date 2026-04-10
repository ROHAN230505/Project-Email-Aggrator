import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/layout/Layout';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-8">Settings</h1>

        {/* Profile */}
        <div className="glass rounded-2xl p-6 mb-6">
          <h2 className="font-semibold mb-4 text-slate-300">Profile</h2>
          <div className="flex items-center gap-4">
            {user?.picture_url ? (
              <img src={user.picture_url} className="w-16 h-16 rounded-full" alt="avatar" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-accent-purple/50 flex items-center justify-center text-xl font-bold">
                {user?.email[0].toUpperCase()}
              </div>
            )}
            <div>
              <div className="font-medium">{user?.full_name}</div>
              <div className="text-sm text-slate-400">{user?.email}</div>
            </div>
          </div>
        </div>

        {/* Account */}
        <div className="glass rounded-2xl p-6 mb-6">
          <h2 className="font-semibold mb-4 text-slate-300">Gmail Account</h2>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-slate-300">Connected account</div>
              <div className="text-xs text-slate-500">{user?.email}</div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">Active</span>
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={signOut}
          className="w-full py-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium transition"
        >
          Sign Out
        </button>
      </div>
    </Layout>
  );
}
