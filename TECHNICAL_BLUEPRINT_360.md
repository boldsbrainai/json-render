# Technical Blueprint 360º

## Escopo e método

Este blueprint foi construído por engenharia reversa a partir da topografia real do monorepo, dependências declaradas, rotas expostas, esquemas de dados, handlers de integração e documentação interna.

Evidências-base principais:

- `package.json`
- `pnpm-workspace.yaml`
- `turbo.json`
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
- `README.md`
- `apps/web/package.json`
- `apps/web/app/layout.tsx`
- `apps/web/next.config.js`
- `apps/web/app/api/docs-chat/route.ts`
- `apps/web/lib/rate-limit.ts`
- `examples/dashboard/README.md`
- `examples/dashboard/package.json`
- `examples/dashboard/drizzle.config.ts`
- `examples/dashboard/lib/db/schema.ts`
- `examples/dashboard/lib/db/connection.ts`
- `examples/dashboard/lib/db/store.ts`
- `examples/dashboard/app/api/v1/widgets/route.ts`
- `examples/dashboard/app/api/v1/customers/route.ts`
- `examples/dashboard/app/page.tsx`
- `examples/dashboard/lib/render/registry.tsx`
- `examples/game-engine/README.md`
- `examples/game-engine/lib/store.ts`
- `examples/game-engine/app/api/text-to-speech/route.ts`
- `examples/game-engine/app/api/upload-model/route.ts`
- `examples/chat/lib/tools/weather.ts`
- `examples/chat/lib/tools/hackernews.ts`
- `examples/chat/lib/tools/github.ts`
- `examples/chat/lib/tools/crypto.ts`
- `examples/stripe-app/fullpage-app/src/lib/render/catalog/actions.ts`

---

## Fase 1: Topografia de Stack e Infraestrutura

### Core stack

| Camada | Stack identificado | Evidência |
| --- | --- | --- |
| Linguagem principal | TypeScript | `package.json`, `apps/web/package.json` |
| Runtime backend | Node.js 24+ | `package.json` `engines.node >=24` |
| Frontend principal | React 19 | `package.json`, `apps/web/package.json` |
| Framework web principal | Next.js 16 App Router | `apps/web/package.json`, múltiplas rotas em `app/api/**/route.ts` |
| Frameworks adicionais suportados | Vue 3, Svelte 5, SolidJS, React Native, Ink | `README.md`, `packages/*` |
| Motor de UI generativa | `@json-render/core` + renderers específicos | `README.md`, `packages/core`, `packages/react`, `packages/vue`, `packages/svelte`, `packages/solid` |
| IA / geração | Vercel AI SDK + AI Gateway | `apps/web/package.json`, `examples/dashboard/package.json`, `apps/web/app/api/docs-chat/route.ts`, `examples/dashboard/app/api/generate/route.ts` |

### Infraestrutura e containerização

| Tema | Achado forense | Evidência |
| --- | --- | --- |
| Docker | Não há `Dockerfile`, `docker-compose`, Kubernetes manifests ou Helm charts no repositório inspecionado | busca por arquivos de infra; nenhum resultado para Docker |
| Deploy app web | Forte viés para Vercel/Next.js, mas sem manifesto explícito `vercel.json` | `apps/web/README.md`, `apps/web/app/layout.tsx`, uso de `@vercel/analytics` e `@vercel/speed-insights` |
| Upload de assets | Vercel Blob para uploads de modelos 3D | `examples/game-engine/app/api/upload-model/route.ts` |
| Ambientes locais | `portless` para evitar portas fixas e expor subdomínios `.localhost` | `AGENTS.md`, scripts `predev`/`dev` em `package.json`, `apps/web/package.json`, `examples/dashboard/package.json` |
| CI | GitHub Actions para version sync, lint, testes e typecheck | `.github/workflows/ci.yml` |
| Release | Pipeline manual/automática para npm + GitHub Release | `.github/workflows/release.yml` |

### Gerenciamento de pacotes, build e qualidade

