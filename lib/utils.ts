/**
 * Safe UUID generator with fallback for older browsers (iOS Safari < 15.4
 * doesn't support crypto.randomUUID).
 */
export function safeUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {
      // fall through
    }
  }
  // RFC4122 v4 polyfill
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Format a number of bytes into human-readable text.
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Max size for an uploaded artwork PNG (2 MB).
 */
export const MAX_ARTWORK_BYTES = 2 * 1024 * 1024;

/**
 * Format a date into a friendly, short form.
 */
export function formatRelativeDate(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = now - then;
  const day = 1000 * 60 * 60 * 24;

  if (diffMs < 60_000) return 'just now';
  if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)} min ago`;
  if (diffMs < day) return `${Math.floor(diffMs / 3_600_000)} hr ago`;
  if (diffMs < 7 * day) return `${Math.floor(diffMs / day)} days ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}
