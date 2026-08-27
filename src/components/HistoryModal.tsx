import React, { useState, useEffect } from 'react';
import { X, Download, Trash2, RefreshCw, Search, Clock, Cpu, CheckCircle2, AlertCircle, FileText, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { InteractionLog } from '../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<InteractionLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/history');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDownload = () => {
    window.location.href = '/api/history/download';
  };

  const handleClear = async () => {
    try {
      const res = await fetch('/api/history/clear', { method: 'POST' });
      if (res.ok) {
        setLogs([]);
        setShowClearConfirm(false);
      }
    } catch (err) {
      console.error('Error clearing history:', err);
    }
  };

  const handleCopyLog = (log: InteractionLog) => {
    const text = `--- لاگ تعامل مدرسه راکان ---
تاریخ: ${log.persianDate} (${log.timestamp})
مدل: ${log.model} (دمای ${log.temperature})
زمان پاسخ‌دهی: ${log.durationMs} میلی‌ثانیه

پرسش دانش‌آموز:
${log.userQuery}

پاسخ مشاور هوشمند:
${log.botResponse}
`;
    navigator.clipboard.writeText(text);
    setCopiedId(log.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.userQuery.toLowerCase().includes(q) ||
      log.botResponse.toLowerCase().includes(q) ||
      log.model.toLowerCase().includes(q) ||
      log.persianDate.includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">فایل لاگ تعاملات (chat_history.json)</h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold font-mono">
                  {logs.length} رکورد
                </span>
              </div>
              <p className="text-xs text-slate-400">ثبت دقیق پرسش‌های دانش‌آموز و پاسخ‌های مشاور با زمان و مشخصات مدل</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="بارگذاری مجدد لاگ‌ها"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar: Search, Filter, Download */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-b border-slate-800 bg-slate-950/30">
          {/* Search Bar */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="جستجو در سوالات و پاسخ‌ها..."
              className="w-full pr-9 pl-3 py-2 rounded-xl bg-slate-950 border border-slate-700/80 text-slate-200 text-xs sm:text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-950/40 transition-all active:scale-95"
              title="دانلود فایل مستقیم chat_history.json"
            >
              <Download className="w-4 h-4" />
              دانلود chat_history.json
            </button>

            {showClearConfirm ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={handleClear}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
                >
                  تایید پاک‌سازی
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-2 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
                >
                  انصراف
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowClearConfirm(true)}
                disabled={logs.length === 0}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 border border-rose-800/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title="پاک‌سازی کامل لاگ‌های ذخیره‌شده"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                پاک‌سازی
              </button>
            )}
          </div>
        </div>

        {/* Logs List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-amber-400" />
              <p className="text-sm">در حال بارگذاری فایل تاریخچه...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 space-y-2">
              <FileText className="w-12 h-12 text-slate-600 mb-1" />
              <p className="font-semibold text-slate-300">هنوز لاگی ثبت نشده است</p>
              <p className="text-xs text-slate-500 max-w-sm">
                هر پرسشی که از مشاور مدرسه راکان بپرسید، به همراه زمان دقیق و پاسخ در فایل chat_history.json ذخیره خواهد شد.
              </p>
            </div>
          ) : (
            filteredLogs
              .slice()
              .reverse()
              .map(log => {
                const isExpanded = expandedLogId === log.id;
                const isCopied = copiedId === log.id;

                return (
                  <div
                    key={log.id}
                    className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all space-y-2.5"
                  >
                    {/* Log Card Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs">
                        {log.status === 'success' ? (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            موفق
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 font-medium">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                            خطا
                          </span>
                        )}

                        <span className="flex items-center gap-1 text-slate-300">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          {log.persianDate}
                        </span>

                        <span className="text-slate-600">•</span>

                        <span className="flex items-center gap-1 text-slate-400 font-mono text-[11px]">
                          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                          {log.model} ({log.durationMs}ms)
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleCopyLog(log)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="کپی متن لاگ"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors"
                        >
                          {isExpanded ? (
                            <>
                              بستن <ChevronUp className="w-3.5 h-3.5" />
                            </>
                          ) : (
                            <>
                              مشاهده کامل <ChevronDown className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Query Snippet */}
                    <div className="text-xs sm:text-sm font-semibold text-slate-200">
                      <span className="text-amber-400 ml-1.5">سؤال:</span>
                      {log.userQuery}
                    </div>

                    {/* Expanded Response */}
                    {isExpanded && (
                      <div className="pt-2 border-t border-slate-800/80 space-y-2 text-xs sm:text-sm animate-in fade-in duration-150">
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 leading-relaxed whitespace-pre-wrap">
                          <span className="font-bold text-emerald-400 block mb-1">پاسخ مشاور:</span>
                          {log.botResponse}
                        </div>
                        <div className="flex flex-wrap gap-3 text-[11px] text-slate-500 font-mono">
                          <span>شناسه لاگ: {log.id}</span>
                          <span>دما: {log.temperature}</span>
                          <span>پرامپت: {log.systemPromptName}</span>
                          <span>زمان میلادی: {log.timestamp}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800 bg-slate-950/60 text-xs text-slate-400">
          <span>محل ذخیره: فایل ریشه chat_history.json</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors text-xs font-medium"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
