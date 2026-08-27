import type { Request, Response } from 'express';
import { processChatRequest } from './geminiService';
import { getChatHistory, clearChatHistory, getHistoryFilePath } from './storage';
import { getUserFromToken, getAllUsersForAdmin, deleteUserById } from './authService';
import {
  verifyDeveloperPassword,
  verifyDeveloperCredentials,
  createDeveloperSession,
  isValidDeveloperSession,
  revokeDeveloperSession,
  getDeveloperSettings,
  saveDeveloperSettings,
  updateDeveloperPassword
} from './developerSettings';
import { DailyActivityStat } from '../types';
import fs from 'fs';

export async function handleChatApi(req: Request, res: Response): Promise<void> {
  try {
    const payload = req.body;
    if (!payload || !payload.messages || !Array.isArray(payload.messages)) {
      res.status(400).json({ error: 'آرایه پیام‌ها (messages) الزامی است.' });
      return;
    }

    // MANDATORY AUTHENTICATION: Check user token
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : '';
    const user = token ? getUserFromToken(token) : null;

    if (!user) {
      res.status(401).json({
        error: 'برای ارسال سوال و استفاده از هوش مصنوعی حتماً باید وارد حساب کاربری خود شوید یا ثبت‌نام کنید.',
        requireAuth: true
      });
      return;
    }

    // Attach verified user identity
    payload.userId = user.id;
    payload.userEmail = user.email;
    payload.userName = user.name;
    payload.userRole = user.roleTitle || user.grade || 'دانش‌آموز';

    if (!payload.metadata) payload.metadata = {};
    payload.metadata.studentGrade = user.grade;
    payload.metadata.studentField = user.field;

    const result = await processChatRequest(payload);
    res.json({ success: true, ...result });
  } catch (err: unknown) {
    console.error('API /api/chat error:', err);
    res.status(500).json({
      error: 'خطای داخلی سرور در پردازش درخواست',
      details: err instanceof Error ? err.message : String(err)
    });
  }
}

// User-specific or Developer history endpoint
export function handleGetHistoryApi(req: Request, res: Response): void {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : '';
    
    // Check if developer token
    const isDev = isValidDeveloperSession(token);
    const user = !isDev && token ? getUserFromToken(token) : null;

    const allLogs = getChatHistory();

    if (isDev) {
      // Developer can see all messages of all users
      res.json({ success: true, count: allLogs.length, logs: allLogs, isDeveloper: true });
      return;
    }

    if (user) {
      // Normal user can ONLY see their own messages
      const userLogs = allLogs.filter(l => l.userId === user.id || l.userEmail === user.email);
      res.json({ success: true, count: userLogs.length, logs: userLogs, currentUserId: user.id });
      return;
    }

    // Guest has no access to stored database logs
    res.json({ success: true, count: 0, logs: [], currentUserId: null });
  } catch (err: unknown) {
    console.error('API /api/history error:', err);
    res.status(500).json({ error: 'خطا در دریافت تاریخچه پیام‌ها' });
  }
}

export function handleWeeklyStatsApi(req: Request, res: Response): void {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : '';
    const isDev = isValidDeveloperSession(token);
    const user = !isDev && token ? getUserFromToken(token) : null;

    const allLogs = getChatHistory();
    const targetLogs = isDev ? allLogs : (user ? allLogs.filter(l => l.userId === user.id || l.userEmail === user.email) : []);

    const now = new Date();
    const persianDays = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];
    const statsMap = new Map<string, DailyActivityStat>();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay();
      const dayName = persianDays[dayOfWeek];
      
      statsMap.set(dateKey, {
        dayName,
        dateStr: dateKey,
        questionsCount: 0,
        studyMinutes: 0,
        tokensEstimated: 0
      });
    }

    targetLogs.forEach(log => {
      if (!log.timestamp) return;
      const logDateKey = log.timestamp.split('T')[0];
      if (statsMap.has(logDateKey)) {
        const item = statsMap.get(logDateKey)!;
        item.questionsCount += 1;
        item.studyMinutes += Math.max(3, Math.round((log.durationMs || 1000) / 1000 * 0.5 + 4));
        item.tokensEstimated += Math.round((log.userQuery.length + log.botResponse.length) / 3);
      }
    });

    const weeklyStats = Array.from(statsMap.values());
    const totalQuestions = weeklyStats.reduce((acc, curr) => acc + curr.questionsCount, 0);
    const totalMinutes = weeklyStats.reduce((acc, curr) => acc + curr.studyMinutes, 0);

    res.json({
      success: true,
      stats: weeklyStats,
      summary: {
        totalQuestions,
        totalMinutes,
        activeDays: weeklyStats.filter(s => s.questionsCount > 0).length
      }
    });
  } catch (err: unknown) {
    console.error('API /api/stats/weekly error:', err);
    res.status(500).json({ error: 'خطا در محاسبه آمار هفتگی مطالعه' });
  }
}

