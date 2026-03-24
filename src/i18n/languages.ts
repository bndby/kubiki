export interface Language {
  /** BCP 47 language code */
  code: string;
  /** Display name in English */
  name: string;
  /** Display name in the language itself */
  nativeName: string;
  /** Flag emoji */
  flag: string;
  /** Right-to-left script */
  rtl?: boolean;
}

export const LANGUAGES: Language[] = [
  { code: 'zh', name: 'Chinese',    nativeName: '中文',           flag: '🇨🇳' },
  { code: 'es', name: 'Spanish',    nativeName: 'Español',        flag: '🇪🇸' },
  { code: 'en', name: 'English',    nativeName: 'English',        flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi',      nativeName: 'हिन्दी',          flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali',    nativeName: 'বাংলা',           flag: '🇧🇩' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português',      flag: '🇵🇹' },
  { code: 'ru', name: 'Russian',    nativeName: 'Русский',        flag: '🇷🇺' },
  { code: 'ja', name: 'Japanese',   nativeName: '日本語',          flag: '🇯🇵' },
  { code: 'ar', name: 'Arabic',     nativeName: 'العربية',         flag: '🇸🇦', rtl: true },
  { code: 'pa', name: 'Punjabi',    nativeName: 'ਪੰਜਾਬੀ',          flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi',    nativeName: 'मराठी',           flag: '🇮🇳' },
  { code: 'te', name: 'Telugu',     nativeName: 'తెలుగు',          flag: '🇮🇳' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt',     flag: '🇻🇳' },
  { code: 'tr', name: 'Turkish',    nativeName: 'Türkçe',         flag: '🇹🇷' },
  { code: 'ta', name: 'Tamil',      nativeName: 'தமிழ்',           flag: '🇮🇳' },
  { code: 'ko', name: 'Korean',     nativeName: '한국어',           flag: '🇰🇷' },
  { code: 'fr', name: 'French',     nativeName: 'Français',       flag: '🇫🇷' },
  { code: 'de', name: 'German',     nativeName: 'Deutsch',        flag: '🇩🇪' },
  { code: 'ur', name: 'Urdu',       nativeName: 'اردو',            flag: '🇵🇰', rtl: true },
  { code: 'jv', name: 'Javanese',   nativeName: 'Basa Jawa',      flag: '🇮🇩' },
  { code: 'it', name: 'Italian',    nativeName: 'Italiano',       flag: '🇮🇹' },
  { code: 'fa', name: 'Persian',    nativeName: 'فارسی',           flag: '🇮🇷', rtl: true },
  { code: 'gu', name: 'Gujarati',   nativeName: 'ગુજરાતી',         flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada',    nativeName: 'ಕನ್ನಡ',           flag: '🇮🇳' },
  { code: 'ha', name: 'Hausa',      nativeName: 'Hausa',          flag: '🇳🇬' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia',flag: '🇮🇩' },
  { code: 'yo', name: 'Yoruba',     nativeName: 'Yorùbá',         flag: '🇳🇬' },
  { code: 'pl', name: 'Polish',     nativeName: 'Polski',         flag: '🇵🇱' },
  { code: 'uz', name: 'Uzbek',      nativeName: "O'zbek",         flag: '🇺🇿' },
  { code: 'my', name: 'Burmese',    nativeName: 'မြန်မာ',           flag: '🇲🇲' },
  { code: 'or', name: 'Odia',       nativeName: 'ଓଡ଼ିଆ',           flag: '🇮🇳' },
  { code: 'th', name: 'Thai',       nativeName: 'ภาษาไทย',        flag: '🇹🇭' },
  { code: 'uk', name: 'Ukrainian',  nativeName: 'Українська',     flag: '🇺🇦' },
  { code: 'am', name: 'Amharic',    nativeName: 'አማርኛ',           flag: '🇪🇹' },
  { code: 'nl', name: 'Dutch',      nativeName: 'Nederlands',     flag: '🇳🇱' },
  { code: 'ro', name: 'Romanian',   nativeName: 'Română',         flag: '🇷🇴' },
  { code: 'az', name: 'Azerbaijani',nativeName: 'Azərbaycan',     flag: '🇦🇿' },
  { code: 'ms', name: 'Malay',      nativeName: 'Bahasa Melayu',  flag: '🇲🇾' },
  { code: 'sw', name: 'Swahili',    nativeName: 'Kiswahili',      flag: '🇰🇪' },
  { code: 'el', name: 'Greek',      nativeName: 'Ελληνικά',       flag: '🇬🇷' },
  { code: 'hu', name: 'Hungarian',  nativeName: 'Magyar',         flag: '🇭🇺' },
  { code: 'zu', name: 'Zulu',       nativeName: 'isiZulu',        flag: '🇿🇦' },
  { code: 'cs', name: 'Czech',      nativeName: 'Čeština',        flag: '🇨🇿' },
  { code: 'sv', name: 'Swedish',    nativeName: 'Svenska',        flag: '🇸🇪' },
  { code: 'xh', name: 'Xhosa',      nativeName: 'isiXhosa',       flag: '🇿🇦' },
];
