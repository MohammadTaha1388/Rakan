import React, { useState, useEffect } from 'react';
import {
  X,
  Timer,
  Calculator,
  StickyNote,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Headphones,
  Volume2,
  VolumeX,
  CloudRain,
  Radio,
  Waves,
  Music,
  Plus,
  Trash2,
  BellRing,
  Coffee
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { focusAudio, FocusSoundType } from '../utils/audioSynth';
import { dispatchAppNotification } from '../utils/notificationService';

interface StudyToolsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'dark' | 'light';
}

export const StudyToolsPanel: React.FC<StudyToolsPanelProps> = ({
  isOpen,
  onClose,
  theme = 'dark'
}) => {
  const [activeTab, setActiveTab] = useState<'audio' | 'pomodoro' | 'calculator' | 'notes'>('audio');

  // Focus Audio State
  const [isPlayingAudio, setIsPlayingAudio] = useState(focusAudio.getIsPlaying());
  const [soundType, setSoundType] = useState<FocusSoundType>(focusAudio.getCurrentType());
  const [volume, setVolume] = useState(focusAudio.getVolume());

  // Pomodoro State
  const [pomoMode, setPomoMode] = useState<'work' | 'break'>('work');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [initialBlockTime, setInitialBlockTime] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [desktopNotifGranted, setDesktopNotifGranted] = useState(() => {
    return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
  });

  const requestDesktopNotification = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = await Notification.requestPermission();
      setDesktopNotifGranted(perm === 'granted');
    }
  };

  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
    } catch {
      // AudioContext unavailable or blocked
    }
  };

  // Calculator State
  const [totalQuestions, setTotalQuestions] = useState<number>(30);
  const [correctAnswers, setCorrectAnswers] = useState<number>(20);
  const [wrongAnswers, setWrongAnswers] = useState<number>(4);

  // Notes State
  const [notes, setNotes] = useState<Array<{ id: string; text: string; date: string }>>(() => {
    try {
      const saved = localStorage.getItem('rakan_study_notes');
      return saved ? JSON.parse(saved) : [
        { id: '1', text: 'مرور زیست فصل ۲ دهم با روش بازیابی قبل از تست', date: 'امروز' },
        { id: '2', text: 'تکنیک ضربدر منها برای درس شیمی اجرا شود', date: 'دیروز' }
      ];
    } catch {
      return [];
    }
  });
  const [newNoteText, setNewNoteText] = useState('');

  const isDark = theme === 'dark';

  // Toggle Audio Play/Pause
  const handleToggleAudio = (type?: FocusSoundType) => {
    const targetType = type || soundType;
    if (isPlayingAudio && targetType === soundType) {
      focusAudio.stop();
      setIsPlayingAudio(false);
    } else {
      setSoundType(targetType);
      focusAudio.play(targetType);
      setIsPlayingAudio(true);
    }
  };

  const handleVolumeChange = (newVal: number) => {
    setVolume(newVal);
    focusAudio.setVolume(newVal);
  };

  // Pomodoro Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      playChime();
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
      if (pomoMode === 'work') {
        const count = completedSessions + 1;
        setCompletedSessions(count);
        setPomoMode('break');
        setTimeLeft(5 * 60);
        setInitialBlockTime(5 * 60);
        dispatchAppNotification(
          '🎉 پایان نوبت مطالعه متمرکز ۲۵ دقیقه‌ای!',
          `آفرین! یک بلوک مطالعه را با تمرکز عالی تمام کردی (مجموعاً ${count} نوبت). اکنون وقت استراحت و تنفس عمیق است.`,
          'pomodoro',
          true
        );
      } else {
        setPomoMode('work');
        setTimeLeft(25 * 60);
        setInitialBlockTime(25 * 60);
        dispatchAppNotification(
          '⏰ پایان زمان استراحت!',
          'زمان شروع بلوک مطالعاتی ۲۵ دقیقه‌ای بعدی فرا رسید. آماده شو و شروع کن!',
          'pomodoro',
          true
        );
      }
      setIsRunning(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, pomoMode, completedSessions]);

  // Save notes to localStorage
  const handleAddNote = () => {
    if (!newNoteText.trim()) return;
    const item = {
      id: Date.now().toString(),
      text: newNoteText.trim(),
      date: new Intl.DateTimeFormat('fa-IR', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date())
    };
    const updated = [item, ...notes];
    setNotes(updated);
    localStorage.setItem('rakan_study_notes', JSON.stringify(updated));
    setNewNoteText('');
  };

  const handleDeleteNote = (id: string) => {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    localStorage.setItem('rakan_study_notes', JSON.stringify(updated));
  };

  // Exam Score Calculation
  const unanswered = Math.max(0, totalQuestions - (correctAnswers + wrongAnswers));
  const maxScore = totalQuestions * 3;
  const rawScore = correctAnswers * 3 - wrongAnswers;
  const percentage = totalQuestions > 0 ? (rawScore / maxScore) * 100 : 0;
  const roundedPercentage = Math.max(-33.33, Math.min(100, Math.round(percentage * 100) / 100));

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  const SOUND_PRESETS = [
    {
      id: 'lofi' as FocusSoundType,
      title: 'موسیقی ملایم Lo-Fi',
      desc: 'آکوردهای آرامش‌بخش و پیانو برای تمرکز عمیق مطالعه',
      icon: Music,
      color: 'from-indigo-500/20 to-purple-500/20 border-indigo-500/40 text-indigo-400'
    },
    {
      id: 'white_noise' as FocusSoundType,
      title: 'نوفه سفید (White Noise)',
      desc: 'حذف کامل صداهای مزاحم اطراف و افزایش تمرکز خواندن',
      icon: Radio,
      color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/40 text-emerald-400'
    },
    {
      id: 'rain' as FocusSoundType,
      title: 'بارش باران آرام (Rain Ambience)',
      desc: 'صدای ملایم قطرات باران برای رفع استرس و حس تازگی',
      icon: CloudRain,
      color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/40 text-blue-400'
    },
    {
      id: 'cafe' as FocusSoundType,
      title: 'کافه دنج مطالعه (Cafe Ambience)',
      desc: 'فضای دلنشین کافی‌شاپ آرام و همهمه ملایم مطالعه',
      icon: Coffee,
      color: 'from-amber-600/20 to-orange-500/20 border-amber-600/40 text-amber-500'
    },
    {
      id: 'alpha_waves' as FocusSoundType,
      title: 'امواج آلفا (۱۰ هرتز Alpha Waves)',
      desc: 'فرکانس تقویت یادگیری، تثبیت حافظه و آرامش ذهن',
      icon: Waves,
      color: 'from-amber-500/20 to-rose-500/20 border-amber-500/40 text-amber-400'
    }
  ];

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 w-full sm:w-96 border-r shadow-2xl flex flex-col animate-in slide-in-from-left duration-250 transition-colors ${
      isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
    }`}>
      {/* Panel Header */}
      <div className={`flex items-center justify-between p-4 border-b ${
        isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
      }`}>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm">جعبه ابزار مطالعه راکان</h3>
            <p className="text-[11px] text-slate-400">صداهای تمرکز، پومودورو، درصدگیر و یادداشت‌ها</p>
          </div>
        </div>
        <button
          id="close-study-tools-btn"
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className={`flex items-center border-b p-1 overflow-x-auto no-scrollbar ${
        isDark ? 'border-slate-800 bg-slate-950/30' : 'border-slate-200 bg-slate-100/70'
      }`}>
        <button
          id="tab-audio-focus"
          onClick={() => setActiveTab('audio')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap px-2 ${
            activeTab === 'audio'
              ? 'bg-emerald-500 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Headphones className="w-3.5 h-3.5" />
          صدای تمرکز
        </button>

        <button
          id="tab-pomodoro-timer"
          onClick={() => setActiveTab('pomodoro')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap px-2 ${
            activeTab === 'pomodoro'
              ? 'bg-indigo-500 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Timer className="w-3.5 h-3.5" />
          پومودورو
        </button>

        <button
          id="tab-calculator-calc"
          onClick={() => setActiveTab('calculator')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap px-2 ${
            activeTab === 'calculator'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          درصد آزمون
        </button>

        <button
          id="tab-notes-notepad"
          onClick={() => setActiveTab('notes')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap px-2 ${
            activeTab === 'notes'
              ? 'bg-teal-500 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <StickyNote className="w-3.5 h-3.5" />
          نکات من
        </button>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* TAB 1: FOCUS AUDIO & WHITE NOISE */}
        {activeTab === 'audio' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Master Play / Pause Player */}
            <div className={`p-4 rounded-2xl border text-center relative overflow-hidden transition-all ${
              isPlayingAudio
                ? isDark
                  ? 'bg-emerald-950/40 border-emerald-500/60 shadow-lg shadow-emerald-950/50'
                  : 'bg-emerald-50 border-emerald-300 shadow-md'
                : isDark
                ? 'bg-slate-950/60 border-slate-800'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isPlayingAudio ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
                  <span className="text-xs font-bold">
                    {isPlayingAudio ? 'در حال پخش صدای تمرکز' : 'صدای تمرکز خاموش است'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {isPlayingAudio ? 'Web Audio Engine' : 'Offline Ready'}
                </span>
              </div>

              {/* Big Toggle Button */}
              <button
                id="toggle-focus-audio-main-btn"
                onClick={() => handleToggleAudio()}
                className={`w-full py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 ${
                  isPlayingAudio
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/40'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
                }`}
              >
                {isPlayingAudio ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>توقف پخش صدا</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>شروع پخش صدای مطالعه</span>
                  </>
                )}
              </button>

              {/* Volume Slider */}
              <div className="mt-4 pt-3 border-t border-slate-700/40 flex items-center gap-2.5">
                {volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-slate-400 shrink-0" />
                ) : (
                  <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
                <input
                  id="focus-audio-volume"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={e => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <span className="text-[11px] text-slate-400 w-8 text-left font-mono">
                  {Math.round(volume * 100)}%
                </span>
              </div>
            </div>

            {/* Sound Presets List */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                انتخاب نوع صوت پس‌زمینه (Soundscape):
              </label>
              <div className="space-y-2">
                {SOUND_PRESETS.map(preset => {
                  const isSelected = soundType === preset.id;
                  const isCurrentlyPlaying = isSelected && isPlayingAudio;
                  const IconComp = preset.icon;

                  return (
                    <div
                      key={preset.id}
                      onClick={() => handleToggleAudio(preset.id)}
                      className={`cursor-pointer p-3 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 ${
                        isSelected
                          ? isDark
                            ? 'bg-slate-800 border-emerald-500 ring-1 ring-emerald-500/40 text-white'
                            : 'bg-emerald-50/80 border-emerald-400 text-slate-900 shadow-sm'
                          : isDark
                          ? 'bg-slate-950/40 border-slate-800 hover:bg-slate-800/60'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl border ${preset.color}`}>
                          <IconComp className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold">{preset.title}</h4>
                          <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{preset.desc}</p>
                        </div>
                      </div>

                      <button
                        className={`p-2 rounded-xl transition-colors ${
                          isCurrentlyPlaying
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {isCurrentlyPlaying ? (
                          <Pause className="w-3.5 h-3.5" />
                        ) : (
                          <Play className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={`p-3 rounded-xl border text-[11px] leading-relaxed text-slate-400 ${
              isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              💡 <strong>نکته علمی تمرکز:</strong> شنیدن نوفه سفید یا امواج آلفا موقع مطالعه کتاب‌های سنگین، نوسانات توجه را تا ۴۰٪ کاهش داده و مانع از پرت شدن حواس به مکالمات اطراف می‌شود.
            </div>
          </div>
        )}

        {/* TAB 2: POMODORO TIMER */}
        {activeTab === 'pomodoro' && (
          <div className="space-y-4 text-center animate-in fade-in duration-150">
            {/* Focus Block Quick Selectors */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 text-right">
                انتخاب بلوک زمانی مطالعه:
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  id="pomo-preset-25"
                  onClick={() => {
                    setPomoMode('work');
                    setTimeLeft(25 * 60);
                    setInitialBlockTime(25 * 60);
                    setIsRunning(false);
                  }}
                  className={`p-2 rounded-xl border transition-all ${
                    pomoMode === 'work' && initialBlockTime === 25 * 60
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 font-bold ring-1 ring-emerald-500/30'
                      : isDark ? 'border-slate-800 bg-slate-950 text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="block font-bold">۲۵ دقیقه</span>
                  <span className="text-[10px] text-slate-400">استاندارد پومودورو</span>
                </button>

                <button
                  type="button"
                  id="pomo-preset-50"
                  onClick={() => {
                    setPomoMode('work');
                    setTimeLeft(50 * 60);
                    setInitialBlockTime(50 * 60);
                    setIsRunning(false);
                  }}
                  className={`p-2 rounded-xl border transition-all ${
                    pomoMode === 'work' && initialBlockTime === 50 * 60
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 font-bold ring-1 ring-emerald-500/30'
                      : isDark ? 'border-slate-800 bg-slate-950 text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="block font-bold">۵۰ دقیقه</span>
                  <span className="text-[10px] text-slate-400">بلوک سنگین کنکور</span>
                </button>

                <button
                  type="button"
                  id="pomo-preset-15"
                  onClick={() => {
                    setPomoMode('work');
                    setTimeLeft(15 * 60);
                    setInitialBlockTime(15 * 60);
                    setIsRunning(false);
                  }}
                  className={`p-2 rounded-xl border transition-all ${
                    pomoMode === 'work' && initialBlockTime === 15 * 60
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 font-bold ring-1 ring-emerald-500/30'
                      : isDark ? 'border-slate-800 bg-slate-950 text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="block font-bold">۱۵ دقیقه</span>
                  <span className="text-[10px] text-slate-400">مرور سریع کپسولی</span>
                </button>
              </div>

              {/* Break buttons */}
              <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                <button
                  type="button"
                  id="pomo-preset-break-5"
                  onClick={() => {
                    setPomoMode('break');
                    setTimeLeft(5 * 60);
                    setInitialBlockTime(5 * 60);
                    setIsRunning(false);
                  }}
                  className={`p-1.5 rounded-xl border transition-all ${
                    pomoMode === 'break' && initialBlockTime === 5 * 60
                      ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50 font-bold'
                      : isDark ? 'border-slate-800 bg-slate-950 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  ☕ ۵ دقیقه استراحت کوتاه
                </button>

                <button
                  type="button"
                  id="pomo-preset-break-15"
                  onClick={() => {
                    setPomoMode('break');
                    setTimeLeft(15 * 60);
                    setInitialBlockTime(15 * 60);
                    setIsRunning(false);
                  }}
                  className={`p-1.5 rounded-xl border transition-all ${
                    pomoMode === 'break' && initialBlockTime === 15 * 60
                      ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50 font-bold'
                      : isDark ? 'border-slate-800 bg-slate-950 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  🚶 ۱۵ دقیقه استراحت بلند
                </button>
              </div>
            </div>

            {/* Timer Dial Display with Circular Progress */}
            <div className={`relative w-48 h-48 mx-auto flex flex-col items-center justify-center rounded-full border-4 shadow-xl transition-all ${
              isRunning
                ? pomoMode === 'work'
                  ? 'border-emerald-500/80 shadow-emerald-950/40 bg-emerald-950/20'
                  : 'border-indigo-500/80 shadow-indigo-950/40 bg-indigo-950/20'
                : isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-300'
            }`}>
              <span className="text-4xl font-black font-mono tracking-wider dir-ltr">
                {formatTimer(timeLeft)}
              </span>
              <span className="text-xs font-semibold text-slate-400 mt-1 flex items-center gap-1">
                {pomoMode === 'work' ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    بلوک مطالعه متمرکز
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                    استراحت و بازیابی ذهن
                  </>
                )}
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                id="pomo-start-toggle-btn"
                onClick={() => setIsRunning(!isRunning)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold shadow-lg transition-all active:scale-95 ${
                  isRunning
                    ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/40'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4" />
                    توقف موقت
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    شروع تمرکز
                  </>
                )}
              </button>

              <button
                id="pomo-reset-btn"
                onClick={() => {
                  setIsRunning(false);
                  setTimeLeft(initialBlockTime);
                }}
                className={`p-2.5 rounded-2xl border transition-colors ${
                  isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-700'
                }`}
                title="بازنشانی تایمر"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Desktop Notification Toggle / Status */}
            <div className={`p-3 rounded-2xl border text-xs flex items-center justify-between gap-2 ${
              isDark ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-2 text-right">
                <BellRing className={`w-4 h-4 ${desktopNotifGranted ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span className="text-[11px] text-slate-300">
                  {desktopNotifGranted ? 'اعلان‌های دسکتاپ فعال است' : 'هشدار دسکتاپ هنگام پایان زمان'}
                </span>
              </div>
              {!desktopNotifGranted ? (
                <button
                  type="button"
                  id="enable-pomo-desktop-notif"
                  onClick={requestDesktopNotification}
                  className="px-2 py-1 rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-white text-[10px] font-bold border border-indigo-500/40 transition-all shrink-0"
                >
                  فعال‌سازی
                </button>
              ) : (
                <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/20">
                  ✓ تأیید شده
                </span>
              )}
            </div>

            <div className={`p-3 rounded-2xl border text-xs flex items-center justify-between ${
              isDark ? 'bg-slate-950/60 border-slate-800/80 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              <span>پومودوروهای تکمیل‌شده امروز:</span>
              <span className="font-bold text-emerald-500 text-sm font-mono">{completedSessions} نوبت</span>
            </div>
          </div>
        )}

        {/* TAB 3: EXAM PERCENTAGE CALCULATOR */}
        {activeTab === 'calculator' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className={`p-4 rounded-2xl border text-center space-y-1 ${
              isDark ? 'bg-slate-950 border-slate-800/80' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="text-xs text-slate-400">درصد نهایی (با احتساب نمره منفی یک‌سوم):</div>
              <div
                className={`text-3xl sm:text-4xl font-extrabold font-mono dir-ltr ${
                  roundedPercentage >= 70
                    ? 'text-emerald-500'
                    : roundedPercentage >= 40
                    ? 'text-amber-500'
                    : 'text-rose-500'
                }`}
              >
                {roundedPercentage}%
              </div>
              <div className="text-[11px] text-slate-400 pt-1">
                تعداد نزده: <strong className="text-slate-300">{unanswered}</strong> سوال
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium mb-1">تعداد کل سوالات آزمون:</label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={totalQuestions}
                  onChange={e => setTotalQuestions(Math.max(1, parseInt(e.target.value) || 0))}
                  className={`w-full px-3 py-2 rounded-xl border text-center font-mono focus:outline-none focus:border-indigo-500 ${
                    isDark ? 'bg-slate-950 border-slate-700/80 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-emerald-500 font-medium mb-1">تعداد پاسخ‌های صحیح (درست):</label>
                <input
                  type="number"
                  min="0"
                  max={totalQuestions}
                  value={correctAnswers}
                  onChange={e => setCorrectAnswers(Math.max(0, parseInt(e.target.value) || 0))}
                  className={`w-full px-3 py-2 rounded-xl border text-center font-mono focus:outline-none focus:border-emerald-500 ${
                    isDark ? 'bg-slate-950 border-emerald-700/60 text-emerald-300' : 'bg-slate-50 border-emerald-300 text-emerald-700'
                  }`}
                />
              </div>

              <div>
                <label className="block text-rose-500 font-medium mb-1">تعداد پاسخ‌های نادرست (غلط):</label>
                <input
                  type="number"
                  min="0"
                  max={totalQuestions}
                  value={wrongAnswers}
                  onChange={e => setWrongAnswers(Math.max(0, parseInt(e.target.value) || 0))}
                  className={`w-full px-3 py-2 rounded-xl border text-center font-mono focus:outline-none focus:border-rose-500 ${
                    isDark ? 'bg-slate-950 border-rose-700/60 text-rose-300' : 'bg-slate-50 border-rose-300 text-rose-700'
                  }`}
                />
              </div>
            </div>

            <div className={`p-3 rounded-xl border text-[11px] text-slate-400 leading-relaxed ${
              isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              💡 <strong>فرمول رسمی کنکور:</strong>
              <br />
              <span className="font-mono dir-ltr block text-center my-1">
                Score % = ((Correct × 3) - Wrong) ÷ (Total × 3) × 100
              </span>
            </div>
          </div>
        )}

        {/* TAB 4: STUDY NOTES & SCRATCHPAD */}
        {activeTab === 'notes' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="space-y-2">
              <textarea
                rows={2}
                value={newNoteText}
                onChange={e => setNewNoteText(e.target.value)}
                placeholder="یادداشت نکته درسی یا توصیه مشاور..."
                className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none focus:border-amber-500 resize-none ${
                  isDark ? 'bg-slate-950 border-slate-700/80 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
              <button
                onClick={handleAddNote}
                disabled={!newNoteText.trim()}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" />
                ثبت در یادداشت‌ها
              </button>
            </div>

            <div className="space-y-2">
              {notes.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  هیچ یادداشتی ثبت نشده است.
                </div>
              ) : (
                notes.map(n => (
                  <div
                    key={n.id}
                    className={`p-2.5 rounded-xl border flex items-start justify-between gap-2 text-xs ${
                      isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex-1 leading-relaxed">
                      {n.text}
                      <span className="block text-[10px] text-slate-500 mt-1">{n.date}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteNote(n.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
