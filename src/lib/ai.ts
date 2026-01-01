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
