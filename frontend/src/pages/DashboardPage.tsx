import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Inbox, Mail, Star, Send, Trash2, FileText, AlertCircle,
  RefreshCw, ArrowLeft, TrendingUp,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { getStats } from '../api/mails';
import Layout from '../components/layout/Layout';
import type { MailStats, LabelStat } from '../types';
import clsx from 'clsx';

// Map Gmail label IDs to nice UI props
const LABEL_META: Record<string, { icon: React.ElementType; color: string; gradient: string; query: string }> = {
  INBOX:   { icon: Inbox,       color: 'text-accent-purple', gradient: 'from-purple-600 to-violet-500', query: 'in:inbox' },
  UNREAD:  { icon: Mail,        color: 'text-blue-400',      gradient: 'from-blue-600 to-blue-400',    query: 'is:unread' },
  STARRED: { icon: Star,        color: 'text-yellow-400',    gradient: 'from-yellow-500 to-amber-400', query: 'is:starred' },
  SENT:    { icon: Send,        color: 'text-emerald-400',   gradient: 'from-emerald-600 to-teal-400', query: 'in:sent' },
  DRAFT:   { icon: FileText,    color: 'text-slate-400',     gradient: 'from-slate-600 to-slate-500',  query: 'in:drafts' },
  SPAM:    { icon: AlertCircle, color: 'text-orange-400',    gradient: 'from-orange-600 to-amber-500', query: 'in:spam' },
  TRASH:   { icon: Trash2,      color: 'text-red-400',       gradient: 'from-red-600 to-rose-500',     query: 'in:trash' },
};

const DISPLAY_ORDER = ['INBOX', 'UNREAD', 'STARRED', 'SENT', 'DRAFT', 'SPAM', 'TRASH'];

interface StatCardProps {
  labelId: string;
  stat: LabelStat;
  delay: number;
  onClick: () => void;
}

function StatCard({ labelId, stat, delay, onClick }: StatCardProps) {
  const meta = LABEL_META[labelId];
  if (!meta) return null;
  const Icon = meta.icon;
  const hasUnread = stat.messages_unread > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      onClick={onClick}
      className="glass rounded-2xl p-5 cursor-pointer hover:bg-white/7 transition-all duration-200 group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={clsx('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg', meta.gradient)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {hasUnread && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent-purple/20 text-accent-purple">
            {stat.messages_unread} unread
          </span>
        )}
      </div>
      <div className="text-2xl font-bold mb-1">
        {stat.messages_total.toLocaleString()}
      </div>
      <div className="text-sm text-slate-400">{stat.name}</div>
      <div className="text-xs text-slate-600 mt-1">
        {stat.threads_total.toLocaleString()} threads
      </div>
    </motion.div>
  );
}

// Custom tooltip for the bar chart
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload?.length) {
    return (
      <div className="glass rounded-xl px-3 py-2 text-xs">
        <p className="font-semibold text-white mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.fill }} className="font-medium">
            {p.name}: {p.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export default function DashboardPage() {
  const navigate = useNavigate();

  const { data, isLoading, error, refetch, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ['mail-stats'],
    queryFn: getStats,
    refetchOnWindowFocus: false,
    staleTime: 60_000, // consider fresh for 1 minute
  });

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString()
    : null;

  // Build chart data from stats
  const chartData = DISPLAY_ORDER
    .filter(id => data?.[id])
    .map(id => ({
      name: data![id].name,
      Total: data![id].messages_total,
      Unread: data![id].messages_unread,
    }));

  return (
    <Layout>
      <div className="px-6 py-6 max-w-5xl mx-auto">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/inbox')}
              className="p-2 rounded-lg hover:bg-white/5 transition"
            >
              <ArrowLeft className="w-4 h-4 text-slate-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-accent-purple" />
                Mailbox Stats
              </h1>
              {lastUpdated && (
                <p className="text-xs text-slate-500 mt-0.5">
                  Last updated: {lastUpdated}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm transition',
              isFetching && 'opacity-70 cursor-not-allowed'
            )}
          >
            <RefreshCw className={clsx('w-4 h-4', isFetching && 'animate-spin')} />
            Refresh
          </button>
        </div>

        {/* Loading skeletons */}
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="glass rounded-2xl p-5 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-white/10 mb-4" />
                <div className="h-7 bg-white/10 rounded w-1/2 mb-2" />
                <div className="h-3 bg-white/5 rounded w-2/3" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="glass rounded-2xl p-8 text-center mb-8">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <p className="text-red-400 text-sm mb-2">Failed to load stats</p>
            <p className="text-slate-500 text-xs mb-4">{(error as Error).message}</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-accent-purple/20 text-accent-purple rounded-lg text-sm hover:bg-accent-purple/30 transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Stat cards */}
        {data && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
              {DISPLAY_ORDER.filter(id => data[id]).map((id, i) => (
                <StatCard
                  key={id}
                  labelId={id}
                  stat={data[id]}
                  delay={i * 0.07}
                  onClick={() => {
                    const q = LABEL_META[id]?.query;
                    if (q) navigate(`/inbox?q=${encodeURIComponent(q)}`);
                  }}
                />
              ))}
            </div>

            {/* Bar chart */}
            {chartData.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass rounded-2xl p-6"
              >
                <h2 className="text-sm font-semibold text-slate-300 mb-5">
                  Messages by folder
                </h2>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={chartData} barCategoryGap="30%">
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={48}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                    <Bar dataKey="Total" radius={[4, 4, 0, 0]} fill="#7c3aed" />
                    <Bar dataKey="Unread" radius={[4, 4, 0, 0]} fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex items-center gap-5 mt-4 justify-center">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <div className="w-3 h-3 rounded bg-accent-purple" />
                    Total messages
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <div className="w-3 h-3 rounded bg-accent-blue" />
                    Unread messages
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
