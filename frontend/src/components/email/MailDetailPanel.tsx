import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { X, Reply, Forward, Star, Paperclip, ExternalLink, Send } from 'lucide-react';
import { format } from 'date-fns';
import DOMPurify from 'isomorphic-dompurify';
import type { Mail } from '../../types';
import { getThread, sendMail } from '../../api/mails';
import toast from 'react-hot-toast';
import clsx from 'clsx';

// Lightweight DOMPurify wrapper (safe HTML)
function safeHtml(html: string): string {
  if (typeof DOMPurify !== 'undefined') {
    return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
  }
  return html;
}

interface Props {
  mail: Mail;
  onClose: () => void;
}

export default function MailDetailPanel({ mail, onClose }: Props) {
  const [showReply, setShowReply] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [sending, setSending] = useState(false);
  const [viewMode, setViewMode] = useState<'html' | 'text'>('html');

  // Fetch full thread
  const { data: thread } = useQuery({
    queryKey: ['thread', mail.thread_id],
    queryFn: () => getThread(mail.thread_id),
    enabled: !!mail.thread_id,
  });

  const messages = thread ?? [mail];

  const handleSendReply = async () => {
    if (!replyBody.trim()) return;
    setSending(true);
    try {
      // Extract "From" email for To field
      const toMatch = mail.from.match(/<([^>]+)>/);
      const to = toMatch ? toMatch[1] : mail.from;
      await sendMail({
        to,
        subject: mail.subject.startsWith('Re:') ? mail.subject : `Re: ${mail.subject}`,
        body: replyBody,
        reply_to_message_id: mail.id,
      });
      toast.success('Reply sent!');
      setShowReply(false);
      setReplyBody('');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold truncate mb-1">{mail.subject}</h2>
          <div className="text-sm text-slate-400 truncate">
            From: <span className="text-slate-300">{mail.from}</span>
          </div>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 transition flex-shrink-0">
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Thread messages */}
      <div className="flex-1 overflow-auto px-6 py-4 space-y-6">
        {messages.map((msg, idx) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="glass rounded-2xl overflow-hidden"
          >
            {/* Message header */}
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-xs font-bold">
                  {msg.from[0].toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-medium">{msg.from}</div>
                  <div className="text-xs text-slate-500">
                    {msg.to && `To: ${msg.to}`}
                    {msg.date && (
                      <span className="ml-2">
                        {(() => { try { return format(new Date(msg.date), 'MMM d, yyyy h:mm a'); } catch { return ''; } })()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {msg.is_starred && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
            </div>

            {/* Body */}
            <div className="px-4 py-4">
              {msg.body_html ? (
                <div className="flex gap-2 mb-3">
                  <button onClick={() => setViewMode('html')} className={clsx('text-xs px-2 py-0.5 rounded', viewMode === 'html' ? 'bg-accent-purple/30 text-accent-purple' : 'text-slate-500')}>HTML</button>
                  <button onClick={() => setViewMode('text')} className={clsx('text-xs px-2 py-0.5 rounded', viewMode === 'text' ? 'bg-accent-purple/30 text-accent-purple' : 'text-slate-500')}>Plain</button>
                </div>
              ) : null}

              {viewMode === 'html' && msg.body_html ? (
                <div
                  className="prose prose-invert prose-sm max-w-none text-slate-300 [&_a]:text-accent-cyan [&_a:hover]:underline"
                  dangerouslySetInnerHTML={{ __html: safeHtml(msg.body_html) }}
                />
              ) : (
                <pre className="whitespace-pre-wrap text-sm text-slate-300 font-sans leading-relaxed">
                  {msg.body_text || msg.snippet}
                </pre>
              )}

              {/* Attachments */}
              {msg.attachments?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/5">
                  <div className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                    <Paperclip className="w-3.5 h-3.5" />
                    {msg.attachments.length} attachment{msg.attachments.length > 1 ? 's' : ''}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {msg.attachments.map((att) => (
                      <div key={att.attachment_id} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 text-xs">
                        <Paperclip className="w-3 h-3 text-slate-400" />
                        <span className="text-slate-300">{att.filename}</span>
                        <span className="text-slate-500">{att.size ? `${Math.round(att.size / 1024)}KB` : ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {/* Reply composer */}
        {showReply && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-4"
          >
            <div className="text-sm font-medium mb-3 text-slate-300">Reply</div>
            <textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder="Write your reply…"
              rows={5}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-accent-purple/50 resize-none"
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleSendReply}
                disabled={sending || !replyBody.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-purple hover:bg-accent-purple/80 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
              >
                <Send className="w-4 h-4" />
                {sending ? 'Sending…' : 'Send'}
              </button>
              <button
                onClick={() => setShowReply(false)}
                className="px-4 py-2 rounded-xl hover:bg-white/5 transition text-sm text-slate-400"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Action bar */}
      <div className="px-6 py-3 border-t border-white/5 flex gap-2">
        <button
          onClick={() => setShowReply(!showReply)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-purple/20 hover:bg-accent-purple/30 text-accent-purple transition text-sm font-medium"
        >
          <Reply className="w-4 h-4" />
          Reply
        </button>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white/5 transition text-sm text-slate-400">
          <Forward className="w-4 h-4" />
          Forward
        </button>
      </div>
    </div>
  );
}
