/**
 * Every piece of authored content stores both languages side by side.
 * A missing translation is a compile error, not a runtime surprise.
 */
export type L = { ru: string; en: string };

export type Lang = 'ru' | 'en';

export const LANGS: Lang[] = ['ru', 'en'];

export const OTHER: Record<Lang, Lang> = { ru: 'en', en: 'ru' };

export function pick(value: L, lang: Lang): string {
  return value[lang];
}

/** Shorthand used all over the content files. */
export function l(ru: string, en: string): L {
  return { ru, en };
}

/** True when a value looks like a localized string pair. */
export function isL(value: unknown): value is L {
  if (!value || typeof value !== 'object') return false;
  const rec = value as Record<string, unknown>;
  return typeof rec.ru === 'string' && typeof rec.en === 'string';
}
