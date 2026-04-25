import type { IncomingMessage, ServerResponse } from 'http';

// Minimal compatible types for Vercel Node.js handlers
export type ApiRequest = IncomingMessage & {
  method?: string;
  query?: Record<string, string | string[]>;
  headers: Record<string, string | string[] | undefined>;
};

export type ApiResponse = ServerResponse & {
  status(code: number): ApiResponse;
  json(body: unknown): void;
  setHeader(name: string, value: string | string[]): ApiResponse;
  writeHead(code: number, headers?: Record<string, string>): ApiResponse;
  end(body?: string): void;
};

/** Reads and JSON-parses the request body. Resolves to {} on empty body. */
export async function readJsonBody(req: ApiRequest): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk: Buffer) => { data += chunk.toString(); });
    req.on('end', () => {
      if (!data) return resolve({});
      try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

type Handler = (req: ApiRequest, res: ApiResponse) => Promise<void>;

/**
 * Wraps a handler with a top-level try/catch.
 * Ensures every unhandled error returns a clean 500 JSON response
 * instead of Vercel's opaque default error page.
 */
export function withErrorHandler(handler: Handler): Handler {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (err: unknown) {
      console.error('[api] unhandled error:', err);
      if (!res.writableEnded) {
        const detail = process.env.NODE_ENV !== 'production' && err instanceof Error
          ? err.message
          : undefined;
        res.status(500).json({ error: 'Internal server error', ...(detail ? { detail } : {}) });
      }
    }
  };
}
