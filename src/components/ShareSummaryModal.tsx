import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Share2,
  Download,
  Copy,
  Check,
  Sparkles,
  Image as ImageIcon,
  MessageSquare,
  Send,
  BookOpen,
  Calendar,
  User,
  Target
} from 'lucide-react';
import { AdvisorSettings } from '../types';

interface ShareSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summaryText: string;
  settings: AdvisorSettings;
  theme?: 'dark' | 'light';
  onShowToast?: (msg: string) => void;
}

export const ShareSummaryModal: React.FC<ShareSummaryModalProps> = ({
  isOpen,
  onClose,
  summaryText,
  settings,
  theme = 'dark',
  onShowToast
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const isDark = theme === 'dark';

  const persianDate = new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date());

  // Generate shareable link
  const generateShareUrl = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    const params = new URLSearchParams();
    params.set('share', 'summary');
    params.set('date', new Date().toISOString().split('T')[0]);
    if (settings.studentName) params.set('student', settings.studentName);
    return `${baseUrl}?${params.toString()}`;
  };

  const shareUrl = generateShareUrl();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    if (onShowToast) onShowToast('لینک اشتراک‌گذاری در کلیپ‌بورد کپی شد 🔗');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyMessengerText = () => {
    const formattedText = `🌟 *خلاصه برنامه و مباحث مشاوره‌ای مدرسه راکان* 🌟
👤 دانش‌آموز: ${settings.studentName || 'دانش‌آموز کوشا'} (${settings.studentGrade} - ${settings.studentField})
🎯 هدف: ${settings.studyGoal || (settings.studyGoals && settings.studyGoals[0]) || 'موفقیت تحصیلی'}
📅 تاریخ: ${persianDate}
🤖 مدل هوشمند: ${settings.model}

📌 *مهم‌ترین نکات و خلاصه مباحث:*
${summaryText}

✨ تهیه شده توسط سامانه مشاور تحصیلی هوشمند مدرسه راکان`;

    navigator.clipboard.writeText(formattedText);
    setCopiedText(true);
    if (onShowToast) onShowToast('متن مناسب پیام‌رسان‌ها (شاد، ایتا، بله، تلگرام) کپی شد 📋');
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `خلاصه مباحث درسی ${settings.studentName || 'دانش‌آموز راکان'}`,
          text: summaryText,
          url: shareUrl
        });
        if (onShowToast) onShowToast('با موفقیت به اشتراک گذاشته شد 🚀');
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          handleCopyMessengerText();
        }
      }
    } else {
      handleCopyMessengerText();
    }
  };

  // Render Canvas Image
  const generateCanvasImage = () => {
    setIsGeneratingImage(true);
    const canvas = document.createElement('canvas');
    const width = 800;
    const height = 1000;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      setIsGeneratingImage(false);
      return;
    }

    // Background gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, '#0f172a');
    bgGradient.addColorStop(0.5, '#090d16');
    bgGradient.addColorStop(1, '#020617');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Decorative top glow
    const glowGradient = ctx.createRadialGradient(width / 2, 80, 10, width / 2, 80, 300);
    glowGradient.addColorStop(0, 'rgba(16, 185, 129, 0.25)');
    glowGradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, 0, width, 300);

    // Card border
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, width - 40, height - 40);

    // Header Badge
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 24px Vazirmatn, Tahoma, sans-serif';
    ctx.textAlign = 'center';
    ctx.direction = 'rtl';
    ctx.fillText('🎓 سامانه مشاور تحصیلی هوشمند مدرسه راکان', width / 2, 70);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px Vazirmatn, Tahoma, sans-serif';
    ctx.fillText('کارنامه خلاصه‌سازی مباحث و راهبردهای آموزشی', width / 2, 100);

    // Student Info Box
    ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
    ctx.fillRect(50, 125, width - 100, 100);
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
    ctx.strokeRect(50, 125, width - 100, 100);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 16px Vazirmatn, Tahoma, sans-serif';
    ctx.textAlign = 'right';
    const studentTitle = `دانش‌آموز: ${settings.studentName || 'نامشخص'} | مقطع: ${settings.studentGrade}`;
    ctx.fillText(studentTitle, width - 80, 160);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '14px Vazirmatn, Tahoma, sans-serif';
    const goalTitle = `🎯 هدف: ${settings.studyGoal || (settings.studyGoals && settings.studyGoals[0]) || 'موفقیت تحصیلی و رتبه برتر'}`;
    ctx.fillText(goalTitle, width - 80, 195);

    // Summary Section Header
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 18px Vazirmatn, Tahoma, sans-serif';
    ctx.fillText('📋 خلاصه نکات کلیدی و مصوبات جلسه:', width - 50, 260);

    // Wrap Summary Text Lines
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '15px Vazirmatn, Tahoma, sans-serif';
    const cleanLines = summaryText
      .split('\n')
      .map(l => l.replace(/^[#*>-]+\s*/, '').trim())
      .filter(Boolean);

    let currentY = 300;
    const maxLineLength = 52;

    for (const line of cleanLines) {
      if (currentY > height - 120) break;

      // Wrap long line
      const words = line.split(' ');
      let lineBuffer = '• ';
      for (let i = 0; i < words.length; i++) {
        const testLine = lineBuffer + words[i] + ' ';
        if (testLine.length > maxLineLength && i > 0) {
          ctx.fillText(lineBuffer, width - 60, currentY);
          lineBuffer = '   ' + words[i] + ' ';
          currentY += 28;
          if (currentY > height - 120) break;
        } else {
          lineBuffer = testLine;
        }
      }
      ctx.fillText(lineBuffer, width - 60, currentY);
      currentY += 34;
    }

    // Footer Info
    ctx.fillStyle = '#64748b';
    ctx.font = '12px Vazirmatn, Tahoma, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`تاریخ ثبت: ${persianDate}  |  مدل تحلیل: ${settings.model}  |  سامانه مشاور راکان`, width / 2, height - 50);

    const dataUrl = canvas.toDataURL('image/png');
    setPreviewImageUrl(dataUrl);
    setIsGeneratingImage(false);
  };

  useEffect(() => {
    if (isOpen && summaryText) {
      generateCanvasImage();
    }
  }, [isOpen, summaryText]);

  const handleDownloadImage = () => {
    if (!previewImageUrl) return;
    const link = document.createElement('a');
    link.download = `Rakan_Study_Summary_${new Date().toISOString().slice(0, 10)}.png`;
    link.href = previewImageUrl;
    link.click();
    if (onShowToast) onShowToast('تصویر خلاصه مباحث با موفقیت ذخیره شد 🖼️');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`relative w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 sm:p-5 border-b ${
          isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">اشتراک‌گذاری خلاصه مباحث و برنامه درسی</h2>
              <p className="text-xs text-slate-400">تولید لینک و کارت تصویری باکیفیت برای ارسال به معلم، مشاور یا دوستان</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Quick Sharing Options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Download Image Button */}
            <button
              id="export-png-summary-btn"
              type="button"
              onClick={handleDownloadImage}
              disabled={!previewImageUrl || isGeneratingImage}
              className="p-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex flex-col items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>دانلود کارت تصویری (PNG)</span>
            </button>

            {/* Copy Messenger Formatted Text */}
            <button
              id="copy-formatted-text-btn"
              type="button"
              onClick={handleCopyMessengerText}
              className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 ${
                copiedText
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                  : isDark ? 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700' : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300'
              }`}
            >
              {copiedText ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-indigo-400" />}
              <span>کپی متن شاد / بله / ایتا</span>
            </button>

            {/* Native Share / Direct Link */}
            <button
              id="native-share-btn"
              type="button"
              onClick={handleNativeShare}
              className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 ${
                isDark ? 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700' : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300'
              }`}
            >
              <Share2 className="w-4 h-4 text-teal-400" />
              <span>ارسال مستقیم (Web Share)</span>
            </button>
          </div>

          {/* Shareable Link Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>لینک اختصاصی خلاصه مباحث:</span>
              <span className="text-[11px] text-slate-500 font-normal">قابل بازگشایی در تمامی مرورگرها</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className={`flex-1 px-3.5 py-2 rounded-xl text-xs font-mono border focus:outline-none ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shrink-0"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'کپی شد' : 'کپی لینک'}</span>
              </button>
            </div>
          </div>

          {/* Live Graphic Image Preview Card */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                پیش‌نمایش کارت گرافیکی تولید شده:
              </span>
              <span className="text-[11px] text-slate-500 font-normal">رزولوشن استاندارد (PNG)</span>
            </div>

            <div className={`p-3 rounded-2xl border flex items-center justify-center overflow-hidden max-h-72 ${
              isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              {previewImageUrl ? (
                <img
                  src={previewImageUrl}
                  alt="Rakan Summary Preview"
                  className="rounded-xl max-h-64 object-contain shadow-lg border border-slate-700/60"
                />
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
                  <Sparkles className="w-6 h-6 animate-pulse text-emerald-400" />
                  <span>در حال رندر گرافیکی کارت مطالعه...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex items-center justify-between text-xs ${
          isDark ? 'border-slate-800 bg-slate-950/60 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'
        }`}>
          <span>تولید خودکار بر اساس هوش مصنوعی و اهداف درسی</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-colors"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
