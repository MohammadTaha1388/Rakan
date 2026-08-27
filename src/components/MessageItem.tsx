import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Copy,
  Check,
  Volume2,
  VolumeX,
  User,
  Sparkles,
  Cpu,
  Clock,
  AlertTriangle,
  Pencil,
  X,
  Send,
  ThumbsUp,
  Heart,
  Share2
} from 'lucide-react';
import { ChatMessage } from '../types';

interface MessageItemProps {
  message: ChatMessage;
  theme?: 'dark' | 'light';
  onEditAndResend?: (messageId: string, newContent: string) => void;
  onReact?: (messageId: string, type: 'thumbsUp' | 'heart') => void;
  onShowToast?: (text: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  theme = 'dark',
  onEditAndResend,
  onReact,
  onShowToast
}) => {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);

  const isUser = message.role === 'user';
  const isDark = theme === 'dark';

  // Stop speech when component unmounts
  useEffect(() => {
    return () => {
      if (isSpeaking && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSpeaking]);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    if (onShowToast) {
      onShowToast('متن پیام در کلیپ‌بورد کپی شد ✨');
    }
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'نکته مشاور تحصیلی راکان',
          text: message.content
        });
        setShared(true);
        if (onShowToast) onShowToast('پیام با موفقیت به اشتراک گذاشته شد 🚀');
        setTimeout(() => setShared(false), 2000);
        return;
      } catch (err) {
        // Fallback to clipboard if share was canceled or failed
        if ((err as Error).name !== 'AbortError') {
          console.warn('Share API error, fallback to clipboard', err);
        }
      }
    }

    navigator.clipboard.writeText(message.content);
    setShared(true);
    if (onShowToast) {
      onShowToast('متن پیام کپی شد و آماده اشتراک‌گذاری است 📋');
    }
    setTimeout(() => setShared(false), 2000);
  };

  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert('مرورگر شما از قابلیت خواندن صوتی (Speech Synthesis) پشتیبانی نمی‌کند.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    // Strip markdown characters for natural speech
    const cleanText = message.content
      .replace(/```[\s\S]*?```/g, 'کد یا فرمول')
      .replace(/[#*`_~[\]()]/g, ' ')
      .replace(/>+/g, '')
      .replace(/-{3,}/g, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'fa-IR';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    // Pick Persian voice if available
    const voices = window.speechSynthesis.getVoices();
    const faVoice = voices.find(v => v.lang.startsWith('fa') || v.lang.includes('IR'));
    if (faVoice) {
      utterance.voice = faVoice;
    }

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const handleSaveEdit = () => {
    if (!editText.trim()) return;
    if (onEditAndResend) {
      onEditAndResend(message.id, editText.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditText(message.content);
    setIsEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className={`flex items-start gap-2.5 sm:gap-3.5 my-4 group ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
          isUser
            ? 'bg-gradient-to-tr from-indigo-600 to-violet-500 text-white'
            : message.isError
            ? 'bg-rose-900/60 text-rose-400 border border-rose-700/50'
            : 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-emerald-950/40 ring-1 ring-emerald-400/30'
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 sm:w-5 sm:h-5" />
        ) : message.isError ? (
          <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
        ) : (
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
        )}
      </div>

      {/* Bubble & Content */}
      <div
        className={`max-w-[90%] sm:max-w-[84%] rounded-3xl p-4 sm:p-5 shadow-lg transition-all ${
          isUser
            ? 'bg-indigo-600 text-white rounded-tr-none'
            : message.isError
            ? isDark
              ? 'bg-rose-950/40 border border-rose-800/60 text-slate-200 rounded-tl-none'
              : 'bg-rose-50 border border-rose-200 text-rose-900 rounded-tl-none'
            : isDark
            ? 'bg-slate-900/90 border border-slate-800/90 text-slate-100 rounded-tl-none'
            : 'bg-white border border-slate-200/90 text-slate-900 rounded-tl-none shadow-md'
        }`}
      >
        {/* Assistant Header Metadata */}
        {!isUser && (
          <div
            className={`flex items-center justify-between gap-2 border-b pb-2 mb-3 text-xs ${
              isDark ? 'border-slate-800/80' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-emerald-500 dark:text-emerald-400 flex items-center gap-1">
                <span>مشاور مدرسه راکان</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              </span>
              {message.modelUsed && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono border flex items-center gap-1 ${
                    isDark
                      ? 'bg-slate-800 text-slate-400 border-slate-700/50'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  <Cpu className="w-3 h-3 text-indigo-500" />
                  {message.modelUsed}
                </span>
              )}
            </div>

            {message.durationMs && (
              <span className="text-[11px] text-slate-400 flex items-center gap-1 shrink-0">
                <Clock className="w-3 h-3 text-slate-400" />
                {(message.durationMs / 1000).toFixed(1)} ثانیه
              </span>
            )}
          </div>
        )}

        {/* Text Content or Inline Edit Box */}
        {isEditing ? (
          <div className="space-y-3">
            <label className="block text-xs font-bold text-indigo-100">
              ویرایش سوال درسی و ارسال مجدد:
            </label>
            <textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              rows={3}
              className="w-full p-2.5 rounded-xl bg-indigo-700/80 text-white placeholder-indigo-300 text-sm border border-indigo-400/50 focus:outline-none focus:ring-2 focus:ring-white resize-none"
              autoFocus
            />
            <div className="flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-3 py-1.5 rounded-lg bg-indigo-700/60 hover:bg-indigo-700 text-indigo-100 transition-colors flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                لغو
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={!editText.trim()}
                className="px-3 py-1.5 rounded-lg bg-white text-indigo-900 font-bold hover:bg-indigo-50 transition-colors flex items-center gap-1 shadow-sm disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                ارسال مجدد
              </button>
            </div>
          </div>
        ) : isUser ? (
          <div className="text-sm sm:text-base leading-relaxed break-words whitespace-pre-wrap">
            {message.content}
          </div>
        ) : (
          <div className="text-sm sm:text-base leading-relaxed break-words space-y-2 markdown-container">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => (
                  <h2 className="text-lg sm:text-xl font-extrabold text-emerald-400 mt-3 mb-2 border-b border-emerald-500/20 pb-1">
                    {children}
                  </h2>
                ),
                h2: ({ children }) => (
                  <h3 className="text-base sm:text-lg font-bold text-teal-400 mt-2.5 mb-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-4 rounded-full bg-teal-400 inline-block shrink-0" />
                    <span>{children}</span>
                  </h3>
                ),
                h3: ({ children }) => (
                  <h4 className="text-sm sm:text-base font-bold text-amber-400 mt-2 mb-1">
                    {children}
                  </h4>
                ),
                p: ({ children }) => (
                  <p className="my-1.5 leading-relaxed text-inherit">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="my-2 space-y-1.5 list-none pr-1">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="my-2 space-y-1.5 list-decimal list-inside pr-1 marker:text-emerald-500 marker:font-bold">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="flex items-start gap-2 text-inherit">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                    <div className="flex-1 leading-relaxed">{children}</div>
                  </li>
                ),
                blockquote: ({ children }) => (
                  <blockquote
                    className={`my-3 p-3 rounded-2xl border-r-4 border-emerald-500 text-sm leading-relaxed ${
                      isDark
                        ? 'bg-emerald-950/30 text-emerald-200'
                        : 'bg-emerald-50 text-emerald-900'
                    }`}
                  >
                    {children}
                  </blockquote>
                ),
                code: ({ className, children, ...props }) => {
                  const match = /language-(\w+)/.exec(className || '');
                  const isInline = !match && !String(children).includes('\n');
                  if (isInline) {
                    return (
                      <code
                        className={`px-1.5 py-0.5 rounded-md font-mono text-xs font-semibold ${
                          isDark
                            ? 'bg-slate-800 text-amber-300 border border-slate-700/60'
                            : 'bg-slate-100 text-amber-800 border border-slate-300'
                        }`}
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  }
                  return (
                    <div className="my-3 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden text-left dir-ltr shadow-md">
                      {match && (
                        <div className="flex items-center justify-between px-3 py-1 bg-slate-900 border-b border-slate-800 text-[10px] uppercase font-mono text-slate-400">
                          <span>{match[1]}</span>
                          <span className="text-[9px] text-slate-500">نکته یا فرمول کدنویسی</span>
                        </div>
                      )}
                      <pre className="p-3 font-mono text-xs text-emerald-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                        <code>{children}</code>
                      </pre>
                    </div>
                  );
                },
                table: ({ children }) => (
                  <div className="overflow-x-auto my-3 rounded-xl border border-slate-700/50">
                    <table className="min-w-full text-xs text-right border-collapse">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className={isDark ? 'bg-slate-800/80 text-emerald-400' : 'bg-slate-100 text-emerald-700'}>
                    {children}
                  </thead>
                ),
                th: ({ children }) => (
                  <th className="p-2 border-b border-slate-700/50 font-bold">{children}</th>
                ),
                td: ({ children }) => (
                  <td className="p-2 border-b border-slate-700/30">{children}</td>
                ),
                strong: ({ children }) => (
                  <strong className={isDark ? 'font-bold text-white' : 'font-bold text-slate-950'}>
                    {children}
                  </strong>
                )
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Bubble Footer & Actions */}
        {!isEditing && (
          <div
            className={`flex items-center justify-between gap-2 pt-2.5 mt-3 border-t text-[11px] flex-wrap ${
              isUser
                ? 'border-indigo-500/40 text-indigo-200'
                : isDark
                ? 'border-slate-800/70 text-slate-400'
                : 'border-slate-200 text-slate-500'
            }`}
          >
            {/* Left status / timestamp */}
            <div className="flex items-center gap-2">
              <span>{message.persianTime || 'لحظاتی پیش'}</span>
              {isSpeaking && (
                <span className="flex items-center gap-1 text-amber-400 text-[10px] font-bold animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  در حال خواندن صوتی...
                </span>
              )}
            </div>

            {/* Right Action buttons */}
            <div className="flex items-center gap-1 flex-wrap">
              {/* Reactions for Assistant Message: Heart & ThumbsUp */}
              {!isUser && onReact && (
                <div className="flex items-center gap-0.5 ml-1 border-l pl-1 border-slate-700/30">
                  <button
                    type="button"
                    id={`react-thumbsup-${message.id}`}
                    onClick={() => onReact(message.id, 'thumbsUp')}
                    className={`p-1.5 rounded-lg transition-all flex items-center gap-1 ${
                      message.reactions?.thumbsUp
                        ? 'text-emerald-400 bg-emerald-500/20 ring-1 ring-emerald-500/40 font-bold scale-105'
                        : isDark
                        ? 'hover:bg-slate-800 text-slate-400 hover:text-emerald-400'
                        : 'hover:bg-slate-100 text-slate-500 hover:text-emerald-600'
                    }`}
                    title="پاسخ مفید و عالی بود (Thumbs Up)"
                  >
                    <ThumbsUp
                      className={`w-3.5 h-3.5 ${
                        message.reactions?.thumbsUp ? 'fill-emerald-400 text-emerald-400' : ''
                      }`}
                    />
                  </button>

                  <button
                    type="button"
                    id={`react-heart-${message.id}`}
                    onClick={() => onReact(message.id, 'heart')}
                    className={`p-1.5 rounded-lg transition-all flex items-center gap-1 ${
                      message.reactions?.heart
                        ? 'text-rose-400 bg-rose-500/20 ring-1 ring-rose-500/40 font-bold scale-105'
                        : isDark
                        ? 'hover:bg-slate-800 text-slate-400 hover:text-rose-400'
                        : 'hover:bg-slate-100 text-slate-500 hover:text-rose-600'
                    }`}
                    title="پسندیدم (Heart)"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        message.reactions?.heart ? 'fill-rose-400 text-rose-400' : ''
                      }`}
                    />
                  </button>
                </div>
              )}

              {/* User Edit Button */}
              {isUser && onEditAndResend && (
                <button
                  type="button"
                  id={`edit-user-msg-${message.id}`}
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 rounded-lg hover:bg-indigo-700/60 text-indigo-200 hover:text-white transition-colors flex items-center gap-1"
                  title="ویرایش و ارسال مجدد سوال"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span className="text-[10px] hidden sm:inline">ویرایش</span>
                </button>
              )}

              {/* Share Button with small toast trigger */}
              <button
                type="button"
                id={`share-msg-${message.id}`}
                onClick={handleShare}
                className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                  isUser
                    ? 'hover:bg-indigo-700/60 text-indigo-200 hover:text-white'
                    : isDark
                    ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                    : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
                }`}
                title="اشتراک‌گذاری متن پیام (Share)"
              >
                {shared ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] text-emerald-400 font-bold">ارسال شد</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span className="text-[10px] hidden sm:inline">اشتراک</span>
                  </>
                )}
              </button>

              {/* Copy to Clipboard Button */}
              <button
                type="button"
                id={`copy-msg-${message.id}`}
                onClick={handleCopy}
                className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                  isUser
                    ? 'hover:bg-indigo-700/60 text-indigo-200 hover:text-white'
                    : isDark
                    ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                    : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
                }`}
                title="کپی متن به کلیپ‌بورد"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] text-emerald-400 font-bold">کپی شد</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-[10px] hidden sm:inline">کپی</span>
                  </>
                )}
              </button>

              {/* Read Aloud Button for Assistant (Native SpeechSynthesis) */}
              {!isUser && 'speechSynthesis' in window && (
                <button
                  type="button"
                  id={`read-aloud-btn-${message.id}`}
                  onClick={handleToggleSpeech}
                  className={`p-1.5 rounded-lg transition-all flex items-center gap-1 ${
                    isSpeaking
                      ? 'text-amber-400 bg-amber-500/20 ring-1 ring-amber-400/40 font-bold'
                      : isDark
                      ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                      : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
                  }`}
                  title={
                    isSpeaking
                      ? 'توقف خواندن صوتی'
                      : 'خواندن صوتی پاسخ با هوش صوتی مرورگر (Read Aloud)'
                  }
                >
                  {isSpeaking ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                      <span className="text-[10px] text-amber-400">توقف</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span className="text-[10px] hidden sm:inline">صدا</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
