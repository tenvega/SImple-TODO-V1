/**
 * Builds a safe ILIKE pattern from what the user typed. Wildcards and the
 * escape character are escaped, so input is always matched literally.
 * (v1 built a regex straight from user input.)
 */
export function containsPattern(query: string): string | null {
  const q = query.trim().slice(0, 100);
  if (!q) return null;
  return `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}
