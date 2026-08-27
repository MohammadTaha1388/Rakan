import React from 'react';
import { Calendar, HelpCircle, Timer, Target, Flame, CheckSquare, Sparkles } from 'lucide-react';
import { QUICK_PROMPTS } from '../utils/constants';

interface QuickPromptsBarProps {
  onSelectPrompt: (promptText: string) => void;
}

export const QuickPromptsBar: React.FC<QuickPromptsBarProps> = ({ onSelectPrompt }) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Calendar':
        return <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'HelpCircle':
        return <HelpCircle className="w-4 h-4 text-blue-400 shrink-0" />;
      case 'Timer':
        return <Timer className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'Target':
        return <Target className="w-4 h-4 text-indigo-400 shrink-0" />;
      case 'Flame':
        return <Flame className="w-4 h-4 text-rose-400 shrink-0" />;
      case 'CheckSquare':
        return <CheckSquare className="w-4 h-4 text-teal-400 shrink-0" />;
      default:
        return <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />;
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-amber-400" />
        <h3 className="text-xs sm:text-sm font-bold text-slate-300">
          مسیرهای پیشنهادی و موضوعات پرکاربرد مشاوره:
        </h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {QUICK_PROMPTS.map(item => (
          <button
            key={item.id}
            onClick={() => onSelectPrompt(item.prompt)}
            className="flex items-start gap-3 p-3 text-right rounded-2xl bg-slate-900/70 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 transition-all duration-200 group hover:shadow-lg hover:shadow-emerald-950/20 hover:-translate-y-0.5 active:translate-y-0"
          >
            <div className="p-2 rounded-xl bg-slate-800/80 group-hover:bg-slate-700/90 transition-colors mt-0.5">
              {getIcon(item.icon)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs sm:text-sm font-bold text-slate-200 group-hover:text-emerald-300 transition-colors">
                {item.title}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                {item.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
