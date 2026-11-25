// SRS v2.3 §3.9 save code: the saved progress as text a player can copy or download
// (a .lakbay file), and load again on another device or after clearing the browser.
// Format: "LR<version>.<base64url of the progress JSON>.<4-character checksum>".
import { CURRENT_VERSION, migrateProgress, sanitizeProgress } from './migrations';
import { initialProgress, PROGRESS_KEYS, type Progress } from './progress';

const PREFIX = 'LR';

export type LoadError = 'empty' | 'format' | 'checksum' | 'newer' | 'damaged';

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(code: string): string {
  const base64 = code.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4));
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
}

/** FNV-1a, shown as 4 base-36 characters: catches typing and copying mistakes. */
export function checksum(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return (hash % 36 ** 4).toString(36).padStart(4, '0').toUpperCase();
}

/** The progress (no actions) as a save code. */
export function encodeSave(progress: Progress): string {
  const state = Object.fromEntries(PROGRESS_KEYS.map((key) => [key, progress[key]]));
  const payload = toBase64Url(JSON.stringify(state));
  return `${PREFIX}${CURRENT_VERSION}.${payload}.${checksum(payload)}`;
}

/**
 * Reads a save code (or the text of a .lakbay file). Returns the full progress to load, or
 * why it cannot be read. Nothing is changed here, so a bad code never half-loads.
 */
export function decodeSave(input: string): { progress: Progress } | { error: LoadError } {
  const code = input.trim().replace(/\s+/g, '');
  if (!code) return { error: 'empty' };
  const match = /^LR(\d+)\.([A-Za-z0-9_-]+)\.([0-9A-Z]{4})$/.exec(code);
  if (!match) return { error: 'format' };
  const [, versionText, payload, sum] = match as unknown as [string, string, string, string];
  const version = Number(versionText);
  if (version > CURRENT_VERSION) return { error: 'newer' };
  if (checksum(payload) !== sum) return { error: 'checksum' };
  try {
    const raw = JSON.parse(fromBase64Url(payload)) as unknown;
    const migrated = migrateProgress(raw, version);
    const progress = sanitizeProgress(migrated, initialProgress());
    return progress ? { progress } : { error: 'damaged' };
  } catch {
    return { error: 'damaged' };
  }
}
