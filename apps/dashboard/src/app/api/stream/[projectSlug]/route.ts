import { NextRequest } from 'next/server';
import { getFlagsForProject } from '../../../../lib/flags-store';
import { subscribeProjectFlagChanges } from '../../../../lib/flag-events';
import { getCorsHeaders } from '../../../../lib/cors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface StreamPayload {
  projectSlug: string;
  ts: number;
  flags: Awaited<ReturnType<typeof getFlagsForProject>>;
}

function formatSseData(payload: StreamPayload): Uint8Array {
  const body = `data: ${JSON.stringify(payload)}\n\n`;
  return new TextEncoder().encode(body);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectSlug: string }> },
) {
  const { projectSlug } = await params;
  const corsHeaders = await getCorsHeaders(request, projectSlug);

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      let lastSnapshot = '';

      const safeEnqueue = (chunk: Uint8Array) => {
        if (!closed) controller.enqueue(chunk);
      };

      const pushSnapshot = async () => {
        try {
          const flags = await getFlagsForProject(projectSlug);
          const serialized = JSON.stringify(flags);
          if (serialized === lastSnapshot) return;
          lastSnapshot = serialized;
          safeEnqueue(
            formatSseData({
              projectSlug,
              ts: Date.now(),
              flags,
            }),
          );
        } catch {
          // Keep stream alive even if one snapshot fails.
        }
      };

      const heartbeatTimer = setInterval(() => {
        safeEnqueue(new TextEncoder().encode(': heartbeat\n\n'));
      }, 15000);

      const unsubscribe = subscribeProjectFlagChanges(projectSlug, () => {
        void pushSnapshot();
      });
      const pollTimer = setInterval(() => {
        void pushSnapshot();
      }, 1000);
      void pushSnapshot();

      const cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(heartbeatTimer);
        clearInterval(pollTimer);
        unsubscribe();
        controller.close();
      };

      request.signal.addEventListener('abort', cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
