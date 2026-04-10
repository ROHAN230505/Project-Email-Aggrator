import { motion } from 'framer-motion';
import { Paperclip, Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Mail } from '../../types';
import clsx from 'clsx';

interface Props {
  mail: Mail;
  selected?: boolean;
  onClick: () => void;
}

function getSenderInitial(from: string): string {
  // "Name <email>" or just "email"
  const match = from.match(/^"?([^"<]+)"?\s*</);
  return match ? match[1].trim()[0].toUpperCase() : from[0].toUpperCase();
}

function getSenderName(from: string): string {
  const match = from.match(/^"?([^"<]+)"?\s*</);
  if (match) return match[1].trim();
  return from.split('@')[0];
}

const avatarColors = [
  'from-purple-500 to-blue-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-red-600',
  'from-pink-500 to-rose-600',
];

function getColor(from: string) {
  let hash = 0;
  for (let i = 0; i < from.length; i++) hash = from.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export default function EmailCard({ mail, selected, onClick }: Props) {
  const initial = getSenderInitial(mail.from);
  const name = getSenderName(mail.from);
  const color = getColor(mail.from);

  let timeAgo = '';
  try {
    timeAgo = formatDistanceToNow(new Date(mail.date), { addSuffix: true });
  } catch {
    timeAgo = '';
  }

  return (
    <motion.div
      whileHover={{ x: 2 }}
      onClick={onClick}
      className={clsx(
        'flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-all duration-200 border-b border-white/5',
        selected ? 'bg-accent-purple/10 border-l-2 border-l-accent-purple' : 'hover:bg-white/4',
        mail.is_unread && !selected && 'bg-white/[0.02]'
      )}
    >
      {/* Unread dot */}
      <div className="flex-shrink-0 mt-1.5 w-2">
        {mail.is_unread && (
          <div className="w-2 h-2 rounded-full bg-accent-purple shadow-glow" />
        )}
      </div>

      {/* Avatar */}
      <div className={clsx('w-9 h-9 rounded-full bg-gradient-to-br flex-shrink-0 flex items-center justify-center text-sm font-bold text-white', color)}>
        {initial}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className={clsx('text-sm truncate', mail.is_unread ? 'font-semibold text-white' : 'text-slate-300')}>
            {name}
          </span>
          <span className="text-xs text-slate-500 flex-shrink-0">{timeAgo}</span>
        </div>
        <div className={clsx('text-xs truncate mb-0.5', mail.is_unread ? 'font-medium text-slate-200' : 'text-slate-400')}>
          {mail.subject}
        </div>
        <div className="text-xs text-slate-500 truncate">{mail.snippet}</div>
      </div>

      {/* Icons */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {mail.is_starred && <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />}
        {mail.has_attachments && <Paperclip className="w-3.5 h-3.5 text-slate-500" />}
      </div>
    </motion.div>
  );
}