| Categoria | Ferramenta | Evidência |
| --- | --- | --- |
| Package manager | pnpm 11 | `package.json`, `pnpm-workspace.yaml` |
| Orquestração de monorepo/build | Turborepo | `package.json`, `turbo.json` |
| Lint | ESLint 9 | `apps/web/package.json`, `examples/dashboard/package.json`, workflow CI |
| Formatação | Prettier 3 | `package.json` |
| Testes unitários/integração | Vitest | `package.json` |
| Husky / pre-commit | Husky + lint-staged | `package.json` |
| Type checking | TypeScript + `turbo run check-types` | `package.json`, `turbo.json` |
| Banco / migrações | Drizzle Kit | `examples/dashboard/package.json`, `examples/dashboard/drizzle.config.ts` |

### Conclusão da fundação técnica

- O repositório é um monorepo TypeScript-first orientado a bibliotecas e exemplos executáveis.
- O centro operacional é Next.js + React, mas o produto principal é um framework cross-renderer, não apenas uma aplicação web.
- A infraestrutura é “cloud-friendly”, porém leve: sem containerização nativa, sem IaC e sem malha de serviços.

---

## Fase 2: Padrões Arquiteturais e Topologia

### Padrão global

**Classificação:** monorepo modular orientado a framework, com múltiplos apps de exemplo e elementos agentic/tool-calling.

Não há sinais de microserviços independentes, mensageria, service mesh ou arquitetura event-driven distribuída. O que existe é:

- um núcleo de bibliotecas reutilizáveis em `packages/`
- um portal/documentação principal em `apps/web`
- vários exemplos autocontidos em `examples/`
- componentes agentic locais, como tool-calling e streaming de LLM, em `apps/web/app/api/docs-chat/route.ts`, `examples/chat`, `examples/ink-chat` e `examples/game-engine/app/api/ai-game/route.ts`

### Mapeamento de diretórios e boundaries

| Diretório | Responsabilidade arquitetural |
| --- | --- |
| `apps/web` | Site principal, documentação, playground e APIs auxiliares (`generate`, `docs-chat`, `search`, `docs-markdown`) |
| `packages/core` | Contratos centrais: schema, catálogo, prompt building, state store, parsing/streaming |
| `packages/react`, `packages/vue`, `packages/svelte`, `packages/solid`, `packages/next`, `packages/react-native`, `packages/ink` | Adaptadores/renderers por plataforma |
| `packages/shadcn`, `packages/shadcn-svelte`, `packages/ui` | Blocos de UI padronizados e catálogo visual |
| `packages/redux`, `packages/zustand`, `packages/jotai`, `packages/xstate` | Adaptadores de gerenciamento de estado |
| `packages/devtools*` | Ferramentas de inspeção/devtools por framework |
| `packages/codegen`, `packages/yaml`, `packages/mcp` | Geração de código, wire format e integração com agentes/MCP |
| `examples/dashboard` | Exemplo full-stack com CRUD real, Postgres, Drizzle, rate limit e UI gerada por IA |
| `examples/game-engine` | Exemplo 3D com editor, Zustand, uploads, IA in-game e TTS |
| `examples/chat`, `examples/svelte-chat`, `examples/ink-chat` | Exemplos de tool-calling com integrações externas reais |
| `examples/stripe-app/*` | Exemplos acoplados ao Stripe Apps SDK e Stripe API |
| `tests/e2e` | Testes end-to-end do framework |
| `skills/` | Artefatos operacionais para agentes/copilots, ampliando a camada de uso do framework |

### Fluxo de controle típico

#### Fluxo típico do dashboard full-stack

1. O cliente React renderiza a dashboard e busca widgets salvos via `fetch('/api/v1/widgets')` em `examples/dashboard/app/page.tsx`.
2. As rotas Next App Router em `examples/dashboard/app/api/v1/**/route.ts` recebem as requisições REST.
3. Os handlers chamam a camada de store em `examples/dashboard/lib/db/store.ts`.
4. A store usa Drizzle ORM + driver `postgres` via `examples/dashboard/lib/db/connection.ts`.
5. Os dados persistidos em Postgres retornam ao handler e voltam como JSON ao cliente.
6. Em paralelo, ações de UI declaradas em `examples/dashboard/lib/render/registry.tsx` disparam `fetch` para essas rotas REST.

