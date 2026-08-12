import { createOpenAI } from "@ai-sdk/openai";

// Create OpenAI client
export const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Default model for most tasks
export const defaultModel = openai("gpt-4o-mini");

// Model for more complex tasks
export const advancedModel = openai("gpt-4o");

// Model for embeddings
export const embeddingModel = openai.embedding("text-embedding-3-small");

interface UpstreamError {
  statusCode?: number;
  status?: number;
  message?: string;
  data?: { error?: { code?: string; message?: string } };
  lastError?: unknown;
  errors?: unknown[];
  cause?: unknown;
}

/**
 * The AI SDK retries and then rethrows an AI_RetryError wrapper, so the real
 * OpenAI error (with its status and code) is nested inside.
 */
function unwrapUpstream(error: unknown): UpstreamError {
  let current = (error ?? {}) as UpstreamError;

  for (let depth = 0; depth < 5; depth += 1) {
    if (current.statusCode ?? current.status ?? current.data?.error?.code) break;

    if (current.lastError) {
      current = current.lastError as UpstreamError;
    } else if (Array.isArray(current.errors) && current.errors.length) {
      current = current.errors[current.errors.length - 1] as UpstreamError;
    } else if (current.cause) {
      current = current.cause as UpstreamError;
    } else {
      break;
    }
  }

  return current;
}

/**
 * Turns an OpenAI failure into a response the UI can actually act on.
 *
 * Without this every upstream problem collapses into a generic 500, so a
 * missing API key, an account with no credits and a transient rate limit all
 * read as "try again" even when retrying cannot possibly help.
 */
export function aiErrorResponse(scope: string, error: unknown): {
  status: number;
  body: { error: string; code: string };
} {
  const err = unwrapUpstream(error);
  const status = err.statusCode ?? err.status;
  const code = err.data?.error?.code;
  const message = err.data?.error?.message ?? err.message ?? "";

  console.error(`[${scope}]`, message || error);

  // The quota error comes back as a plain 429 on some paths, so fall back to
  // the message when the structured code is not present.
  if (code === "insufficient_quota" || /no credits remaining|exceeded your current quota/i.test(message)) {
    return {
      status: 429,
      body: {
        error: "The OpenAI account has no credits remaining.",
        code: "quota_exceeded",
      },
    };
  }

  if (code === "invalid_api_key" || status === 401) {
    return {
      status: 503,
      body: {
        error: "AI is not configured correctly. The OpenAI API key is invalid.",
        code: "ai_key_invalid",
      },
    };
  }

  if (status === 429) {
    return {
      status: 429,
      body: {
        error: "Too many requests to the AI service. Please wait a moment.",
        code: "rate_limit",
      },
    };
  }

  return {
    status: 500,
    body: { error: "The AI service failed. Please try again.", code: "ai_failed" },
  };
}
