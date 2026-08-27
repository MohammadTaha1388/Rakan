import fs from 'fs';
import path from 'path';
import { InteractionLog } from '../types';

const HISTORY_FILE_PATH = path.resolve(process.cwd(), 'chat_history.json');

// Ensure history file exists
export function ensureHistoryFileExists(): void {
  try {
    if (!fs.existsSync(HISTORY_FILE_PATH)) {
      fs.writeFileSync(HISTORY_FILE_PATH, JSON.stringify([], null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('Error ensuring chat_history.json exists:', err);
  }
}

// Read all logs from chat_history.json
export function getChatHistory(): InteractionLog[] {
  try {
    ensureHistoryFileExists();
    const data = fs.readFileSync(HISTORY_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    console.error('Error reading chat_history.json:', err);
    return [];
  }
}

// Append an interaction log to chat_history.json
export function appendInteractionLog(log: InteractionLog): boolean {
  try {
    ensureHistoryFileExists();
    const logs = getChatHistory();
    logs.push(log);
    fs.writeFileSync(HISTORY_FILE_PATH, JSON.stringify(logs, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error appending to chat_history.json:', err);
    return false;
  }
}

// Clear chat history
export function clearChatHistory(): boolean {
  try {
    fs.writeFileSync(HISTORY_FILE_PATH, JSON.stringify([], null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error clearing chat_history.json:', err);
    return false;
  }
}

// Get history file path for direct download
export function getHistoryFilePath(): string {
  ensureHistoryFileExists();
  return HISTORY_FILE_PATH;
}
