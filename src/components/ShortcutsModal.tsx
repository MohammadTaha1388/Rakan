import React from 'react';
import { X, Command, Keyboard, Mic, Sparkles, Sliders, FileText, Download, Wrench } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'dark' | 'light';
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose, theme = 'dark' }) => {
  if (!isOpen) return null;

  const isDark = theme === 'dark';

  const shortcuts = [
    {
      keys: ['Ctrl', 'K'],
      macKeys: ['⌘', 'K'],
      description: 'تمرکز روی کادر پیام و پاک‌سازی ورودی',
      icon: Command,
      color: 'text-emerald-400'
    },
    {
      keys: ['Ctrl', 'S'],
      macKeys: ['⌘', 'S'],
      description: 'باز کردن پنجره تنظیمات مشاور و مدل هوش مصنوعی',
      icon: Sliders,
      color: 'text-indigo-400'
    },
    {
      keys: ['Ctrl', 'M'],
      macKeys: ['⌘', 'M'],
      description: 'شروع / توقف تایپ صوتی با میکروفون (Web Speech)',
      icon: Mic,
      color: 'text-rose-400'
    },
    {
      keys: ['Ctrl', 'D'],
      macKeys: ['⌘', 'D'],
      description: 'دانلود فایل متنی گفتگوی جاری (.txt) برای مرور آفلاین',
      icon: Download,
      color: 'text-teal-400'
    },
    {
      keys: ['Ctrl', 'T'],
      macKeys: ['⌘', 'T'],
      description: 'باز / بسته کردن جعبه‌ابزار مطالعه و پومودورو',
      icon: Wrench,
      color: 'text-amber-400'
    },
    {
      keys: ['Ctrl', 'H'],
      macKeys: ['⌘', 'H'],
      description: 'مشاهده تاریخچه و لاگ‌های گفتگوی تحصیلی',
      icon: FileText,
      color: 'text-sky-400'
    },
    {
      keys: ['Enter'],
      macKeys: ['Return'],
      description: 'ارسال پیام درسی به مشاور هوشمند',
      icon: Sparkles,
      color: 'text-purple-400'
    },
    {
      keys: ['Shift', 'Enter'],
      macKeys: ['Shift', 'Return'],
      description: 'ایجاد خط جدید در کادر پیام بدون ارسال',
      icon: Keyboard,
      color: 'text-slate-400'
    },
    {
      keys: ['#'],
      macKeys: ['#'],
      description: 'باز کردن منوی هشتگ‌های درسی و تکنیک‌های کنکور',
      icon: Keyboard,
      color: 'text-emerald-400'
    },
    {
      keys: ['Ctrl', '/'],
      macKeys: ['⌘', '/'],
      description: 'نمایش همین راهنمای کلیدهای میانبر سریع',
      icon: Keyboard,
      color: 'text-slate-300'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${
          isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-100 bg-slate-50'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-500">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">کلیدهای میانبر سامانه (Keyboard Shortcuts)</h3>
              <p className="text-xs text-slate-400">ناوبری سریع و حرفه‌ای بدون نیاز به ماوس</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-5 max-h-[65vh] overflow-y-auto space-y-2.5">
          {shortcuts.map((sc, idx) => {
            const IconC = sc.icon;
            return (
              <div
                key={idx}
                className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all ${
                  isDark
                    ? 'bg-slate-950/50 border-slate-800/80 hover:bg-slate-800/50'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <IconC className={`w-4 h-4 ${sc.color}`} />
                  <span className="text-xs font-medium text-slate-300 dark:text-slate-200">
                    {sc.description}
                  </span>
                </div>

                <div className="flex items-center gap-1 dir-ltr">
                  {sc.keys.map((k, kIdx) => (
                    <kbd
                      key={kIdx}
                      className={`px-2 py-1 text-[11px] font-mono font-bold rounded-lg border shadow-xs ${
                        isDark
                          ? 'bg-slate-800 border-slate-700 text-slate-200'
                          : 'bg-white border-slate-300 text-slate-800'
                      }`}
                    >
                      {k}
                    </kbd>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className={`px-5 py-3 border-t text-center text-xs text-slate-400 ${
          isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-100 bg-slate-50'
        }`}>
          برای بستن این پنجره دکمه <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono border border-slate-700">Esc</kbd> را فشار دهید.
        </div>
      </div>
    </div>
  );
};
