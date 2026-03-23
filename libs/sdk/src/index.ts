export interface ClientOptions {
  baseUrl: string;
  projectSlug: string;
  context?: Context;
  defaultValue?: boolean;
  connect?: boolean;
  reconnectDelayMs?: number;
}

export interface Context {
  key?: string;
  environmentId?: string;
  clientId?: string;
}

interface FlagSnapshot {
  key: string;
  on: boolean;
  overrides: { clientId: string; on: boolean }[];
  envOverrides: { environmentId: string; on: boolean }[];
}

interface StreamMessage {
  projectSlug: string;
  ts: number;
  flags: FlagSnapshot[];
}

interface TrackPayload {
  [key: string]: unknown;
}

function resolveFlag(flag: FlagSnapshot, ctx: Context): boolean {
  if (ctx.clientId) {
    const clientOverride = flag.overrides.find((o) => o.clientId === ctx.clientId);
    if (clientOverride) return clientOverride.on;
  }

  if (ctx.environmentId) {
    const envOverride = flag.envOverrides.find(
      (o) => o.environmentId === ctx.environmentId,
    );
    if (envOverride) return envOverride.on;
  }

  return flag.on;
}

export function createClient(options: ClientOptions) {
  const baseUrl = (options.baseUrl || '').replace(/\/$/, '');
  const projectSlug = options.projectSlug;
  const defaultContext = options.context || {};
  const defaultValue = options.defaultValue ?? false;
  const reconnectDelayMs = options.reconnectDelayMs ?? 2000;

  let flagsByKey: Record<string, FlagSnapshot> = {};
  let connected = false;
  let stopped = false;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let streamAbortController: AbortController | null = null;
  const updateListeners = new Set<() => void>();

  const mergeContext = (ctx: Context = {}): Context => ({
    ...defaultContext,
    ...ctx,
  });

  const toQueryString = (ctx: Context): string => {
    const search = new URLSearchParams();
    if (ctx.environmentId) search.set('environmentId', ctx.environmentId);
    if (ctx.clientId) search.set('clientId', ctx.clientId);
    const qs = search.toString();
    return qs ? `?${qs}` : '';
  };

  const applyStreamPayload = (payload: StreamMessage) => {
    if (payload.projectSlug !== projectSlug || !Array.isArray(payload.flags)) return;
    const next: Record<string, FlagSnapshot> = {};
    for (const flag of payload.flags) {
      if (flag?.key) next[flag.key] = flag;
    }
    flagsByKey = next;
    updateListeners.forEach((listener) => listener());
  };

  const scheduleReconnect = () => {
    if (stopped || reconnectTimer) return;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      void connect();
    }, reconnectDelayMs);
  };

  const parseSse = async (response: Response) => {
    if (!response.body) return;

    const decoder = new TextDecoder();
    const reader = response.body.getReader();
    let buffer = '';

    while (!stopped) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const events = buffer.split('\n\n');
      buffer = events.pop() ?? '';
      for (const event of events) {
        const dataLines = event
          .split('\n')
          .filter((line) => line.startsWith('data:'))
          .map((line) => line.slice(5).trim());
        if (dataLines.length === 0) continue;
        const payloadText = dataLines.join('\n');
        try {
          const payload = JSON.parse(payloadText) as StreamMessage;
          applyStreamPayload(payload);
        } catch {
          // Ignore malformed event payloads.
        }
      }
    }
  };

  const connect = async (): Promise<void> => {
    if (stopped) return;

    streamAbortController?.abort();
    streamAbortController = new AbortController();

    try {
      const streamUrl = `${baseUrl}/api/stream/${encodeURIComponent(projectSlug)}`;
      const response = await fetch(streamUrl, {
        headers: { Accept: 'text/event-stream' },
        signal: streamAbortController.signal,
      });
      if (!response.ok) throw new Error(`stream failed: ${response.status}`);
      connected = true;
      await parseSse(response);
    } catch {
      connected = false;
    } finally {
      connected = false;
      if (!stopped) scheduleReconnect();
    }
  };

  const fetchSingle = async (flagKey: string, ctx: Context): Promise<boolean> => {
    const query = toQueryString(ctx);
    const url = `${baseUrl}/api/eval/${encodeURIComponent(projectSlug)}/${encodeURIComponent(flagKey)}${query}`;
    try {
      const res = await fetch(url);
      if (!res.ok) return defaultValue;
      const data = (await res.json()) as { on?: boolean };
      return data.on === true;
    } catch {
      return defaultValue;
    }
  };

  const fetchAll = async (ctx: Context): Promise<Record<string, boolean>> => {
    const query = toQueryString(ctx);
    const url = `${baseUrl}/api/eval/${encodeURIComponent(projectSlug)}${query}`;
    try {
      const res = await fetch(url);
      if (!res.ok) return {};
      const data = (await res.json()) as { flags?: Record<string, boolean> };
      return data.flags ?? {};
    } catch {
      return {};
    }
  };

  async function variation(flagKey: string, ctx: Context = {}): Promise<boolean> {
    const mergedCtx = mergeContext(ctx);
    const cached = flagsByKey[flagKey];
    if (cached) return resolveFlag(cached, mergedCtx);
    return fetchSingle(flagKey, mergedCtx);
  }

  async function allFlags(ctx: Context = {}): Promise<Record<string, boolean>> {
    const mergedCtx = mergeContext(ctx);
    const keys = Object.keys(flagsByKey);
    if (keys.length > 0) {
      const out: Record<string, boolean> = {};
      for (const key of keys) out[key] = resolveFlag(flagsByKey[key], mergedCtx);
      return out;
    }
    return fetchAll(mergedCtx);
  }

  async function variationAll(
    flagKeys: string[],
    ctx: Context = {},
  ): Promise<Record<string, boolean | null>> {
    const flags = await allFlags(ctx);
    const out: Record<string, boolean | null> = {};
    for (const key of flagKeys) {
      out[key] = key in flags ? flags[key] : null;
    }
    return out;
  }

  async function track(
    eventName: string,
    data: TrackPayload = {},
    ctx: Context = {},
  ): Promise<void> {
    const mergedCtx = mergeContext(ctx);
    try {
      await fetch(`${baseUrl}/api/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName,
          projectSlug,
          context: mergedCtx,
          data,
        }),
      });
    } catch {
      // Tracking failures should never break app flow.
    }
  }

  function close() {
    stopped = true;
    connected = false;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = null;
    streamAbortController?.abort();
    streamAbortController = null;
    updateListeners.clear();
  }

  function subscribe(listener: () => void) {
    updateListeners.add(listener);
    return () => {
      updateListeners.delete(listener);
    };
  }

  if (options.connect !== false) {
    void connect();
  }

  return {
    connect,
    close,
    subscribe,
    variation,
    allFlags,
    variationAll,
    track,
    isConnected: () => connected,
  };
}