#### Fluxo típico de geração por IA

1. O cliente envia prompt para uma rota `app/api/generate/route.ts` ou similar.
2. O servidor aplica rate limiting baseado em IP com Upstash em `apps/web/lib/rate-limit.ts` e equivalentes dos exemplos.
3. O prompt é transformado em contexto estruturado por `@json-render/core`.
4. O servidor chama `streamText()` do Vercel AI SDK com `AI_GATEWAY_MODEL`.
5. A resposta volta como stream textual/JSONL para o cliente renderizar progressivamente.

### Leitura arquitetural objetiva

- É um **framework platform monorepo** com vários produtos-exemplo acoplados.
- O maior acoplamento estrutural é entre `packages/core` e os renderers/plataformas.
- Os exemplos servem como referência funcional e também como superfície real de integração.

---

## Fase 3: Modelagem de Dados e Persistência

### ORM / query builders

| Ferramenta | Uso | Evidência |
| --- | --- | --- |
| Drizzle ORM | acesso relacional tipado ao Postgres | `examples/dashboard/lib/db/connection.ts`, `examples/dashboard/lib/db/store.ts` |
| Drizzle Kit | geração/push/migrate/studio | `examples/dashboard/package.json`, `examples/dashboard/drizzle.config.ts` |
| `postgres` | driver PostgreSQL | `examples/dashboard/package.json`, `examples/dashboard/lib/db/connection.ts` |

### Schemas e entidades principais

Entidades centrais encontradas em `examples/dashboard/lib/db/schema.ts`:

| Entidade | Papel |
| --- | --- |
| `customers` | cadastro de clientes, saldo e status |
| `invoices` | cobrança/faturamento, itens, status e vencimento |
| `expenses` | despesas operacionais com aprovação/rejeição |
| `accounts` | contas financeiras (banco, cartão, caixa) |
| `transactions` | ledger simplificado de entradas/saídas |
| `widgets` | persistência de prompts e specs gerados pela IA |

Enums de domínio detectados:

- `customer_status`
- `invoice_status`
- `expense_status`
- `account_type`
- `transaction_type`

### Persistência não relacional / transitória

| Mecanismo | Papel | Evidência |
| --- | --- | --- |
| JSONB no Postgres | persistência de `spec` e `items` | `examples/dashboard/lib/db/schema.ts` |
| Upstash Redis REST | rate limiting | `apps/web/lib/rate-limit.ts`, `examples/game-engine/lib/rate-limit.ts` |
| Session storage do browser | persistência local do chat de docs | `apps/web/components/docs-chat.tsx` |
| Estado em memória | exemplos e editores interativos | `examples/game-engine/lib/store.ts`, `examples/dashboard/app/page.tsx` |

### Gerenciamento de estado

| Escopo | Estratégia | Evidência |
| --- | --- | --- |
| Framework | camada abstrata de `StateStore` + adapters | `README.md`, pacotes `redux`, `zustand`, `jotai`, `xstate` |
| Game engine | Zustand com histórico/undo/redo e estado de cena | `examples/game-engine/lib/store.ts` |
| Dashboard | `useState`, `useEffect`, `useCallback` + backend REST | `examples/dashboard/app/page.tsx` |
| Docs chat | estado React + `sessionStorage` | `apps/web/components/docs-chat.tsx` |
| Backend | stateless por requisição, exceto Redis/Postgres | rotas `app/api/**/route.ts` |

### Leitura da camada de dados

- Só o exemplo `dashboard` possui persistência relacional real no repositório inspecionado.
- O framework principal é intencionalmente agnóstico a banco; a persistência de domínio aparece nos exemplos.
- `widgets.spec` em JSONB confirma que o sistema persiste árvores de UI geradas, não apenas entidades tradicionais.

---

## Fase 4: Hub de Integrações e Superfície de API

### Rotas principais expostas

