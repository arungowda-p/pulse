type FlagChangedPayload = {
  event: 'flag.changed';
  ts: number;
  projectSlug: string;
  flagKey?: string;
};

function getWebhookTargets(): string[] {
  const raw = process.env.PULSE_OUTBOUND_WEBHOOK_URLS || '';
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function sendFlagChangedWebhook(
  projectSlug: string,
  flagKey?: string,
): Promise<void> {
  const urls = getWebhookTargets();
  if (urls.length === 0) return;

  const payload: FlagChangedPayload = {
    event: 'flag.changed',
    ts: Date.now(),
    projectSlug,
    flagKey,
  };

  const secret = process.env.PULSE_OUTBOUND_WEBHOOK_SECRET?.trim();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (secret) {
    headers['X-Pulse-Webhook-Secret'] = secret;
  }

  await Promise.allSettled(
    urls.map(async (url) => {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(
          `Webhook ${url} failed with status ${response.status}`,
        );
      }
    }),
  );
}
