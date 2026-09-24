import 'server-only';

const windows = new Map<string, { count: number; resetAt: number }>();

/** Small in-process guard for the demo; production should use a shared store. */
export function assistantRateLimited(userId: string, limit = 12) {
  const now = Date.now();
  const current = windows.get(userId);
  if (!current || current.resetAt <= now) {
    windows.set(userId, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  if (current.count >= limit) return true;
  current.count += 1;
  return false;
}
