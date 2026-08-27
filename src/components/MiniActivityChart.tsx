import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
  XAxis
} from 'recharts';
import { Activity, Clock, MessageSquare, TrendingUp, X } from 'lucide-react';
import { DailyActivityStat } from '../types';

interface MiniActivityChartProps {
  theme?: 'dark' | 'light';
  refreshTrigger?: number;
}

export const MiniActivityChart: React.FC<MiniActivityChartProps> = ({
  theme = 'dark',
  refreshTrigger = 0
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<DailyActivityStat[]>([]);
  const [summary, setSummary] = useState({ totalQuestions: 0, totalMinutes: 0, activeDays: 0 });
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/stats/weekly');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.stats)) {
          setData(json.stats);
          if (json.summary) {
            setSummary(json.summary);
          }
          return;
        }
      }
      // Fallback days
      const days = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
      setData(
        days.map((d, i) => ({
          dayName: d,
          dateStr: `Day-${i + 1}`,
          questionsCount: 0,
          studyMinutes: 0,
          tokensEstimated: 0
        }))
      );
    } catch (err) {
      console.warn('Mini chart stats fetch:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [refreshTrigger]);

  const isDark = theme === 'dark';

  return (
    <div className="relative">
      <button
        type="button"
        id="header-activity-chart-btn"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-medium border transition-all ${
          isOpen
            ? 'bg-teal-500/20 text-teal-400 border-teal-500/50'
            : isDark
            ? 'bg-slate-800/80 text-teal-400 border-slate-700/70 hover:bg-slate-800'
            : 'bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100'
        }`}
        title="نمودار فعالیت هفتگی و استمرار مطالعه (Recharts)"
      >
        <Activity className="w-4 h-4 text-teal-400" />
        <span className="hidden sm:inline">فعالیت هفتگی</span>
        {summary.totalQuestions > 0 && (
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div
          className={`absolute left-0 mt-2 w-72 sm:w-80 rounded-3xl border shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 ${
            isDark
              ? 'bg-slate-900/95 border-slate-800 text-white backdrop-blur-xl'
              : 'bg-white/95 border-slate-200 text-slate-900 backdrop-blur-xl'
          }`}
          onMouseLeave={() => setIsOpen(false)}
        >
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-teal-500/20 text-teal-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs">روند مطالعه ۷ روز اخیر</h4>
                <p className="text-[10px] text-slate-400">تحلیل استمرار و تعامل آموزشی</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Metrics summary */}
          <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
            <div
              className={`p-2 rounded-2xl border ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-indigo-400" />
                کل زمان مطالعه
              </span>
              <strong className="text-sm font-bold text-emerald-400">
                {summary.totalMinutes.toLocaleString('fa-IR')} دقیقه
              </strong>
            </div>

            <div
              className={`p-2 rounded-2xl border ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <MessageSquare className="w-3 h-3 text-teal-400" />
                پرسش‌های تحلیلی
              </span>
              <strong className="text-sm font-bold text-teal-400">
                {summary.totalQuestions.toLocaleString('fa-IR')} سوال
              </strong>
            </div>
          </div>

          {/* Mini Area Chart */}
          <div className="h-28 w-full dir-ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
                <defs>
                  <linearGradient id="miniActivityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="dayName"
                  stroke={isDark ? '#64748b' : '#94a3b8'}
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload as DailyActivityStat;
                      return (
                        <div
                          className={`p-2 rounded-xl border text-[11px] shadow-lg dir-rtl ${
                            isDark
                              ? 'bg-slate-950 border-slate-700 text-white'
                              : 'bg-white border-slate-200 text-slate-900'
                          }`}
                        >
                          <p className="font-bold text-emerald-400">{item.dayName}</p>
                          <p>{item.studyMinutes} دقیقه مطالعه</p>
                          <p>{item.questionsCount} پرسش مطرح‌شده</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="studyMinutes"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#miniActivityGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 text-center text-[10px] text-slate-400">
            استمرار در مطالعه کلید اصلی رتبه برتر شدن است ✨
          </div>
        </div>
      )}
    </div>
  );
};
