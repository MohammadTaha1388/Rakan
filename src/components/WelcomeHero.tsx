import React, { useMemo } from 'react';
import { Sparkles, Compass, Brain, Zap, Target, Flame, Hash, ArrowUpRight, TrendingUp } from 'lucide-react';
import { AdvisorSettings, UserProfile } from '../types';
import { QuickPromptsBar } from './QuickPromptsBar';
import { StudyProgressChart } from './StudyProgressChart';
import { STUDY_HASHTAGS, StudyHashtag } from '../utils/studyHashtags';

interface WelcomeHeroProps {
  settings: AdvisorSettings;
  user: UserProfile | null;
  onSelectPrompt: (prompt: string) => void;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
}

export const WelcomeHero: React.FC<WelcomeHeroProps> = ({
  settings,
  user,
  onSelectPrompt,
  onOpenSettings,
  onOpenAuth,
}) => {
  const isDark = settings.theme === 'dark';
  const displayName = user ? user.name : settings.studentName ? settings.studentName : 'دانش‌آموز کوشا';

  // Dynamically compute 3 trending study topics from the hashtag system and recent history/field
  const trendingTopics = useMemo(() => {
    try {
      let historyText = '';
      const savedLogs = localStorage.getItem('rakan_advisor_logs');
      if (savedLogs) {
        historyText += savedLogs.toLowerCase();
      }
      const savedNotes = localStorage.getItem('rakan_study_notes');
      if (savedNotes) {
        historyText += savedNotes.toLowerCase();
      }

      // Score each hashtag
      const scored = STUDY_HASHTAGS.map(item => {
        let score = 0;
        const tagClean = item.tag.replace('#', '');
        if (historyText.includes(tagClean) || historyText.includes(item.title)) {
          score += 5;
        }
        // Match student field
        if (settings.studentField === 'علوم تجربی' && ['#زیست_شناسی', '#شیمی', '#تکنیک_تست_زنی'].includes(item.tag)) {
          score += 4;
        } else if (settings.studentField === 'ریاضی و فیزیک' && ['#ریاضی', '#فیزیک', '#برنامه_ریزی'].includes(item.tag)) {
          score += 4;
        } else if (settings.studentField === 'ادبیات و علوم انسانی' && ['#خلاصه_نویسی', '#برنامه_ریزی', '#تکنیک_تست_زنی'].includes(item.tag)) {
          score += 4;
        }
        // General popularity
        if (item.tag === '#کنکور' || item.tag === '#برنامه_ریزی' || item.tag === '#رفع_اشکال') {
          score += 2;
        }
        return { ...item, score };
      });

      scored.sort((a, b) => b.score - a.score);
      return scored.slice(0, 3);
    } catch {
      return STUDY_HASHTAGS.slice(0, 3);
    }
  }, [settings.studentField]);

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-6 space-y-6 animate-in fade-in duration-300">
      {/* Hero Card */}
      <div className={`relative overflow-hidden rounded-3xl border p-6 sm:p-8 shadow-2xl transition-all ${
        isDark
          ? 'bg-gradient-to-br from-slate-900 via-slate-900/95 to-emerald-950/40 border-slate-800 text-white'
          : 'bg-gradient-to-br from-white via-emerald-50/40 to-teal-50/60 border-slate-200 text-slate-900 shadow-xl'
      }`}>
        {/* Background glow effects */}
        <div className="absolute top-0 -left-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -right-20 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              سامانه هوشمند مشاوره تحصیلی و کنکور مدرسه راکان
            </div>

            <div className="flex items-center gap-2 text-xs">
              {!user && (
                <button
                  id="hero-register-prompt-btn"
                  onClick={onOpenAuth}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/40 hover:bg-emerald-500 hover:text-white transition-all"
                >
                  ثبت‌نام برای ذخیره ابری پیشرفت
                </button>
              )}
              <button
                onClick={onOpenSettings}
                className="text-slate-400 hover:text-emerald-500 underline underline-offset-4 transition-colors"
              >
                تنظیمات مقطع ({settings.studentGrade})
              </button>
            </div>
          </div>

          <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight leading-snug">
            سلام {displayName} عزیز! 🎓
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-emerald-500 via-teal-400 to-indigo-400">
              مشاور هوشمند مدرسه راکان در خدمت شماست
            </span>
          </h2>

          <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-300 leading-relaxed max-w-2xl">
            آماده‌ام تا در <strong className="text-slate-900 dark:text-white font-semibold">برنامه‌ریزی متوازن درسی</strong>،{' '}
            <strong className="text-slate-900 dark:text-white font-semibold">رفع اشکال مفهومی</strong>،{' '}
            <strong className="text-slate-900 dark:text-white font-semibold">تکنیک‌های مدیریت آزمون</strong> و{' '}
            <strong className="text-slate-900 dark:text-white font-semibold">تقویت انگیزه و تمرکز</strong> همراه شما باشم.
          </p>

          {/* Feature Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
            <div className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs ${
              isDark ? 'bg-slate-800/60 border-slate-700/50 text-slate-200' : 'bg-white/80 border-slate-200 text-slate-700'
            }`}>
              <Compass className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>برنامه‌ریزی متوازن</span>
            </div>
            <div className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs ${
              isDark ? 'bg-slate-800/60 border-slate-700/50 text-slate-200' : 'bg-white/80 border-slate-200 text-slate-700'
            }`}>
              <Brain className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>رفع اشکال مفهومی</span>
            </div>
            <div className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs ${
              isDark ? 'bg-slate-800/60 border-slate-700/50 text-slate-200' : 'bg-white/80 border-slate-200 text-slate-700'
            }`}>
              <Target className="w-4 h-4 text-amber-500 shrink-0" />
              <span>استراتژی آزمون</span>
            </div>
            <div className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs ${
              isDark ? 'bg-slate-800/60 border-slate-700/50 text-slate-200' : 'bg-white/80 border-slate-200 text-slate-700'
            }`}>
              <Zap className="w-4 h-4 text-rose-500 shrink-0" />
              <span>انگیزش و تمرکز</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Trending Study Topics Section based on Hashtag System & User History */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-amber-500/15 text-amber-500">
              <Flame className="w-4 h-4 animate-pulse" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-300 dark:text-slate-200 flex items-center gap-1.5">
              مباحث داغ و پرتکرار امروز
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-400 font-medium">
                سیستم هشتگ‌های راکان
              </span>
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            بر اساس رشته {settings.studentField}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {trendingTopics.map((topic, idx) => (
            <button
              key={topic.tag}
              id={`trending-topic-${idx}`}
              onClick={() => onSelectPrompt(`سلام مشاور راکان، لطفاً یک راهنمایی جامع و نقشه راه برای مبحث ${topic.tag} (${topic.title}) به من ارائه بده.`)}
              className={`text-right p-3.5 rounded-2xl border transition-all duration-200 group relative overflow-hidden flex flex-col justify-between ${
                isDark
                  ? 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/60 hover:bg-slate-800/80'
                  : 'bg-white border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 shadow-sm'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-emerald-500 dark:text-emerald-400 flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    {topic.tag.replace('#', '')}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-[-2px] group-hover:translate-y-[-2px] transition-all" />
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-200 dark:text-slate-100">
                  {topic.title}
                </h4>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {topic.description}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/40 flex items-center justify-between text-[10px] text-slate-400">
                <span>شروع مشاوره فوری</span>
                <span className="font-semibold text-indigo-400 group-hover:underline">پرسش از راکان ←</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recharts Data Visualization: Weekly Study Time & Questions Chart */}
      <StudyProgressChart theme={settings.theme} />

      {/* Quick Prompts Category Grid */}
      <QuickPromptsBar onSelectPrompt={onSelectPrompt} />
    </div>
  );
};
