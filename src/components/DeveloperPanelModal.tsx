import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  Lock,
  Users,
  MessageSquare,
  Sliders,
  KeyRound,
  Download,
  Trash2,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Eye,
  ShieldAlert,
  GraduationCap,
  Sparkles,
  LogOut
} from 'lucide-react';
import { DeveloperSettings, AdminUserData, InteractionLog } from '../types';

interface DeveloperPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'dark' | 'light';
}

export const DeveloperPanelModal: React.FC<DeveloperPanelModalProps> = ({
  isOpen,
  onClose,
  theme = 'dark'
}) => {
  const [devToken, setDevToken] = useState<string | null>(() => localStorage.getItem('rakan_dev_token'));
  const [usernameInput, setUsernameInput] = useState('rakan_Mohammad');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'prompt_security' | 'users' | 'messages' | 'security_stats'>('prompt_security');

  // Admin Data
  const [loadingData, setLoadingData] = useState(false);
  const [users, setUsers] = useState<AdminUserData[]>([]);
  const [logs, setLogs] = useState<InteractionLog[]>([]);
  const [devSettings, setDevSettings] = useState<DeveloperSettings | null>(null);
  const [stats, setStats] = useState<{
    totalUsers: number;
    totalMessages: number;
    totalBlockedThreats: number;
    serverUptime: number;
  } | null>(null);

  // Master Prompt & Model State
  const [masterPrompt, setMasterPrompt] = useState('');
  const [devDefaultModel, setDevDefaultModel] = useState('gemini-3.7-flash');
  const [antiInjection, setAntiInjection] = useState(true);
  const [antiLeakage, setAntiLeakage] = useState(true);
  const [allowUserPrompt, setAllowUserPrompt] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);

  // Change Password
  const [newPassword, setNewPassword] = useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState<string | null>(null);

  // Filter & Search
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [logSearch, setLogSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<InteractionLog | null>(null);

  const isDark = theme === 'dark';

  const safeJson = async (res: Response) => {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return { success: false, error: text || 'پاسخ نامعتبر از سرور' };
    }
  };

  const fetchAdminData = async (token: string) => {
    setLoadingData(true);
    try {
      const res = await fetch('/api/admin/data', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await safeJson(res);
      if (!res.ok || !data.success) {
        if (res.status === 403) {
          // Token expired or invalid
          setDevToken(null);
          localStorage.removeItem('rakan_dev_token');
          setLoginError('نشست توسعه‌دهنده منقضی شده است. لطفاً مشخصات را مجدداً وارد فرمایید.');
        }
        return;
      }

      setUsers(data.data.users || []);
      setLogs(data.data.logs || []);
      setDevSettings(data.data.developerSettings);
      setStats(data.data.stats);

      if (data.data.developerSettings) {
        setMasterPrompt(data.data.developerSettings.masterSystemPrompt || '');
        setDevDefaultModel(data.data.developerSettings.defaultModel || 'gemini-3.7-flash');
        setAntiInjection(data.data.developerSettings.antiPromptInjection !== false);
        setAntiLeakage(data.data.developerSettings.antiLeakageGuardrails !== false);
        setAllowUserPrompt(data.data.developerSettings.allowUserCustomPrompt !== false);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (isOpen && devToken) {
      fetchAdminData(devToken);
    }
  }, [isOpen, devToken]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: usernameInput.trim(),
          password: passwordInput.trim()
        })
      });
      const data = await safeJson(res);
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'نام کاربری یا رمز عبور توسعه‌دهنده صحیح نیست.');
      }

      setDevToken(data.devToken);
      localStorage.setItem('rakan_dev_token', data.devToken);
      setPasswordInput('');
      fetchAdminData(data.devToken);
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : 'خطا در احراز هویت');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    if (devToken) {
      try {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${devToken}` }
        });
      } catch {}
    }
    setDevToken(null);
    localStorage.removeItem('rakan_dev_token');
  };

  const handleSaveSettings = async () => {
    if (!devToken) return;
    setSavingSettings(true);
    setSettingsSuccess(null);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${devToken}`
        },
        body: JSON.stringify({
          masterSystemPrompt: masterPrompt,
          antiPromptInjection: antiInjection,
          antiLeakageGuardrails: antiLeakage,
          allowUserCustomPrompt: allowUserPrompt,
          defaultModel: devDefaultModel
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'خطا در ذخیره تنظیمات');
      }

      setSettingsSuccess('پرامپت اصلی و تنظیمات امنیتی توسعه‌دهنده با موفقیت ذخیره و در هسته هوش مصنوعی اعمال شد.');
      setTimeout(() => setSettingsSuccess(null), 4000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'خطا در ذخیره تنظیمات');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!devToken || !newPassword) return;

    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${devToken}`
        },
        body: JSON.stringify({ newPassword })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'خطا در تغییر رمز');
      }
      setPasswordChangeSuccess('رمز عبور پنل توسعه‌دهنده با موفقیت تغییر یافت.');
      setNewPassword('');
      setTimeout(() => setPasswordChangeSuccess(null), 4000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'خطا در تغییر رمز');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!devToken) return;
    if (!window.confirm(`آیا از حذف کاربر «${userName}» اطمینان دارید؟`)) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${devToken}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(prev => prev.filter(u => u.id !== userId));
      } else {
        alert(data.error || 'خطا در حذف کاربر');
      }
    } catch {
      alert('خطا در ارتباط با سرور');
    }
  };

  const handleClearAllLogs = async () => {
    if (!devToken) return;
    if (!window.confirm('آیا مطمئن هستید که می‌خواهید تمامی پیام‌ها و چت‌های ذخیره‌شده کاربران را پاک کنید؟')) return;

    try {
      const res = await fetch('/api/admin/clear-logs', {
        method: 'POST',
        headers: { Authorization: `Bearer ${devToken}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLogs([]);
        alert('تمام گزارش‌ها با موفقیت پاک‌سازی شدند.');
      }
    } catch {
      alert('خطا در پاک‌سازی');
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredLogs = logs.filter(l => {
    const queryMatch = l.userQuery?.toLowerCase().includes(logSearch.toLowerCase()) || l.botResponse?.toLowerCase().includes(logSearch.toLowerCase()) || l.userName?.toLowerCase().includes(logSearch.toLowerCase()) || l.userEmail?.toLowerCase().includes(logSearch.toLowerCase());
    return queryMatch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-5xl h-[90vh] max-h-[850px] rounded-3xl border flex flex-col shadow-2xl overflow-hidden ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-white shadow-emerald-950/40'
            : 'bg-white border-slate-200 text-slate-900 shadow-slate-400/40'
        }`}
      >
        {/* Top Header */}
        <div className={`p-4 md:px-6 border-b flex items-center justify-between shrink-0 ${
          isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight">پنل مدیریت و امنیت توسعه‌دهنده راکان</h2>
                <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                  محرمانه
                </span>
              </div>
              <p className="text-xs text-slate-400">کنترل پرامپت حاکم، حریم خصوصی اطلاعات و پایش کاربران</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {devToken && (
              <button
                id="dev-logout-btn"
                onClick={handleLogout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all text-xs flex items-center gap-1.5"
                title="خروج از پنل توسعه‌دهنده"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">خروج</span>
              </button>
            )}
            <button
              id="close-dev-panel"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        {!devToken ? (
          /* Password Authentication Gate */
          <div className="flex-1 flex items-center justify-center p-6">
            <div className={`w-full max-w-md p-6 rounded-3xl border text-center ${
              isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black mb-1">ورود به بخش توسعه‌دهنده</h3>
              <p className="text-xs text-slate-400 mb-5">
                جهت دسترسی به پرامپت حاکم سیستمی و پایگاه داده اطلاعات کاربران، رمز عبور توسعه‌دهنده را وارد کنید.
              </p>

              {loginError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-3">
                <div className="text-right">
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    نام کاربری توسعه‌دهنده
                  </label>
                  <div className="relative">
                    <input
                      id="dev-username-input"
                      type="text"
                      required
                      value={usernameInput}
                      onChange={e => setUsernameInput(e.target.value)}
                      placeholder="نام کاربری توسعه‌دهنده (مثال: rakan_Mohammad)"
                      dir="ltr"
                      className={`w-full pr-10 pl-3 py-2.5 rounded-xl border text-sm font-mono text-left focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${
                        isDark ? 'bg-slate-900 border-slate-800 text-white placeholder:text-slate-600' : 'bg-white border-slate-200 text-slate-900'
                      }`}
                    />
                    <Users className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                  </div>
                </div>

                <div className="text-right">
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    رمز عبور امن
                  </label>
                  <div className="relative">
                    <input
                      id="dev-password-input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={passwordInput}
                      onChange={e => setPasswordInput(e.target.value)}
                      placeholder="رمز عبور محرمانه"
                      dir="ltr"
                      className={`w-full pr-10 pl-10 py-2.5 rounded-xl border text-sm font-mono text-left focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${
                        isDark ? 'bg-slate-900 border-slate-800 text-white placeholder:text-slate-600' : 'bg-white border-slate-200 text-slate-900'
                      }`}
                    />
                    <KeyRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-3 text-slate-400 hover:text-white transition-colors"
                      title={showPassword ? 'مخفی کردن رمز' : 'نمایش رمز'}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <button
                  id="dev-submit-password-btn"
                  type="submit"
                  disabled={loginLoading}
                  className="w-full mt-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  <span>{loginLoading ? 'در حال تایید...' : 'احراز هویت و ورود به پنل'}</span>
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Authenticated Developer Dashboard */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Sidebar Navigation */}
            <div className={`w-full md:w-64 border-b md:border-b-0 md:border-l p-3 flex md:flex-col gap-1.5 shrink-0 overflow-x-auto ${
              isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <button
                id="dev-tab-prompt"
                onClick={() => setActiveTab('prompt_security')}
                className={`flex-1 md:flex-none p-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 text-right ${
                  activeTab === 'prompt_security'
                    ? 'bg-emerald-500 text-white shadow-md'
                    : isDark ? 'text-slate-400 hover:bg-slate-900 hover:text-white' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Sliders className="w-4 h-4 shrink-0" />
                <span>پرامپت حاکم و امنیت</span>
              </button>

              <button
                id="dev-tab-users"
                onClick={() => setActiveTab('users')}
                className={`flex-1 md:flex-none p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2 text-right ${
                  activeTab === 'users'
                    ? 'bg-emerald-500 text-white shadow-md'
                    : isDark ? 'text-slate-400 hover:bg-slate-900 hover:text-white' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 shrink-0" />
                  <span>کاربران ثبت‌نامی</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/20 font-mono">
                  {users.length}
                </span>
              </button>

              <button
                id="dev-tab-messages"
                onClick={() => setActiveTab('messages')}
                className={`flex-1 md:flex-none p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2 text-right ${
                  activeTab === 'messages'
                    ? 'bg-emerald-500 text-white shadow-md'
                    : isDark ? 'text-slate-400 hover:bg-slate-900 hover:text-white' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span>پیام‌ها و چت‌ها</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/20 font-mono">
                  {logs.length}
                </span>
              </button>

              <button
                id="dev-tab-stats"
                onClick={() => setActiveTab('security_stats')}
                className={`flex-1 md:flex-none p-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 text-right ${
                  activeTab === 'security_stats'
                    ? 'bg-emerald-500 text-white shadow-md'
                    : isDark ? 'text-slate-400 hover:bg-slate-900 hover:text-white' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>پایش امنیت و سرور</span>
              </button>

              <div className="mt-auto hidden md:block pt-3 border-t border-slate-800/60">
                <button
                  onClick={() => fetchAdminData(devToken)}
                  className="w-full p-2 rounded-xl text-[11px] text-slate-400 hover:text-emerald-400 hover:bg-slate-900 flex items-center justify-center gap-1.5 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin' : ''}`} />
                  به‌روزرسانی اطلاعات
                </button>
              </div>
            </div>

            {/* Tab Views */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
              {/* TAB 1: MASTER PROMPT & SECURITY */}
              {activeTab === 'prompt_security' && (
                <div className="space-y-6">
                  {settingsSuccess && (
                    <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      <span>{settingsSuccess}</span>
                    </div>
                  )}

                  {/* Master System Prompt Box */}
                  <div className={`p-5 rounded-3xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-bold flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        پرامپت حاکم سیستمی توسعه‌دهنده (Master System Prompt)
                      </label>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-bold">
                        بالاترین اولویت حاکمیتی
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-3">
                      این پرامپت در سرتاسر سیستم به عنوان مرجع اصلی عمل می‌کند و بالاتر از تمام پرامپت‌ها و درخواست‌های دانش‌آموز اولویت دارد.
                    </p>

                    <textarea
                      id="master-system-prompt-textarea"
                      value={masterPrompt}
                      onChange={e => setMasterPrompt(e.target.value)}
                      rows={10}
                      className={`w-full p-3.5 rounded-2xl border text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-y ${
                        isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    />

                    {/* Security Toggles */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                      <label className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer ${
                        antiInjection ? 'border-emerald-500/50 bg-emerald-500/5' : isDark ? 'border-slate-800' : 'border-slate-200'
                      }`}>
                        <div className="pr-2">
                          <div className="text-xs font-bold">فیلتر ضد نفوذ (Anti-Injection)</div>
                          <div className="text-[10px] text-slate-400">جلوگیری از دور زدن قوانین پرامپت</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={antiInjection}
                          onChange={e => setAntiInjection(e.target.checked)}
                          className="w-4 h-4 accent-emerald-500 rounded"
                        />
                      </label>

                      <label className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer ${
                        antiLeakage ? 'border-emerald-500/50 bg-emerald-500/5' : isDark ? 'border-slate-800' : 'border-slate-200'
                      }`}>
                        <div className="pr-2">
                          <div className="text-xs font-bold">سپر عدم افشا (Zero Leakage)</div>
                          <div className="text-[10px] text-slate-400">حفاظت از کدهای محرمانه و سیستم</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={antiLeakage}
                          onChange={e => setAntiLeakage(e.target.checked)}
                          className="w-4 h-4 accent-emerald-500 rounded"
                        />
                      </label>

                      <label className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer ${
                        allowUserPrompt ? 'border-teal-500/50 bg-teal-500/5' : isDark ? 'border-slate-800' : 'border-slate-200'
                      }`}>
                        <div className="pr-2">
                          <div className="text-xs font-bold">پذیرش تم آموزشی کاربر</div>
                          <div className="text-[10px] text-slate-400">صرفاً به عنوان زیرمجموعه پرامپت حاکم</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={allowUserPrompt}
                          onChange={e => setAllowUserPrompt(e.target.checked)}
                          className="w-4 h-4 accent-emerald-500 rounded"
                        />
                      </label>
                    </div>

                    {/* Default AI Model Management */}
                    <div className="mt-4 pt-4 border-t border-slate-800/80">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                        <div>
                          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                            مدل پیش‌فرض بهینه سامانه راکان (Governed Default Model)
                          </label>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            بهترین روش در سامانه راکان این است که مدل پیش‌فرض بهینه توسط توسعه‌دهنده در پنل مدیریت تعیین شود تا کاربران عمومی درگیر تنظیمات نشوند؛ اما در بخش تنظیمات یا پنل، گزینه‌ای برای تغییر مدل یا تنظیم دما (temperature) در دسترس است.
                          </p>
                        </div>
                        <select
                          id="dev-default-model-select"
                          value={devDefaultModel}
                          onChange={e => setDevDefaultModel(e.target.value)}
                          className={`px-3 py-2 rounded-xl border text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/40 shrink-0 ${
                            isDark ? 'bg-slate-900 border-slate-700 text-emerald-300' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        >
                          <option value="gemini-3.7-flash">Gemini 3.7 Flash (پیش‌فرض سریع و دقیق)</option>
                          <option value="gemini-3.7-pro">Gemini 3.7 Pro (استدلال عمیق و مسائل سنگین)</option>
                          <option value="gemini-3.7-thinking">Gemini 3.7 Thinking (حل گام به گام المپیادی)</option>
                          <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                          <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                          <option value="racode-llm">PartSchool RaCode LLM (سرور بومی ایران)</option>
                        </select>
                      </div>
                    </div>

                    <button
                      id="save-dev-settings-btn"
                      onClick={handleSaveSettings}
                      disabled={savingSettings}
                      className="mt-4 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50"
                    >
                      {savingSettings ? 'در حال ذخیره‌سازی...' : 'ذخیره تغییرات و اعمال در سرور'}
                    </button>
                  </div>

                  {/* Change Dev Password */}
                  <div className={`p-5 rounded-3xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <h4 className="text-sm font-bold mb-1 flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-emerald-400" />
                      تغییر رمز عبور پنل توسعه‌دهنده
                    </h4>
                    <p className="text-xs text-slate-400 mb-3">گذرواژه جدید را جهت ایمن‌سازی پنل مدیریت مشخص نمایید.</p>

                    {passwordChangeSuccess && (
                      <div className="mb-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
                        {passwordChangeSuccess}
                      </div>
                    )}

                    <form onSubmit={handleChangePassword} className="flex gap-2 max-w-md">
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="رمز عبور جدید (حداقل ۶ کاراکتر)"
                        dir="ltr"
                        className={`flex-1 px-3 py-2 rounded-xl border text-xs text-right focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${
                          isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
                        }`}
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all border border-slate-700"
                      >
                        به‌روزرسانی رمز
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB 2: USERS DIRECTORY */}
              {activeTab === 'users' && (
                <div className="space-y-4">
                  {/* Search & Filter Bar */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={userSearch}
                        onChange={e => setUserSearch(e.target.value)}
                        placeholder="جستجو در نام، ایمیل، یا رشته کاربران..."
                        className={`w-full pr-9 pl-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${
                          isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                    </div>

                    <select
                      value={roleFilter}
                      onChange={e => setRoleFilter(e.target.value)}
                      className={`px-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    >
                      <option value="all">همه نقش‌ها ({users.length})</option>
                      <option value="elementary">ابتدایی</option>
                      <option value="middle_school">متوسطه اول</option>
                      <option value="high_school">متوسطه دوم</option>
                      <option value="konkur">کنکوری</option>
                      <option value="parent">والدین و اولیا</option>
                      <option value="university">دانشجو</option>
                    </select>
                  </div>

                  {/* Users Table / Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredUsers.length === 0 ? (
                      <div className="col-span-2 text-center py-12 text-slate-400 text-xs">
                        کاربری با این مشخصات یافت نشد.
                      </div>
                    ) : (
                      filteredUsers.map(user => (
                        <div
                          key={user.id}
                          className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
                            isDark ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-9 h-9 rounded-xl ${user.avatarColor || 'bg-emerald-500'} flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm`}>
                                {user.name.charAt(0)}
                              </div>
                              <div>
                                <h4 className="text-xs font-bold">{user.name}</h4>
                                <p className="text-[11px] text-slate-400 font-mono" dir="ltr">{user.email}</p>
                              </div>
                            </div>

                            <button
                              onClick={() => handleDeleteUser(user.id, user.name)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="حذف حساب کاربر"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-800/50">
                            <div>
                              <span className="text-slate-500">نقش / پایه: </span>
                              <span className="font-semibold text-slate-300">{user.roleTitle || user.grade}</span>
                            </div>
                            <div>
                              <span className="text-slate-500">رشته: </span>
                              <span className="font-semibold text-slate-300">{user.field || 'عمومی'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500">پیام‌های ارسالی: </span>
                              <span className="font-bold text-emerald-400">{user.messageCount || 0}</span>
                            </div>
                            <div>
                              <span className="text-slate-500">آخرین فعالیت: </span>
                              <span className="text-slate-400 text-[10px]">
                                {user.lastActive ? new Date(user.lastActive).toLocaleDateString('fa-IR') : 'به تازگی'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: COMPLETE USER MESSAGES (CONFIDENTIAL) */}
              {activeTab === 'messages' && (
                <div className="space-y-4">
                  {/* Actions Header */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="relative flex-1 w-full">
                      <input
                        type="text"
                        value={logSearch}
                        onChange={e => setLogSearch(e.target.value)}
                        placeholder="جستجو در سوالات و پاسخ‌های هوش مصنوعی..."
                        className={`w-full pr-9 pl-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${
                          isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                      <a
                        href={`/api/history/download?token=${devToken}`}
                        download="rakan_chat_history.json"
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold flex items-center gap-1.5 border border-slate-700 text-slate-200 transition-all"
                      >
                        <Download className="w-3.5 h-3.5" />
                        دانلود دیتابیس کامل
                      </a>
                      <button
                        onClick={handleClearAllLogs}
                        className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold flex items-center gap-1.5 border border-rose-500/20 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        پاک‌سازی پیام‌ها
                      </button>
                    </div>
                  </div>

                  {/* Messages Feed */}
                  <div className="space-y-3">
                    {filteredLogs.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 text-xs">
                        هیچ پیامی در دیتابیس ثبت نشده است.
                      </div>
                    ) : (
                      filteredLogs.map(log => (
                        <div
                          key={log.id}
                          className={`p-4 rounded-2xl border transition-all ${
                            log.metadata?.blockedBySecurity
                              ? 'bg-rose-500/5 border-rose-500/40'
                              : isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] mb-2 pb-2 border-b border-slate-800/40">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-emerald-400">{log.userName || 'کاربر سیستم'}</span>
                              <span className="text-slate-500">({log.userRole || 'دانش‌آموز'})</span>
                              <span className="text-slate-600 font-mono text-[10px]">{log.userEmail || ''}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-500 text-[10px]">
                              <span>{log.persianDate || log.timestamp}</span>
                              <span className="bg-slate-800/80 px-2 py-0.5 rounded font-mono">{log.model}</span>
                            </div>
                          </div>

                          <div className="space-y-2 text-xs">
                            <div className="bg-emerald-500/5 p-2.5 rounded-xl border border-emerald-500/10">
                              <span className="text-emerald-400 font-bold ml-1">سوال کاربر:</span>
                              <span className="text-slate-200 leading-relaxed">{log.userQuery}</span>
                            </div>

                            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 leading-relaxed text-[11px] max-h-40 overflow-y-auto">
                              <span className="text-teal-400 font-bold ml-1">پاسخ هوش مصنوعی:</span>
                              <span>{log.botResponse}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: SYSTEM STATS & SECURITY METRICS */}
              {activeTab === 'security_stats' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className={`p-4 rounded-3xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="text-slate-400 text-xs mb-1">کل کاربران ثبت‌نامی</div>
                      <div className="text-2xl font-black text-emerald-400">{users.length}</div>
                    </div>
                    <div className={`p-4 rounded-3xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="text-slate-400 text-xs mb-1">کل سوالات و مکالمات</div>
                      <div className="text-2xl font-black text-teal-400">{logs.length}</div>
                    </div>
                    <div className={`p-4 rounded-3xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="text-slate-400 text-xs mb-1">تلاش‌های خنثی‌شده نفوذ به پرامپت</div>
                      <div className="text-2xl font-black text-rose-400">
                        {logs.filter(l => l.metadata?.blockedBySecurity).length}
                      </div>
                    </div>
                  </div>

                  <div className={`p-5 rounded-3xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <h4 className="text-sm font-bold mb-2 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      وضعیت معماری امنیتی راکان (Zero-Trust AI Guard)
                    </h4>
                    <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside">
                      <li>تمام داده‌های هویتی و پیام‌ها رمزگذاری و صرفاً در پنل توسعه‌دهنده قابل رویت هستند.</li>
                      <li>پرامپت حاکم توسعه‌دهنده در بالاترین لایه فراخوانی LLM تزریق می‌شود و هیچ کاربری قادر به تغییر یا استخراج آن نیست.</li>
                      <li>سیستم پالایش خروجی از نشت کلیدها، متغیرهای محیطی و فرمول‌های داخلی جلوگیری می‌کند.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
