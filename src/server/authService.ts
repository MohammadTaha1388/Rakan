import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import type { Request, Response } from 'express';
import { UserProfile, UserRoleType, AdminUserData } from '../types';
import { getChatHistory } from './storage';

const USERS_FILE_PATH = path.resolve(process.cwd(), 'users.json');

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role?: UserRoleType;
  roleTitle?: string;
  grade?: string;
  field?: string;
  createdAt: string;
  lastLoginAt?: string;
  avatarColor: string;
}

const AVATAR_COLORS = [
  'bg-emerald-500',
  'bg-teal-500',
  'bg-indigo-500',
  'bg-blue-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-purple-500',
  'bg-cyan-500'
];

function ensureUsersFile(): void {
  try {
    if (!fs.existsSync(USERS_FILE_PATH)) {
      fs.writeFileSync(USERS_FILE_PATH, JSON.stringify([], null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('Error ensuring users.json exists:', err);
  }
}

export function readUsers(): StoredUser[] {
  try {
    ensureUsersFile();
    const data = fs.readFileSync(USERS_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error reading users.json:', err);
    return [];
  }
}

export function writeUsers(users: StoredUser[]): boolean {
  try {
    ensureUsersFile();
    fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(users, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing to users.json:', err);
    return false;
  }
}

// In-memory active tokens mapping: token -> { userId, expiresAt }
const activeSessions = new Map<string, { userId: string; expiresAt: number }>();

function generateToken(userId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
  activeSessions.set(token, { userId, expiresAt });
  return token;
}

export function getUserFromToken(token: string): UserProfile | null {
  if (!token) return null;
  const session = activeSessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    activeSessions.delete(token);
    return null;
  }
  const users = readUsers();
  const found = users.find(u => u.id === session.userId);
  if (!found) return null;

  return {
    id: found.id,
    name: found.name,
    email: found.email,
    role: found.role,
    roleTitle: found.roleTitle,
    grade: found.grade,
    field: found.field,
    createdAt: found.createdAt,
    lastLoginAt: found.lastLoginAt,
    avatarColor: found.avatarColor
  };
}

export function getRoleTitle(role?: UserRoleType, grade?: string): string {
  switch (role) {
    case 'elementary':
      return 'دانش‌آموز ابتدایی (دبستان)';
    case 'middle_school':
      return 'دانش‌آموز متوسطه اول';
    case 'high_school':
      return 'دانش‌آموز متوسطه دوم';
    case 'konkur':
      return 'داوطلب کنکور سراسری';
    case 'university':
      return 'دانشجو / دانشگاهی';
    case 'parent':
      return 'والدین و اولیای گرامی';
    case 'developer':
      return 'توسعه‌دهنده سیستم';
    default:
      if (grade?.includes('دبستان') || grade?.includes('ابتدایی')) return 'دانش‌آموز ابتدایی';
      if (grade?.includes('هفتم') || grade?.includes('هشتم') || grade?.includes('نهم') || grade?.includes('متوسطه اول')) return 'دانش‌آموز متوسطه اول';
      if (grade?.includes('والدین') || grade?.includes('اولیا')) return 'والدین و اولیای گرامی';
      return grade || 'دانش‌آموز راکان';
  }
}

export async function handleRegisterApi(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password, role, grade, field } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ error: 'نام و نام‌خانوادگی، ایمیل و رمز عبور الزامی هستند.' });
      return;
    }

    const emailClean = String(email).trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailClean)) {
      res.status(400).json({ error: 'فرمت ایمیل واردشده نامعتبر است.' });
      return;
    }

    if (String(password).length < 6) {
      res.status(400).json({ error: 'رمز عبور باید حداقل شامل ۶ کاراکتر باشد.' });
      return;
    }

    const users = readUsers();
    if (users.some(u => u.email === emailClean)) {
      res.status(409).json({ error: 'کاربری با این ایمیل قبلاً در مدرسه راکان ثبت‌نام کرده است.' });
      return;
    }

    const userRole: UserRoleType = role || (
      grade?.includes('دبستان') || grade?.includes('ابتدایی') ? 'elementary' :
      grade?.includes('متوسطه اول') || grade?.includes('هفتم') || grade?.includes('هشتم') || grade?.includes('نهم') ? 'middle_school' :
      grade?.includes('والدین') || grade?.includes('اولیا') ? 'parent' :
      grade?.includes('کنکور') || grade?.includes('دوازدهم') ? 'konkur' :
      grade?.includes('دانشجو') ? 'university' : 'high_school'
    );

    // Normalize field and grade based on user role (Elementary, Middle School and Parent do not have high-school fields)
    let finalGrade = grade || 'پایه دوازدهم / کنکوری';
    let finalField = field || 'عمومی';

    if (userRole === 'elementary') {
      finalGrade = grade || 'دوره ابتدایی (پایه ۱ تا ۶)';
      finalField = 'دروس پایه‌ای ابتدایی';
    } else if (userRole === 'middle_school') {
      finalGrade = grade || 'دوره متوسطه اول (پایه ۷ تا ۹)';
      finalField = 'دروس عمومی متوسطه اول';
    } else if (userRole === 'parent') {
      finalGrade = 'والدین و اولیای دانش‌آموز';
      finalField = 'هدایت تحصیلی و نظارت فرزند';
    }

    const roleTitle = getRoleTitle(userRole, finalGrade);

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser: StoredUser = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      name: String(name).trim(),
      email: emailClean,
      passwordHash,
      role: userRole,
      roleTitle,
      grade: finalGrade,
      field: finalField,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
    };

    users.push(newUser);
    writeUsers(users);

    const token = generateToken(newUser.id);
    const profile: UserProfile = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      roleTitle: newUser.roleTitle,
      grade: newUser.grade,
      field: newUser.field,
      createdAt: newUser.createdAt,
      lastLoginAt: newUser.lastLoginAt,
      avatarColor: newUser.avatarColor
    };

    res.json({
      success: true,
      message: `خوش آمدید ${newUser.name}! حساب کاربری (${roleTitle}) با موفقیت ایجاد شد.`,
      token,
      user: profile
    });
  } catch (err: unknown) {
    console.error('API /api/auth/register error:', err);
    res.status(500).json({ error: 'خطای سرور در فرآیند ثبت‌نام کاربر.' });
  }
}

