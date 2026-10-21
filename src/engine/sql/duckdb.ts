import * as duckdb from '@duckdb/duckdb-wasm';
import { normalizeRows } from '../grading/compare';
import { dropStatements } from './isolate';
import { splitStatements, stripTrailingSemicolon } from './split';
import type { ResultSet } from '../grading/types';

/**
 * DuckDB-WASM runs inside its own worker, which the library spawns for us.
 * That keeps the UI responsive and, more importantly, gives us a thread we can
 * kill outright when a query runs past its time limit.
 *
 * Why DuckDB and not sql.js: the SQL branch is built on window functions,
 * sessionisation and product metrics over logs, which is what an analytical
 * engine is for. The dialect is also the closest runnable approximation of
 * the ClickHouse-style SQL used in production.
 */

let dbPromise: Promise<duckdb.AsyncDuckDB> | null = null;
let activeWorker: Worker | null = null;

export class SqlEngineError extends Error {}

async function createDb(): Promise<duckdb.AsyncDuckDB> {
  const bundle = await duckdb.selectBundle(duckdb.getJsDelivrBundles());
  if (!bundle.mainWorker) throw new SqlEngineError('No DuckDB worker bundle available');
  const workerUrl = URL.createObjectURL(
    new Blob([`importScripts("${bundle.mainWorker}");`], { type: 'text/javascript' }),
  );
  const worker = new Worker(workerUrl);
  const db = new duckdb.AsyncDuckDB(new duckdb.VoidLogger(), worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  URL.revokeObjectURL(workerUrl);
  activeWorker = worker;
  return db;
}

export function getDb(): Promise<duckdb.AsyncDuckDB> {
  if (!dbPromise) {
    dbPromise = createDb().catch((err) => {
      dbPromise = null;
      throw new SqlEngineError(err instanceof Error ? err.message : String(err));
    });
  }
  return dbPromise;
}

/** Tear the engine down after a timeout; the next run re-creates it. */
function hardReset() {
  try {
    activeWorker?.terminate();
  } catch {
    /* ignore */
  }
  activeWorker = null;
  dbPromise = null;
}

export type SqlRunRequest = {
  setupSql: string;
  /** Queries to run in order against the freshly built database. */
  queries: string[];
  timeoutMs: number;
};

export class SqlTimeout extends Error {}

/** Per-query outcome, so a failing user query can be told from a broken setup. */
export type QueryOutcome = { ok: true; result: ResultSet } | { ok: false; message: string };

/**
 * Build a scratch database, run the queries, drop it.
 * Each call is isolated, so one task cannot see another task's tables.
 * A failure in the setup script throws (that is the task author's bug);
 * a failure in one of the queries comes back as an outcome.
 */
export async function runSqlQueries({
  setupSql,
  queries,
  timeoutMs,
}: SqlRunRequest): Promise<QueryOutcome[]> {
  const db = await getDb();
  const work = (async () => {
    const conn = await db.connect();
    try {
      // The DuckDB instance is shared across runs, so clear the previous
      // dataset before building this one.
      for (const stmt of dropStatements(setupSql)) {
        await conn.query(stmt);
      }
      for (const stmt of splitStatements(setupSql)) {
        await conn.query(stmt);
      }
      const out: QueryOutcome[] = [];
      for (const query of queries) {
        try {
          const table = await conn.query(stripTrailingSemicolon(query));
          const columns = table.schema.fields.map((f) => f.name);
          const rows: unknown[][] = [];
          for (const row of table.toArray()) {
            const obj = row as Record<string, unknown>;
            rows.push(columns.map((c) => obj[c]));
          }
          out.push({ ok: true, result: { columns, rows: normalizeRows(rows) } });
        } catch (err) {
          out.push({ ok: false, message: err instanceof Error ? err.message : String(err) });
        }
      }
      return out;
    } finally {
      try {
        await conn.close();
      } catch {
        /* ignore */
      }
    }
  })();

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new SqlTimeout('time limit exceeded')), timeoutMs);
  });

  try {
    return await Promise.race([work, timeout]);
  } catch (err) {
    if (err instanceof SqlTimeout) hardReset();
    throw err;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Used by the task view to show the first rows of each table. */
export async function previewTables(
  setupSql: string,
  tables: string[],
  limit = 5,
): Promise<Record<string, ResultSet>> {
  const queries = tables.map((t) => `SELECT * FROM ${t} LIMIT ${limit}`);
  const outcomes = await runSqlQueries({ setupSql, queries, timeoutMs: 30000 });
  const entries: Array<[string, ResultSet]> = [];
  tables.forEach((t, i) => {
    const o = outcomes[i];
    if (o?.ok) entries.push([t, o.result]);
  });
  return Object.fromEntries(entries);
}