| Grupo de rotas | Função | Evidência |
| --- | --- | --- |
| `/api/generate` | geração por IA para web e exemplos | `apps/web/app/api/generate/route.ts`, `examples/dashboard/app/api/generate/route.ts`, `examples/react-email/app/api/generate/route.ts`, `examples/remotion/app/api/generate/route.ts`, `examples/image/app/api/generate/route.ts` |
| `/api/docs-chat` | assistente de documentação com tools locais | `apps/web/app/api/docs-chat/route.ts` |
| `/api/search` | busca documental do site | `apps/web/app/api/search/route.ts` |
| `/api/docs-markdown` | transformação/entrega de docs em markdown | `apps/web/app/api/docs-markdown/route.ts` |
| `/api/v1/widgets` | CRUD de widgets persistidos | `examples/dashboard/app/api/v1/widgets/**` |
| `/api/v1/customers` | CRUD/listagem de clientes | `examples/dashboard/app/api/v1/customers/**` |
| `/api/v1/invoices` | CRUD e transições de faturamento | `examples/dashboard/app/api/v1/invoices/**` |
| `/api/v1/expenses` | CRUD e workflow de aprovação/rejeição | `examples/dashboard/app/api/v1/expenses/**` |
| `/api/v1/accounts` | leitura de contas/transações | `examples/dashboard/app/api/v1/accounts/**` |
| `/api/v1/reports/*` | export e relatórios financeiros | `examples/dashboard/app/api/v1/reports/**` |
| `/api/ai`, `/api/ai-game`, `/api/character-responses` | IA para edição de cena, manipulação in-game e diálogo NPC | `examples/game-engine/app/api/**` |
| `/api/upload-model`, `/api/upload-environment`, `/api/models`, `/api/environments` | upload/listagem de assets do game engine | `examples/game-engine/app/api/**` |
| `/api/email`, `/api/pdf`, `/api/image`, `/api/spec` | APIs de exemplos específicos | `examples/react-email/app/api/email/route.ts`, `examples/react-pdf/app/api/pdf/route.ts`, `examples/image/app/api/image/route.ts`, `examples/next-website-builder/app/api/spec/route.ts` |

### Third-party APIs e serviços externos

| Provider / serviço | Tipo de uso | Como aparece no código | Autenticação |
| --- | --- | --- | --- |
| Vercel AI Gateway via AI SDK | geração/streaming LLM | `streamText()` com `AI_GATEWAY_MODEL` em `apps/web/app/api/docs-chat/route.ts`, `examples/dashboard/app/api/generate/route.ts` e variantes | `AI_GATEWAY_API_KEY` via ambiente / SDK |
| Upstash Redis REST | rate limiting | `@upstash/ratelimit` + `@upstash/redis` em `apps/web/lib/rate-limit.ts` e exemplos | `KV_REST_API_URL` + `KV_REST_API_TOKEN` |
| GitHub REST API | consulta de repositório/PRs/estrelas | `examples/chat/lib/tools/github.ts`, `apps/web/lib/github.ts` | pública em alguns pontos; sem token explícito |
| Open-Meteo Geocoding API | geocodificação | `examples/chat/lib/tools/weather.ts` | sem autenticação |
| Open-Meteo Forecast API | previsão do tempo | `examples/chat/lib/tools/weather.ts` | sem autenticação |
| Hacker News Firebase API | top stories e itens | `examples/chat/lib/tools/hackernews.ts` | sem autenticação |
| CoinGecko API | preço e histórico cripto | `examples/chat/lib/tools/crypto.ts` | sem autenticação |
| ElevenLabs Text-to-Speech API | síntese de voz | `examples/game-engine/app/api/text-to-speech/route.ts` | header `xi-api-key` com `ELEVENLABS_API_KEY` |
| Vercel Blob | upload de modelos/ambientes | `examples/game-engine/app/api/upload-model/route.ts` e correlatas | token/config do serviço via SDK/ambiente |
| Stripe API via Stripe Apps UI Extension SDK | operações de clientes, payments, checkout sessions, billing portal etc. | `examples/stripe-app/fullpage-app/src/lib/render/catalog/actions.ts`, `examples/stripe-app/drawer-app/src/lib/render/catalog/actions.ts` | autenticado pelo contexto/SDK do Stripe App |
| Vercel Analytics | telemetria frontend | `apps/web/app/layout.tsx` | implícita pelo SDK |
| Vercel Speed Insights | performance telemetry | `apps/web/app/layout.tsx` | implícita pelo SDK |

