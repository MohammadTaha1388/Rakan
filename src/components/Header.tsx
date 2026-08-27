import React, { useState } from 'react';
import {
  Settings,
  FileText,
  PlusCircle,
  Sparkles,
  GraduationCap,
  Wrench,
  Bell,
  User,
  Sun,
  Moon,
  LogOut,
  ChevronDown,
  LogIn,
  Download,
  Shield,
  Globe
} from 'lucide-react';
import { AdvisorSettings, UserProfile } from '../types';
import { SYSTEM_PROMPT_PRESETS } from '../utils/constants';
import { MiniActivityChart } from './MiniActivityChart';
import { SUPPORTED_LANGUAGES, getTranslation, AppLanguage } from '../utils/i18n';

interface HeaderProps {
  settings: AdvisorSettings;
  logsCount: number;
  user: UserProfile | null;
  unreadNotifs: number;
  hasMessages?: boolean;
  onDownloadChat?: () => void;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  onNewChat: () => void;
  onToggleTools: () => void;
  onOpenAuth: () => void;
  onOpenDevPanel?: () => void;
  onLogout: () => void;
  onOpenNotifications: () => void;
  onToggleTheme: () => void;
  onLanguageChange?: (lang: AppLanguage) => void;
  isToolsOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  logsCount,
  user,
  unreadNotifs,
  hasMessages = false,
  onDownloadChat,
  onOpenSettings,
  onOpenHistory,
  onNewChat,
  onToggleTools,
  onOpenAuth,
  onOpenDevPanel,
  onLogout,
  onOpenNotifications,
  onToggleTheme,
  onLanguageChange,
  isToolsOpen,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const lang: AppLanguage = (settings.language as AppLanguage) || 'fa';
  const currentLangMeta = SUPPORTED_LANGUAGES.find(l => l.code === lang) || SUPPORTED_LANGUAGES[0];

  const currentPreset = SYSTEM_PROMPT_PRESETS.find(p => p.id === settings.systemPromptKey);
  const isDark = settings.theme === 'dark';

  const t = (key: string, fallback?: string) => getTranslation(lang, key, fallback);

