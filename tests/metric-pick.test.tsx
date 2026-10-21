import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LangProvider } from '@/i18n/LangProvider';
import { MetricPickTaskView } from '@/features/node-view/MetricPickTaskView';
import { NODES } from '@/content/graph';
import type { MetricPickTask, MetricSlot } from '@/content/types';
import { dcg, ndcg } from '@/features/simulators/search';
import { emptyProgress, useProgress } from '@/progress/store';

const task = NODES.flatMap((n) => n.tasks).find(
  (t): t is MetricPickTask => t.kind === 'metric-pick',
)!;

/** The slot panels are rendered in a fixed order: offline, online, guardrails. */
function slotPanel(index: number): HTMLElement {
  return document.querySelectorAll('.metricslot')[index] as HTMLElement;
}

function pick(slot: MetricSlot, optionLabel: string) {
  const index = slot === 'offline' ? 0 : slot === 'online' ? 1 : 2;
  const panel = slotPanel(index);
  return within(panel).getByLabelText(optionLabel, { exact: false });
}

beforeEach(() => {
  useProgress.setState({ data: emptyProgress(), ready: true });
});

describe('metric choice trainer', () => {
  it('accepts a defensible answer in every slot', async () => {
    const user = userEvent.setup();
    const onResult = vi.fn();
    render(
      <LangProvider>
        <MetricPickTaskView task={task} onResult={onResult} />
      </LangProvider>,
    );

    const offline = task.options.find((o) => o.correctFor.includes('offline'))!;
    const online = task.options.find((o) => o.correctFor.includes('online'))!;
    const guardrails = task.options
      .filter((o) => o.correctFor.includes('guardrail'))
      .slice(0, task.guardrailCount);

    await user.click(pick('offline', offline.label.ru));
    await user.click(pick('online', online.label.ru));
    for (const g of guardrails) await user.click(pick('guardrail', g.label.ru));

    const submit = screen.getByRole('button', { name: 'Ответить' });
    expect(submit).toBeEnabled();
    await user.click(submit);

    expect(onResult).toHaveBeenCalledWith(true);
    expect(document.querySelector('.verdict--OK')).toBeTruthy();
  });

  it('rejects a distractor and explains every option afterwards', async () => {
    const user = userEvent.setup();
    const onResult = vi.fn();
    render(
      <LangProvider>
        <MetricPickTaskView task={task} onResult={onResult} />
      </LangProvider>,
    );

    const wrong = task.options.find((o) => o.correctFor.length === 0)!;
    const online = task.options.find((o) => o.correctFor.includes('online'))!;
    const guardrails = task.options
      .filter((o) => o.correctFor.includes('guardrail'))
      .slice(0, task.guardrailCount);

    await user.click(pick('offline', wrong.label.ru));
    await user.click(pick('online', online.label.ru));
    for (const g of guardrails) await user.click(pick('guardrail', g.label.ru));
    await user.click(screen.getByRole('button', { name: 'Ответить' }));

    expect(onResult).toHaveBeenCalledWith(false);
    expect(document.querySelector('.verdict--WA')).toBeTruthy();
    // The breakdown explains the distractor too, not just the right answers.
    expect(screen.getByText(wrong.note.ru, { exact: false })).toBeTruthy();
  });

  it('does not let the user submit a half-filled answer', async () => {
    const user = userEvent.setup();
    render(
      <LangProvider>
        <MetricPickTaskView task={task} onResult={() => undefined} />
      </LangProvider>,
    );

    const offline = task.options.find((o) => o.correctFor.includes('offline'))!;
    await user.click(pick('offline', offline.label.ru));
    expect(screen.getByRole('button', { name: 'Ответить' })).toBeDisabled();
  });

  it('caps the number of guardrails at what the scenario asks for', async () => {
    const user = userEvent.setup();
    render(
      <LangProvider>
        <MetricPickTaskView task={task} onResult={() => undefined} />
      </LangProvider>,
    );

    const panel = slotPanel(2);
    const boxes = within(panel).getAllByRole('checkbox');
    for (const box of boxes) await user.click(box);

    const checked = boxes.filter((b) => (b as HTMLInputElement).checked);
    expect(checked).toHaveLength(task.guardrailCount);
  });
});

describe('ranking metric helpers', () => {
  it('computes DCG with the documented discount', () => {
    // One document graded 3 at position 1: gain 2^3-1 over log2(2) = 7.
    expect(dcg([3], true)).toBeCloseTo(7, 9);
    // The same document at position 2 is discounted by log2(3).
    expect(dcg([0, 3], true)).toBeCloseTo(7 / Math.log2(3), 9);
  });

  it('scores the ideal order at exactly one', () => {
    expect(ndcg([3, 2, 1, 0], true)).toBeCloseTo(1, 12);
    expect(ndcg([3, 2, 1, 0], false)).toBeCloseTo(1, 12);
  });

  it('punishes a swap at the top more than the same swap in the tail', () => {
    const ideal = [3, 2, 1, 1, 1, 1, 1, 1, 1, 0];
    const topSwap = [2, 3, 1, 1, 1, 1, 1, 1, 1, 0];
    const tailSwap = [3, 2, 1, 1, 1, 1, 1, 1, 0, 1];
    const base = ndcg(ideal, true);
    expect(base).toBeCloseTo(1, 12);
    expect(base - ndcg(topSwap, true)).toBeGreaterThan(10 * (base - ndcg(tailSwap, true)));
  });

  it('notices a relevant document below the cutoff through the ideal', () => {
    // It adds nothing to DCG@2 but does raise IDCG@2.
    expect(ndcg([3, 0, 0, 3], true, 2)).toBeLessThan(ndcg([3, 0, 0, 0], true, 2));
  });

  it('returns zero when nothing is relevant', () => {
    expect(ndcg([0, 0, 0], true)).toBe(0);
  });
});
