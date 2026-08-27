import React, { useEffect, useRef } from 'react';
import {
  Calendar,
  Calculator,
  Atom,
  FlaskConical,
  Dna,
  Award,
  Target,
  Flame,
  BookOpen,
  HelpCircle,
  Hash,
  Sparkles
} from 'lucide-react';
import { StudyHashtag } from '../utils/studyHashtags';

interface HashtagSuggestionsProps {
  suggestions: StudyHashtag[];
  selectedIndex: number;
  onSelect: (hashtag: StudyHashtag) => void;
  theme: 'dark' | 'light';
  searchQuery: string;
}

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Calendar,
  Calculator,
  Atom,
  FlaskConical,
  Dna,
  Award,
  Target,
  Flame,
  BookOpen,
  HelpCircle,
};

export const HashtagSuggestions: React.FC<HashtagSuggestionsProps> = ({
  suggestions,
  selectedIndex,
  onSelect,
  theme,
  searchQuery
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark';

  // Ensure active element is scrolled into view
  useEffect(() => {
    if (containerRef.current && suggestions.length > 0) {
      const activeEl = containerRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, suggestions.length]);

  if (suggestions.length === 0) {
    return (
      <div
        className={`absolute bottom-full mb-2 right-0 left-0 sm:left-auto sm:w-80 p-3 rounded-2xl border shadow-2xl z-30 animate-in fade-in zoom-in-95 duration-150 ${
          isDark
            ? 'bg-slate-900/95 border-slate-800 text-slate-400'
            : 'bg-white/95 border-slate-200 text-slate-500'
        } backdrop-blur-md`}
      >
        <div className="flex items-center gap-2 text-xs">
          <Hash className="w-4 h-4 text-emerald-500" />
          <span>مبحثی با عبارت «{searchQuery}» یافت نشد.</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`absolute bottom-full mb-2 right-0 left-0 sm:left-auto sm:w-96 rounded-2xl border shadow-2xl z-30 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150 ${
        isDark
          ? 'bg-slate-900/95 border-slate-800 text-slate-100'
          : 'bg-white/95 border-slate-200 text-slate-800 shadow-xl'
      } backdrop-blur-md`}
    >
      {/* Header bar */}
      <div
        className={`flex items-center justify-between px-3.5 py-2 border-b text-[11px] font-medium ${
          isDark ? 'border-slate-800/80 bg-slate-950/60 text-slate-400' : 'border-slate-100 bg-slate-50/80 text-slate-500'
        }`}
      >
        <span className="flex items-center gap-1.5 font-bold text-emerald-500">
          <Hash className="w-3.5 h-3.5" />
          پیشنهاد هشتگ موضوع درسی (Study Topics)
        </span>
        <span className="text-[10px] text-slate-400">کلیدهای ↑ و ↓ برای انتخاب</span>
      </div>

      {/* Suggestion list */}
      <div ref={containerRef} className="max-h-60 overflow-y-auto p-1.5 space-y-1">
        {suggestions.map((item, idx) => {
          const isSelected = idx === selectedIndex;
          const IconComp = ICON_MAP[item.iconName] || Sparkles;

          return (
            <button
              key={item.tag}
              id={`hashtag-option-${idx}`}
              type="button"
              onMouseDown={e => {
                e.preventDefault(); // prevent losing textarea focus
                onSelect(item);
              }}
              className={`w-full text-right p-2 rounded-xl flex items-center gap-3 transition-colors ${
                isSelected
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : isDark
                  ? 'hover:bg-slate-800/70 text-slate-200'
                  : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                  isSelected
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : isDark
                    ? 'bg-slate-800 text-slate-300 border-slate-700'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                <IconComp className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs">{item.tag}</span>
                    {item.enTag && (
                      <span className="text-[10px] font-mono text-slate-400">
                        ({item.enTag})
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {item.title}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate text-right">
                  {item.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
