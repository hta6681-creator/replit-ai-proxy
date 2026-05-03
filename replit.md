# Workspace

## Overview

pnpm workspace monorepo using TypeScript. AI 反向代理服务，支持 OpenAI / Anthropic / OpenRouter，通过统一的 `/v1` 接口对外暴露。

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Build**: esbuild (ESM bundle)
- **Frontend**: React + Vite (api-portal)
- **AI Integrations**: OpenAI · Anthropic · OpenRouter（Replit AI Integrations 代理，无需自己的 API key）

## Artifacts

| artifact | 路径 | 说明 |
|---|---|---|
| `api-server` | `/api`, `/v1` | Express 代理服务，port 8080 |
| `api-portal` | `/` | React 管理门户，port 24927 |

## Key Commands

- `pnpm run typecheck` — 全量类型检查
- `pnpm run build` — typecheck + 构建所有包
- `pnpm --filter @workspace/api-server run build` — 单独构建 api-server
- `pnpm --filter @workspace/api-portal run build` — 单独构建 api-portal（build 模式下 PORT/BASE_PATH 非必须）
- `pnpm --filter @workspace/api-spec run codegen` — 从 OpenAPI spec 重新生成 hooks 和 Zod schemas

## Secrets / Env Vars

| 变量 | 说明 |
|---|---|
| `PROXY_API_KEY` | 保护 `/v1/*` 接口的 Bearer token，必须由用户提供 |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` / `_API_KEY` | 由 `setupReplitAIIntegrations` 自动写入 |
| `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` / `_API_KEY` | 由 `setupReplitAIIntegrations` 自动写入 |
| `AI_INTEGRATIONS_OPENROUTER_BASE_URL` / `_API_KEY` | 由 `setupReplitAIIntegrations` 自动写入 |

## Verified Endpoints

```
GET  /api/healthz                                  → 200 {"status":"ok"}
GET  /v1/models          Authorization: Bearer ... → 200 {object:"list", data:[...]}
POST /v1/chat/completions Authorization: Bearer ... → 200 OpenAI-compatible response
POST /v1/messages        x-api-key: ...            → 200 Anthropic-native response
```

## 已知坑 & 修复记录

1. **`vite build` 不需要 PORT** — `vite.config.ts` 已修复：`build` 模式下 PORT / BASE_PATH 非必须，仅 dev/preview 模式强制要求。
2. **api-server 重启端口冲突** — `dev` 脚本已加 `fuser -k ${PORT:-8080}/tcp 2>/dev/null` 在启动前自动释放端口，避免 `EADDRINUSE`。
3. **无用依赖** — `@workspace/db` 和 `drizzle-orm` 已从 api-server 移除（代理不访问数据库），避免缺少 `DATABASE_URL` 时崩溃。
4. **setup.sh 需要 PORT** — 若需手动运行 `pnpm --filter @workspace/api-portal run build`，直接执行即可，无需设置 PORT。

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
