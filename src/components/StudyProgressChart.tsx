import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts';
import { DailyActivityStat } from '../types';
import { TrendingUp, Clock, MessageSquare, BarChart3, RefreshCw } from 'lucide-react';

interface StudyProgressChartProps {
  theme?: 'dark' | 'light';
  refreshTrigger?: number;
}

export const StudyProgressChart: React.FC<StudyProgressChartProps> = ({
  theme = 'dark',
  refreshTrigger = 0
}) => {
  const [data, setData] = useState<DailyActivityStat[]>([]);
  const [metric, setMetric] = useState<'minutes' | 'questions'>('minutes');
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const [loading, setLoading] = useState<boolean>(true);
  const [summary, setSummary] = useState({ totalQuestions: 0, totalMinutes: 0, activeDays: 0 });

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/stats/weekly');
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        const json = await res.json();
        if (json.success && Array.isArray(json.stats)) {
          setData(json.stats);
          if (json.summary) {
            setSummary(json.summary);
          }
          return;
        }
      }
      // Fallback empty week if response is not JSON
      const fallbackDays = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];
      const emptyStats: DailyActivityStat[] = fallbackDays.map((d, i) => ({
        dayName: d,
        dateStr: `Day-${i + 1}`,
        questionsCount: 0,
        studyMinutes: 0,
        tokensEstimated: 0
      }));
      setData(emptyStats);
    } catch (err) {
      console.warn('Weekly stats fetch warning:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [refreshTrigger]);

  const isDark = theme === 'dark';

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; payload: DailyActivityStat }>; label?: string }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className={`p-3 rounded-xl border text-xs shadow-xl backdrop-blur-md ${
          isDark
            ? 'bg-slate-900/95 border-emerald-500/30 text-white'
            : 'bg-white/95 border-emerald-500/30 text-slate-900'
        }`}>
          <p className="font-bold text-sm text-emerald-400 mb-1">{label} ({item.dateStr})</p>
          <div className="space-y-1">
            <p className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>زمان مطالعه و تحلیل: </span>
              <strong className="text-emerald-400">{item.studyMinutes} دقیقه</strong>
            </p>
            <p className="flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-teal-400" />
              <span>پرسش‌های درسی: </span>
              <strong className="text-teal-400">{item.questionsCount} سوال</strong>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`rounded-2xl border p-5 transition-all duration-300 ${
      isDark
        ? 'bg-slate-900/80 border-slate-800 shadow-xl'
        : 'bg-white border-slate-200/80 shadow-md'
    }`}>
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              نمودار پیشرفت و فعالیت هفتگی مطالعه
            </h3>
            <p className="text-xs text-slate-400">تحلیل زمان مطالعه و تعاملات آموزشی ۷ روز اخیر</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Metric Selector */}
          <div className={`flex rounded-lg p-1 border text-xs ${
            isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              id="chart-metric-minutes"
              onClick={() => setMetric('minutes')}
              className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                metric === 'minutes'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ⏱️ دقایق مطالعه
            </button>
            <button
              id="chart-metric-questions"
              onClick={() => setMetric('questions')}
              className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                metric === 'questions'
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              💬 تعداد سوالات
            </button>
          </div>

          {/* Chart Style Toggle */}
          <button
            id="chart-type-toggle"
            onClick={() => setChartType(prev => prev === 'area' ? 'bar' : 'area')}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              isDark
                ? 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
            title="تغییر نوع نمودار (مساحتی / میله‌ای)"
          >
            <BarChart3 className="w-4 h-4" />
          </button>

          <button
            id="chart-refresh-btn"
            onClick={fetchStats}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              isDark
                ? 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
            title="بروزرسانی داده‌ها"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mini Stats Summary Pills */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4">
        <div className={`p-3 rounded-xl border text-center transition-all ${
          isDark ? 'bg-slate-950/40 border-slate-800/80' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="text-[11px] text-slate-400 mb-0.5">کل زمان مطالعه هفته</div>
          <div className="text-base sm:text-lg font-black text-emerald-400">
            {summary.totalMinutes} <span className="text-xs font-normal">دقیقه</span>
          </div>
        </div>

        <div className={`p-3 rounded-xl border text-center transition-all ${
          isDark ? 'bg-slate-950/40 border-slate-800/80' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="text-[11px] text-slate-400 mb-0.5">پرسش‌های رفع اشکال</div>
          <div className="text-base sm:text-lg font-black text-indigo-400">
            {summary.totalQuestions} <span className="text-xs font-normal">سوال</span>
          </div>
        </div>

        <div className={`p-3 rounded-xl border text-center transition-all ${
          isDark ? 'bg-slate-950/40 border-slate-800/80' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="text-[11px] text-slate-400 mb-0.5">روزهای فعال</div>
          <div className="text-base sm:text-lg font-black text-amber-400">
            {summary.activeDays} <span className="text-xs font-normal">از ۷ روز</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-44 sm:h-52" dir="ltr">
        {loading && data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-xs gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
            <span>در حال تحلیل و بارگذاری لاگ‌های درسی...</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="indigoGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} opacity={0.4} />
                <XAxis
                  dataKey="dayName"
                  stroke={isDark ? '#94a3b8' : '#64748b'}
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke={isDark ? '#94a3b8' : '#64748b'}
                  fontSize={11}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey={metric === 'minutes' ? 'studyMinutes' : 'questionsCount'}
                  stroke={metric === 'minutes' ? '#10b981' : '#6366f1'}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill={metric === 'minutes' ? 'url(#emeraldGrad)' : 'url(#indigoGrad)'}
                  dot={{ r: 3.5, fill: metric === 'minutes' ? '#10b981' : '#6366f1', strokeWidth: 1 }}
                  activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            ) : (
              <BarChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} opacity={0.4} />
                <XAxis
                  dataKey="dayName"
                  stroke={isDark ? '#94a3b8' : '#64748b'}
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke={isDark ? '#94a3b8' : '#64748b'}
                  fontSize={11}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey={metric === 'minutes' ? 'studyMinutes' : 'questionsCount'}
                  fill={metric === 'minutes' ? '#10b981' : '#6366f1'}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={36}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