### Observações sobre a superfície externa

- O repositório contém **integrações reais**, não apenas placeholders, especialmente em `dashboard`, `game-engine`, `chat` e `stripe-app`.
- Parte importante das integrações vive em **exemplos**, não no produto principal `apps/web`.
- O repositório mistura chamadas HTTP explícitas com integrações encapsuladas por SDK (`ai`, `@vercel/blob`, Stripe UI Extension SDK).

### Autenticação e autorização

| Tema | Situação real | Evidência |
| --- | --- | --- |
| JWT/OAuth interno | não encontrado no código inspecionado | busca por bibliotecas/padrões de auth sem ocorrência operacional |
| Sessão de usuário do app | não há camada formal de auth no app web/demos | ausência de `middleware.ts`, NextAuth, Clerk, Auth0 etc. |
| Proteção básica | rate limiting por IP | `apps/web/lib/rate-limit.ts` e equivalentes |
| Auth para terceiros | via chaves de ambiente e SDKs | `AI_GATEWAY_API_KEY`, `ELEVENLABS_API_KEY`, `KV_REST_API_TOKEN` |
| Auth Stripe | delegada ao ambiente do Stripe App / UI Extension SDK | `examples/stripe-app/*/src/lib/render/catalog/actions.ts` |
| RBAC | inexistente como camada explícita | não há policies, guards ou middleware de papel/perfil |

### Leitura objetiva de segurança

- A segurança de borda do repositório é **service-key centric**, não **user-identity centric**.
- Os exemplos com CRUD real e geração por IA não mostram autenticação de usuários finais.
- Em produção, isso exige uma camada adicional de autenticação/autorização que hoje não está no blueprint do código.

---

## Fase 5: UI/UX e Design System Engine

### Bibliotecas de componentes e estilização

| Categoria | Ferramenta | Evidência |
| --- | --- | --- |
| Utility CSS | Tailwind CSS v4 | `apps/web/package.json`, `apps/web/app/globals.css` |
| UI base | shadcn/ui | `apps/web/components.json`, `examples/dashboard/components.json`, `examples/dashboard/lib/render/registry.tsx` |
| Headless primitives | Radix UI | `apps/web/package.json` |
| Component variants | class-variance-authority | `apps/web/package.json` |
| Icons | Lucide | `apps/web/components.json`, `examples/dashboard/components.json` |
| Theming | next-themes | `apps/web/package.json`, `apps/web/app/layout.tsx` |
| Charts | Recharts | `examples/dashboard/package.json`, `examples/dashboard/lib/render/registry.tsx` |
| DnD | `@dnd-kit/*` | `examples/dashboard/package.json`, `examples/dashboard/app/page.tsx` |
| Toast/feedback | Sonner | `apps/web/package.json`, `examples/dashboard/lib/render/registry.tsx` |

### Evidências de design system

- Configuração shadcn em estilo `new-york` tanto no site quanto no dashboard: `apps/web/components.json`, `examples/dashboard/components.json`
- Tokens CSS com variáveis e modo escuro/claro: `apps/web/app/globals.css`, `examples/dashboard/app/globals.css`
- Fontes Geist + Geist Mono + Geist Pixel Square: `apps/web/app/layout.tsx`
- Primitivas de interface densas e data-heavy no dashboard: tabelas, tabs, dialogs, drawers, charts, badges e inputs em `examples/dashboard/lib/render/registry.tsx`

### Filosofia de design inferida

#### apps/web

- estética monocromática e editorial, com forte controle tipográfico
- dark mode suportado, mas não “dark-first” absoluto
- presença de telemetria e observabilidade frontend (`Analytics`, `SpeedInsights`)
- documentação e playground como experiência principal do produto

#### examples/dashboard

- alta densidade de informação
- componentes de produtividade/BI
- uso de tabelas, métricas, gráficos e modais como primitives de negócio

#### framework como um todo

