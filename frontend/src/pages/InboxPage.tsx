import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, RefreshCw, ChevronRight, X } from 'lucide-react';
import { listMails } from '../api/mails';
import EmailCard from '../components/email/EmailCard';
import MailDetailPanel from '../components/email/MailDetailPanel';
import Layout from '../components/layout/Layout';
import type { Mail } from '../types';
import clsx from 'clsx';

const TABS = [
  { label: 'Inbox', q: 'in:inbox' },
  { label: 'Unread', q: 'is:unread' },
  { label: 'Starred', q: 'is:starred' },
  { label: 'Sent', q: 'in:sent' },
];

export default function InboxPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [activeQuery, setActiveQuery] = useState(searchParams.get('q') ?? 'in:inbox');
  const [selectedMail, setSelectedMail] = useState<Mail | null>(null);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['mails', activeQuery],
    queryFn: () => listMails(activeQuery, 50),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) setActiveQuery(searchInput.trim());
  };

  return (
    <Layout>
      <div className="flex h-full">
        {/* Mail list panel */}
        <div className={clsx('flex flex-col border-r border-white/5 transition-all duration-300', selectedMail ? 'w-80 flex-shrink-0' : 'flex-1')}>
          {/* Header */}
          <div className="px-5 pt-5 pb-3 border-b border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold">Inbox</h1>
              <button
                onClick={() => refetch()}
                className={clsx('p-2 rounded-lg hover:bg-white/5 transition', isFetching && 'animate-spin')}
              >
                <RefreshCw className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search emails…"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder-slate-500 focus:outline-none focus:border-accent-purple/50 focus:bg-white/8 transition"
              />
            </form>

            {/* Tabs */}
            <div className="flex gap-1">
              {TABS.map(tab => (
                <button
                  key={tab.q}
                  onClick={() => { setActiveQuery(tab.q); setSelectedMail(null); }}
                  className={clsx(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition',
                    activeQuery === tab.q
                      ? 'bg-accent-purple/20 text-accent-purple'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Email list */}
          <div className="flex-1 overflow-auto">
            {isLoading && (
              <div className="flex flex-col gap-3 p-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-9 h-9 rounded-full bg-white/10 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-white/10 rounded w-1/3" />
                      <div className="h-3 bg-white/5 rounded w-2/3" />
                      <div className="h-2.5 bg-white/5 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {error && (
              <div className="p-8 text-center">
                <p className="text-red-400 text-sm mb-3">Failed to load emails</p>
                <p className="text-slate-500 text-xs mb-4">{(error as Error).message}</p>
                <button onClick={() => refetch()} className="px-4 py-2 bg-accent-purple/20 text-accent-purple rounded-lg text-sm hover:bg-accent-purple/30 transition">
                  Retry
                </button>
              </div>
            )}
            {!isLoading && !error && data?.messages.length === 0 && (
              <div className="p-8 text-center">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-slate-400 text-sm">No emails found</p>
              </div>
            )}
            {data?.messages.map(mail => (
              <EmailCard
                key={mail.id}
                mail={mail}
                selected={selectedMail?.id === mail.id}
                onClick={() => setSelectedMail(mail)}
              />
            ))}
          </div>
        </div>

        {/* Detail panel */}
        <AnimatePresence>
          {selectedMail && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex-1 overflow-auto"
            >
              <MailDetailPanel
                mail={selectedMail}
                onClose={() => setSelectedMail(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state when nothing selected and not loading */}
        {!selectedMail && !isLoading && data?.messages && data.messages.length > 0 && (
          <div className="hidden lg:flex flex-1 items-center justify-center text-slate-600">
            <div className="text-center">
              <div className="text-5xl mb-3">✉️</div>
              <p className="text-sm">Select an email to read</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