// Developer Admin Login
export async function handleAdminLoginApi(req: Request, res: Response): Promise<void> {
  try {
    const { username, password } = req.body || {};
    if (!password) {
      res.status(400).json({ error: 'رمز عبور توسعه‌دهنده الزامی است.' });
      return;
    }

    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
    const authResult = await verifyDeveloperCredentials(username || 'rakan_Mohammad', String(password).trim(), clientIp);

    if (!authResult.success) {
      res.status(401).json({ error: authResult.error || 'نام کاربری یا رمز عبور توسعه‌دهنده نادرست است.' });
      return;
    }

    const devToken = createDeveloperSession();
    res.json({
      success: true,
      message: 'ورود امن به پنل حاکمیتی توسعه‌دهنده موفقیت‌آمیز بود.',
      devToken
    });
  } catch (err: unknown) {
    console.error('API /api/admin/login error:', err);
    res.status(500).json({ error: 'خطای سرور در احراز هویت توسعه‌دهنده' });
  }
}

// Developer Admin: Get full data (Users + All Messages + Master System Prompt + Stats)
export function handleAdminGetDataApi(req: Request, res: Response): void {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : '';

    if (!isValidDeveloperSession(token)) {
      res.status(403).json({ error: 'دسترسی غیرمجاز: نیاز به توکن فعال توسعه‌دهنده دارد.' });
      return;
    }

    const users = getAllUsersForAdmin();
    const logs = getChatHistory();
    const devSettings = getDeveloperSettings();

    const totalQuestions = logs.length;
    const totalBlockedThreats = logs.filter(l => l.metadata?.blockedBySecurity).length;

    res.json({
      success: true,
      data: {
        users,
        logs,
        developerSettings: {
          masterSystemPrompt: devSettings.masterSystemPrompt,
          securityLevel: devSettings.securityLevel,
          antiPromptInjection: devSettings.antiPromptInjection,
          antiLeakageGuardrails: devSettings.antiLeakageGuardrails,
          allowUserCustomPrompt: devSettings.allowUserCustomPrompt,
          lastUpdated: devSettings.lastUpdated
        },
        stats: {
          totalUsers: users.length,
          totalMessages: totalQuestions,
          totalBlockedThreats,
          serverUptime: process.uptime()
        }
      }
    });
  } catch (err: unknown) {
    console.error('API /api/admin/data error:', err);
    res.status(500).json({ error: 'خطا در دریافت اطلاعات پنل توسعه‌دهنده' });
  }
}

// Developer Admin: Update Settings & Master Prompt
export function handleAdminUpdateSettingsApi(req: Request, res: Response): void {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : '';

    if (!isValidDeveloperSession(token)) {
      res.status(403).json({ error: 'دسترسی غیرمجاز' });
      return;
    }

    const { masterSystemPrompt, securityLevel, antiPromptInjection, antiLeakageGuardrails, allowUserCustomPrompt } = req.body;

    const updated = saveDeveloperSettings({
      ...(typeof masterSystemPrompt === 'string' && masterSystemPrompt.trim() ? { masterSystemPrompt: masterSystemPrompt.trim() } : {}),
      ...(securityLevel ? { securityLevel } : {}),
      ...(typeof antiPromptInjection === 'boolean' ? { antiPromptInjection } : {}),
      ...(typeof antiLeakageGuardrails === 'boolean' ? { antiLeakageGuardrails } : {}),
      ...(typeof allowUserCustomPrompt === 'boolean' ? { allowUserCustomPrompt } : {})
    });

    res.json({
      success: true,
      message: 'تنظیمات و پرامپت حاکم توسعه‌دهنده با موفقیت ذخیره و در سرتاسر سیستم اعمال شد.',
      developerSettings: updated
    });
  } catch (err: unknown) {
    console.error('API /api/admin/settings error:', err);
    res.status(500).json({ error: 'خطا در ذخیره تنظیمات توسعه‌دهنده' });
  }
}

