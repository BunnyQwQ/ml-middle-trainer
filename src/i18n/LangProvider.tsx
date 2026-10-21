import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { OTHER, pick, type L, type Lang } from './types';

const STORAGE_KEY = 'mlmt.lang';

type LangCtx = {
  lang: Lang;
  other: Lang;
  setLang: (next: Lang) => void;
  toggleLang: () => void;
  /** Resolve a localized pair in the current language. */
  t: (value: L) => string;
  /** Resolve a localized pair in the other language. */
  tOther: (value: L) => string;
};

const Ctx = createContext<LangCtx | null>(null);

function readStored(): Lang {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'ru' || raw === 'en') return raw;
  } catch {
    /* private mode or storage blocked */
  }
  try {
    if (navigator.language.toLowerCase().startsWith('ru')) return 'ru';
  } catch {
    /* no navigator */
  }
  return 'ru';
}

/**
 * Language switching must not disturb anything the user has going on:
 * no remount, no navigation, and the scroll offset is pinned across the
 * reflow that a different text length causes.
 */
export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStored);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* ignore */
    }
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState((prev) => {
      if (prev === next) return prev;
      pinScroll();
      return next;
    });
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((prev) => {
      pinScroll();
      return OTHER[prev];
    });
  }, []);

  const value = useMemo<LangCtx>(
    () => ({
      lang,
      other: OTHER[lang],
      setLang,
      toggleLang,
      t: (v: L) => pick(v, lang),
      tOther: (v: L) => pick(v, OTHER[lang]),
    }),
    [lang, setLang, toggleLang],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/**
 * Keep the viewport where it was. Text length differs between languages, so a
 * naive switch makes the page jump. We re-apply the offset after the browser
 * has laid the new text out.
 */
function pinScroll() {
  if (typeof window === 'undefined') return;
  const y = window.scrollY;
  const apply = () => window.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior });
  requestAnimationFrame(() => {
    apply();
    requestAnimationFrame(apply);
  });
}

export function useLang(): LangCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useLang must be used inside <LangProvider>');
  return ctx;
}

/** Shorthand for components that only need the translator. */
export function useT(): (value: L) => string {
  return useLang().t;
}
