/**
 * Each task runs its own database build on a connection that may be shared
 * with earlier runs, so the tables of the previous dataset have to go first.
 * Parsing the names out of the generated DDL keeps this honest: whatever the
 * setup script creates is what gets dropped.
 */
export function tableNamesFromDdl(sql: string): string[] {
  const matches = sql.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([A-Za-z_][A-Za-z0-9_]*)/gi);
  const names: string[] = [];
  for (const match of matches) {
    if (!names.includes(match[1])) names.push(match[1]);
  }
  return names;
}

/** Drop in reverse order, so a future schema with foreign keys still works. */
export function dropStatements(setupSql: string): string[] {
  return tableNamesFromDdl(setupSql)
    .reverse()
    .map((name) => `DROP TABLE IF EXISTS ${name}`);
}
