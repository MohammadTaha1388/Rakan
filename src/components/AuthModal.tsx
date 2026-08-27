import React, { useState } from 'react';
import { UserProfile, UserRoleType } from '../types';
import { X, Lock, Mail, User, BookOpen, GraduationCap, ArrowLeft, CheckCircle, AlertCircle, LogIn, UserPlus, Users, Sparkles, Shield, KeyRound } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserProfile, token: string) => void;
  onOpenDevPanel?: () => void;
  theme?: 'dark' | 'light';
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  onOpenDevPanel,
  theme = 'dark',
  initialMode = 'login'
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [role, setRole] = useState<UserRoleType>('high_school');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('پایه دوازدهم / کنکوری');
  const [field, setField] = useState('علوم تجربی');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const isDark = theme === 'dark';

  // Specific rule: Hide field selection for elementary, middle school, and parents
  const shouldHideFieldMenu = role === 'elementary' || role === 'middle_school' || role === 'parent';

  const handleRoleChange = (newRole: UserRoleType) => {
    setRole(newRole);
    if (newRole === 'elementary') {
      setGrade('دوره اول و دوم دبستان (پایه‌های ۱ تا ۶)');
      setField('دروس پایه‌ای ابتدایی');
    } else if (newRole === 'middle_school') {
      setGrade('متوسطه اول (پایه‌های ۷ تا ۹)');
      setField('دروس عمومی متوسطه اول');
    } else if (newRole === 'parent') {
      setGrade('والدین و اولیای گرامی');
      setField('هدایت تحصیلی فرزند');
    } else if (newRole === 'high_school') {
      setGrade('پایه دهم');
      setField('علوم تجربی');
    } else if (newRole === 'konkur') {
      setGrade('داوطلب کنکور سراسری');
      setField('علوم تجربی');
    } else if (newRole === 'university') {
      setGrade('دانشجوی مقطع کارشناسی');
      setField('مهندسی / علوم پایه');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'خطا در ورود به حساب کاربری');
        }

        setSuccess(data.message || 'خوش آمدید!');
        localStorage.setItem('rakan_auth_token', data.token);
        setTimeout(() => {
          onAuthSuccess(data.user, data.token);
          onClose();
        }, 600);
      } else {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            email,
            password,
            role,
            grade,
            field: shouldHideFieldMenu ? undefined : field
          })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'خطا در ایجاد حساب کاربری');
        }

        setSuccess(data.message || 'ثبت‌نام با موفقیت انجام شد!');
        localStorage.setItem('rakan_auth_token', data.token);
        setTimeout(() => {
          onAuthSuccess(data.user, data.token);
          onClose();
        }, 600);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطای ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div
        className={`relative w-full max-w-lg rounded-3xl border p-6 md:p-7 shadow-2xl transition-all my-8 ${
          isDark
            ? 'bg-slate-900/95 border-slate-800 text-white shadow-emerald-950/20'
            : 'bg-white border-slate-200 text-slate-900 shadow-slate-300/40'
        }`}
      >
        {/* Close Button */}
        <button
          id="close-auth-modal"
          onClick={onClose}
          className="absolute left-4 top-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon & Title */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-2 text-emerald-400 shadow-inner">
            {mode === 'login' ? <LogIn className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
          </div>
          <h2 className="text-xl font-black tracking-tight">
            {mode === 'login' ? 'ورود به سامانه هوشمند راکان' : 'عضویت در مدرسه هوشمند راکان'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'login'
              ? 'جهت ارسال پیام و دریافت مشاوره تحصیلی، با حساب خود وارد شوید'
              : 'نقش خود را مشخص کنید تا هوش مصنوعی مشاوره‌های اختصاصی متناسب با پایه شما ارائه دهد'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className={`flex rounded-2xl p-1 border mb-4 ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            id="tab-login-btn"
            type="button"
            onClick={() => { setMode('login'); setError(null); setSuccess(null); }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mode === 'login'
                ? 'bg-emerald-500 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            ورود به حساب
          </button>
          <button
            id="tab-register-btn"
            type="button"
            onClick={() => { setMode('register'); setError(null); setSuccess(null); }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mode === 'register'
                ? 'bg-emerald-500 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            ثبت‌نام جدید
          </button>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <>
              {/* Role Selection Grid */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    انتخاب نقش در سامانه
                  </span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    الزامی
                  </span>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    id="role-elementary-btn"
                    type="button"
                    onClick={() => handleRoleChange('elementary')}
                    className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                      role === 'elementary'
                        ? 'bg-amber-500/15 border-amber-500 text-amber-400 font-bold shadow-sm'
                        : isDark ? 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-[11px] leading-tight">دانش‌آموز دبستانی</span>
                  </button>

                  <button
                    id="role-middle-school-btn"
                    type="button"
                    onClick={() => handleRoleChange('middle_school')}
                    className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                      role === 'middle_school'
                        ? 'bg-cyan-500/15 border-cyan-500 text-cyan-400 font-bold shadow-sm'
                        : isDark ? 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <BookOpen className="w-4 h-4 text-cyan-400" />
                    <span className="text-[11px] leading-tight">متوسطه اول</span>
                  </button>

                  <button
                    id="role-high-school-btn"
                    type="button"
                    onClick={() => handleRoleChange('high_school')}
                    className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                      role === 'high_school'
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400 font-bold shadow-sm'
                        : isDark ? 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4 text-emerald-400" />
                    <span className="text-[11px] leading-tight">متوسطه دوم</span>
                  </button>

                  <button
                    id="role-konkur-btn"
                    type="button"
                    onClick={() => handleRoleChange('konkur')}
                    className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                      role === 'konkur'
                        ? 'bg-indigo-500/15 border-indigo-500 text-indigo-400 font-bold shadow-sm'
                        : isDark ? 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4 text-indigo-400" />
                    <span className="text-[11px] leading-tight">داوطلب کنکور</span>
                  </button>

                  <button
                    id="role-parent-btn"
                    type="button"
                    onClick={() => handleRoleChange('parent')}
                    className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                      role === 'parent'
                        ? 'bg-rose-500/15 border-rose-500 text-rose-400 font-bold shadow-sm'
                        : isDark ? 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Users className="w-4 h-4 text-rose-400" />
                    <span className="text-[11px] leading-tight">والدین و اولیا</span>
                  </button>

                  <button
                    id="role-university-btn"
                    type="button"
                    onClick={() => handleRoleChange('university')}
                    className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                      role === 'university'
                        ? 'bg-purple-500/15 border-purple-500 text-purple-400 font-bold shadow-sm'
                        : isDark ? 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <BookOpen className="w-4 h-4 text-purple-400" />
                    <span className="text-[11px] leading-tight">دانشجو</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  نام و نام خانوادگی
                </label>
                <div className="relative">
                  <input
                    id="auth-name-input"
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="مثال: پارسا نادری"
                    className={`w-full pr-10 pl-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all ${
                      isDark
                        ? 'bg-slate-950/80 border-slate-800 text-white placeholder:text-slate-600'
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                    }`}
                  />
                  <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              پست الکترونیک (ایمیل)
            </label>
            <div className="relative">
              <input
                id="auth-email-input"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="student@example.com"
                dir="ltr"
                className={`w-full pr-10 pl-3 py-2.5 rounded-xl border text-sm text-right focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all ${
                  isDark
                    ? 'bg-slate-950/80 border-slate-800 text-white placeholder:text-slate-600'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                }`}
              />
              <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              رمز عبور
            </label>
            <div className="relative">
              <input
                id="auth-password-input"
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="حداقل ۶ کاراکتر"
                dir="ltr"
                className={`w-full pr-10 pl-3 py-2.5 rounded-xl border text-sm text-right focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all ${
                  isDark
                    ? 'bg-slate-950/80 border-slate-800 text-white placeholder:text-slate-600'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                }`}
              />
              <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            </div>
          </div>

          {mode === 'register' && (
            <div className={`grid ${shouldHideFieldMenu ? 'grid-cols-1' : 'grid-cols-2'} gap-2 pt-1`}>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1 flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                  مقطع / پایه تحصیلی
                </label>
                <select
                  id="auth-grade-select"
                  value={grade}
                  onChange={e => setGrade(e.target.value)}
                  className={`w-full px-2.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  {role === 'elementary' ? (
                    <>
                      <option value="دوره اول دبستان (پایه اول تا سوم)">دوره اول دبستان (پایه اول تا سوم)</option>
                      <option value="دوره دوم دبستان (پایه چهارم تا ششم)">دوره دوم دبستان (پایه چهارم تا ششم)</option>
                      <option value="کل مقطع ابتدایی">کل مقطع ابتدایی</option>
                    </>
                  ) : role === 'middle_school' ? (
                    <>
                      <option value="پایه هفتم (متوسطه اول)">پایه هفتم (متوسطه اول)</option>
                      <option value="پایه هشتم (متوسطه اول)">پایه هشتم (متوسطه اول)</option>
                      <option value="پایه نهم (متوسطه اول و هدایت تحصیلی)">پایه نهم (هدایت تحصیلی)</option>
                    </>
                  ) : role === 'parent' ? (
                    <>
                      <option value="والدین دانش‌آموز ابتدایی">والدین دانش‌آموز ابتدایی</option>
                      <option value="والدین دانش‌آموز متوسطه اول">والدین دانش‌آموز متوسطه اول</option>
                      <option value="والدین دانش‌آموز دبیرستانی / کنکوری">والدین دانش‌آموز دبیرستانی / کنکوری</option>
                    </>
                  ) : role === 'konkur' ? (
                    <>
                      <option value="داوطلب کنکور سراسری (پایه دوازدهم)">داوطلب کنکور سراسری (پایه دوازدهم)</option>
                      <option value="فارغ‌التحصیل / پشت کنکوری">فارغ‌التحصیل / پشت کنکوری</option>
                    </>
                  ) : role === 'university' ? (
                    <>
                      <option value="دانشجوی کارشناسی">دانشجوی کارشناسی</option>
                      <option value="دانشجوی کارشناسی ارشد یا دکتری">دانشجوی ارشد / دکتری</option>
                    </>
                  ) : (
                    <>
                      <option value="پایه دهم">پایه دهم</option>
                      <option value="پایه یازدهم">پایه یازدهم</option>
                      <option value="پایه دوازدهم">پایه دوازدهم</option>
                    </>
                  )}
                </select>
              </div>

              {/* Conditional Field dropdown: Hidden for elementary, middle_school, and parents */}
              {!shouldHideFieldMenu && (
                <div id="field-of-study-container">
                  <label className="block text-[11px] text-slate-400 mb-1 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-teal-400" />
                    رشته تحصیلی
                  </label>
                  <select
                    id="auth-field-select"
                    value={field}
                    onChange={e => setField(e.target.value)}
                    className={`w-full px-2.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="علوم تجربی">علوم تجربی</option>
                    <option value="ریاضی و فیزیک">ریاضی و فیزیک</option>
                    <option value="ادبیات و علوم انسانی">ادبیات و علوم انسانی</option>
                    <option value="علوم و معارف اسلامی">علوم و معارف اسلامی</option>
                    <option value="هنر و زبان‌های خارجی">هنر و زبان‌های خارجی</option>
                    <option value="فنی و حرفه‌ای / کاردانش">فنی و حرفه‌ای / کاردانش</option>
                  </select>
                </div>
              )}
            </div>
          )}

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <span>در حال پردازش...</span>
            ) : mode === 'login' ? (
              <>
                <span>ورود به حساب کاربری</span>
                <ArrowLeft className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>تکمیل ثبت‌نام و ورود</span>
                <CheckCircle className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Developer Admin Entry Button */}
        {onOpenDevPanel && (
          <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              پنل مدیریت توسعه‌دهنده
            </span>
            <button
              id="open-dev-login-btn"
              type="button"
              onClick={() => {
                onClose();
                onOpenDevPanel();
              }}
              className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 hover:underline"
            >
              <KeyRound className="w-3.5 h-3.5" />
              ورود توسعه‌دهنده با رمز عبور
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
