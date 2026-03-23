export type FlagChangePayload = { type: 'flag-change'; flagKey?: string };

type Listener = (payload: FlagChangePayload) => void;

const byProject = new Map<string, Set<Listener>>();

export function subscribeProjectFlagChanges(
  projectSlug: string,
  listener: Listener,
): () => void {
  let listeners = byProject.get(projectSlug);
  if (!listeners) {
    listeners = new Set();
    byProject.set(projectSlug, listeners);
  }
  listeners.add(listener);

  return () => {
    if (!listeners) return;
    listeners.delete(listener);
    if (listeners.size === 0) {
      byProject.delete(projectSlug);
    }
  };
}

export function notifyProjectFlagChange(
  projectSlug: string,
  flagKey?: string,
): void {
  const listeners = byProject.get(projectSlug);
  if (!listeners) return;

  const payload: FlagChangePayload = { type: 'flag-change', flagKey };
  for (const listener of listeners) {
    try {
      listener(payload);
    } catch {
      // Ignore listener errors and continue notifying others.
    }
  }
}
