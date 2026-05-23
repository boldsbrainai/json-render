# Chat Example

An AI-powered data explorer that streams rich, interactive UI directly into a chat interface. The assistant uses tool calls to fetch real data (weather, GitHub, crypto, Hacker News, web search), then generates a json-render spec that renders inline alongside the conversation using shadcn components, Recharts, and React Three Fiber.

## What it shows

- **Streaming specs inside chat messages** -- `pipeJsonRender` on the server merges the AI SDK UI stream with json-render spec patches so text, tool-call indicators, and rendered UI all appear in the correct order within a single message bubble.
- **ToolLoopAgent with live data** -- the agent loops through tool calls (weather, GitHub repos/PRs, crypto prices, Hacker News, web search) to gather real data before generating UI.
- **Full catalog/registry stack** -- a catalog constrains what the model can produce; the registry maps every component to a real React implementation (shadcn, Recharts charts, R3F 3D scenes).
- **State and interactivity** -- `$state`, `$bindState`, visibility, and actions work inside the streamed spec, so the rendered UI is interactive, not static.

## Setup

```bash
pnpm install          # from the monorepo root
cd examples/chat
cp .env.example .env.local
```

Set the required environment variables in `.env.local`:

| Variable | Required | Description |
| ---------- | ---------- | ------------- |
| `LLM_BASE_URL` | Yes | OpenAI-compatible endpoint for LiteLLM, Ollama, or vLLM |
| `LLM_API_KEY` | No | API key for the provider. For local Ollama, use `ollama` or omit |
| `LLM_MODEL` | No | Model identifier exposed by the provider |
| `REDIS_URL` | No | Redis/Valkey URL for rate limiting |
| `RATE_LIMIT_PER_MINUTE` | No | Defaults to `10` |
| `RATE_LIMIT_PER_DAY` | No | Defaults to `100` |

Rate limiting is a no-op when `REDIS_URL` is not set.

## Run

```bash
pnpm dev
# http://chat-demo.json-render.localhost:1355
```

Requires global [`portless`](https://github.com/vercel-labs/portless). The `predev` script checks for it automatically.

## Files

- `app/page.tsx` -- chat UI with `useChat`, message rendering, and inline spec display
- `app/api/generate/route.ts` -- streams the agent through `pipeJsonRender` with optional Redis/Valkey rate limiting
- `lib/agent.ts` -- `ToolLoopAgent` with system prompt from `explorerCatalog.prompt()` and custom rules for layout, 3D, and interactivity
- `lib/tools/` -- tool definitions for weather, GitHub, crypto, Hacker News, and web search
- `lib/render/catalog.ts` -- component catalog (shadcn base + custom metrics, tables, charts, tabs, 3D)
- `lib/render/registry.tsx` -- maps catalog types to React components (shadcn, Recharts, R3F)
- `lib/render/renderer.tsx` -- `ExplorerRenderer` wrapping `StateProvider`, `VisibilityProvider`, `ActionProvider`, and `Renderer`
