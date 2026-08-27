import { GoogleGenAI } from '@google/genai';
import { appendInteractionLog } from './storage';
import { InteractionLog } from '../types';
import {
  getDeveloperSettings,
  detectPromptInjection,
  sanitizeAssistantOutput
} from './developerSettings';

function getPersianDateTime(): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    return formatter.format(now);
  } catch {
    return new Date().toISOString();
  }
}

interface ChatRequestPayload {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  model?: string;
  customModelName?: string;
  temperature?: number;
  systemPrompt?: string;
  systemPromptName?: string;
  customEndpointUrl?: string;
  customApiKey?: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  userRole?: string;
  studyGoals?: string[];
  metadata?: {
    studentGrade?: string;
    studentField?: string;
    topic?: string;
    studyGoal?: string;
    studyGoals?: string[];
    blockedBySecurity?: boolean;
  };
}

function normalizeGeminiModel(model?: string): string {
  if (!model) return 'gemini-3.7-flash';
  const m = model.toLowerCase().trim();
  if (m === 'custom-ai' || m === 'racode-llm') {
    return m;
  }
  if (m.includes('3.1-pro') || m.includes('2.5-pro') || m.includes('1.5-pro') || m === 'gemini-pro') {
    return 'gemini-3.1-pro-preview';
  }
  if (m.includes('lite') || m.includes('flash-lite')) {
    return 'gemini-3.1-flash-lite';
  }
  if (m === 'gemini-3.7-flash' || m === 'gemini-flash-latest') {
    return 'gemini-3.7-flash';
  }
  // Deprecated 1.5/2.0/2.5 flash or other aliases fallback to 3.7-flash
  if (m.startsWith('gemini-')) {
    return 'gemini-3.7-flash';
  }
  return 'gemini-3.7-flash';
}

