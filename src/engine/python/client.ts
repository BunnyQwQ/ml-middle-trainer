import PythonWorker from './worker?worker';

export type PyPhaseResult = {
  name: string;
  ok: boolean;
  error?: string;
  isAssertion?: boolean;
};

export type PyRunResult = {
  phases: PyPhaseResult[];
  stdout: string;
  /** Set when the user's module itself failed to execute. */
  userError?: string;
};

export class PyTimeout extends Error {
  constructor() {
    super('time limit exceeded');
    this.name = 'PyTimeout';
  }
}

export class PyEngineError extends Error {}

let worker: Worker | null = null;
let nextId = 1;

function getWorker(): Worker {
  if (!worker) worker = new PythonWorker();
  return worker;
}

/** A hung worker cannot be reasoned with, only replaced. */
function resetWorker() {
  try {
    worker?.terminate();
  } catch {
    /* ignore */
  }
  worker = null;
}

export const PY_TIME_LIMIT_MS = 20000;
/** The very first run also downloads the interpreter. */
export const PY_FIRST_RUN_GRACE_MS = 45000;

let everRan = false;

export async function runPython(
  code: string,
  phases: Array<{ name: string; source: string }>,
  timeoutMs = PY_TIME_LIMIT_MS,
  packages?: string[],
): Promise<PyRunResult> {
  const w = getWorker();
  const id = nextId++;
  // A first run downloads the interpreter; a package adds several megabytes.
  const needsGrace = !everRan || (packages ?? []).length > 0;
  const limit = needsGrace ? Math.max(timeoutMs, PY_FIRST_RUN_GRACE_MS) : timeoutMs;

  return new Promise<PyRunResult>((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      resetWorker();
      reject(new PyTimeout());
    }, limit);

    function cleanup() {
      clearTimeout(timer);
      w.removeEventListener('message', onMessage);
      w.removeEventListener('error', onError);
    }

    function onMessage(event: MessageEvent) {
      const data = event.data as { id: number; type: string } & Record<string, unknown>;
      if (data.id !== id) return;
      cleanup();
      everRan = true;
      if (data.type === 'engineError') {
        reject(new PyEngineError(String(data.message)));
        return;
      }
      resolve({
        phases: (data.phases as PyPhaseResult[]) ?? [],
        stdout: String(data.stdout ?? ''),
        userError: data.userError as string | undefined,
      });
    }

    function onError(event: ErrorEvent) {
      cleanup();
      resetWorker();
      reject(new PyEngineError(event.message || 'worker failed'));
    }

    w.addEventListener('message', onMessage);
    w.addEventListener('error', onError);
    w.postMessage({ id, code, phases, packages });
  });
}
