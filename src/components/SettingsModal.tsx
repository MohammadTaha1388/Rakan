import React, { useState } from 'react';
import {
  X,
  Sliders,
  Cpu,
  MessageSquareQuote,
  User,
  RotateCcw,
  Check,
  ShieldCheck,
  Link2,
  KeyRound,
  Sun,
  Moon,
  Palette,
  Bell,
  BellRing,
  Type,
  Keyboard,
  Volume2,
  Globe,
  Plus,
  Trash2,
  Target
} from 'lucide-react';
import { AdvisorSettings } from '../types';
import { SYSTEM_PROMPT_PRESETS, AVAILABLE_MODELS, DEFAULT_SETTINGS } from '../utils/constants';
import { requestBrowserNotificationPermission } from '../utils/notificationService';
import { playMechanicalKeyClick } from '../utils/audioSynth';
import { AppLanguage } from '../utils/i18n';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AdvisorSettings;
  onSave: (newSettings: AdvisorSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [formData, setFormData] = useState<AdvisorSettings>({ 
    ...settings,
    studyGoals: settings.studyGoals || (settings.studyGoal ? [settings.studyGoal] : [])
  });
  const [newGoalInput, setNewGoalInput] = useState('');
  const [activeTab, setActiveTab] = useState<'theme' | 'model' | 'prompt' | 'profile' | 'advanced'>('theme');
  const [isSavedAlert, setIsSavedAlert] = useState(false);

  if (!isOpen) return null;

  const isDark = formData.theme === 'dark';

  const handleAddGoal = () => {
    const trimmed = newGoalInput.trim();
    if (!trimmed) return;
    const currentGoals = formData.studyGoals || [];
    if (!currentGoals.includes(trimmed)) {
      const updated = [...currentGoals, trimmed];
      setFormData(prev => ({
        ...prev,
        studyGoals: updated,
        studyGoal: prev.studyGoal || trimmed
      }));
    }
    setNewGoalInput('');
  };

  const handleRemoveGoal = (indexToRemove: number) => {
    const currentGoals = formData.studyGoals || [];
    const updated = currentGoals.filter((_, idx) => idx !== indexToRemove);
    setFormData(prev => ({
      ...prev,
      studyGoals: updated,
      studyGoal: updated[0] || ''
    }));
  };

  const handlePresetSelect = (presetId: string) => {
    const selectedPreset = SYSTEM_PROMPT_PRESETS.find(p => p.id === presetId);
    setFormData(prev => ({
      ...prev,
      systemPromptKey: presetId,
      customSystemPrompt: selectedPreset?.prompt || prev.customSystemPrompt,
    }));
  };

  const handleSave = () => {
    onSave(formData);
    setIsSavedAlert(true);
    setTimeout(() => {
      setIsSavedAlert(false);
      onClose();
    }, 600);
  };

  const handleResetToDefaults = () => {
    setFormData({ ...DEFAULT_SETTINGS });
  };

  const handleToggleBrowserNotif = async () => {
    if (!formData.browserNotifications) {
      const granted = await requestBrowserNotificationPermission();
      setFormData(prev => ({ ...prev, browserNotifications: granted }));
    } else {
      setFormData(prev => ({ ...prev, browserNotifications: false }));
    }
  };

  const languagesList: Array<{ id: AppLanguage; name: string; nativeName: string; flag: string }> = [
    { id: 'fa', name: 'Persian', nativeName: 'فارسی', flag: '🇮🇷' },
    { id: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
    { id: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
    { id: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
    { id: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
    { id: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
    { id: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`relative w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Modal Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${
          isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">تنظیمات مشاور هوشمند راکان</h2>
              <p className="text-xs text-slate-400">پوسته روز/شب، مدل هوش مصنوعی، لحن و هشدارهای مطالعه</p>
            </div>
          </div>
          <button
            id="close-settings-modal"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className={`flex items-center border-b px-3 overflow-x-auto no-scrollbar ${
          isDark ? 'border-slate-800 bg-slate-950/30' : 'border-slate-200 bg-slate-100/60'
        }`}>
          <button
            id="tab-theme"
            onClick={() => setActiveTab('theme')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors shrink-0 ${
              activeTab === 'theme'
                ? 'border-emerald-500 text-emerald-500 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette className="w-4 h-4" />
            پوسته و اعلانات
          </button>

          <button
            id="tab-model"
            onClick={() => setActiveTab('model')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors shrink-0 ${
              activeTab === 'model'
                ? 'border-emerald-500 text-emerald-500 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            مدل و خلاقیت
          </button>

          <button
            id="tab-prompt"
            onClick={() => setActiveTab('prompt')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors shrink-0 ${
              activeTab === 'prompt'
                ? 'border-emerald-500 text-emerald-500 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquareQuote className="w-4 h-4" />
            لحن و پرامپت
          </button>

          <button
            id="tab-profile"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors shrink-0 ${
              activeTab === 'profile'
                ? 'border-emerald-500 text-emerald-500 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            مشخصات دانش‌آموز
          </button>

          <button
            id="tab-advanced"
            onClick={() => setActiveTab('advanced')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors shrink-0 ${
              activeTab === 'advanced'
                ? 'border-emerald-500 text-emerald-500 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            توکن و هوش مصنوعی شخصی
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 0: THEME & NOTIFICATIONS */}
          {activeTab === 'theme' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Theme Toggle Cards */}
              <div>
                <label className="block text-sm font-bold mb-2">
                  انتخاب تم و پوسته بصری (Theme):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Midnight Dark */}
                  <div
                    id="theme-midnight-btn"
                    onClick={() => setFormData(prev => ({ ...prev, theme: 'dark' }))}
                    className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 ${
                      formData.theme === 'dark'
                        ? 'bg-slate-900 border-emerald-500 ring-2 ring-emerald-500/40 shadow-lg text-white'
                        : isDark
                        ? 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                        : 'bg-slate-100 border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                          <Moon className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-sm">حالت نیمه‌شب (Midnight Dark)</span>
                      </div>
                      {formData.theme === 'dark' && (
                        <Check className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      طراحی تاریک و عمیق، ضد خستگی چشم برای مطالعه شبانه و ساعات طولانی تمرکز
                    </p>
                    <div className="flex gap-1.5 mt-3">
                      <div className="w-4 h-4 rounded-full bg-slate-900 border border-slate-700"></div>
                      <div className="w-4 h-4 rounded-full bg-emerald-500"></div>
                      <div className="w-4 h-4 rounded-full bg-indigo-500"></div>
                    </div>
                  </div>

                  {/* Light Day */}
                  <div
                    id="theme-light-btn"
                    onClick={() => setFormData(prev => ({ ...prev, theme: 'light' }))}
                    className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 ${
                      formData.theme === 'light'
                        ? 'bg-white border-emerald-500 ring-2 ring-emerald-500/40 shadow-lg text-slate-900'
                        : isDark
                        ? 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                        : 'bg-slate-100 border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center">
                          <Sun className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-sm">حالت روشن روز (Daylight Light)</span>
                      </div>
                      {formData.theme === 'light' && (
                        <Check className="w-4 h-4 text-emerald-500" />
                      )}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      پوسته شفاف و روشن، بهینه‌سازی‌شده برای محیط‌های پرنور و شیفت صبح مطالعه
                    </p>
                    <div className="flex gap-1.5 mt-3">
                      <div className="w-4 h-4 rounded-full bg-slate-100 border border-slate-300"></div>
                      <div className="w-4 h-4 rounded-full bg-emerald-500"></div>
                      <div className="w-4 h-4 rounded-full bg-sky-500"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* System Language Selector */}
              <div>
                <label className="block text-sm font-bold mb-2 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-500" />
                  زبان رابط کاربری سامانه (System Language):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {languagesList.map(lang => {
                    const isSelected = (formData.language || 'fa') === lang.id;
                    return (
                      <button
                        key={lang.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, language: lang.id }))}
                        className={`p-2.5 rounded-2xl border text-xs flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/50 text-white font-bold'
                            : isDark
                            ? 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                            : 'bg-slate-100 border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>{lang.flag}</span>
                          <span>{lang.nativeName}</span>
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Font Family Selection */}
              <div>
                <label className="block text-sm font-bold mb-2 flex items-center gap-2">
                  <Type className="w-4 h-4 text-emerald-500" />
                  قلم و تایپوگرافی سامانه (Font Family):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Default Vazirmatn */}
                  <div
                    id="font-vazirmatn-btn"
                    onClick={() => setFormData(prev => ({ ...prev, fontFamily: 'vazirmatn' }))}
                    className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 ${
                      formData.fontFamily !== 'monospace'
                        ? 'bg-emerald-950/30 border-emerald-500 ring-2 ring-emerald-500/40 shadow-lg text-white'
                        : isDark
                        ? 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                        : 'bg-slate-100 border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                          Aa
                        </div>
                        <span className="font-bold text-sm font-sans">قلم وزیرمتن (پیش‌فرض)</span>
                      </div>
                      {formData.fontFamily !== 'monospace' && (
                        <Check className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed font-sans">
                      قلم استاندارد فارسی، روان و چشم‌نواز برای متون مشاوره‌ای، انگیزش و برنامه‌ریزی
                    </p>
                    <div className="mt-2.5 px-2 py-1 rounded-lg bg-slate-800/60 text-[11px] text-emerald-400 font-sans border border-slate-700/50">
                      نمونه: مشاور درسی و هوشمند مدرسه راکان
                    </div>
                  </div>

                  {/* Study Monospace */}
                  <div
                    id="font-monospace-btn"
                    onClick={() => setFormData(prev => ({ ...prev, fontFamily: 'monospace' }))}
                    className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 font-mono ${
                      formData.fontFamily === 'monospace'
                        ? 'bg-emerald-950/30 border-emerald-500 ring-2 ring-emerald-500/40 shadow-lg text-white'
                        : isDark
                        ? 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                        : 'bg-slate-100 border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-mono font-bold text-xs">
                          {`{;}`}
                        </div>
                        <span className="font-bold text-sm font-mono">قلم تک‌فاصله مطالعه (Monospace)</span>
                      </div>
                      {formData.fontFamily === 'monospace' && (
                        <Check className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed font-mono">
                      قلم فنی با خوانایی بالا، عالی برای فرمول‌های ریاضی و فیزیک، یادداشت‌برداری و کد
                    </p>
                    <div className="mt-2.5 px-2 py-1 rounded-lg bg-slate-800/60 text-[11px] text-indigo-300 font-mono border border-slate-700/50" dir="ltr">
                      f(x) = ∫ 2x dx | E = mc²
                    </div>
                  </div>
                </div>
              </div>

              {/* Tactile Keyboard Sound & Audio Feedback */}
              <div className={`p-4 rounded-2xl border space-y-4 ${
                isDark ? 'bg-slate-800/40 border-slate-700/60' : 'bg-slate-50 border-slate-200'
              }`}>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Keyboard className="w-3.5 h-3.5 text-indigo-400" />
                  بازخورد صوتی و تایپ (Tactile Typing Feedback)
                </h4>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold flex items-center gap-2">
                      <span>صدای صفحه‌کلید مکانیکی حین تایپ</span>
                      <button
                        type="button"
                        onClick={() => playMechanicalKeyClick(' ')}
                        className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-[10px] flex items-center gap-1 transition-colors"
                        title="تست صدای کلید"
                      >
                        <Volume2 className="w-3 h-3" />
                        تست کلیک
                      </button>
                    </div>
                    <div className="text-xs text-slate-400">
                      پخش افکت کلیک مکانیکی دقیق و ملایم با فشردن کلیدها در کادر سوال
                    </div>
                  </div>
                  <button
                    id="toggle-mech-keyboard-sound"
                    type="button"
                    onClick={() => {
                      const nextVal = !formData.mechanicalKeyboardSound;
                      setFormData(prev => ({ ...prev, mechanicalKeyboardSound: nextVal }));
                      if (nextVal) playMechanicalKeyClick('Enter');
                    }}
                    className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                      formData.mechanicalKeyboardSound !== false ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        formData.mechanicalKeyboardSound !== false ? 'translate-x-0' : '-translate-x-6'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Notification Preferences */}
              <div className={`p-4 rounded-2xl border space-y-4 ${
                isDark ? 'bg-slate-800/40 border-slate-700/60' : 'bg-slate-50 border-slate-200'
              }`}>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Bell className="w-3.5 h-3.5 text-emerald-500" />
                  تنظیمات سیستم یادآوری و اعلانات
                </h4>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">اعلان‌های مرورگر (Push Notifications)</div>
                    <div className="text-xs text-slate-400">دریافت اعلان پایان تایمر پومودورو یا پیام‌های مهم مشاور</div>
                  </div>
                  <button
                    id="toggle-browser-notif"
                    type="button"
                    onClick={handleToggleBrowserNotif}
                    className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                      formData.browserNotifications ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        formData.browserNotifications ? 'translate-x-0' : '-translate-x-6'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-700/30">
                  <div>
                    <div className="text-sm font-semibold">هشدارهای بازدهی و استراحت پومودورو</div>
                    <div className="text-xs text-slate-400">پخش افکت صوتی آرامش‌بخش در انتهای دوره‌های ۲۵ دقیقه‌ای</div>
                  </div>
                  <button
                    id="toggle-study-reminders"
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, studyReminders: !prev.studyReminders }))}
                    className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                      formData.studyReminders ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        formData.studyReminders ? 'translate-x-0' : '-translate-x-6'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: MODEL & TEMPERATURE */}
          {activeTab === 'model' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className={`p-3.5 rounded-2xl border text-xs leading-relaxed ${
                isDark ? 'bg-slate-950/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <p className="font-bold text-emerald-400 mb-1 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  مدل بهینه و انعطاف‌پذیری تنظیمات:
                </p>
                <p className="text-slate-400">
                  بهترین روش در سامانه راکان این است که مدل پیش‌فرض بهینه توسط توسعه‌دهنده در پنل مدیریت تعیین می‌شود تا کاربران عمومی درگیر پیچیدگی‌های فنی نشوند؛ با این حال شما در این بخش می‌توانید مدل دلخواه و ضریب خلاقیت (Temperature) را متناسب با نیاز مطالعاتی خود تنظیم نمایید.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  انتخاب مدل هوش مصنوعی (AI Model):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {AVAILABLE_MODELS.map(m => {
                    const isSelected = formData.model === m.id;
                    return (
                      <div
                        key={m.id}
                        onClick={() => setFormData(prev => ({ ...prev, model: m.id }))}
                        className={`cursor-pointer p-3.5 rounded-2xl border transition-all duration-200 ${
                          isSelected
                            ? 'bg-emerald-950/40 border-emerald-500/80 shadow-md ring-1 ring-emerald-500/50 text-white'
                            : isDark
                            ? 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-sm">{m.name}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                            isSelected
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                              : 'bg-slate-700/50 text-slate-400 border-slate-600/50'
                          }`}>
                            {m.tag}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">{m.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Temperature Slider */}
              <div className={`p-4 rounded-2xl border space-y-3 ${
                isDark ? 'bg-slate-800/40 border-slate-700/60' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-400" />
                    <span className="text-sm font-semibold">میزان خلاقیت (Temperature):</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 text-xs font-mono font-bold border border-indigo-500/30">
                    {formData.temperature.toFixed(2)}
                  </span>
                </div>

                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={formData.temperature}
                  onChange={e => setFormData(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />

                <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                  <span className={formData.temperature < 0.35 ? 'text-emerald-400 font-bold' : ''}>
                    🎯 ۰٫۰ - دقیق و فرمولی
                  </span>
                  <span className={formData.temperature >= 0.35 && formData.temperature <= 0.75 ? 'text-indigo-400 font-bold' : ''}>
                    ⚖️ ۰٫۷ - متعادل و طبیعی
                  </span>
                  <span className={formData.temperature > 0.75 ? 'text-amber-400 font-bold' : ''}>
                    💡 ۱٫۰ - خلاقانه و پرانرژی
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SYSTEM PROMPT & TONE */}
          {activeTab === 'prompt' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  انتخاب لحن و شخصیت مشاور:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {SYSTEM_PROMPT_PRESETS.map(preset => {
                    const isSelected = formData.systemPromptKey === preset.id;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => handlePresetSelect(preset.id)}
                        className={`cursor-pointer p-3 rounded-2xl border transition-all ${
                          isSelected
                            ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/40 text-white'
                            : isDark
                            ? 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs sm:text-sm">{preset.title}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-300 border border-slate-600/40">
                            {preset.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2">{preset.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold">
                    متن پرامپت سیستمی (System Prompt):
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {formData.customSystemPrompt.length} کاراکتر
                  </span>
                </div>
                <textarea
                  rows={7}
                  value={formData.customSystemPrompt}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      customSystemPrompt: e.target.value,
                      systemPromptKey: 'custom',
                    }))
                  }
                  placeholder="دستورالعمل سیستمی برای تعیین هویت و لحن چت‌بات مشاور راکان..."
                  className={`w-full p-3.5 rounded-2xl border text-xs sm:text-sm leading-relaxed focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none font-sans ${
                    isDark ? 'bg-slate-950 border-slate-700/80 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>
            </div>
          )}

          {/* TAB 3: STUDENT PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <label className="block text-xs font-semibold mb-1.5">
                  نام یا لقب دانش‌آموز:
                </label>
                <input
                  type="text"
                  value={formData.studentName}
                  onChange={e => setFormData(prev => ({ ...prev, studentName: e.target.value }))}
                  placeholder="مثال: علی، سارا، قهرمان راکان..."
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-emerald-500 ${
                    isDark ? 'bg-slate-950 border-slate-700/80 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    پایه تحصیلی:
                  </label>
                  <select
                    value={formData.studentGrade}
                    onChange={e => setFormData(prev => ({ ...prev, studentGrade: e.target.value }))}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-emerald-500 ${
                      isDark ? 'bg-slate-950 border-slate-700/80 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="کنکوری (پایه دوازدهم)">کنکوری (پایه دوازدهم)</option>
                    <option value="پایه یازدهم">پایه یازدهم</option>
                    <option value="پایه دهم">پایه دهم</option>
                    <option value="متوسطه اول (هفتم تا نهم)">متوسطه اول (هفتم تا نهم)</option>
                    <option value="فارغ‌التحصیل / پشت کنکور">فارغ‌التحصیل / پشت کنکور</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    رشته تحصیلی:
                  </label>
                  <select
                    value={formData.studentField}
                    onChange={e => setFormData(prev => ({ ...prev, studentField: e.target.value }))}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-emerald-500 ${
                      isDark ? 'bg-slate-950 border-slate-700/80 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="علوم تجربی">علوم تجربی</option>
                    <option value="ریاضی و فیزیک">ریاضی و فیزیک</option>
                    <option value="ادبیات و علوم انسانی">ادبیات و علوم انسانی</option>
                    <option value="فنی و حرفه‌ای / هنر">فنی و حرفه‌ای / هنر</option>
                    <option value="زبان‌های خارجی">زبان‌های خارجی</option>
                  </select>
                </div>
              </div>

              {/* Multi-item Study Goals */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-emerald-400" />
                    اهداف مطالعاتی و چشم‌انداز آموزشی (Study Goals):
                  </span>
                  <span className="text-[11px] text-slate-400">تزریق مستقیم به حافظه مشاور</span>
                </label>
                
                {/* Active Goals List */}
                <div className="space-y-2 mb-3">
                  {(formData.studyGoals && formData.studyGoals.length > 0) ? (
                    formData.studyGoals.map((goal, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs ${
                          isDark ? 'bg-slate-950/80 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[10px]">
                            {idx + 1}
                          </span>
                          <span>{goal}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveGoal(idx)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="حذف هدف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 rounded-xl border border-dashed text-xs text-slate-400 text-center">
                      هنوز هدفی ثبت نشده است. هدفی مانند «تسلط بر انتگرال و فیزیک پایه» اضافه کنید.
                    </div>
                  )}
                </div>

                {/* Add Goal Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newGoalInput}
                    onChange={e => setNewGoalInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddGoal();
                      }
                    }}
                    placeholder="هدف جدید را وارد کنید (مثال: رتبه زیر ۵۰۰ کنکور، یادگیری لغات تافل)..."
                    className={`flex-1 px-3.5 py-2 rounded-xl border text-xs focus:outline-none focus:border-emerald-500 ${
                      isDark ? 'bg-slate-950 border-slate-700/80 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleAddGoal}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    افزودن
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ADVANCED / CUSTOM AI & TOKEN */}
          {activeTab === 'advanced' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className={`p-4 rounded-2xl border text-xs leading-relaxed flex items-start gap-3 ${
                isDark ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}>
                <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm mb-1 text-emerald-600 dark:text-emerald-300">اتصال با توکن و هوش مصنوعی دلخواه شما (Custom AI Token):</p>
                  <p className="text-slate-400 dark:text-slate-300">
                    می‌توانید به جای جمینای، از هوش مصنوعی اختصاصی خود، توکن OpenAI، دیپ‌سیک (DeepSeek)، کلود (Claude)، سرور دانشگاه یا مدرسه پارت‌اسکول استفاده کنید.
                  </p>
                </div>
              </div>

              {/* Quick Presets */}
              <div>
                <label className="block text-xs font-semibold mb-2 text-slate-400">
                  قالب‌های آماده برای اتصال سریع:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        model: 'custom-ai',
                        customEndpointUrl: 'https://api.openai.com/v1',
                        customModelName: 'gpt-4o'
                      }));
                    }}
                    className={`p-2.5 rounded-xl border text-right transition-all ${
                      formData.customEndpointUrl?.includes('openai.com')
                        ? 'border-emerald-500 bg-emerald-500/10 font-bold'
                        : isDark ? 'border-slate-800 bg-slate-950 hover:bg-slate-800' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <span className="block font-bold">OpenAI / GPT-4o</span>
                    <span className="text-[10px] text-slate-400">api.openai.com</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        model: 'custom-ai',
                        customEndpointUrl: 'https://api.deepseek.com/v1',
                        customModelName: 'deepseek-chat'
                      }));
                    }}
                    className={`p-2.5 rounded-xl border text-right transition-all ${
                      formData.customEndpointUrl?.includes('deepseek.com')
                        ? 'border-emerald-500 bg-emerald-500/10 font-bold'
                        : isDark ? 'border-slate-800 bg-slate-950 hover:bg-slate-800' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <span className="block font-bold">DeepSeek AI</span>
                    <span className="text-[10px] text-slate-400">deepseek-chat</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        model: 'racode-llm',
                        customEndpointUrl: 'https://racode-llm.partschool.ir/v1',
                        customModelName: 'racode-llm'
                      }));
                    }}
                    className={`p-2.5 rounded-xl border text-right transition-all ${
                      formData.customEndpointUrl?.includes('partschool.ir')
                        ? 'border-emerald-500 bg-emerald-500/10 font-bold'
                        : isDark ? 'border-slate-800 bg-slate-950 hover:bg-slate-800' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <span className="block font-bold">پارت‌اسکول راکان</span>
                    <span className="text-[10px] text-slate-400">racode-llm</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">
                  نام مدل هوش مصنوعی (Model ID):
                </label>
                <div className="relative">
                  <Cpu className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={formData.customModelName || ''}
                    onChange={e => setFormData(prev => ({ ...prev, customModelName: e.target.value, model: 'custom-ai' }))}
                    placeholder="مثال: gpt-4o, deepseek-chat, claude-3-5-sonnet, my-custom-model"
                    className={`w-full pr-9 pl-3 py-2.5 rounded-xl border text-xs sm:text-sm font-mono text-left dir-ltr focus:outline-none focus:border-emerald-500 ${
                      isDark ? 'bg-slate-950 border-slate-700/80 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">
                  آدرس اندپوینت سرور (API Base URL):
                </label>
                <div className="relative">
                  <Link2 className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={formData.customEndpointUrl}
                    onChange={e => setFormData(prev => ({ ...prev, customEndpointUrl: e.target.value, model: 'custom-ai' }))}
                    placeholder="https://api.openai.com/v1 یا https://api.deepseek.com/v1"
                    className={`w-full pr-9 pl-3 py-2.5 rounded-xl border text-xs sm:text-sm font-mono text-left dir-ltr focus:outline-none focus:border-emerald-500 ${
                      isDark ? 'bg-slate-950 border-slate-700/80 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">
                  توکن دسترسی شخصی / API Key:
                </label>
                <div className="relative">
                  <KeyRound className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={formData.customApiKey}
                    onChange={e => setFormData(prev => ({ ...prev, customApiKey: e.target.value, model: 'custom-ai' }))}
                    placeholder="sk-... توکن اختصاصی هوش مصنوعی خود را وارد کنید"
                    className={`w-full pr-9 pl-3 py-2.5 rounded-xl border text-xs sm:text-sm font-mono text-left dir-ltr focus:outline-none focus:border-emerald-500 ${
                      isDark ? 'bg-slate-950 border-slate-700/80 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  🔒 توکن شما تنها در مرورگر خودتان ذخیره می‌شود و مستقیماً برای فراخوانی API مدل مدنظر شما استفاده خواهد شد.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className={`flex items-center justify-between px-5 py-4 border-t ${
          isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
        }`}>
          <button
            onClick={handleResetToDefaults}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            بازنشانی به پیش‌فرض
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm text-slate-400 hover:bg-slate-800 transition-colors"
            >
              انصراف
            </button>
            <button
              id="save-settings-btn"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50 transition-all"
            >
              {isSavedAlert ? (
                <>
                  <Check className="w-4 h-4" />
                  ذخیره شد!
                </>
              ) : (
                'ذخیره تنظیمات'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