  return (
    <header className={`sticky top-0 z-30 backdrop-blur-md border-b shadow-lg px-3 sm:px-6 py-3 transition-colors ${
      isDark
        ? 'bg-slate-900/90 border-slate-800 text-white'
        : 'bg-white/90 border-slate-200 text-slate-900'
    }`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-indigo-600 shadow-md shadow-emerald-900/30 ring-2 ring-emerald-400/30 shrink-0">
            <GraduationCap className="w-6 h-6 text-white" />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight flex items-center gap-1.5">
                {t('appName', 'مدرسه راکان')}
                <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 font-medium">
                  {t('appSubtitle', 'مشاور درسی هوشمند')}
                </span>
              </h1>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span className="inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>{t('activeModel', 'مدل')}:</span> <strong className="font-mono text-[11px] text-emerald-500 dark:text-emerald-400">{settings.model}</strong>
              </span>
              <span className="hidden md:inline text-slate-500">•</span>
              <span className="hidden md:inline-flex items-center gap-1">
                <span>لحن:</span> <span className="text-indigo-400">{currentPreset ? currentPreset.title : 'شخصی‌سازی'}</span>
              </span>
              <span className="hidden lg:inline text-slate-500">•</span>
              <span className="hidden lg:inline-flex items-center gap-1">
                <span>دما:</span> <span className="font-mono text-amber-400">{settings.temperature}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              id="header-language-toggle-btn"
              onClick={() => setShowLangMenu(!showLangMenu)}
              className={`p-2 rounded-xl border text-xs transition-colors flex items-center gap-1 font-medium ${
                isDark
                  ? 'bg-slate-800/80 border-slate-700/70 text-slate-200 hover:bg-slate-800'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
              title={t('language', 'انتخاب زبان')}
            >
              <Globe className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold">{currentLangMeta.flag}</span>
              <span className="hidden sm:inline text-[11px] font-mono uppercase">{currentLangMeta.code}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showLangMenu && (
              <div
                className={`absolute left-0 mt-2 w-44 rounded-2xl border shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 ${
                  isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
                }`}
                onMouseLeave={() => setShowLangMenu(false)}
              >
                {SUPPORTED_LANGUAGES.map(l => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setShowLangMenu(false);
                      onLanguageChange?.(l.code);
                    }}
                    className={`w-full text-right px-2.5 py-1.5 text-xs rounded-xl flex items-center justify-between transition-colors ${
                      lang === l.code
                        ? 'bg-emerald-500/20 text-emerald-400 font-bold'
                        : isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{l.flag}</span>
                      <span>{l.nativeName}</span>
                    </span>
                    <span className="text-[10px] uppercase font-mono opacity-60">{l.code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Developer Master Panel Button */}
          {onOpenDevPanel && (
            <button
              id="header-dev-panel-btn"
              onClick={onOpenDevPanel}
              className={`p-2 rounded-xl border text-xs transition-colors flex items-center gap-1 font-bold ${
                isDark
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
              }`}
              title="ورود به پنل مدیریت توسعه‌دهنده (Master Prompt & Users Data)"
            >
              <Shield className="w-4 h-4" />
              <span className="hidden xl:inline">{t('developerPanel', 'پنل توسعه‌دهنده')}</span>
            </button>
          )}

          {/* Quick Theme Toggle */}
          <button
            id="quick-theme-toggle-btn"
            onClick={onToggleTheme}
            className={`p-2 rounded-xl border text-xs transition-colors ${
              isDark
                ? 'bg-slate-800/80 border-slate-700/70 text-amber-400 hover:bg-slate-800'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
            title={isDark ? t('themeLight', 'حالت روشن') : t('themeDark', 'حالت تاریک')}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Weekly Activity Mini Recharts Chart */}
          <MiniActivityChart theme={settings.theme} refreshTrigger={logsCount} />

          {/* Notifications Center Toggle */}
          <button
            id="notifications-toggle-btn"
            onClick={onOpenNotifications}
            className={`relative p-2 rounded-xl border text-xs transition-colors ${
              isDark
                ? 'bg-slate-800/80 border-slate-700/70 text-slate-300 hover:bg-slate-800'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
            title={t('notifications', 'مرکز اعلانات')}
          >
            <Bell className="w-4 h-4 text-emerald-400" />
            {unreadNotifs > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                {unreadNotifs > 9 ? '9+' : unreadNotifs}
              </span>
            )}
          </button>

          {/* Download Chat Export Button */}
          {hasMessages && onDownloadChat && (
            <button
              id="header-download-chat-btn"
              onClick={onDownloadChat}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-medium border transition-all ${
                isDark
                  ? 'bg-slate-800/80 text-emerald-400 border-emerald-500/40 hover:bg-slate-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
              }`}
              title="دانلود متن گفتگوی جاری (.txt)"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">دانلود گفتگو</span>
            </button>
          )}

          {/* Study Tools Drawer Toggle */}
          <button
            id="header-tools-toggle-btn"
            onClick={onToggleTools}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all border ${
              isToolsOpen
                ? 'bg-indigo-600/30 text-indigo-400 border-indigo-500/50 shadow-inner'
                : isDark
                ? 'bg-slate-800/80 text-slate-300 border-slate-700/70 hover:bg-slate-800'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
            title={t('tools', 'ابزارهای مطالعه')}
          >
            <Wrench className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">{t('tools', 'جعبه‌ابزار')}</span>
          </button>

          {/* Chat History & Log Viewer */}
          <button
            id="header-history-btn"
            onClick={onOpenHistory}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-medium border transition-all ${
              isDark
                ? 'bg-slate-800/80 text-slate-300 border-slate-700/70 hover:bg-slate-800'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
            title={t('history', 'تاریخچه پیام‌ها')}
          >
            <FileText className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">{t('history', 'تاریخچه')}</span>
            {logsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-500 text-[11px] font-bold border border-amber-500/40">
                {logsCount}
              </span>
            )}
          </button>

          {/* AI Settings Modal */}
          <button
            id="header-settings-btn"
            onClick={onOpenSettings}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-medium border transition-all ${
              isDark
                ? 'bg-slate-800/80 text-slate-300 border-slate-700/70 hover:bg-slate-800'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
            title={t('settings', 'تنظیمات')}
          >
            <Settings className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">{t('settings', 'تنظیمات')}</span>
          </button>

          {/* User Profile / Auth Button */}
          {user ? (
            <div className="relative">
              <button
                id="user-profile-menu-btn"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs transition-all ${
                  isDark ? 'bg-slate-800/80 border-slate-700/70 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'
                }`}
              >
                <div className={`w-6 h-6 rounded-lg ${user.avatarColor || 'bg-emerald-500'} text-white flex items-center justify-center font-bold text-[11px]`}>
                  {user.name.slice(0, 1)}
                </div>
                <div className="hidden md:flex flex-col text-right">
                  <span className="font-semibold max-w-28 truncate text-[11px]">{user.name}</span>
                  <span className="text-[9px] text-emerald-400">{user.roleTitle || user.grade}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showUserMenu && (
                <div
                  className={`absolute left-0 mt-2 w-60 rounded-2xl border shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 ${
                    isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                  onMouseLeave={() => setShowUserMenu(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-800/50 mb-1">
                    <p className="font-bold text-xs">{user.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-medium border border-emerald-500/30">
                        {user.roleTitle || user.grade || 'دانش‌آموز راکان'}
                      </span>
                    </div>
                  </div>
                  {onOpenDevPanel && (
                    <button
                      onClick={() => { setShowUserMenu(false); onOpenDevPanel(); }}
                      className="w-full text-right px-3 py-2 text-xs rounded-xl hover:bg-emerald-500/10 text-emerald-400 flex items-center gap-2 transition-colors font-bold"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>{t('developerPanel', 'پنل توسعه‌دهنده')}</span>
                    </button>
                  )}
                  <button
                    onClick={() => { setShowUserMenu(false); onOpenSettings(); }}
                    className="w-full text-right px-3 py-2 text-xs rounded-xl hover:bg-slate-800/50 flex items-center gap-2 transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                    <span>ویرایش مشخصات درسی</span>
                  </button>
                  <button
                    onClick={() => { setShowUserMenu(false); onLogout(); }}
                    className="w-full text-right px-3 py-2 text-xs rounded-xl hover:bg-rose-500/10 text-rose-400 flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{t('logout', 'خروج از حساب کاربری')}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              id="header-login-btn"
              onClick={onOpenAuth}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
                isDark
                  ? 'bg-slate-800/90 text-emerald-400 border-emerald-500/40 hover:bg-slate-800'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">{t('loginRegister', 'ورود / ثبت‌نام')}</span>
            </button>
          )}

          {/* New Chat Button */}
          <button
            id="header-new-chat-btn"
            onClick={onNewChat}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40 transition-all duration-200 active:scale-95"
            title={t('newChat', 'شروع گفتگوی جدید')}
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">{t('newChat', 'گفتگوی جدید')}</span>
          </button>
        </div>
      </div>
    </header>
  );
};


