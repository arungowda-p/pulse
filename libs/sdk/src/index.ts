/**
 * LaunchDarkly MVP — minimal client SDK
 * Use in your app to evaluate feature flags.
 *
 * Usage:
 *   const client = createClient({ baseUrl: 'http://localhost:3000' });
 *   const on = await client.variation('new-checkout', { key: 'user-123' });
 */

export interface ClientOptions {
  baseUrl: string;
  context?: { key?: string };
  defaultValue?: boolean;
}

export interface Context {
  key?: string;
}

export function createClient(options: ClientOptions) {
  const baseUrl = (options.baseUrl || '').replace(/\/$/, '');
  const context = options.context || {};

  async function variation(flagKey: string, ctx: Context = {}): Promise<boolean> {
    const key = ctx.key ?? context.key ?? 'anonymous';
    const url = `${baseUrl}/api/eval/${encodeURIComponent(flagKey)}?user=${encodeURIComponent(key)}`;
    try {
      const res = await fetch(url);
      if (!res.ok) return options.defaultValue ?? false;
      const data = await res.json();
      return data.value === true;
    } catch {
      return options.defaultValue ?? false;
    }
  }

  async function variationAll(
    flagKeys: string[],
    ctx: Context = {}
  ): Promise<Record<string, boolean | null>> {
    const key = ctx.key ?? context.key ?? 'anonymous';
    const url = `${baseUrl}/api/eval`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys: flagKeys, context: { key } }),
      });
      if (!res.ok) return {};
      const data = await res.json();
      return data.flags ?? {};
    } catch {
      return {};
    }
  }

  return { variation, variationAll };
}
