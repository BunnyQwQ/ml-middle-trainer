import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LangProvider, useLang } from '@/i18n/LangProvider';
import { Para } from '@/ui/Theory';
import { QuizTaskView } from '@/features/node-view/QuizTaskView';
import { statsDistributions } from '@/content/branches/stats/distributions';
import { emptyProgress, useProgress } from '@/progress/store';
import type { QuizTask } from '@/content/types';

const quiz = statsDistributions.tasks.find(
  (t): t is QuizTask => t.kind === 'quiz' && t.mode === 'single',
)!;

/**
 * The hard requirement: switching language must not cost the user anything.
 * Typed code, chosen answers and the scroll offset all have to survive.
 */
function Harness() {
  const { toggleLang, lang } = useLang();
  const draft = useProgress((s) => s.data.drafts.demo ?? '');
  const setDraft = useProgress((s) => s.setDraft);
  return (
    <div>
      <span data-testid="lang">{lang}</span>
      <button type="button" onClick={toggleLang}>
        switch
      </button>
      <textarea
        aria-label="code"
        value={draft}
        onChange={(e) => setDraft('demo', e.target.value)}
      />
      <QuizTaskView task={quiz} onResult={() => undefined} />
    </div>
  );
}

beforeEach(() => {
  useProgress.setState({ data: emptyProgress(), ready: true });
  localStorage.clear();
});

describe('language switching', () => {
  it('replaces the text without losing typed code or a chosen answer', async () => {
    const user = userEvent.setup();
    render(
      <LangProvider>
        <Harness />
      </LangProvider>,
    );

    expect(screen.getByTestId('lang')).toHaveTextContent('ru');
    expect(screen.getByText(quiz.prompt.ru)).toBeTruthy();

    const editor = screen.getByLabelText('code');
    await user.type(editor, 'SELECT count(*)');
    const radios = screen.getAllByRole('radio');
    await user.click(radios[1]);

    expect((editor as HTMLTextAreaElement).value).toBe('SELECT count(*)');
    expect((radios[1] as HTMLInputElement).checked).toBe(true);

    await user.click(screen.getByText('switch'));

    expect(screen.getByTestId('lang')).toHaveTextContent('en');
    expect(screen.getByText(quiz.prompt.en)).toBeTruthy();
    expect(screen.queryByText(quiz.prompt.ru)).toBeNull();

    // Nothing was remounted, so the state is still there.
    expect((screen.getByLabelText('code') as HTMLTextAreaElement).value).toBe('SELECT count(*)');
    expect((screen.getAllByRole('radio')[1] as HTMLInputElement).checked).toBe(true);
  });

  it('pins the scroll offset across the reflow', async () => {
    const user = userEvent.setup();
    const scrollTo = vi.fn();
    window.scrollTo = scrollTo as unknown as typeof window.scrollTo;
    Object.defineProperty(window, 'scrollY', { value: 640, configurable: true });

    render(
      <LangProvider>
        <Harness />
      </LangProvider>,
    );
    // Let any animation frames queued by earlier tests drain first.
    await new Promise((resolve) => setTimeout(resolve, 30));
    scrollTo.mockClear();

    await user.click(screen.getByText('switch'));
    await new Promise((resolve) => setTimeout(resolve, 30));

    expect(scrollTo).toHaveBeenCalled();
    expect(scrollTo.mock.calls.every(([arg]) => (arg as ScrollToOptions).top === 640)).toBe(true);
  });

  it('remembers the chosen language for the next visit', async () => {
    const user = userEvent.setup();
    render(
      <LangProvider>
        <Harness />
      </LangProvider>,
    );
    await user.click(screen.getByText('switch'));
    expect(localStorage.getItem('mlmt.lang')).toBe('en');
  });
});

describe('per-paragraph translation', () => {
  it('reveals the other language under the paragraph, keeping the original', async () => {
    const user = userEvent.setup();
    const text = { ru: 'Текст абзаца про дисперсию', en: 'A paragraph about variance' };
    render(
      <LangProvider>
        <Para value={text} />
      </LangProvider>,
    );

    expect(screen.getByText(text.ru, { exact: false })).toBeTruthy();
    expect(screen.queryByText(text.en)).toBeNull();

    await user.click(screen.getByRole('button', { name: 'EN' }));

    expect(screen.getByText(text.ru, { exact: false })).toBeTruthy();
    expect(screen.getByText(text.en)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'EN' }));
    expect(screen.queryByText(text.en)).toBeNull();
  });
});
