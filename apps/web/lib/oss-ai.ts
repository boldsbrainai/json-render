import type { LanguageModel } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

const DEFAULT_BASE_URL = "http://127.0.0.1:11434/v1";
const DEFAULT_API_KEY = "ollama";
const DEFAULT_MODEL = "qwen2.5:7b-instruct";

export function getModelId(fallbackModel?: string): string {
  return (
    process.env.LLM_MODEL ||
    process.env.AI_GATEWAY_MODEL ||
    fallbackModel ||
    DEFAULT_MODEL
  );
}

export function createOssModel(modelId?: string): LanguageModel {
  const provider = createOpenAI({
    baseURL: process.env.LLM_BASE_URL || DEFAULT_BASE_URL,
    apiKey: process.env.LLM_API_KEY || DEFAULT_API_KEY,
  });

  return provider(getModelId(modelId));
}
