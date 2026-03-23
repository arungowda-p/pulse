import { useCallback, useEffect, useMemo, useState } from 'react';
import { ClientOptions, Context, createClient } from './index';

export interface UsePulseOptions
  extends Omit<ClientOptions, 'connect' | 'context'> {
  context?: Context;
  autoRefreshMs?: number;
}

export interface UsePulseFlagsResult {
  flags: Record<string, boolean>;
  connected: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  variation: (flagKey: string, ctx?: Context) => Promise<boolean>;
  track: (
    eventName: string,
    data?: Record<string, unknown>,
    ctx?: Context,
  ) => Promise<void>;
}

type PulseClient = ReturnType<typeof createClient>;

export function usePulseFlags(options: UsePulseOptions): UsePulseFlagsResult {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const contextKey = JSON.stringify(options.context ?? {});
  const autoRefreshMs = options.autoRefreshMs ?? 0;

  const client: PulseClient = useMemo(
    () =>
      createClient({
        baseUrl: options.baseUrl,
        projectSlug: options.projectSlug,
        context: options.context,
        defaultValue: options.defaultValue,
        reconnectDelayMs: options.reconnectDelayMs,
        connect: true,
      }),
    [
      options.baseUrl,
      options.projectSlug,
      options.defaultValue,
      options.reconnectDelayMs,
      contextKey,
    ],
  );

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const nextFlags = await client.allFlags(options.context);
      setFlags(nextFlags);
      setConnected(client.isConnected());
    } catch (e) {
      setError((e as Error).message || 'Failed to refresh flags');
      setConnected(client.isConnected());
    } finally {
      setLoading(false);
    }
  }, [client, contextKey]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      await refresh();
      if (!cancelled) setConnected(client.isConnected());
    })();

    const heartbeat = setInterval(() => {
      if (!cancelled) setConnected(client.isConnected());
    }, 2000);

    const unsubscribe = client.subscribe(() => {
      if (!cancelled) {
        void refresh();
      }
    });

    const poller =
      autoRefreshMs > 0
        ? setInterval(() => {
            void refresh();
          }, autoRefreshMs)
        : null;

    return () => {
      cancelled = true;
      clearInterval(heartbeat);
      if (poller) clearInterval(poller);
      unsubscribe();
      client.close();
    };
  }, [client, refresh, autoRefreshMs]);

  const variation = useCallback(
    (flagKey: string, ctx: Context = {}) => client.variation(flagKey, ctx),
    [client],
  );

  const track = useCallback(
    (
      eventName: string,
      data: Record<string, unknown> = {},
      ctx: Context = {},
    ) => client.track(eventName, data, ctx),
    [client],
  );

  return { flags, connected, loading, error, refresh, variation, track };
}

export function usePulseFlag(flagKey: string, options: UsePulseOptions) {
  const state = usePulseFlags(options);
  const value =
    flagKey in state.flags
      ? state.flags[flagKey]
      : options.defaultValue ?? false;

  return {
    ...state,
    value,
  };
}
