import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

const requiredVars = [
  "AI_INTEGRATIONS_OPENAI_BASE_URL",
  "AI_INTEGRATIONS_OPENAI_API_KEY",
  "AI_INTEGRATIONS_ANTHROPIC_BASE_URL",
  "AI_INTEGRATIONS_ANTHROPIC_API_KEY",
] as const;

for (const v of requiredVars) {
  if (!process.env[v]) throw new Error(`Missing required env var: ${v}`);
}

const DEBUG = !!process.env.DEBUG_UPSTREAM;

function maskHeaders(headers: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    const lower = k.toLowerCase();
    if (lower === "authorization" || lower === "x-api-key") {
      out[k] = v.slice(0, 10) + "…[masked]";
    } else {
      out[k] = v;
    }
  }
  return out;
}

function truncate(s: string, max = 2000): string {
  return s.length > max ? s.slice(0, max) + `… [+${s.length - max} chars]` : s;
}

export function makeLoggedFetch(label: string): typeof globalThis.fetch {
  if (!DEBUG) return globalThis.fetch;

  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : (input as Request).url;
    const method = init?.method ?? "GET";
    const t0 = Date.now();

    let bodySnippet = "";
    if (init?.body) {
      const raw = typeof init.body === "string" ? init.body : String(init.body);
      try {
        const parsed = JSON.parse(raw);
        if (parsed.messages && Array.isArray(parsed.messages)) {
          parsed.messages = parsed.messages.map((m: any) => ({
            ...m,
            content: typeof m.content === "string"
              ? truncate(m.content, 200)
              : m.content,
          }));
        }
        bodySnippet = truncate(JSON.stringify(parsed));
      } catch {
        bodySnippet = truncate(raw);
      }
    }

    const headersObj: Record<string, string> = {};
    if (init?.headers) {
      if (init.headers instanceof Headers) {
        init.headers.forEach((v, k) => { headersObj[k] = v; });
      } else if (Array.isArray(init.headers)) {
        for (const [k, v] of init.headers) headersObj[k] = v;
      } else {
        Object.assign(headersObj, init.headers);
      }
    }

    console.log(`\n[${label}] ▶ ${method} ${url}`);
    console.log(`[${label}] headers:`, JSON.stringify(maskHeaders(headersObj), null, 2));
    if (bodySnippet) console.log(`[${label}] body:`, bodySnippet);

    let res: Response;
    try {
      res = await globalThis.fetch(input, init);
    } catch (err) {
      console.error(`[${label}] ✗ fetch error (${Date.now() - t0}ms):`, err);
      throw err;
    }

    console.log(`[${label}] ◀ ${res.status} ${res.statusText} (${Date.now() - t0}ms)`);

    if (!res.ok) {
      const clone = res.clone();
      clone.text().then(txt => {
        console.error(`[${label}] error body:`, truncate(txt, 500));
      }).catch(() => {});
    }

    return res;
  };
}

const loggedFetch = makeLoggedFetch("upstream");

export const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  fetch: loggedFetch,
});

export const anthropic = new Anthropic({
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  fetch: loggedFetch,
});

export const openrouter: OpenAI | null =
  process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL &&
  process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY
    ? new OpenAI({
        baseURL: process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL,
        apiKey: process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY,
        fetch: loggedFetch,
      })
    : null;
