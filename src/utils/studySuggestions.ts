export interface StudySuggestion {
  text: string;
  recommendedModeId: string;
  recommendedModeTitle: string;
  iconName: 'math' | 'plan' | 'exam' | 'concept' | 'peace' | 'general';
}

export function analyzeQueryAndSuggestMode(query: string): StudySuggestion | null {
  const trimmed = query.trim();
  if (trimmed.length < 4) return null;

  // 1. Math / Physics / Calculations / Formulas
  const mathKeywords = /ریاضی|فیزیک|فرمول|معادله|مشتق|انتگرال|حل مسئله|محاسبه|سینماتیک|الکتریسیته|شیمی|موازنه|هندسه|مثلثات|لگاریتم|ماتریس|تابع|دیفرانسیل|جبر/;
  const mathSymbols = /[+\-*/=^√∑∫≤≥≠≈×÷]|\b\d+[\s\d+\-*/=^]+/;
  if (mathKeywords.test(trimmed) || (mathSymbols.test(trimmed) && trimmed.length > 8)) {
    return {
      text: 'به نظر می‌رسد یک مسئله محاسباتی یا فرمول ریاضی/فیزیک است!',
      recommendedModeId: 'strict_mentor',
      recommendedModeTitle: 'استاد دقیق و تحلیلی',
      iconName: 'math'
    };
  }

  // 2. Planning, Daily/Weekly Routine, Time Management
  const planKeywords = /برنامه|ساعت|جدول|هفتگی|روزانه|زمان‌بندی|مدیریت زمان|ساعت مطالعه|شروع از صفر|پایه‌ریزی|برنامه‌ریزی|تفکیک دروس/;
  if (planKeywords.test(trimmed)) {
    return {
      text: 'درخواست تنظیم جدول زمان‌بندی و برنامه‌ریزی درسی',
      recommendedModeId: 'rakan_energetic',
      recommendedModeTitle: 'مشاور پرانرژی راکان',
      iconName: 'plan'
    };
  }

  // 3. Stress, Burnout, Sleep, Mental Wellness
  const calmKeywords = /استرس|اضطراب|خستگی|انگیزه ندارم|افسردگی|ناامید|خواب|تغذیه|آرامش|تمرکز ندارم|حواس‌پرتی|فشار روانی/;
  if (calmKeywords.test(trimmed)) {
    return {
      text: 'مدیریت اضطراب و بازیافت آرامش و تمرکز ذهن',
      recommendedModeId: 'calm_mindful',
      recommendedModeTitle: 'مشاور آرامش و سلامت ذهن',
      iconName: 'peace'
    };
  }

  // 4. Test / Exam / Percentage / Ranking
  const examKeywords = /تست|آزمون|کنکور|قلم‌چی|قلمچی|گاج|گزینه دو|درصد|تراز|رتبه|زمان نقصانی|ضربدر منها|دام تستی|تست‌زنی/;
  if (examKeywords.test(trimmed)) {
    return {
      text: 'تحلیل آزمون آزمایشی و تکنیک‌های تست‌زنی سرعتی',
      recommendedModeId: 'strict_mentor',
      recommendedModeTitle: 'استاد دقیق و تحلیلی',
      iconName: 'exam'
    };
  }

  // 5. Short Definition / Capsule / Quick revision
  const quickKeywords = /چیست|تعریف|توضیح بده|خلاصه|نکات کلیدی|فرمول سریع|در یک خط|کپسولی|مرور سریع|نکته و تست/;
  if (quickKeywords.test(trimmed) || (trimmed.length < 35 && trimmed.endsWith('؟'))) {
    return {
      text: 'پرسش مفهومی و مرور سریع نکات آموزشی',
      recommendedModeId: 'concise_fast',
      recommendedModeTitle: 'مرور سریع و کپسولی',
      iconName: 'concept'
    };
  }

  // 6. Long query
  if (trimmed.length > 220) {
    return {
      text: 'پیش‌نویس جامع تحلیلی (ارائه پاسخ گام‌به‌گام و تفصیلی)',
      recommendedModeId: 'rakan_energetic',
      recommendedModeTitle: 'مشاور پرانرژی راکان',
      iconName: 'general'
    };
  }

  return null;
}
