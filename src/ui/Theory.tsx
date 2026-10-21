import { useState } from 'react';
import { useLang } from '@/i18n/LangProvider';
import { UI } from '@/i18n/ui';
import type { L } from '@/i18n/types';
import type { TheoryBlock } from '@/content/types';
import { Formula } from './Math';
import { getSim } from '@/features/simulators/registry';
import { SimFrame } from './controls';

/**
 * One authored paragraph with a per-paragraph translation toggle.
 * The toggle reveals the other language right underneath instead of
 * replacing the text, which is what makes it useful for picking up terms.
 */
export function Para({ value, className }: { value: L; className?: string }) {
  const { t, tOther, other } = useLang();
  const [shown, setShown] = useState(false);
  return (
    <>
      <p className={`theory__para${className ? ` ${className}` : ''}`}>
        {t(value)}
        <button
          type="button"
          className="theory__translate"
          aria-expanded={shown}
          title={t(UI.lang.showOtherTitle)}
          onClick={() => setShown((v) => !v)}
        >
          {other.toUpperCase()}
        </button>
      </p>
      {shown && <div className="theory__other">{tOther(value)}</div>}
    </>
  );
}

export function TheoryBody({ blocks }: { blocks: TheoryBlock[] }) {
  const { t } = useLang();
  return (
    <div className="theory">
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'h':
            return (
              <h2 className="h2" key={i}>
                {t(block.text)}
              </h2>
            );
          case 'p':
            return <Para key={i} value={block.text} />;
          case 'note':
            return (
              <div className={`note note--${block.tone}`} key={i}>
                <Para value={block.text} />
              </div>
            );
          case 'list':
            return block.ordered ? (
              <ol key={i}>
                {block.items.map((item, j) => (
                  <li key={j}>
                    <Para value={item} />
                  </li>
                ))}
              </ol>
            ) : (
              <ul key={i}>
                {block.items.map((item, j) => (
                  <li key={j}>
                    <Para value={item} />
                  </li>
                ))}
              </ul>
            );
          case 'formula':
            return (
              <div key={i}>
                <Formula tex={block.tex} />
                {block.caption && <p className="faint">{t(block.caption)}</p>}
              </div>
            );
          case 'code':
            return (
              <div key={i}>
                <pre className="codeblock">
                  <code>{block.code}</code>
                </pre>
                {block.caption && <p className="faint">{t(block.caption)}</p>}
              </div>
            );
          case 'table':
            return (
              <div className="table-wrap" key={i}>
                <table className="data">
                  <thead>
                    <tr>
                      {block.head.map((h, j) => (
                        <th key={j}>{t(h)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, j) => (
                      <tr key={j}>
                        {row.map((cell, k) => (
                          <td key={k}>{t(cell)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {block.caption && <p className="faint">{t(block.caption)}</p>}
              </div>
            );
          case 'sim': {
            const Sim = getSim(block.sim);
            return (
              <SimFrame key={i} title={block.title} caption={block.caption}>
                <Sim />
              </SimFrame>
            );
          }
          default:
            return null;
        }
      })}
    </div>
  );
}
