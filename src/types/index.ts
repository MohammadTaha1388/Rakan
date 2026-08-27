export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string; // ISO string
  persianTime?: string;
  modelUsed?: string;
  temperature?: number;
  systemPromptName?: string;
  durationMs?: number;
  isError?: boolean;
  reactions?: {
    thumbsUp?: boolean;
    heart?: boolean;
  };
}

export interface InteractionLog {
  id: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  userRole?: string;
  timestamp: string;
  persianDate: string;
  userQuery: string;
  botResponse: string;
  model: string;
  temperature: number;
  systemPromptName: string;
  durationMs: number;
  status: 'success' | 'error';
  metadata?: {
    studentGrade?: string;
    studentField?: string;
    topic?: string;
    blockedBySecurity?: boolean;
  };
}

export interface SystemPromptPreset {
  id: string;
  name: string;
  title: string;
  badge: string;
  description: string;
  prompt: string;
  icon: string;
}

export interface AdvisorSettings {
  model: string;
  customModelName?: string;
  aiProvider?: 'gemini' | 'custom' | 'partschool';
  temperature: number;
  systemPromptKey: string;
  customSystemPrompt: string;
  customEndpointUrl: string;
  customApiKey: string;
  studentName: string;
  studentGrade: string;
  studentField: string;
  studyGoal: string;
  studyGoals?: string[];
  theme: 'dark' | 'light';
  language?: 'fa' | 'en' | 'ar' | 'fr' | 'de' | 'tr' | 'es';
  fontFamily?: 'vazirmatn' | 'monospace';
  mechanicalKeyboardSound?: boolean;
  browserNotifications: boolean;
  studyReminders: boolean;
  dailyReminderEnabled?: boolean;
  dailyReminderTime?: string;
  dailyReminderDays?: string[];
}

export interface StudyNote {
  id: string;
  title?: string;
  text: string;
  category: 'general' | 'math' | 'physics' | 'biology' | 'chemistry' | 'konkur' | 'planning' | 'exam' | 'advisory';
  sourceMessageId?: string;
  date: string;
  timestamp: string;
  tags?: string[];
  isPinned?: boolean;
}

export interface QuickPrompt {
  id: string;
  category: 'planning' | 'academic' | 'exam' | 'motivation' | 'quiz';
  title: string;
  description: string;
  prompt: string;
  icon: string;
  color: string;
}

export type UserRoleType = 
  | 'elementary' 
  | 'middle_school' 
  | 'high_school' 
  | 'konkur' 
  | 'university' 
  | 'parent'
  | 'developer';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role?: UserRoleType;
  roleTitle?: string;
  grade?: string;
  field?: string;
  createdAt: string;
  avatarColor?: string;
  lastLoginAt?: string;
  messageCount?: number;
}

export interface DeveloperSettings {
  masterSystemPrompt: string;
  securityLevel: 'maximum' | 'high' | 'standard';
  antiPromptInjection: boolean;
  antiLeakageGuardrails: boolean;
  allowUserCustomPrompt: boolean;
  defaultModel?: string;
  developerPasswordHash?: string;
  lastUpdated?: string;
}

export interface AdminUserData extends UserProfile {
  messageCount: number;
  lastActive: string;
  recentMessages?: InteractionLog[];
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'reminder' | 'pomodoro' | 'chat' | 'system' | 'security';
  timestamp: string;
  persianTime: string;
  read: boolean;
}

export interface DailyActivityStat {
  dayName: string;
  dateStr: string;
  questionsCount: number;
  studyMinutes: number;
  tokensEstimated: number;
}

