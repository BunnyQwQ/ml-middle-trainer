import { useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { LangProvider, useLang } from '@/i18n/LangProvider';
import { UI } from '@/i18n/ui';
import { useProgress } from '@/progress/store';
import { ThemeProvider } from './ThemeProvider';
import { Topbar } from './Topbar';
import { MapPage } from '@/features/skill-map/MapPage';
import { NodePage } from '@/features/node-view/NodePage';
import { ReviewPage } from '@/features/review/ReviewPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { SettingsPage } from '@/features/settings/SettingsPage';

/**
 * HashRouter on purpose: the same build works on GitHub Pages under a
 * repository subpath, on any other static host, and from a dist/ folder
 * served locally on another laptop. No server rewrite rules needed anywhere.
 */
export function App() {
  return (
    <ThemeProvider>
      <LangProvider>
        <HashRouter>
          <Shell />
        </HashRouter>
      </LangProvider>
    </ThemeProvider>
  );
}

function Shell() {
  const hydrate = useProgress((s) => s.hydrate);
  const ready = useProgress((s) => s.ready);
  const touchStreak = useProgress((s) => s.touchStreak);
  const { t } = useLang();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (ready) touchStreak();
  }, [ready, touchStreak]);

  return (
    <div className="app">
      <Topbar />
      <main className="main">
        {!ready ? (
          <p className="muted">{t(UI.common.loading)}</p>
        ) : (
          <Routes>
            <Route path="/" element={<MapPage />} />
            <Route path="/node/:nodeId" element={<NodePage />} />
            <Route path="/review" element={<ReviewPage />} />
            <Route path="/progress" element={<DashboardPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </main>
    </div>
  );
}