// Developer Admin: Change Password
export async function handleAdminChangePasswordApi(req: Request, res: Response): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : '';

    if (!isValidDeveloperSession(token)) {
      res.status(403).json({ error: 'دسترسی غیرمجاز' });
      return;
    }

    const { newPassword } = req.body;
    if (!newPassword || String(newPassword).length < 6) {
      res.status(400).json({ error: 'رمز عبور جدید باید حداقل ۶ کاراکتر باشد.' });
      return;
    }

    const ok = await updateDeveloperPassword(String(newPassword));
    if (ok) {
      res.json({ success: true, message: 'گذرواژه پنل توسعه‌دهنده با موفقیت تغییر یافت.' });
    } else {
      res.status(500).json({ error: 'خطا در به‌روزرسانی رمز عبور' });
    }
  } catch (err: unknown) {
    console.error('API /api/admin/change-password error:', err);
    res.status(500).json({ error: 'خطای سرور در تغییر رمز عبور' });
  }
}

// Developer Admin: Delete User
export function handleAdminDeleteUserApi(req: Request, res: Response): void {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : '';

    if (!isValidDeveloperSession(token)) {
      res.status(403).json({ error: 'دسترسی غیرمجاز' });
      return;
    }

    const { id } = req.params;
    const ok = deleteUserById(id);
    if (ok) {
      res.json({ success: true, message: 'کاربر با موفقیت حذف گردید.' });
    } else {
      res.status(404).json({ error: 'کاربر مورد نظر یافت نشد.' });
    }
  } catch (err: unknown) {
    console.error('API /api/admin/users/:id delete error:', err);
    res.status(500).json({ error: 'خطا در حذف کاربر' });
  }
}

// Developer Admin: Clear Logs
export function handleAdminClearLogsApi(req: Request, res: Response): void {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : '';

    if (!isValidDeveloperSession(token)) {
      res.status(403).json({ error: 'دسترسی غیرمجاز' });
      return;
    }

    clearChatHistory();
    res.json({ success: true, message: 'تمام گزارش‌ها و پیام‌های کاربران با موفقیت پاک‌سازی شد.' });
  } catch (err: unknown) {
    console.error('API /api/admin/clear-logs error:', err);
    res.status(500).json({ error: 'خطا در پاک‌سازی گزارش‌ها' });
  }
}

// Developer Admin Logout
export function handleAdminLogoutApi(req: Request, res: Response): void {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : '';
    if (token) {
      revokeDeveloperSession(token);
    }
    res.json({ success: true, message: 'خروج از پنل توسعه‌دهنده انجام شد.' });
  } catch (err: unknown) {
    console.error('API /api/admin/logout error:', err);
    res.status(500).json({ error: 'خطا در خروج' });
  }
}

export function handleClearHistoryApi(req: Request, res: Response): void {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : '';
    
    // Only Developer can clear global database history
    if (!isValidDeveloperSession(token)) {
      res.status(403).json({ error: 'تنها توسعه‌دهنده مجاز به پاک‌سازی دیتابیس پیام‌ها می‌باشد.' });
      return;
    }

    const success = clearChatHistory();
    res.json({ success, message: 'تاریخچه چت با موفقیت پاک‌سازی شد.' });
  } catch (err: unknown) {
    console.error('API /api/history/clear error:', err);
    res.status(500).json({ error: 'خطا در پاک‌سازی تاریخچه' });
  }
}

export function handleDownloadHistoryApi(req: Request, res: Response): void {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : '';
    
    // Only Developer can download the full database history
    if (!isValidDeveloperSession(token)) {
      res.status(403).json({ error: 'دسترسی فقط مخصوص توسعه‌دهنده است.' });
      return;
    }

    const filePath = getHistoryFilePath();
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'فایل تاریخچه یافت نشد.' });
      return;
    }
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="rakan_chat_history.json"');
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (err: unknown) {
    console.error('API /api/history/download error:', err);
    res.status(500).json({ error: 'خطا در دانلود فایل تاریخچه' });
  }
}

export function handleStatusApi(_req: Request, res: Response): void {
  const logs = getChatHistory();
  res.json({
    status: 'online',
    app: 'Rakan School AI Advisor',
    serverTime: new Date().toISOString(),
    totalLogs: logs.length,
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY)
  });
}

