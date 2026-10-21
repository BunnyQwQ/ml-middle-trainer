import { useRef, useState } from 'react';
import { useLang } from '@/i18n/LangProvider';
import { UI } from '@/i18n/ui';
import { buildExport, migrate, useProgress } from '@/progress/store';
import { storageKind } from '@/progress/storage';
import { useTheme } from '@/app/ThemeProvider';

export function SettingsPage() {
  const { t, lang, setLang } = useLang();
  const { choice, setChoice } = useTheme();
  const data = useProgress((s) => s.data);
  const replaceAll = useProgress((s) => s.replaceAll);
  const wipe = useProgress((s) => s.wipe);
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);

  function exportProgress() {
    const payload = buildExport(data);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `ml-middle-trainer-progress-${stamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importProgress(file: File) {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      replaceAll(migrate(parsed));
      setStatus(t(UI.settings.importOk));
    } catch {
      setStatus(t(UI.settings.importFail));
    }
  }

  const kind = storageKind();

  return (
    <>
      <h1 className="h1">{t(UI.settings.title)}</h1>

      <section className="card">
        <h2 className="h2" style={{ marginTop: 0 }}>
          {t(UI.lang.switch)}
        </h2>
        <div className="segmented">
          <button type="button" aria-pressed={lang === 'ru'} onClick={() => setLang('ru')}>
            Русский
          </button>
          <button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>
            English
          </button>
        </div>

        <h2 className="h2">{t(UI.theme.toggle)}</h2>
        <div className="segmented">
          <button type="button" aria-pressed={choice === 'dark'} onClick={() => setChoice('dark')}>
            {t(UI.theme.dark)}
          </button>
          <button type="button" aria-pressed={choice === 'light'} onClick={() => setChoice('light')}>
            {t(UI.theme.light)}
          </button>
          <button type="button" aria-pressed={choice === 'system'} onClick={() => setChoice('system')}>
            {t(UI.theme.system)}
          </button>
        </div>
      </section>

      <section className="card">
        <h2 className="h2" style={{ marginTop: 0 }}>
          {t(UI.settings.export)}
        </h2>
        <p className="faint" style={{ marginTop: 0 }}>
          {t(UI.settings.exportHint)}
        </p>
        <div className="row">
          <button type="button" className="btn btn--primary" onClick={exportProgress}>
            {t(UI.settings.export)}
          </button>
          <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
            {t(UI.settings.import)}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void importProgress(file);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            className="btn btn--danger"
            onClick={() => {
              if (window.confirm(t(UI.settings.wipeConfirm))) wipe();
            }}
          >
            {t(UI.settings.wipe)}
          </button>
        </div>
        {status && <p className="muted">{status}</p>}
      </section>

      <section className="card">
        <h2 className="h2" style={{ marginTop: 0 }}>
          {t(UI.settings.storage)}
        </h2>
        <p className="muted" style={{ marginBottom: 0 }}>
          {kind === 'idb'
            ? t(UI.settings.storageIdb)
            : kind === 'local'
              ? t(UI.settings.storageLocal)
              : t(UI.settings.storageMemory)}
        </p>
        <p className="faint">
          xp {data.xp} · nodes {Object.keys(data.nodes).length} · srs {Object.keys(data.srs).length} ·
          drafts {Object.keys(data.drafts).length}
        </p>
      </section>
    </>
  );
}
