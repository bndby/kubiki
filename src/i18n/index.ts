import { type ReactiveController, type ReactiveControllerHost } from 'lit';
import { LANGUAGES, type Language } from './languages';
import { TRANSLATIONS, type Translations } from './translations';
import { loadLanguage, saveLanguage } from '../storage';

export type { Language, Translations };
export { LANGUAGES };
export { tn } from './translations';

// ─── Language detection ───────────────────────────────────────────────────────

/**
 * Detects the best matching language code for a given BCP 47 tag.
 * Returns 'en' as fallback.
 */
function matchLang(tag: string): string | undefined {
  const lower = tag.toLowerCase();
  // Exact match (e.g. 'ru', 'zh', 'pt')
  if (TRANSLATIONS[lower]) return lower;
  // Primary subtag only (e.g. 'zh-CN' → 'zh', 'pt-BR' → 'pt')
  const primary = lower.split('-')[0];
  if (TRANSLATIONS[primary]) return primary;
  return undefined;
}

function detectLanguage(): string {
  // 1. Respect saved preference
  const saved = loadLanguage();
  if (saved && TRANSLATIONS[saved]) return saved;

  // 2. Walk through navigator.languages list
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const tag of langs) {
    const match = matchLang(tag);
    if (match) return match;
  }

  return 'en';
}

// ─── Singleton state ──────────────────────────────────────────────────────────

let _currentLang: string = detectLanguage();

/** Applies document-level language and direction attributes */
function applyDocumentAttrs(code: string): void {
  document.documentElement.lang = code;
  const lang = LANGUAGES.find(l => l.code === code);
  document.documentElement.dir = lang?.rtl ? 'rtl' : 'ltr';
}

// Apply on module load
applyDocumentAttrs(_currentLang);

// ─── Public API ───────────────────────────────────────────────────────────────

/** Returns the current active language code */
export function getCurrentLang(): string {
  return _currentLang;
}

/** Returns all supported languages */
export function getLanguages(): Language[] {
  return LANGUAGES;
}

/**
 * Translates a key using the current language.
 * Falls back to English if a key is missing.
 */
export function t(key: keyof Translations): string {
  const tr = TRANSLATIONS[_currentLang] ?? TRANSLATIONS['en'];
  return (tr[key] ?? TRANSLATIONS['en'][key]) as string;
}

/**
 * Changes the active language, persists the choice, and notifies all
 * registered I18nController instances to trigger a re-render.
 */
export function setLanguage(code: string): void {
  if (_currentLang === code) return;
  if (!TRANSLATIONS[code]) return;
  _currentLang = code;
  saveLanguage(code);
  applyDocumentAttrs(code);
  window.dispatchEvent(new CustomEvent('langchange', { detail: code }));
}

// ─── Lit Reactive Controller ──────────────────────────────────────────────────

/**
 * A Lit ReactiveController that triggers a host re-render whenever the
 * active language changes. Add it to any LitElement that renders translated
 * text:
 *
 * ```ts
 * private i18n = new I18nController(this);
 * ```
 */
export class I18nController implements ReactiveController {
  private host: ReactiveControllerHost;

  constructor(host: ReactiveControllerHost) {
    this.host = host;
    host.addController(this);
  }

  hostConnected() {
    window.addEventListener('langchange', this._onLangChange);
  }

  hostDisconnected() {
    window.removeEventListener('langchange', this._onLangChange);
  }

  private _onLangChange = () => {
    this.host.requestUpdate();
  };
}
