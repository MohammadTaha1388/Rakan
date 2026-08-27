/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Sparkles,
  RefreshCw,
  Trash2,
  Calendar,
  Brain,
  Flame,
  FileCheck,
  Save,
  CheckCircle,
  AlertCircle,
  Hash,
  Mic,
  MicOff,
  Keyboard,
  Download,
  X,
  Compass,
  Zap,
  HeartHandshake,
  Copy,
  Wand2,
  BookOpen,
  Check,
  BarChart3,
  ListFilter,
  MessageSquare,
  Clock,
  Settings as SettingsIcon,
  Wrench,
  History,
  FileText,
  Maximize2,
  Minimize2,
  Share2
} from 'lucide-react';
import { Header } from './components/Header';
import { WelcomeHero } from './components/WelcomeHero';
import { MessageItem } from './components/MessageItem';
import { SettingsModal } from './components/SettingsModal';
import { HistoryModal } from './components/HistoryModal';
import { StudyToolsPanel } from './components/StudyToolsPanel';
import { StudyProgressChart } from './components/StudyProgressChart';
import { AuthModal } from './components/AuthModal';
import { DeveloperPanelModal } from './components/DeveloperPanelModal';
import { NotificationCenter } from './components/NotificationCenter';
import { HashtagSuggestions } from './components/HashtagSuggestions';
import { ShortcutsModal } from './components/ShortcutsModal';
import { ShareSummaryModal } from './components/ShareSummaryModal';
import { ChatMessage, AdvisorSettings, UserProfile, AppNotification } from './types';
import { DEFAULT_SETTINGS, SYSTEM_PROMPT_PRESETS } from './utils/constants';
import { STUDY_HASHTAGS, StudyHashtag } from './utils/studyHashtags';
import { playMechanicalKeyClick } from './utils/audioSynth';
import { analyzeQueryAndSuggestMode } from './utils/studySuggestions';
import { formatAcademicText } from './utils/academicFormatter';
import { calculateReadingComplexity } from './utils/complexityCalculator';
import { getTranslation, AppLanguage } from './utils/i18n';
import {
  getStoredNotifications,
  getUnreadNotificationsCount,
  dispatchAppNotification,
  requestNotificationPermission
} from './utils/notificationService';

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem('rakan_current_chat');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Input draft state with localStorage persistence
  const [inputQuery, setInputQuery] = useState<string>(() => {
    try {
      return localStorage.getItem('rakan_chat_input_draft') || '';
    } catch {
      return '';
    }
  });

  const [hasDraftRestored, setHasDraftRestored] = useState<boolean>(() => {
    try {
      const draft = localStorage.getItem('rakan_chat_input_draft');
      return !!(draft && draft.trim().length > 0);
    } catch {
      return false;
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [logsCount, setLogsCount] = useState(0);

  // Voice speech recognition state
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // User Profile & Authentication State
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('rakan_user_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [authToken, setAuthToken] = useState<string | null>(() => {
    return localStorage.getItem('rakan_auth_token') || null;
  });

  // Notification State
  const [unreadNotifs, setUnreadNotifs] = useState(getUnreadNotificationsCount());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedDraft, setCopiedDraft] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(current => (current === msg ? null : current));
    }, 2600);
  };

  const handleCopyDraft = async () => {
    if (!inputQuery.trim()) return;
    try {
      await navigator.clipboard.writeText(inputQuery);
      setCopiedDraft(true);
      showToast('متن پیش‌نویس در کلیپ‌بورد کپی شد 📋');
      setTimeout(() => setCopiedDraft(false), 2000);
    } catch {
      showToast('خطا در کپی کردن متن');
    }
  };

  const handleFormatAcademic = () => {
    if (!inputQuery.trim()) return;
    const formatted = formatAcademicText(inputQuery);
    if (formatted !== inputQuery) {
      setInputQuery(formatted);
      showToast('متن با اصول نگارشی و فاصله‌گذاری استاندارد آکادمیک مرتب شد ✨');
    } else {
      showToast('متن از پیش دارای ساختار نگارشی استاندارد است ✔️');
    }
  };

  const handleLanguageChange = (newLang: AppLanguage) => {
    setSettings(prev => {
      const updated = { ...prev, language: newLang };
      localStorage.setItem('rakan_advisor_settings', JSON.stringify(updated));
      return updated;
    });
    showToast(`زبان برنامه به «${newLang}» تغییر یافت.`);
  };

  // Modals, Drawers & UI Modes
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isDevPanelOpen, setIsDevPanelOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareSummaryText, setShareSummaryText] = useState<string>('');
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [lastAutoSavedAt, setLastAutoSavedAt] = useState<string | null>(null);

  // Daily Push Notification Scheduler Effect
  useEffect(() => {
    if (!settings.dailyReminderEnabled || !settings.dailyReminderTime) return;

    const checkReminder = () => {
      const now = new Date();
      const currentDay = now.getDay(); // 0=Sunday, 6=Saturday
      const activeDays = settings.dailyReminderDays || [0, 1, 2, 3, 4, 5, 6];
      if (!activeDays.includes(currentDay)) return;

      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;

      if (currentTimeStr === settings.dailyReminderTime) {
        const lastSentDateKey = `rakan_last_reminder_${now.toDateString()}`;
        if (!localStorage.getItem(lastSentDateKey)) {
          localStorage.setItem(lastSentDateKey, 'sent');
          dispatchAppNotification(
            '⏰ وقت مطالعه فرارسید!',
            `سلام ${settings.studentName || 'دانش‌آموز عزیز'}! ساعت مطالعه روزانه برای هدف «${settings.studyGoal || 'پیشرفت درسی و حل تست'}» آغاز شد. با تمرکز شروع کن!`,
            'dailyReminder',
            true
          );
        }
      }
    };

    checkReminder();
    const interval = setInterval(checkReminder, 30000);
    return () => clearInterval(interval);
  }, [
    settings.dailyReminderEnabled,
    settings.dailyReminderTime,
    settings.dailyReminderDays,
    settings.studentName,
    settings.studyGoal
  ]);

  // Advisor Settings with automatic OS theme detection
  const [settings, setSettings] = useState<AdvisorSettings>(() => {
    // Detect OS system theme
    const systemPrefersDark =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    const systemTheme: 'dark' | 'light' = systemPrefersDark ? 'dark' : 'light';

    try {
      const saved = localStorage.getItem('rakan_advisor_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed.model === 'gemini-2.5-flash' ||
          parsed.model === 'gemini-2.0-flash' ||
          parsed.model === 'gemini-1.5-flash'
        ) {
          parsed.model = 'gemini-3.7-flash';
        } else if (
          parsed.model === 'gemini-2.5-pro' ||
          parsed.model === 'gemini-2.0-pro' ||
          parsed.model === 'gemini-1.5-pro'
        ) {
          parsed.model = 'gemini-3.1-pro-preview';
        }
        return {
          ...DEFAULT_SETTINGS,
          theme: parsed.theme || systemTheme,
          ...parsed
        };
      }
      return { ...DEFAULT_SETTINGS, theme: systemTheme };
    } catch {
      return { ...DEFAULT_SETTINGS, theme: systemTheme };
    }
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Hashtag suggestions state
  const [showHashtags, setShowHashtags] = useState(false);
  const [hashtagQuery, setHashtagQuery] = useState('');
  const [selectedHashtagIndex, setSelectedHashtagIndex] = useState(0);

  // Filter hashtags according to search query
  const filteredHashtags = STUDY_HASHTAGS.filter(item => {
    if (!hashtagQuery) return true;
    const q = hashtagQuery.toLowerCase().trim();
    return (
      item.tag.toLowerCase().includes(q) ||
      (item.enTag && item.enTag.toLowerCase().includes(q)) ||
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)
    );
  });

  // Keep dark/light theme in sync with HTML root
  useEffect(() => {
    if (settings.theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  }, [settings.theme]);

  // Keep font family in sync with document body
  useEffect(() => {
    const root = document.getElementById('root') || document.body;
    if (settings.fontFamily === 'monospace') {
      document.body.classList.remove("font-['Vazirmatn',sans-serif]");
      document.body.classList.add('font-mono');
      root.classList.add('font-mono');
    } else {
      document.body.classList.remove('font-mono');
      document.body.classList.add("font-['Vazirmatn',sans-serif]");
      root.classList.remove('font-mono');
    }
  }, [settings.fontFamily]);

  // Check cursor position for hashtag trigger
  const checkHashtagTrigger = (text: string, cursorPos: number) => {
    const textBeforeCursor = text.slice(0, cursorPos);
    const match = textBeforeCursor.match(/(?:^|\s)#([\p{L}\p{N}_]*)$/u);
    if (match) {
      const query = match[1] || '';
      setHashtagQuery(query);
      setShowHashtags(true);
      setSelectedHashtagIndex(0);
    } else {
      setShowHashtags(false);
    }
  };

  const handleSelectHashtag = (hashtag: StudyHashtag) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart || inputQuery.length;
    const textBeforeCursor = inputQuery.slice(0, cursorPos);
    const textAfterCursor = inputQuery.slice(cursorPos);

    const replacedBefore = textBeforeCursor.replace(/(?:^|\s)#([\p{L}\p{N}_]*)$/u, match => {
      const leadingSpace = match.startsWith(' ') ? ' ' : '';
      return `${leadingSpace}${hashtag.tag} `;
    });

    const newFullText = replacedBefore + textAfterCursor;
    setInputQuery(newFullText);
    setShowHashtags(false);

    setTimeout(() => {
      textarea.focus();
      const newPos = replacedBefore.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 20);
  };

  // Persist input query to localStorage whenever it changes
  useEffect(() => {
    try {
      if (inputQuery.trim()) {
        localStorage.setItem('rakan_chat_input_draft', inputQuery);
      } else {
        localStorage.removeItem('rakan_chat_input_draft');
        setHasDraftRestored(false);
      }
    } catch (err) {
      console.error('Error saving input draft to localStorage:', err);
    }
  }, [inputQuery]);

  // Auto-expand textarea height based on content length while respecting max-h-32 (128px)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const nextHeight = Math.min(Math.max(textareaRef.current.scrollHeight, 44), 128);
      textareaRef.current.style.height = `${nextHeight}px`;
    }
  }, [inputQuery]);

  // Apply theme to document root
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  // Check auth session on startup
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('rakan_auth_token');
      if (!token) return;
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          localStorage.setItem('rakan_user_profile', JSON.stringify(data.user));
        } else {
          // Token expired
          localStorage.removeItem('rakan_auth_token');
          localStorage.removeItem('rakan_user_profile');
          setUser(null);
          setAuthToken(null);
        }
      } catch (err) {
        console.error('Auth verification error:', err);
      }
    };
    checkAuth();
  }, []);

  // Listen to custom notification events
  useEffect(() => {
    const handleNotifUpdate = () => {
      setUnreadNotifs(getUnreadNotificationsCount());
    };
    window.addEventListener('rakan_notifications_updated', handleNotifUpdate);
    return () => {
      window.removeEventListener('rakan_notifications_updated', handleNotifUpdate);
    };
  }, []);

  // Fetch initial history logs count
  const fetchLogsCount = async () => {
    try {
      const res = await fetch('/api/history');
      if (res.ok) {
        const data = await res.json();
        setLogsCount(data.count || 0);
      }
    } catch (err) {
      console.error('Error fetching logs count:', err);
    }
  };

  useEffect(() => {
    fetchLogsCount();
  }, []);

  // Save current chat session to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('rakan_current_chat', JSON.stringify(messages));
    } catch (err) {
      console.error('Error saving chat session:', err);
    }
  }, [messages]);

  // Robust 30-second interval Auto-save to localStorage to prevent data loss on sudden browser close
  useEffect(() => {
    const doAutoSave = () => {
      try {
        if (messages.length > 0 || inputQuery.trim()) {
          const autoSavePayload = {
            messages,
            inputDraft: inputQuery,
            timestamp: new Date().toISOString()
          };
          localStorage.setItem('rakan_chat_autosave_30s', JSON.stringify(autoSavePayload));
          const timeFormatted = new Intl.DateTimeFormat('fa-IR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }).format(new Date());
          setLastAutoSavedAt(timeFormatted);
        }
      } catch (err) {
        console.warn('Auto-save error:', err);
      }
    };

    // Initial check/save
    doAutoSave();

    // Set 30-second interval
    const interval = setInterval(doAutoSave, 30000);
    return () => clearInterval(interval);
  }, [messages, inputQuery]);

  // Auto scroll to bottom
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Save Settings
  const handleSaveSettings = (newSettings: AdvisorSettings) => {
    setSettings(newSettings);
    localStorage.setItem('rakan_advisor_settings', JSON.stringify(newSettings));
  };

  // Toggle Theme directly
  const handleToggleTheme = () => {
    const newTheme: 'dark' | 'light' = settings.theme === 'dark' ? 'light' : 'dark';
    const updated: AdvisorSettings = { ...settings, theme: newTheme };
    handleSaveSettings(updated);
  };

  // Download Chat as Text File for Offline Review
  const handleDownloadChat = () => {
    if (messages.length === 0) return;

    const dateStr = new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date());

    const studentName = user?.name || settings.studentName || 'دانش‌آموز';
    const grade = user?.grade || settings.studentGrade || 'کنکوری';
    const field = user?.field || settings.studentField || 'عمومی';

    let content = `=====================================================
  گزارش گفتگوی درسی و مشاوره تحصیلی مدرسه هوشمند راکان
=====================================================
دانش‌آموز: ${studentName}
مقطع: ${grade} | رشته: ${field}
تاریخ دریافت گزارش: ${dateStr}
مدل هوش مصنوعی: ${settings.model}
تعداد پیام‌ها: ${messages.length}
=====================================================\n\n`;

    messages.forEach((msg, idx) => {
      const sender =
        msg.role === 'user'
          ? `[${studentName} - ${msg.persianTime}]`
          : `[مشاور هوشمند راکان - ${msg.persianTime} - مدل: ${msg.modelUsed || settings.model}]`;
      content += `${idx + 1}. ${sender}\n${msg.content}\n\n-----------------------------------------------------\n\n`;
    });

    content += `\nسامانه مشاوره هوشمند مدرسه راکان | Rakan School AI Advisor\n`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileDate = new Date().toISOString().slice(0, 10);
    a.download = `rakan_study_chat_${fileDate}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    dispatchAppNotification(
      'دانلود گفتگوی درسی',
      'متن گفتگوی جاری با موفقیت به صورت فایل متنی (.txt) ذخیره شد.',
      'system'
    );
  };

  // Toggle Web Speech API voice recognition
  const toggleVoiceInput = () => {
    const SpeechRecognitionClass =
      (window as unknown as { SpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      alert(
        'مرورگر شما از قابلیت تبدیل صوت به متن (Web Speech API) پشتیبانی نمی‌کند. لطفاً از مرورگر Google Chrome یا Edge استفاده فرمایید.'
      );
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // Ignore
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.lang = 'fa-IR';
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setInputQuery(prev => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${transcript}` : transcript;
          });
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
    }
  };

  // Global Keyboard Shortcuts (Ctrl+K, Ctrl+S, Ctrl+H, Ctrl+T, Ctrl+D, Ctrl+M, Ctrl+/)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl+K / Cmd+K: Focus chat input & clear/select
      if (modifier && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        textareaRef.current?.focus();
        textareaRef.current?.select();
        return;
      }

      // Ctrl+S / Cmd+S: Open Settings
      if (modifier && e.key.toLowerCase() === 's') {
        e.preventDefault();
        setIsSettingsOpen(prev => !prev);
        return;
      }

      // Ctrl+H / Cmd+H: Open History / Logs
      if (modifier && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setIsHistoryOpen(prev => !prev);
        return;
      }

      // Ctrl+T / Cmd+T: Toggle Study Tools Drawer
      if (modifier && e.key.toLowerCase() === 't') {
        e.preventDefault();
        setIsToolsOpen(prev => !prev);
        return;
      }

      // Ctrl+D / Cmd+D: Download chat transcript
      if (modifier && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleDownloadChat();
        return;
      }

      // Ctrl+M / Cmd+M: Toggle Voice Transcription
      if (modifier && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        toggleVoiceInput();
        return;
      }

      // Ctrl+/ or '?' when outside textarea: Show Shortcuts Cheat Sheet
      if (
        (modifier && e.key === '/') ||
        (e.key === '?' && document.activeElement !== textareaRef.current)
      ) {
        e.preventDefault();
        setIsShortcutsOpen(prev => !prev);
        return;
      }

      // Alt+F or Ctrl+Shift+F: Toggle Focus Mode
      if ((modifier && e.shiftKey && e.key.toLowerCase() === 'f') || (e.altKey && e.key.toLowerCase() === 'f')) {
        e.preventDefault();
        setIsFocusMode(prev => !prev);
        return;
      }

      // Esc: Close any open modal or exit focus mode
      if (e.key === 'Escape') {
        if (isFocusMode) {
          setIsFocusMode(false);
        }
        setIsShortcutsOpen(false);
        setIsSettingsOpen(false);
        setIsHistoryOpen(false);
        setIsAuthOpen(false);
        setIsNotificationsOpen(false);
        setIsShareModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [messages, user, settings, isListening, isFocusMode]);

  // Auth Handlers
  const handleAuthSuccess = (profile: UserProfile, token: string) => {
    setUser(profile);
    setAuthToken(token);
    localStorage.setItem('rakan_auth_token', token);
    localStorage.setItem('rakan_user_profile', JSON.stringify(profile));
    setIsAuthOpen(false);

    // Update student name and grade in settings if empty
    if (!settings.studentName && profile.name) {
      const updated = {
        ...settings,
        studentName: profile.name,
        studentGrade: profile.grade || settings.studentGrade,
        studentField: profile.field || settings.studentField
      };
      handleSaveSettings(updated);
    }

    dispatchAppNotification(
      'ورود موفقیت‌آمیز',
      `خوش آمدید، ${profile.name}! گزارش‌های مطالعاتی شما اکنون به حساب کاربریتان متصل شدند.`,
      'system'
    );
  };

  const handleLogout = () => {
    localStorage.removeItem('rakan_auth_token');
    localStorage.removeItem('rakan_user_profile');
    setUser(null);
    setAuthToken(null);
    dispatchAppNotification(
      'خروج از حساب',
      'با موفقیت از حساب کاربری خود خارج شدید.',
      'system'
    );
  };

  // Start Fresh Chat
  const handleNewChat = () => {
    if (messages.length === 0) return;
    if (
      window.confirm(
        'آیا مایلید گفتگوی جدیدی با مشاور آغاز کنید؟ (تمامی گفتگوهای قبلی در فایل chat_history.json محفوظ خواهند ماند)'
      )
    ) {
      setMessages([]);
      sessionStorage.removeItem('rakan_current_chat');
    }
  };

  // Open Share Summary Modal with custom or generated text
  const handleOpenShareModal = (customText?: string) => {
    if (customText) {
      setShareSummaryText(customText);
    } else if (messages.length > 0) {
      const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant' && !m.isError);
      if (lastAssistant) {
        setShareSummaryText(lastAssistant.content);
      } else {
        const text = messages.map(m => `${m.role === 'user' ? '👤 دانش‌آموز' : '🤖 مشاور'}: ${m.content}`).join('\n\n');
        setShareSummaryText(text);
      }
    } else {
      setShareSummaryText(`برنامه درسی هدفمند ${settings.studentName || 'دانش‌آموز راکان'} - ${settings.studyGoal || 'موفقیت در کنکور و امتحانات نهایی'}`);
    }
    setIsShareModalOpen(true);
  };

  // Summarize recent chat key takeaways using selected AI model
  const handleSummarizeChat = async () => {
    if (messages.length === 0 || isLoading) return;
    const summaryPrompt = 'لطفاً یک خلاصه کلیدی، کاربردی و تیتروار از مهم‌ترین مباحث درسی، سوالات و توصیه‌های مشاوره‌ای مطرح شده در این گفتگو همراه با جمع‌بندی نکات طلایی ارائه بده.';
    await handleSendMessage(summaryPrompt);
  };

  // Send Message
  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputQuery.trim();
    if (!textToSend || isLoading) return;

    // Check mandatory authentication for using AI
    if (!user || !authToken) {
      setIsAuthOpen(true);
      showToast('برای استفاده از هوش مصنوعی راکان، لطفاً ابتدا ثبت‌نام کرده یا وارد شوید 🔐');
      dispatchAppNotification(
        'ثبت‌نام الزامی است',
        'جهت گفتگو با هوش مصنوعی و ذخیره پرونده مشاوره‌ای، لطفاً ابتدا حساب کاربری خود را ایجاد کنید.',
        'system'
      );
      return;
    }

    // Clear input and draft from localStorage
    setInputQuery('');
    setHasDraftRestored(false);
    localStorage.removeItem('rakan_chat_input_draft');

    // Persian time for UI
    const persianTime = new Intl.DateTimeFormat('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date());

    const userMessage: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString(),
      persianTime
    };

    const newMessagesList = [...messages, userMessage];
    setMessages(newMessagesList);
    setIsLoading(true);

    // Prepare system prompt based on preset or custom
    let activeSystemPrompt = settings.customSystemPrompt;
    if (settings.systemPromptKey !== 'custom') {
      const preset = SYSTEM_PROMPT_PRESETS.find(p => p.id === settings.systemPromptKey);
      activeSystemPrompt = preset ? preset.prompt : settings.customSystemPrompt;
    }

    // Enrich with student profile if provided
    let enrichedSystemPrompt = activeSystemPrompt;
    const studentName = user?.name || settings.studentName;
    const studentGrade = user?.grade || settings.studentGrade;
    const studentField = user?.field || settings.studentField;

    if (studentGrade || studentField || studentName) {
      enrichedSystemPrompt += `\n\n[اطلاعات دانش‌آموز مخاطب: ${
        studentName ? `نام: ${studentName} | ` : ''
      }پایه: ${studentGrade} | رشته: ${studentField} | هدف یا چالش: ${settings.studyGoal}]`;
    }

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages: newMessagesList.map(m => ({ role: m.role, content: m.content })),
          model: settings.model,
          temperature: settings.temperature,
          systemPrompt: enrichedSystemPrompt,
          systemPromptName:
            SYSTEM_PROMPT_PRESETS.find(p => p.id === settings.systemPromptKey)?.name || 'شخصی‌سازی شده',
          customEndpointUrl: settings.customEndpointUrl,
          customApiKey: settings.customApiKey,
          metadata: {
            studentGrade,
            studentField
          }
        })
      });

      if (!response.ok) {
        throw new Error(`خطای سرور (${response.status})`);
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: `msg_bot_${Date.now()}`,
        role: 'assistant',
        content: data.text || 'پاسخی دریافت نشد.',
        timestamp: new Date().toISOString(),
        persianTime: data.persianTime || persianTime,
        modelUsed: data.modelUsed,
        temperature: settings.temperature,
        durationMs: data.durationMs
      };

      setMessages(prev => [...prev, assistantMessage]);
      fetchLogsCount();

      // Trigger notification if user was away or requested notifications
      if (settings.browserNotifications) {
        dispatchAppNotification(
          'مشاور درسی راکان',
          `پاسخ به سوال شما آماده شد: "${textToSend.slice(0, 45)}..."`,
          'chat',
          false
        );
      }

      // Native Browser Push Notification when completed (informs user if they switched tabs)
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted' && (document.hidden || settings.browserNotifications)) {
          try {
            new Notification('مشاور درسی راکان 🎓', {
              body: `پاسخ سوال تحصیلی شما آماده شد: "${textToSend.slice(0, 40)}..."`,
              icon: '/favicon.ico'
            });
          } catch (notifErr) {
            console.warn('Native notification error:', notifErr);
          }
        }
      }
    } catch (err: unknown) {
      console.error('Error sending message:', err);
      const errorMessage: ChatMessage = {
        id: `msg_err_${Date.now()}`,
        role: 'assistant',
        content:
          'متأسفانه در دریافت پاسخ مشاور هوشمند خطایی رخ داد. لطفاً اتصال اینترنت خود یا تنظیمات مدل را بررسی کنید.',
        timestamp: new Date().toISOString(),
        persianTime,
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  };

  // Edit and resend user message to fix typos
  const handleEditAndResendMessage = (messageId: string, newContent: string) => {
    const msgIdx = messages.findIndex(m => m.id === messageId);
    if (msgIdx === -1) return;
    // Keep messages up to before this message, and resend the corrected query
    const priorMessages = messages.slice(0, msgIdx);
    setMessages(priorMessages);
    handleSendMessage(newContent);
  };

  // Toggle reaction on assistant message (thumbsUp / heart)
  const handleMessageReaction = (messageId: string, type: 'thumbsUp' | 'heart') => {
    setMessages(prev => {
      const updated = prev.map(msg => {
        if (msg.id === messageId) {
          const reactions = msg.reactions || {};
          const isCurrentActive = !!reactions[type];
          return {
            ...msg,
            reactions: {
              ...reactions,
              [type]: !isCurrentActive
            }
          };
        }
        return msg;
      });
      try {
        sessionStorage.setItem('rakan_current_chat', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    const isThumbs = type === 'thumbsUp';
    showToast(isThumbs ? 'بازخورد شما ثبت شد (مفید و کاربردی) 👍' : 'به پیام‌های منتخب افزوده شد ❤️');
  };

  // Keyboard shortcut (Enter to send, Shift+Enter for newline, Hashtag navigation, Audio feedback)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 1. Play tactile mechanical keyboard audio feedback
    if (settings.mechanicalKeyboardSound !== false) {
      playMechanicalKeyClick(e.key);
    }

    // 2. Handle hashtag suggestions dropdown keyboard navigation
    if (showHashtags && filteredHashtags.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedHashtagIndex(prev => (prev + 1) % filteredHashtags.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedHashtagIndex(
          prev => (prev - 1 + filteredHashtags.length) % filteredHashtags.length
        );
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        handleSelectHashtag(filteredHashtags[selectedHashtagIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowHashtags(false);
        return;
      }
    }

    // 3. Send message on Enter
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const isDark = settings.theme === 'dark';

  return (
    <div
      className={`flex flex-col min-h-screen transition-colors duration-200 selection:bg-emerald-500 selection:text-white ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Sticky Header */}
      <Header
        settings={settings}
        logsCount={logsCount}
        user={user}
        unreadNotifs={unreadNotifs}
        hasMessages={messages.length > 0}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onNewChat={handleNewChat}
        onToggleTools={() => setIsToolsOpen(!isToolsOpen)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenDevPanel={() => setIsDevPanelOpen(true)}
        onLogout={handleLogout}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onToggleTheme={handleToggleTheme}
        onLanguageChange={handleLanguageChange}
        onDownloadChat={handleDownloadChat}
        isToolsOpen={isToolsOpen}
      />

      {/* Main Chat Layout */}
      <main className="flex-1 flex flex-col max-w-5xl w-full mx-auto px-3 sm:px-6 py-4 relative">
        {/* Messages or Welcome Hero */}
        <div className="flex-1 pb-40">
          {messages.length === 0 ? (
            <WelcomeHero
              settings={settings}
              user={user}
              onSelectPrompt={prompt => handleSendMessage(prompt)}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenAuth={() => setIsAuthOpen(true)}
            />
          ) : (
            <div className="space-y-4">
              {/* Chat Session Top Action Bar: Key Summary, 30s Auto-save status, Progress Chart Toggle */}
              <div className={`p-3 rounded-2xl border flex flex-wrap items-center justify-between gap-2.5 transition-all shadow-sm ${
                isDark ? 'bg-slate-900/90 border-slate-800/90' : 'bg-white/95 border-slate-200'
              }`}>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Key Discussion Summary Button */}
                  <button
                    id="chat-summary-btn"
                    type="button"
                    onClick={handleSummarizeChat}
                    disabled={isLoading}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/10 hover:from-emerald-500/30 hover:to-teal-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 disabled:opacity-50"
                    title={`دریافت خلاصه کلیدی از مباحث این گفتگو با مدل ${settings.model}`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>خلاصه کلیدی مباحث گفتگو</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hidden sm:inline">
                      {settings.model}
                    </span>
                  </button>

                  {/* Toggle Study Progress Chart */}
                  <button
                    id="toggle-stats-chart-btn"
                    type="button"
                    onClick={() => setIsStatsOpen(!isStatsOpen)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                      isStatsOpen
                        ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50'
                        : isDark ? 'border-slate-800 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{isStatsOpen ? 'بستن نمودار' : 'نمودار فعالیت'}</span>
                  </button>
                </div>

                {/* 30s Auto-save status and Quick Actions */}
                <div className="flex items-center gap-3 text-xs">
                  {/* 30s Auto-save indicator */}
                  <div
                    id="autosave-status-indicator"
                    className="flex items-center gap-1.5 text-[11px] text-slate-400"
                    title="متن چت هر ۳۰ ثانیه در حافظه محلی ذخیره می‌شود تا در صورت بستن ناگهانی مرورگر محفوظ بماند"
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span>ذخیره‌سازی ۳۰ ثانیه‌ای: فعال</span>
                    {lastAutoSavedAt && (
                      <span className="text-[10px] text-emerald-400/80 font-mono hidden md:inline">
                        ({lastAutoSavedAt})
                      </span>
                    )}
                  </div>

                  <div className="h-3.5 w-px bg-slate-700/40 hidden sm:block" />

                  {/* Quick Export/Clear */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleDownloadChat}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="دانلود گفتگوی جاری (.txt)"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNewChat}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="پاک کردن و شروع گفتگوی نو"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Collapsible Weekly Study Progress Recharts Section */}
              {isStatsOpen && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200 mb-2">
                  <StudyProgressChart theme={settings.theme} refreshTrigger={messages.length} />
                </div>
              )}

              {messages.map(msg => (
                <MessageItem
                  key={msg.id}
                  message={msg}
                  theme={settings.theme}
                  onEditAndResend={handleEditAndResendMessage}
                  onReact={handleMessageReaction}
                  onShowToast={showToast}
                />
              ))}

              {/* Typing Animation */}
              {isLoading && (
                <div
                  className={`flex items-center gap-3 p-4 rounded-3xl border w-fit animate-in fade-in duration-200 ${
                    isDark
                      ? 'bg-slate-900/80 border-slate-800 text-emerald-400'
                      : 'bg-white border-slate-200 text-emerald-600 shadow-sm'
                  }`}
                >
                  <div className="w-8 h-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 animate-spin text-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-medium">
                      <span>مشاور هوشمند راکان در حال تحلیل و پاسخ‌گویی است</span>
                      <span className="inline-flex gap-1">
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce"
                          style={{ animationDelay: '0ms' }}
                        />
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce"
                          style={{ animationDelay: '150ms' }}
                        />
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce"
                          style={{ animationDelay: '300ms' }}
                        />
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono">مدل هوش مصنوعی: {settings.model}</p>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Fixed Bottom Input Area */}
        <div
          className={`fixed bottom-0 left-0 right-0 z-20 pt-6 pb-4 px-3 sm:px-6 transition-colors ${
            isDark
              ? 'bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent'
              : 'bg-gradient-to-t from-slate-50 via-slate-50/95 to-transparent'
          }`}
        >
          <div className="max-w-4xl mx-auto space-y-2">
            {/* Draft Restored Banner */}
            {hasDraftRestored && inputQuery.trim() && (
              <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs animate-in fade-in duration-200">
                <div className="flex items-center gap-1.5">
                  <Save className="w-3.5 h-3.5 text-emerald-500" />
                  <span>پیش‌نویس نوشته شما به صورت خودکار بازیابی شد.</span>
                </div>
                <button
                  onClick={() => {
                    setInputQuery('');
                    localStorage.removeItem('rakan_chat_input_draft');
                    setHasDraftRestored(false);
                  }}
                  className="text-[11px] text-slate-400 hover:text-rose-500 underline transition-colors"
                >
                  پاک‌سازی پیش‌نویس
                </button>
              </div>
            )}

            {/* Auth Required Banner for Unregistered Users */}
            {!user && (
              <div
                id="auth-required-banner"
                onClick={() => setIsAuthOpen(true)}
                className="flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-indigo-500/15 border border-emerald-500/30 text-xs cursor-pointer hover:border-emerald-500/50 transition-all shadow-sm group"
              >
                <div className="flex items-center gap-2 text-emerald-400">
                  <Sparkles className="w-4 h-4 shrink-0 animate-pulse" />
                  <span className="text-slate-200">
                    برای استفاده از هوش مصنوعی راکان و ثبت سوابق، <strong className="text-emerald-400 font-bold group-hover:underline">ثبت‌نام یا ورود</strong> الزامی است.
                  </span>
                </div>
                <button
                  id="banner-login-btn"
                  type="button"
                  className="px-3 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[11px] shadow-sm shrink-0"
                >
                  ورود / ثبت‌نام
                </button>
              </div>
            )}

            {/* Quick Action Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
              <button
                id="quick-plan-6h-btn"
                onClick={() =>
                  setInputQuery(
                    'برای این هفته می‌خوام روزی ۶ ساعت مطالعه مفید داشته باشم، چطور دروس تخصصی و عمومی رو تفکیک کنم؟'
                  )
                }
                className={`px-3 py-1 rounded-full border whitespace-nowrap transition-colors flex items-center gap-1 shrink-0 ${
                  isDark
                    ? 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-xs'
                }`}
              >
                <Calendar className="w-3 h-3 text-emerald-500" />
                برنامه‌ریزی ۶ ساعته
              </button>

              <button
                id="quick-problem-btn"
                onClick={() =>
                  setInputQuery('این سوال درسی رو از پایه و با فرمول مرحله‌به‌مرحله برام حل و رفع اشکال کن: ')
                }
                className={`px-3 py-1 rounded-full border whitespace-nowrap transition-colors flex items-center gap-1 shrink-0 ${
                  isDark
                    ? 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-xs'
                }`}
              >
                <Brain className="w-3 h-3 text-indigo-500" />
                رفع اشکال مسئله
              </button>

              <button
                id="quick-exam-tech-btn"
                onClick={() =>
                  setInputQuery(
                    'تکنیک‌های مدیریت زمان در جلسه آزمون آزمایشی (ضربدر منها و زمان نقصانی) چطور اجرا می‌شن؟'
                  )
                }
                className={`px-3 py-1 rounded-full border whitespace-nowrap transition-colors flex items-center gap-1 shrink-0 ${
                  isDark
                    ? 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-xs'
                }`}
              >
                <Flame className="w-3 h-3 text-amber-500" />
                تکنیک‌های آزمون
              </button>

              <button
                id="quick-quiz-gen-btn"
                onClick={() =>
                  setInputQuery(
                    'لطفاً یک آزمونک تستی ۴ گزینه‌ای ۴ سوالی با پاسخ تشریحی از مبحث زیر برام آماده کن: '
                  )
                }
                className={`px-3 py-1 rounded-full border whitespace-nowrap transition-colors flex items-center gap-1 shrink-0 ${
                  isDark
                    ? 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-xs'
                }`}
              >
                <Sparkles className="w-3 h-3 text-teal-500" />
                آزمونک سنجش
              </button>
            </div>

            {/* Input Box with localStorage autosave, Hashtag suggestions & Character Counter */}
            {(() => {
              const dynamicStudySuggestion = analyzeQueryAndSuggestMode(inputQuery);
              return (
                <div
                  className={`relative flex flex-col rounded-3xl border shadow-2xl p-2.5 transition-all ${
                    isDark
                      ? 'bg-slate-900/95 border-slate-800 focus-within:border-emerald-500/80 focus-within:ring-2 focus-within:ring-emerald-500/20'
                      : 'bg-white border-slate-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 shadow-md'
                  }`}
                >
                  {/* Floating Hashtag Suggestions Dropdown */}
                  {showHashtags && (
                    <HashtagSuggestions
                      suggestions={filteredHashtags}
                      selectedIndex={selectedHashtagIndex}
                      onSelect={handleSelectHashtag}
                      theme={settings.theme}
                      searchQuery={hashtagQuery}
                    />
                  )}

                  {/* Textarea & Controls */}
                  <div className="flex items-end gap-2">
                    <textarea
                      id="chat-input-textarea"
                      ref={textareaRef}
                      rows={1}
                      value={inputQuery}
                      onChange={e => {
                        const val = e.target.value;
                        setInputQuery(val);
                        checkHashtagTrigger(val, e.target.selectionStart || val.length);
                      }}
                      onClick={e => {
                        const target = e.target as HTMLTextAreaElement;
                        checkHashtagTrigger(target.value, target.selectionStart || target.value.length);
                      }}
                      onKeyUp={e => {
                        const target = e.target as HTMLTextAreaElement;
                        checkHashtagTrigger(target.value, target.selectionStart || target.value.length);
                      }}
                      onKeyDown={handleKeyDown}
                      placeholder="سوال درسی، درخواست برنامه‌ریزی یا مبحث مورد نظرتان را بنویسید... (تایپ # برای موضوعات درسی)"
                      className={`flex-1 max-h-32 min-h-[44px] px-3.5 py-2.5 bg-transparent text-sm focus:outline-none resize-none leading-relaxed transition-[height] duration-150 ease-out overflow-y-auto ${
                        settings.fontFamily === 'monospace' ? 'font-mono' : 'font-sans'
                      } ${
                        isDark ? 'text-slate-100 placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'
                      }`}
                    />

                    {/* Voice Input Microphone Button with pulse & color shift when listening */}
                    <button
                      type="button"
                      id="voice-speech-input-btn"
                      onClick={toggleVoiceInput}
                      className={`p-3 rounded-2xl flex items-center justify-center transition-all duration-300 shrink-0 self-end ${
                        isListening
                          ? 'bg-gradient-to-tr from-rose-600 via-red-500 to-amber-500 text-white animate-pulse ring-4 ring-rose-500/40 shadow-xl shadow-rose-950/60 scale-105'
                          : isDark
                          ? 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                      title={
                        isListening
                          ? 'در حال شنیدن صدای شما با هوش مصنوعی... (کلیک برای پایان)'
                          : 'تایپ صوتی سوال با میکروفون (Web Speech - کلید میانبر: Ctrl+M)'
                      }
                    >
                      {isListening ? (
                        <div className="flex items-center gap-1">
                          <span className="w-1 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          <MicOff className="w-4 h-4 text-white mr-0.5" />
                        </div>
                      ) : (
                        <Mic className="w-4 h-4" />
                      )}
                    </button>

                    {/* Secondary Cancel/Clear Button (Only visible when textarea has content) */}
                    {inputQuery.length > 0 && (
                      <button
                        type="button"
                        id="cancel-chat-input-btn"
                        onClick={() => {
                          setInputQuery('');
                          localStorage.removeItem('rakan_chat_input_draft');
                          setHasDraftRestored(false);
                          if (textareaRef.current) {
                            textareaRef.current.style.height = '44px';
                            textareaRef.current.focus();
                          }
                          showToast('متن ورودی پاک شد');
                        }}
                        className={`p-3 rounded-2xl flex items-center justify-center transition-all duration-200 shrink-0 self-end ${
                          isDark
                            ? 'bg-slate-800/80 hover:bg-rose-950/60 hover:text-rose-400 text-slate-400 border border-slate-700/60 hover:border-rose-700/50'
                            : 'bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 border border-slate-200'
                        }`}
                        title="لغو و پاک‌سازی متن ورودی (Clear)"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}

                    {/* Send Button */}
                    <button
                      id="send-chat-message-btn"
                      onClick={() => handleSendMessage()}
                      disabled={!inputQuery.trim() || isLoading}
                      className={`p-3 rounded-2xl flex items-center justify-center transition-all duration-200 shrink-0 self-end ${
                        inputQuery.trim() && !isLoading
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50 hover:scale-105 active:scale-95'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                      title="ارسال پیام"
                    >
                      <Send className="w-4 h-4 rotate-180" />
                    </button>
                  </div>

                  {/* Dynamic Study Mode Suggestion Label / Tooltip below textarea */}
                  {dynamicStudySuggestion && (
                    <div
                      id="dynamic-study-mode-suggestion"
                      className={`flex items-center justify-between px-3 py-1.5 mt-2 rounded-2xl text-xs transition-all duration-200 animate-in fade-in slide-in-from-top-1 ${
                        isDark
                          ? 'bg-emerald-950/40 border border-emerald-800/50 text-emerald-300'
                          : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Compass className="w-3.5 h-3.5 text-emerald-400 animate-spin" style={{ animationDuration: '8s' }} />
                        <span className="font-medium">{dynamicStudySuggestion.text}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] opacity-80 hidden sm:inline">حالت پیشنهادی:</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSettings(s => ({
                              ...s,
                              systemPromptKey: dynamicStudySuggestion.recommendedModeId
                            }));
                            showToast(`حالت مشاور روی «${dynamicStudySuggestion.recommendedModeTitle}» تنظیم شد 🎯`);
                          }}
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-colors"
                        >
                          {dynamicStudySuggestion.recommendedModeTitle}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Bottom Metadata inside Textarea: Hashtag quick button, Academic Formatter, Copy button & Reading Complexity */}
                  <div className="flex flex-wrap items-center justify-between gap-2 px-2 pt-1.5 mt-1 border-t border-slate-700/20 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Hashtag Quick Helper */}
                      <button
                        type="button"
                        onClick={() => {
                          const newText = inputQuery ? `${inputQuery} #` : '#';
                          setInputQuery(newText);
                          setShowHashtags(true);
                          setHashtagQuery('');
                          textareaRef.current?.focus();
                        }}
                        className={`text-[11px] flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded-md ${
                          isDark ? 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800/60' : 'text-slate-500 hover:text-emerald-600 hover:bg-slate-100'
                        }`}
                        title="مشاهده هشتگ‌های مباحث درسی (#)"
                      >
                        <Hash className="w-3 h-3 text-emerald-500" />
                        <span>هشتگ درسی (#)</span>
                      </button>

                      {/* Shortcuts Quick Button */}
                      <button
                        type="button"
                        onClick={() => setIsShortcutsOpen(true)}
                        className={`text-[11px] flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded-md ${
                          isDark ? 'text-slate-400 hover:text-indigo-400 hover:bg-slate-800/60' : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-100'
                        }`}
                        title="مشاهده کلیدهای میانبر سریع سامانه"
                      >
                        <Keyboard className="w-3 h-3 text-indigo-400" />
                        <span className="hidden sm:inline">میانبرها (Ctrl+/)</span>
                      </button>

                      {/* Academic Text Formatter Button */}
                      {inputQuery.trim().length > 0 && (
                        <button
                          type="button"
                          id="academic-formatter-btn"
                          onClick={handleFormatAcademic}
                          className={`text-[11px] flex items-center gap-1 transition-all px-2 py-0.5 rounded-lg border font-medium active:scale-95 ${
                            isDark
                              ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/60'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          }`}
                          title="فرمت و ویرایش خودکار متن با استانداردهای آکادمیک، نیم‌فاصله‌ها و فاصله‌بندی پاراگراف‌ها"
                        >
                          <Wand2 className="w-3 h-3 text-emerald-400" />
                          <span>فرمت آکادمیک متن</span>
                        </button>
                      )}
                    </div>

                    {/* Character & Word Counter + Copy to Clipboard + Reading Complexity */}
                    {inputQuery.length > 0 && (
                      <div
                        id="character-counter-indicator"
                        className={`text-[11px] px-2.5 py-0.5 rounded-xl transition-all flex items-center gap-1.5 font-mono ${
                          inputQuery.length > 600
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30 font-bold'
                            : inputQuery.length >= 300
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 font-medium'
                            : isDark
                            ? 'text-slate-400 bg-slate-800/60 border border-slate-700/40'
                            : 'text-slate-600 bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {/* Copy to Clipboard Inside Counter Container */}
                        <button
                          type="button"
                          id="copy-draft-counter-btn"
                          onClick={handleCopyDraft}
                          className="p-1 -mr-1 hover:bg-slate-700/50 rounded-md transition-colors text-slate-400 hover:text-emerald-400"
                          title="کپی کردن پیش‌نویس متن (Copy to Clipboard)"
                        >
                          {copiedDraft ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <span className="text-slate-500">|</span>

                        {/* Reading Complexity Badge */}
                        {(() => {
                          const complexity = calculateReadingComplexity(inputQuery);
                          const isEn = settings.language === 'en';
                          return (
                            <span
                              id="reading-complexity-badge"
                              className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md font-sans text-[10px] font-bold border ${complexity.bgClass} ${complexity.colorClass} ${complexity.borderClass}`}
                              title={`${isEn ? 'Reading Complexity' : 'شاخص پیچیدگی متن'}: ${complexity.score}/100 - ${isEn ? complexity.descriptionEn : complexity.descriptionFa}`}
                            >
                              <BookOpen className="w-2.5 h-2.5" />
                              <span>{isEn ? complexity.labelEn : complexity.labelFa}</span>
                            </span>
                          );
                        })()}

                        <span className="text-slate-500">|</span>

                        <span>{inputQuery.length.toLocaleString('fa-IR')}</span>
                        <span className="text-[10px]">کاراکتر</span>
                        <span className="text-slate-500">|</span>
                        <span>
                          {inputQuery.trim()
                            ? inputQuery
                                .trim()
                                .split(/\s+/)
                                .length.toLocaleString('fa-IR')
                            : 0}
                        </span>
                        <span className="text-[10px]">کلمه</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Sub-bar hint */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 px-2">
              <span className="flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-emerald-500" />
                تعاملات به همراه زمان در فایل <strong className="font-mono text-slate-400">chat_history.json</strong> ذخیره می‌گردند.
              </span>
              <span className="hidden sm:inline">مشاور هوشمند مدرسه راکان | Rakan School AI Advisor</span>
            </div>
          </div>
        </div>
      </main>

      {/* Modals & Tools Drawer */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />

      <HistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />

      <StudyToolsPanel
        isOpen={isToolsOpen}
        onClose={() => setIsToolsOpen(false)}
        theme={settings.theme}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        onOpenDevPanel={() => setIsDevPanelOpen(true)}
        theme={settings.theme}
      />

      <DeveloperPanelModal
        isOpen={isDevPanelOpen}
        onClose={() => setIsDevPanelOpen(false)}
        theme={settings.theme}
      />

      <NotificationCenter
        isOpen={isNotificationsOpen}
        onClose={() => {
          setIsNotificationsOpen(false);
          setUnreadNotifs(getUnreadNotificationsCount());
        }}
      />

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
        theme={settings.theme}
      />

      {/* Mobile Quick Navigation Bar */}
      <div className={`sm:hidden fixed bottom-0 left-0 right-0 z-30 border-t backdrop-blur-lg px-2 py-1.5 flex items-center justify-around text-[10px] font-medium transition-colors ${
        isDark ? 'bg-slate-950/95 border-slate-800 text-slate-400' : 'bg-white/95 border-slate-200 text-slate-600 shadow-lg'
      }`}>
        <button
          type="button"
          onClick={() => {
            textareaRef.current?.focus();
            scrollToBottom();
          }}
          className="flex flex-col items-center gap-0.5 p-1 text-emerald-500 hover:text-emerald-400"
        >
          <MessageSquare className="w-4 h-4" />
          <span>گفتگو</span>
        </button>

        <button
          type="button"
          onClick={() => setIsToolsOpen(true)}
          className="flex flex-col items-center gap-0.5 p-1 hover:text-indigo-400"
        >
          <Wrench className="w-4 h-4 text-indigo-400" />
          <span>ابزارها</span>
        </button>

        <button
          type="button"
          onClick={() => setIsStatsOpen(prev => !prev)}
          className="flex flex-col items-center gap-0.5 p-1 hover:text-amber-400"
        >
          <BarChart3 className="w-4 h-4 text-amber-400" />
          <span>پیشرفت</span>
        </button>

        <button
          type="button"
          onClick={() => setIsHistoryOpen(true)}
          className="flex flex-col items-center gap-0.5 p-1 hover:text-cyan-400"
        >
          <History className="w-4 h-4 text-cyan-400" />
          <span>سوابق</span>
        </button>

        <button
          type="button"
          onClick={() => setIsSettingsOpen(true)}
          className="flex flex-col items-center gap-0.5 p-1 hover:text-slate-200"
        >
          <SettingsIcon className="w-4 h-4" />
          <span>تنظیمات</span>
        </button>
      </div>

      {/* Floating Interactive Toast Feedback */}
      {toastMessage && (
        <div
          id="rakan-toast-notification"
          className="fixed bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-slate-950/90 border border-slate-700 text-white shadow-2xl text-xs sm:text-sm font-medium flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200 backdrop-blur-md"
        >
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle className="w-3.5 h-3.5" />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
