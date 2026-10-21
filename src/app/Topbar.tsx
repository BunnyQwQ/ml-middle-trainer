import { NavLink } from 'react-router-dom';
import { useLang } from '@/i18n/LangProvider';
import { UI } from '@/i18n/ui';
import { useProgress } from '@/progress/store';
import { dueCards } from '@/progress/srs';
import { levelFor } from '@/progress/store';
import { useTheme } from './ThemeProvider';

export function Topbar() {
  const { t, lang, setLang } = useLang();
  const { resolved, cycle } = useTheme();
  const data = useProgress((s) => s.data);
  const due = dueCards(data.srs, Date.now()).length;
  const { level } = levelFor(data.xp);

  return (
    <header className="topbar">
      <NavLink to="/" className="topbar__brand">
        {t(UI.appName)}
        <small>lvl {level}</small>
      </NavLink>

      <nav className="topbar__nav">
        <NavLink to="/" end className={navClass}>
          {t(UI.nav.map)}
        </NavLink>
        <NavLink to="/review" className={navClass}>
          {t(UI.nav.review)}
          {due > 0 && <span className="navlink__badge">{due}</span>}
        </NavLink>
        <NavLink to="/progress" className={navClass}>
          {t(UI.nav.dashboard)}
        </NavLink>
        <NavLink to="/settings" className={navClass}>
          {t(UI.nav.settings)}
        </NavLink>
      </nav>

      <div className="topbar__tools">
        <div className="segmented" role="group" aria-label={t(UI.lang.switch)}>
          <button type="button" aria-pressed={lang === 'ru'} onClick={() => setLang('ru')}>
            RU
          </button>
          <button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>
            EN
          </button>
        </div>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={cycle}
          title={t(UI.theme.toggle)}
          aria-label={t(UI.theme.toggle)}
        >
          {resolved === 'dark' ? '☾' : '☀'}
        </button>
      </div>
    </header>
  );
}

function navClass({ isActive }: { isActive: boolean }): string {
  return isActive ? 'navlink navlink--active' : 'navlink';
}
