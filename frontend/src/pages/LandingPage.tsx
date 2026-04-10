import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { startGoogleLogin } from '../api/auth';
import { Mail, Zap, Shield, Search } from 'lucide-react';

const features = [
  { icon: Mail, title: 'Unified Inbox', desc: 'All your Gmail messages in one beautiful view.' },
  { icon: Zap, title: 'AI Powered', desc: 'Smart summaries and reply suggestions.' },
  { icon: Search, title: 'Powerful Search', desc: 'Find any email instantly across your inbox.' },
  { icon: Shield, title: 'Secure', desc: 'OAuth2 — your password never touches our servers.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
      {/* Gradient orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-700/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-blue-700/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-cyan-700/15 rounded-full blur-3xl" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-2">
          <Mail className="text-accent-purple w-6 h-6" />
          <span className="font-bold text-lg">MailFlow</span>
        </div>
        <button
          onClick={startGoogleLogin}
          className="px-5 py-2 rounded-xl bg-accent-purple/90 hover:bg-accent-purple transition text-sm font-semibold shadow-glow"
        >
          Sign In
        </button>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center text-center px-4 pt-20 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <span className="inline-block px-4 py-1 mb-6 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-accent-cyan tracking-widest uppercase">
            Gmail Integration
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
            Your inbox,{' '}
            <span className="text-gradient">reimagined</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            Sign in with your Google account and read all your Gmail messages in a stunning,
            AI-powered dashboard — zero setup required.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={startGoogleLogin}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-accent-purple via-accent-blue to-accent-cyan text-white font-bold text-lg shadow-glow hover:shadow-glow-blue transition-all duration-300"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </motion.button>
        </motion.div>

        {/* Floating email card preview */}
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="mt-20 glass rounded-2xl p-5 max-w-md w-full text-left shadow-glow"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-sm font-bold">G</div>
            <div>
              <div className="text-sm font-semibold">Google</div>
              <div className="text-xs text-slate-400">security@accounts.google.com</div>
            </div>
            <div className="ml-auto text-xs text-slate-500">2 min ago</div>
          </div>
          <div className="text-sm font-medium mb-1">Security alert: New sign-in</div>
          <div className="text-xs text-slate-400 line-clamp-2">We noticed a new sign-in to your Google Account. If this was you, you don't need to do anything...</div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-8 pb-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className="glass rounded-2xl p-6 glass-hover transition-all duration-300 group"
          >
            <div className="w-10 h-10 rounded-xl bg-accent-purple/20 flex items-center justify-center mb-4 group-hover:bg-accent-purple/30 transition">
              <f.icon className="w-5 h-5 text-accent-purple" />
            </div>
            <h3 className="font-semibold mb-2">{f.title}</h3>
            <p className="text-sm text-slate-400">{f.desc}</p>
          </motion.div>
        ))}
      </section>
    </div>
  );
}