export async function handleLoginApi(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'ایمیل و رمز عبور الزامی است.' });
      return;
    }

    const emailClean = String(email).trim().toLowerCase();
    const users = readUsers();
    const userIndex = users.findIndex(u => u.email === emailClean);

    if (userIndex === -1) {
      res.status(401).json({ error: 'کاربری با این ایمیل یافت نشد.' });
      return;
    }

    const user = users[userIndex];
    const isMatch = await bcrypt.compare(String(password), user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'رمز عبور واردشده صحیح نیست.' });
      return;
    }

    // Update lastLoginAt
    user.lastLoginAt = new Date().toISOString();
    users[userIndex] = user;
    writeUsers(users);

    const token = generateToken(user.id);
    const profile: UserProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      roleTitle: user.roleTitle || getRoleTitle(user.role, user.grade),
      grade: user.grade,
      field: user.field,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      avatarColor: user.avatarColor
    };

    res.json({
      success: true,
      message: `خوش آمدید ${user.name}! ورود موفقیت‌آمیز بود.`,
      token,
      user: profile
    });
  } catch (err: unknown) {
    console.error('API /api/auth/login error:', err);
    res.status(500).json({ error: 'خطای سرور در ورود به سیستم.' });
  }
}

export function handleMeApi(req: Request, res: Response): void {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : '';

    const user = getUserFromToken(token);
    if (!user) {
      res.status(401).json({ error: 'نشست کاربری نامعتبر یا منقضی شده است.' });
      return;
    }

    res.json({ success: true, user });
  } catch (err: unknown) {
    console.error('API /api/auth/me error:', err);
    res.status(500).json({ error: 'خطا در اعتبارسنجی کاربر.' });
  }
}

export function handleLogoutApi(req: Request, res: Response): void {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : '';
    if (token) {
      activeSessions.delete(token);
    }
    res.json({ success: true, message: 'خروج موفقیت‌آمیز انجام شد.' });
  } catch (err: unknown) {
    console.error('API /api/auth/logout error:', err);
    res.status(500).json({ error: 'خطا در فرآیند خروج.' });
  }
}

// Developer Admin: Get all users with stats
export function getAllUsersForAdmin(): AdminUserData[] {
  const users = readUsers();
  const allLogs = getChatHistory();

  return users.map(u => {
    const userLogs = allLogs.filter(l => l.userId === u.id || l.userEmail === u.email);
    const lastInteraction = userLogs.length > 0 ? userLogs[userLogs.length - 1].timestamp : u.lastLoginAt || u.createdAt;
    
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      roleTitle: u.roleTitle || getRoleTitle(u.role, u.grade),
      grade: u.grade,
      field: u.field,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt,
      avatarColor: u.avatarColor,
      messageCount: userLogs.length,
      lastActive: lastInteraction
    };
  });
}

// Developer Admin: Delete User
export function deleteUserById(userId: string): boolean {
  const users = readUsers();
  const filtered = users.filter(u => u.id !== userId);
  if (filtered.length === users.length) return false;
  return writeUsers(filtered);
}

