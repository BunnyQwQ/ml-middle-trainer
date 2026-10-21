import { useEffect, useRef } from 'react';

/**
 * Formulas are the same in both languages, so they live outside the i18n
 * system entirely.
 *
 * KaTeX plus its stylesheet is around a third of a megabyte, which has no
 * business sitting in the entry chunk of a page that opens on a phone. It is
 * imported on first render of a formula instead; the raw TeX shows for the
 * fraction of a second it takes.
 */

type KatexModule = { render: (tex: string, el: HTMLElement, options?: Record<string, unknown>) => void };

let katexPromise: Promise<KatexModule> | null = null;

function loadKatex() {
  if (!katexPromise) {
    katexPromise = (async () => {
      await import('katex/dist/katex.min.css');
      const mod = await import('katex');
      // The package has a default export at runtime; its types describe the namespace.
      return ((mod as unknown as { default?: KatexModule }).default ??
        (mod as unknown as KatexModule)) satisfies KatexModule;
    })();
  }
  return katexPromise;
}

export function Formula({ tex, display = true }: { tex: string; display?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let cancelled = false;
    const el = ref.current;
    if (!el) return;
    el.textContent = tex;
    void loadKatex()
      .then((mod) => {
        if (cancelled || !ref.current) return;
        mod.render(tex, ref.current, {
          displayMode: display,
          throwOnError: false,
          output: 'html',
          strict: 'ignore',
        });
      })
      .catch(() => {
        // Leave the raw TeX in place; it is still readable.
      });
    return () => {
      cancelled = true;
    };
  }, [tex, display]);

  return <span ref={ref} className={display ? 'katex-display' : undefined} />;
}
