import * as chrono from "chrono-node";
import { MAX_TAGS, TAG_PATTERN, type Priority } from "./types";

export type QuickAdd = {
  title: string;
  dueAt: Date | null;
  dueHasTime: boolean;
  priority: Priority;
  tags: string[];
};

const PRIORITY_WORDS: Record<string, Priority> = {
  high: "high",
  hi: "high",
  "1": "high",
  medium: "medium",
  med: "medium",
  "2": "medium",
  low: "low",
  lo: "low",
  "3": "low",
};

const TAG_TOKEN = /(^|\s)#([^\s#]+)(?=\s|$)/g;
const PRIORITY_TOKEN = /(^|\s)!([a-z0-9]+)(?=\s|$)/gi;

/**
 * Parses quick-add text such as "Call Danielle tomorrow 3pm #work !high".
 * Runs in the browser, so dates resolve in the visitor's own time zone.
 * The server validates the result again; this is only a convenience.
 */
export function parseQuickAdd(input: string, now: Date = new Date()): QuickAdd {
  let text = ` ${input} `;
  const tags: string[] = [];
  let priority: Priority = "none";

  text = text.replace(TAG_TOKEN, (match, lead: string, raw: string) => {
    const tag = raw.toLowerCase();
    if (!TAG_PATTERN.test(tag)) return match;
    if (!tags.includes(tag) && tags.length < MAX_TAGS) tags.push(tag);
    return lead;
  });

  text = text.replace(PRIORITY_TOKEN, (match, lead: string, raw: string) => {
    const p = PRIORITY_WORDS[raw.toLowerCase()];
    if (!p) return match;
    priority = p;
    return lead;
  });

  let dueAt: Date | null = null;
  let dueHasTime = false;
  const [result] = chrono.casual.parse(text, now, { forwardDate: true });
  if (result) {
    const start = result.start;
    dueHasTime = start.isCertain("hour");
    const date = start.date();
    dueAt = dueHasTime ? date : new Date(date.getFullYear(), date.getMonth(), date.getDate());
    text = text.slice(0, result.index) + " " + text.slice(result.index + result.text.length);
  }

  const title = text
    .replace(/\s+/g, " ")
    .trim()
    // "Call Danielle at" left over from "at 3pm", or "on" from "on Friday".
    .replace(/\s+(at|on|by|due)$/i, "")
    .slice(0, 200);

  return { title, dueAt, dueHasTime, priority, tags };
}
