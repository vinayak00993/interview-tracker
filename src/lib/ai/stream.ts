/**
 * Newline-delimited JSON streaming for route handlers. The client reads
 * lines as they arrive: {type:"delta",text} while generating, then one
 * {type:"done",...} with whatever the server persisted, or {type:"error"}.
 */
export type StreamEvent =
  | { type: "delta"; text: string }
  | { type: "done"; [key: string]: unknown }
  | { type: "error"; message: string };

export function ndjsonResponse(run: (emit: (event: StreamEvent) => void) => Promise<void>): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: StreamEvent) => controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      try {
        await run(emit);
      } catch (error) {
        emit({ type: "error", message: error instanceof Error ? error.message : "Stream failed" });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}

/** Client-side reader for ndjsonResponse. */
export async function readNdjson(
  res: Response,
  onEvent: (event: StreamEvent) => void
): Promise<void> {
  if (!res.body) throw new Error("No response body");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (line) onEvent(JSON.parse(line) as StreamEvent);
    }
  }
  if (buffer.trim()) onEvent(JSON.parse(buffer.trim()) as StreamEvent);
}