- UI orientada a catálogos, schemas e guardrails
- a camada visual é declarativa e tipada, não livre-forma
- a “engine” de UX está mais próxima de um compilador de interfaces do que de uma app tradicional com páginas estáticas

---

## Síntese arquitetural

### O que este repositório é de fato

Não é apenas um site Next.js. O repositório é uma plataforma de **Generative UI** com três camadas principais:

1. **Kernel de schema/catalog/state/rendering** em `packages/`
2. **Portal de documentação e playground** em `apps/web`
3. **Verticais demonstrativas com integrações reais** em `examples/`

### O que ele não é

- não é uma malha de microserviços
- não é um backend enterprise unificado com domínio único
- não é um sistema com IAM maduro para usuários finais
- não é um projeto com plataforma de deploy declarada por IaC/container por padrão

---

## Avaliação de Débito Técnico / Riscos Arquiteturais

### 1. Segurança de aplicação final é insuficiente nos exemplos com backend real

Risco:

- `examples/dashboard` expõe CRUD, geração por IA e persistência Postgres sem camada explícita de autenticação/autorização de usuário.
- O mesmo vale para vários endpoints de geração e upload nos exemplos.

Impacto:

- qualquer publicação direta desses exemplos sem hardening adicional abre superfície de abuso e acesso indevido.

Evidência:

- `examples/dashboard/app/api/v1/**`
- `examples/dashboard/app/api/generate/route.ts`
- `examples/game-engine/app/api/upload-model/route.ts`

### 2. Rate limiting é opcional e falha para no-op sem Redis configurado

Risco:

- quando `KV_REST_API_URL` ou `KV_REST_API_TOKEN` não estão configurados, o limiter vira no-op e aceita tudo.

Impacto:

- em ambiente mal configurado, APIs com LLM ficam sem proteção de consumo/custo.

Evidência:

- `apps/web/lib/rate-limit.ts`
- `examples/game-engine/lib/rate-limit.ts`

### 3. Concentração de responsabilidade em exemplos full-stack

Risco:

- o exemplo `dashboard` concentra UI, regras de negócio, CRUD, persistência e geração por IA no mesmo boundary.

Impacto:

- bom para demo, ruim para escalabilidade de domínio e isolamento de responsabilidades se alguém tentar promovê-lo a produção.

Evidência:

- `examples/dashboard/app/page.tsx`
- `examples/dashboard/lib/render/registry.tsx`
- `examples/dashboard/lib/db/store.ts`

### 4. Integrações externas estão espalhadas entre apps e exemplos

Risco:

- não existe um hub central de integrações; cada exemplo encapsula seu próprio padrão de API, auth e tratamento de erro.

Impacto:

- aumenta drift de padrões, dificulta governança e observabilidade transversal.

Evidência:

- `examples/chat/lib/tools/*.ts`
- `examples/game-engine/app/api/*.ts`
- `examples/stripe-app/*/src/lib/render/catalog/actions.ts`

### 5. Ausência de containerização/IaC nativa limita reprodutibilidade operacional

Risco:

- deploy e infraestrutura dependem fortemente de conhecimento implícito do ambiente.

Impacto:

- onboarding operacional e promoção para ambientes controlados ficam mais custosos.

Evidência:

- ausência de Dockerfiles, compose, Terraform, Bicep ou manifests equivalentes no workspace inspecionado

### 6. Mistura de código de produto, docs, skills e exemplos aumenta complexidade cognitiva

Risco:

- o monorepo tem alto valor, mas também alta sobrecarga mental para manutenção, porque mistura runtime framework, documentação, exemplos full-stack e artefatos para agentes.

Impacto:

- qualquer mudança de core precisa ser validada em várias superfícies heterogêneas.

Evidência:

- `packages/`
- `apps/web/`
- `examples/`
- `skills/`

### Veredito final

Arquiteturalmente, o repositório é forte como **plataforma de framework + laboratório de integrações**. O principal risco não está na base TypeScript/Next/Turbo, que é sólida; está no fato de que vários exemplos já operam como mini-produtos reais sem as camadas de segurança, isolamento e padronização que seriam esperadas em produção.
