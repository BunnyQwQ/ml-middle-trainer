/** Split a generated script into statements. Our SQL never contains ';' in literals. */
export function splitStatements(sql: string): string[] {
  return sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function stripTrailingSemicolon(sql: string): string {
  return sql.trim().replace(/;\s*$/, '');
}
