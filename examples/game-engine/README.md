# Game Engine Example

A 3D scene editor and lightweight game runtime built with json-render, React Three Fiber, and Rapier physics. Edit levels as structured objects, preview them on a canvas, then press play for first/third-person movement, physics, health/damage, NPCs, and optional AI-assisted editing.

## What it shows

- **3D rendering with json-render** -- the editor's scene graph is converted to a json-render `Spec` via `sceneToSpec`, then rendered with `ThreeRenderer` and the `@json-render/react-three-fiber` registry.
- **AI scene editing** -- type a prompt in the editor sidebar; the server streams YAML patches that are merged into the current spec, updating the 3D scene in real time.
- **In-game AI** -- while playing, an AI agent can manipulate the scene by streaming JSONL function calls (`addObject`, `updateObjectTransform`, etc.).
- **Play mode with physics** -- toggle between edit mode (gizmos, selection) and play mode (Rapier physics, first/third-person controls, health, damage zones, collectibles).
- **NPC dialogue with optional TTS** -- `GameCharacter` components support AI-generated dialogue, with optional ElevenLabs text-to-speech.
- **GLB uploads** -- upload custom 3D models and environments via Vercel Blob.

## Setup

```bash
pnpm install          # from the monorepo root
cd examples/game-engine
cp .env.example .env
```

Set the required environment variables:

| Variable | Required | Description |
| ---------- | ---------- | ------------- |
| `LLM_BASE_URL` | Yes | OpenAI-compatible endpoint for LiteLLM, Ollama, or vLLM |
| `LLM_API_KEY` | No | API key for the provider |
| `LLM_MODEL` | No | Defaults to the provider's configured model |
| `TTS_API_URL` | No | Self-hosted Piper/Coqui-compatible TTS endpoint |
| `TTS_API_KEY` | No | Optional bearer token for the TTS endpoint |
| `REDIS_URL` | No | Redis/Valkey URL for rate limiting |
| `MINIO_ENDPOINT` | No | MinIO host for model/environment uploads |
| `MINIO_ACCESS_KEY` | No | MinIO access key |
| `MINIO_SECRET_KEY` | No | MinIO secret key |
| `RATE_LIMIT_PER_MINUTE` | No | Defaults to `10` |
| `RATE_LIMIT_PER_DAY` | No | Defaults to `100` |

Model/environment uploads now use MinIO via its S3-compatible API when configured.

## Run

```bash
pnpm dev
# http://game-engine-demo.json-render.localhost:1355
```

Requires global [`portless`](https://github.com/vercel-labs/portless). The `predev` script checks for it automatically.

## Files

- `app/page.tsx` -- mounts `GameEngine`
- `components/game-engine.tsx` -- main shell: R3F canvas, sidebars, play/edit mode toggle, AI prompt integration
- `components/game/` -- game primitives (`GameBox`, `GameSphere`, `Player`, `GameCharacter`, etc.) with physics and interactions
- `components/editor/` -- editor UI: object inspector, scene tree, AI prompt sidebar, gizmo controls
- `components/hud/` -- in-game HUD: health bar, crosshair, in-game AI prompt
- `app/api/ai/route.ts` -- streams YAML scene edits from the model
- `app/api/ai-game/route.ts` -- streams JSONL function calls for in-game AI manipulation
- `app/api/character-responses/route.ts` -- generates NPC dialogue, optionally with TTS
- `lib/catalog.ts` -- 3D component catalog (R3F base + game-specific primitives)
- `lib/registry.tsx` -- maps catalog types to R3F and game components
- `lib/store.ts` -- Zustand store for scenes, selection, play mode, health, undo/redo
- `lib/scene-to-spec.ts` / `lib/spec-to-scene.ts` -- converts between the editor's scene graph and json-render specs