export async function processChatRequest(payload: ChatRequestPayload): Promise<{
  text: string;
  modelUsed: string;
  durationMs: number;
  persianTime: string;
  logId: string;
}> {
  const startTime = Date.now();
  const rawModel = payload.model || 'gemini-3.7-flash';
  const isCustomAi = rawModel === 'custom-ai' || rawModel === 'racode-llm' || Boolean(payload.customApiKey && payload.customApiKey.trim());
  const modelName = isCustomAi ? (rawModel === 'racode-llm' ? 'racode-llm' : (payload.customModelName || 'custom-model')) : normalizeGeminiModel(rawModel);
  const temperature = typeof payload.temperature === 'number' ? payload.temperature : 0.7;
  
  // Extract user's latest query
  const lastUserMessage = [...payload.messages].reverse().find(m => m.role === 'user');
  const userQuery = lastUserMessage ? lastUserMessage.content : '';

  // 1. Fetch Developer Master System Prompt (Highest authority in the system)
  const devSettings = getDeveloperSettings();
  const masterSystemPrompt = devSettings.masterSystemPrompt;

  // Subordinate user prompt preference
  const userRequestedPrompt = devSettings.allowUserCustomPrompt && payload.systemPrompt
    ? payload.systemPrompt
    : '';

  const systemPromptName = payload.systemPromptName || 'مشاور تحصیلی راکان';

  // 2. High-Security Anti-Leakage & Prompt Injection Gatekeeper
  let isThreatBlocked = false;
  if (devSettings.antiPromptInjection && detectPromptInjection(userQuery)) {
    isThreatBlocked = true;
  }

  // Collect student study goals
  const goalsList = Array.isArray(payload.studyGoals) && payload.studyGoals.length > 0
    ? payload.studyGoals
    : (payload.metadata?.studyGoals || (payload.metadata?.studyGoal ? [payload.metadata.studyGoal] : []));
  const studyGoalsFormatted = goalsList.length > 0
    ? goalsList.map((g, i) => `  ${i + 1}. ${g}`).join('\n')
    : 'هدف‌گذاری عمومی تحصیلی و ارتقای معدل و تراز';

  // 3. Build Unified Layered Prompt Structure:
  // Layer 1 (Master Authority): Developer Master System Prompt + Security Policy
  // Layer 2 (Context): Authenticated Student Identity, Role & Active Study Goals
  // Layer 3 (Subordinate): User-selected UI Advisor mode (Only as style guide, strictly inferior)
  // Layer 4 (Language Policy): Critical instruction to preserve and answer in the language requested or used in query
  const unifiedSystemInstruction = `
${masterSystemPrompt}

=========================================
🎓 مشخصات پرونده کاربری احرازشده در سیستم راکان:
نام کاربر: ${payload.userName || 'کاربر گرامی'}
نقش / مقطع: ${payload.userRole || payload.metadata?.studentGrade || 'دانش‌آموز'}
رشته تحصیلی: ${payload.metadata?.studentField || 'عمومی'}
ایمیل: ${payload.userEmail || 'ناشناس'}

🎯 اهداف مطالعاتی و چشم‌انداز آموزشی فعال دانش‌آموز (Study Goals):
${studyGoalsFormatted}
* تذکر ویژه به مشاور: تمامی راهکارها، برنامه‌ریزی‌ها و مشاوره‌های درسی باید مستقیماً در راستای تحقق اهداف فوق جهت‌دهی شوند.
=========================================

[دستورالعمل زبان پاسخ‌دهی (CRITICAL LANGUAGE POLICY)]:
پاسخ هر پرسش را دقیقاً به همان زبانی ارائه دهید که کاربر در پرسش خود به کار برده یا صراحتاً در پیام درخواست کرده است (اگر به فارسی پرسید، به فارسی روان و آکادمیک پاسخ دهید؛ اگر به انگلیسی پرسید، به انگلیسی دقیق و علمی پاسخ دهید؛ اگر به عربی، فرانسه، آلمانی، ترکی یا اسپانیایی بود نیز به همان زبان پاسخ دهید). از تغییر نامربوط زبان یا ترجمه اجباری خودداری کنید مگر آنکه کاربر تمرین ترجمه خواسته باشد.

[ترجیحات سبک آموزشی کاربر (صرفاً راهنمای نحوه بیان، تحت حاکمیت قوانین بالا)]:
${userRequestedPrompt || 'ارائه مشاوره تخصصی، علمی و کاربردی متناسب با مقطع تحصیلی فوق'}
`.trim();

  let generatedText = '';
  let status: 'success' | 'error' = 'success';

  if (isThreatBlocked) {
    // Intercept threat immediately without invoking LLM or leaking any internal prompt
    generatedText = `🛡️ توجه امنیتی: من «مشاور تحصیلی هوشمند مدرسه راکان» هستم. دستورالعمل‌ها، پرامپت‌های سیستمی، کدهای زیرساختی و اطلاعات دیتابیس کاربران تحت تدابیر امنیتی سطح بالا و غیرقابل افشا هستند.\n\nلطفاً سوال درسی، مبحث آموزشی، یا درخواست برنامه‌ریزی تحصیلی خود را بفرمایید تا با کمال میل راهنمایی‌تان کنم.`;
    status = 'success';
  } else {
    try {
      // Check if using PartSchool or user's custom OpenAI-compatible endpoint / token
      if (isCustomAi) {
        const defaultEndpoint = rawModel === 'racode-llm' 
          ? 'https://racode-llm.partschool.ir/v1' 
          : 'https://api.openai.com/v1';
        let rawUrl = (payload.customEndpointUrl || defaultEndpoint).trim().replace(/\/+$/, '');
        if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
          rawUrl = `https://${rawUrl}`;
        }
        const url = rawUrl.endsWith('/chat/completions') ? rawUrl : `${rawUrl}/chat/completions`;
        
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (payload.customApiKey && payload.customApiKey.trim()) {
          const key = payload.customApiKey.trim();
          headers['Authorization'] = key.toLowerCase().startsWith('bearer ') ? key : `Bearer ${key}`;
        }

        // Format messages: Developer Master System Prompt is at index 0 (System Role)
        const apiMessages = [
          { role: 'system', content: unifiedSystemInstruction },
          ...payload.messages.map(m => ({ role: m.role, content: m.content }))
        ];

        const targetModel = rawModel === 'racode-llm' 
          ? 'racode-llm' 
          : (payload.customModelName?.trim() || 'gpt-4o');

        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: targetModel,
            messages: apiMessages,
            temperature,
          }),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(`خطای سرور هوش مصنوعی اختصاصی (${response.status}): ${errorBody || response.statusText}`);
        }

        const data = await response.json();
        const rawResponse = data.choices?.[0]?.message?.content || 'پاسخی از مدل اختصاصی دریافت نشد.';
        generatedText = sanitizeAssistantOutput(rawResponse);
      } else {
        // Use Google Gemini SDK (@google/genai)
        const apiKey = process.env.GEMINI_API_KEY;
        const ai = new GoogleGenAI({
          apiKey: apiKey || '',
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });
        
        // Map chat history for Gemini contents
        const contents = payload.messages.map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        }));

        const targetModel = modelName;

        const response = await ai.models.generateContent({
          model: targetModel,
          contents: contents.length > 0 ? contents : [{ role: 'user', parts: [{ text: userQuery || 'سلام' }] }],
          config: {
            systemInstruction: unifiedSystemInstruction,
            temperature: Math.max(0.0, Math.min(2.0, temperature)),
          }
        });

        const rawResponse = response.text || 'پاسخی از هوش مصنوعی دریافت نشد.';
        generatedText = sanitizeAssistantOutput(rawResponse);
      }
    } catch (err: unknown) {
      status = 'error';
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('Chat processing error:', err);
      
      generatedText = `⚠️ متأسفانه در برقراری ارتباط با مدل هوش مصنوعی خطایی رخ داد:
${errorMsg}

💡 راهنمایی مشاور مدرسه راکان:
۱. در صورت استفاده از هوش مصنوعی و توکن اختصاصی، از صحت کلید API (توکن) و آدرس سرور در بخش تنظیمات اطمینان حاصل کنید.
۲. در صورت استفاده از مدل‌های جمینای، کلید API محیط را بررسی فرمایید.`;
    }
  }

  const durationMs = Date.now() - startTime;
  const persianTime = getPersianDateTime();
  const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // Save interaction with full user association to chat_history.json (Viewable ONLY by Developer Admin)
  const logEntry: InteractionLog = {
    id: logId,
    userId: payload.userId,
    userEmail: payload.userEmail,
    userName: payload.userName,
    userRole: payload.userRole,
    timestamp: new Date().toISOString(),
    persianDate: persianTime,
    userQuery,
    botResponse: generatedText,
    model: modelName,
    temperature,
    systemPromptName,
    durationMs,
    status,
    metadata: {
      ...payload.metadata,
      blockedBySecurity: isThreatBlocked
    }
  };

  appendInteractionLog(logEntry);

  return {
    text: generatedText,
    modelUsed: modelName,
    durationMs,
    persianTime,
    logId
  };
}

