/**
 * Pyodide lives in a worker for one decisive reason: an infinite loop in the
 * user's code can only be stopped by killing the thread it runs on. That is
 * how the TL verdict is implemented.
 */

const PYODIDE_VERSION = '0.27.2';
const INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

type RunRequest = {
  id: number;
  /** The user's module source. */
  code: string;
  /** Test scripts to run in order against the module namespace. */
  phases: Array<{ name: string; source: string }>;
};

type PhaseResult = {
  name: string;
  ok: boolean;
  error?: string;
  isAssertion?: boolean;
};

type RunResponse =
  | { id: number; type: 'done'; phases: PhaseResult[]; stdout: string; userError?: string }
  | { id: number; type: 'engineError'; message: string };

/**
 * Typed locally instead of pulling in the webworker lib: mixing it with DOM in
 * one project makes TypeScript lose half of the browser globals.
 */
type WorkerCtx = {
  onmessage: ((event: MessageEvent<RunRequest>) => void) | null;
  postMessage: (data: unknown) => void;
};

const ctx = globalThis as unknown as WorkerCtx;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Pyodide = any;

let pyodidePromise: Promise<Pyodide> | null = null;
let stdoutBuffer: string[] = [];

async function getPyodide(): Promise<Pyodide> {
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      const mod = await import(/* @vite-ignore */ `${INDEX_URL}pyodide.mjs`);
      const py = await mod.loadPyodide({ indexURL: INDEX_URL });
      py.setStdout({ batched: (text: string) => stdoutBuffer.push(text) });
      py.setStderr({ batched: (text: string) => stdoutBuffer.push(text) });
      return py;
    })().catch((err) => {
      pyodidePromise = null;
      throw err;
    });
  }
  return pyodidePromise;
}

function cleanTraceback(message: string): string {
  // Pyodide tracebacks start with frames inside its own machinery.
  const lines = message.split('\n');
  const start = lines.findIndex((l) => l.includes('File "<exec>"'));
  const useful = start >= 0 ? lines.slice(start) : lines;
  return useful.join('\n').trim();
}

ctx.onmessage = async (event) => {
  const { id, code, phases } = event.data;
  stdoutBuffer = [];
  let py: Pyodide;
  try {
    py = await getPyodide();
  } catch (err) {
    const response: RunResponse = {
      id,
      type: 'engineError',
      message: err instanceof Error ? err.message : String(err),
    };
    ctx.postMessage(response);
    return;
  }

  const results: PhaseResult[] = [];
  let userError: string | undefined;

  const ns = py.globals.get('dict')();
  try {
    try {
      py.runPython(code, { globals: ns });
    } catch (err) {
      userError = cleanTraceback(err instanceof Error ? err.message : String(err));
    }

    if (!userError) {
      for (const phase of phases) {
        try {
          py.runPython(phase.source, { globals: ns });
          results.push({ name: phase.name, ok: true });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          results.push({
            name: phase.name,
            ok: false,
            error: cleanTraceback(message),
            isAssertion: /AssertionError/.test(message),
          });
          break;
        }
      }
    }
  } finally {
    try {
      ns.destroy();
    } catch {
      /* ignore */
    }
  }

  const response: RunResponse = {
    id,
    type: 'done',
    phases: results,
    stdout: stdoutBuffer.join(''),
    userError,
  };
  ctx.postMessage(response);
};
