import { tool, generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";

const modelProvider = createOpenAI({
  baseURL: process.env.LLM_BASE_URL || "http://127.0.0.1:11434/v1",
  apiKey: process.env.LLM_API_KEY || "ollama",
});

/**
 * Web search tool using Perplexity Sonar via AI Gateway.
 *
 * Perplexity Sonar models have built-in internet access and return
 * synthesized answers with citations. This is wrapped as a regular tool
 * (with an `execute` function) so that ToolLoopAgent can loop: it calls
 * the model, gets results, and feeds them back for the next step.
 */
export const webSearch = tool({
  description:
    "Search the web for current information on any topic. Use this when the user asks about something not covered by the specialized tools (weather, crypto, GitHub, Hacker News). Returns a synthesized answer based on real-time web data.",
  inputSchema: z.object({
    query: z
      .string()
      .describe(
        "The search query — be specific and include relevant context for better results",
      ),
  }),
  execute: async ({ query }) => {
    try {
      const { text } = await generateText({
        model: modelProvider(
          process.env.WEB_SEARCH_MODEL || "perplexity/sonar",
        ),
        prompt: query,
      });
      return { content: text };
    } catch (error) {
      return {
        error: `Search failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});
