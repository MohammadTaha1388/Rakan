export interface StudyHashtag {
  tag: string;
  enTag?: string;
  title: string;
  category: 'academic' | 'planning' | 'exam' | 'motivation';
  description: string;
  iconName: string;
  color: string;
}

export const STUDY_HASHTAGS: StudyHashtag[] = [
  {
    tag: '#برنامه_ریزی',
    enTag: '#Planning',
    title: 'برنامه‌ریزی و بودجه‌بندی',
    category: 'planning',
    description: 'تنظیم ساعات مطالعه روزانه، پومودورو و جبران عقب‌افتادگی',
    iconName: 'Calendar',
    color: 'emerald'
  },
  {
    tag: '#ریاضی',
    enTag: '#Mathematics',
    title: 'ریاضیات و حسابان',
    category: 'academic',
    description: 'فرمول‌ها، مشتق و کاربرد، انتگرال، هندسه و گسسته',
    iconName: 'Calculator',
    color: 'indigo'
  },
  {
    tag: '#فیزیک',
    enTag: '#Physics',
    title: 'فیزیک و دینامیک',
    category: 'academic',
    description: 'حرکت‌شناسی، نوسان، صوت، الکتریسیته و تست‌های تحلیلی',
    iconName: 'Atom',
    color: 'blue'
  },
  {
    tag: '#شیمی',
    enTag: '#Chemistry',
    title: 'شیمی و استوکیومتری',
    category: 'academic',
    description: 'واکنش‌های شیمیایی، اسید و باز، سنتتیک و شیمی آلی',
    iconName: 'FlaskConical',
    color: 'amber'
  },
  {
    tag: '#زیست_شناسی',
    enTag: '#Biology',
    title: 'زیست‌شناسی و ژنتیک',
    category: 'academic',
    description: 'نکات خط‌به‌خط کتاب، فیزیولوژی، چرخه سلولی و گیاهی',
    iconName: 'Dna',
    color: 'rose'
  },
  {
    tag: '#کنکور',
    enTag: '#Konkur',
    title: 'استراتژی کنکور سراسری',
    category: 'exam',
    description: 'تحلیل بودجه‌بندی آزمون، فصول تست‌خیز و ترازسازی',
    iconName: 'Award',
    color: 'purple'
  },
  {
    tag: '#تکنیک_تست_زنی',
    enTag: '#ExamStrategy',
    title: 'تکنیک‌های تست‌زنی و زمان',
    category: 'exam',
    description: 'روش ضربدر منها، زمان‌های نقصانی و حذف گزینه‌های دام‌دار',
    iconName: 'Target',
    color: 'teal'
  },
  {
    tag: '#انگیزش',
    enTag: '#Motivation',
    title: 'انگیزش و سلامت ذهن',
    category: 'motivation',
    description: 'کنترل اضطراب، رفع خستگی مفرط و شارژ انرژی تحصیلی',
    iconName: 'Flame',
    color: 'orange'
  },
  {
    tag: '#خلاصه_نویسی',
    enTag: '#Summary',
    title: 'خلاصه‌نویسی و لایتنر',
    category: 'planning',
    description: 'نمودارهای درختی، فلش‌کارت‌ها و مرور در منحنی فراموشی',
    iconName: 'BookOpen',
    color: 'cyan'
  },
  {
    tag: '#رفع_اشکال',
    enTag: '#ProblemSolving',
    title: 'رفع اشکال مسئله',
    category: 'academic',
    description: 'حل تشریحی گام‌به‌گام و ریشه‌یابی خطاهای محاسباتی',
    iconName: 'HelpCircle',
    color: 'emerald'
  }
];
