import { type DiceTypeId } from './dice-config';

/** Настройки приложения, хранящиеся в localStorage */
export interface DiceSettings {
  type: DiceTypeId;
  count: number;
}

/** Одна запись в истории бросков */
export interface HistoryEntry {
  /** Уникальный идентификатор записи */
  id: string;
  /** Временная метка броска (Date.now()) */
  timestamp: number;
  /** Тип кубика */
  diceType: DiceTypeId;
  /** Количество кубиков */
  diceCount: number;
  /** Выпавшие значения каждого кубика */
  values: number[];
  /** Сумма всех значений */
  total: number;
}

const SETTINGS_KEY = 'dice-settings';
const HISTORY_KEY = 'dice-history';
const LANGUAGE_KEY = 'app-language';
const MAX_HISTORY_SIZE = 50;

/** Настройки по умолчанию: два шестигранных кубика */
export const DEFAULT_SETTINGS: DiceSettings = { type: 'd6', count: 2 };

/**
 * Загружает настройки из localStorage.
 * Если настройки не заданы или повреждены — возвращает DEFAULT_SETTINGS.
 * @returns Текущие настройки кубиков
 */
export function loadSettings(): DiceSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as DiceSettings;
    // Простая проверка структуры
    if (parsed && typeof parsed.type === 'string' && typeof parsed.count === 'number') {
      return parsed;
    }
  } catch {
    // Невалидный JSON — игнорируем
  }
  return { ...DEFAULT_SETTINGS };
}

/**
 * Сохраняет настройки в localStorage.
 * @param settings Настройки для сохранения
 */
export function saveSettings(settings: DiceSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Игнорируем ошибку (например, режим инкогнито)
  }
}

/**
 * Загружает историю бросков из localStorage.
 * @returns Массив записей истории (от новых к старым)
 */
export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

/**
 * Добавляет новую запись в историю бросков.
 * Если записей больше MAX_HISTORY_SIZE — удаляет самые старые.
 * @param entry Запись для добавления
 */
export function addToHistory(entry: HistoryEntry): void {
  try {
    const history = loadHistory();
    // Новые записи в начало
    history.unshift(entry);
    if (history.length > MAX_HISTORY_SIZE) {
      history.splice(MAX_HISTORY_SIZE);
    }
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // Игнорируем ошибку
  }
}

/**
 * Загружает сохранённый языковой код из localStorage.
 * @returns Код языка или null, если не был сохранён
 */
export function loadLanguage(): string | null {
  try {
    return localStorage.getItem(LANGUAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Сохраняет выбранный языковой код в localStorage.
 * @param code BCP 47 языковой код (например, 'ru', 'en')
 */
export function saveLanguage(code: string): void {
  try {
    localStorage.setItem(LANGUAGE_KEY, code);
  } catch {
    // Игнорируем ошибку (например, режим инкогнито)
  }
}

/**
 * Полностью очищает историю бросков.
 */
export function clearHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    // Игнорируем ошибку
  }
}
