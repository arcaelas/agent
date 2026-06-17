# Providers

**Providers** are functions that integrate AI services (OpenAI, Anthropic, Groq, etc.) with agents. They receive context and return chat completions in OpenAI-compatible format.

## Overview

Providers enable multi-provider failover and vendor flexibility through a standard interface.

### Key Features

- ✅ Standard OpenAI ChatCompletion format
- ✅ Automatic failover between providers
- ✅ Support for any AI service (OpenAI, Anthropic, Groq, custom)
- ✅ Access to full agent context
- ✅ Tool call support

## Provider Function Signature

```typescript
type Provider = {
  (ctx: Context, opts?: { signal?: AbortSignal }): ChatCompletionResponse | Promise<ChatCompletionResponse>;
  (ctx: Context, opts: { stream: true; signal?: AbortSignal }): AsyncIterable<ProviderChunk>;
};
```

**Parameters:**
- **ctx**: `Context` instance exposing `messages`, `tools`, `rules`, `metadata`
- **opts.signal**: Optional `AbortSignal`
- **opts.stream**: When `true`, the provider must return an `AsyncIterable<ProviderChunk>` instead of a response object

**Returns (non-stream):** OpenAI-compatible `ChatCompletionResponse`
**Returns (stream):** `AsyncIterable<ProviderChunk>`

### ProviderChunk (stream mode)

```typescript
type ProviderChunk =
  | { type: "text_delta";      content: string }
  | { type: "thinking_delta";  content: string }
  | { type: "signature_delta"; content: string }
  | { type: "tool_call_delta"; index: number; id?: string; name?: string; arguments_delta?: string }
  | { type: "finish";          finish_reason: string };
```

- `text_delta` — incremental text token from the model.
- `thinking_delta` — incremental reasoning/thinking token (Claude extended thinking, DeepSeek R1 `reasoning_content`, etc.).
- `signature_delta` — cryptographic signature of the thinking block (Anthropic-specific). Accumulated and stored as `thinking_signature` on the persisted `assistant` message so the API can accept the block when reinjected in subsequent turns.
- `tool_call_delta` — partial tool call accumulation (index, id, name, arguments fragment).
- `finish` — signals end of generation with the finish reason.

The `thinking_delta` / `signature_delta` chunks are emitted as `StreamChunk { role: "thinking" }` to the consumer. The Agent accumulates both to persist `thinking` and `thinking_signature` on the stored `assistant` message.

### ResponseMessage (non-stream)

`ResponseMessage` now includes an optional `reasoning_content?: string` field that providers may populate from the model's native reasoning output.

## ChatCompletion Format

```typescript
interface ChatCompletion {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: "assistant";
      content: string;
      tool_calls?: Array<{
        id: string;
        type: "function";
        function: {
          name: string;
          arguments: string;  // JSON string
        };
      }>;
    };
    finish_reason: "stop" | "tool_calls" | "length" | null;
  }>;
}
```

## Built-in Provider Classes

The library exports five ready-to-use callable provider classes: **`OpenAI`**, **`Groq`**, **`DeepSeek`**, **`Claude`**, **`Ollama`**. Each extends `Function` and is directly usable as a `Provider`.

### OpenAI

```typescript
import { OpenAI } from '@arcaelas/agent';

const openai = new OpenAI({
  api_key: process.env.OPENAI_API_KEY!,
  model: "gpt-4o",
  // base_url?: string          // default: "https://api.openai.com/v1"
  // temperature?: number
  // max_tokens?: number
  // headers?: Record<string, string>
  // extra_body?: Record<string, unknown>  // pass-through to request body
});

const agent = new Agent({ providers: [openai] });
```

Use `extra_body` for provider-specific parameters (e.g. `reasoning_effort`):

```typescript
const o3 = new OpenAI({
  api_key: process.env.OPENAI_API_KEY!,
  model: "o3",
  extra_body: { reasoning_effort: "high" },
});
```

### Groq

```typescript
import { Groq } from '@arcaelas/agent';

const groq = new Groq({
  api_key: process.env.GROQ_API_KEY!,
  model: "llama-3.3-70b-versatile",
});
```

`Groq` is an `OpenAI`-compatible provider — it accepts the same options and uses `extra_body` for Groq-specific parameters.

### DeepSeek

```typescript
import { DeepSeek } from '@arcaelas/agent';

const deepseek = new DeepSeek({
  api_key: process.env.DEEPSEEK_API_KEY!,
  model: "deepseek-reasoner",
});
```

`DeepSeek` is an `OpenAI`-compatible provider. Streaming mode reads `delta.reasoning_content` and emits it as `thinking_delta` chunks.

### Claude

`Claude` uses the **Anthropic Messages API** (not OpenAI-compatible). Key differences:
- Uses `body` (not `extra_body`) for Anthropic-specific request fields.
- `api_key` is **optional** — omit it when authentication is handled entirely via `headers`.
- `base_url` is the **full endpoint URL** (default: `"https://api.anthropic.com/v1/messages"`).

```typescript
import { Claude } from '@arcaelas/agent';

// Classic API key
const claude = new Claude({
  api_key: process.env.ANTHROPIC_API_KEY!,
  model: "claude-sonnet-4-5",
  // base_url?: string   // full URL, default: "https://api.anthropic.com/v1/messages"
  // temperature?: number
  // max_tokens?: number  // default: 1024
  // headers?: Record<string, string>
  // body?: Record<string, unknown>  // merged into the Anthropic request body
});

// Extended thinking (via body)
const thinker = new Claude({
  api_key: process.env.ANTHROPIC_API_KEY!,
  model: "claude-sonnet-4-5",
  body: { thinking: { type: "enabled", budget_tokens: 8000 } },
});

// Claude Code OAuth flow — full endpoint URL with ?beta=true + beta headers
const oauth_claude = new Claude({
  base_url: "https://api.anthropic.com/v1/messages?beta=true",
  api_key: oauth_access_token,
  headers: { "anthropic-beta": "oauth-2025-04-20,claude-code-20250219" },
  model: "claude-sonnet-4-5",
});

// Third-party gateway / proxy (authentication via custom headers, no api_key)
const proxy_claude = new Claude({
  base_url: "https://gateway.example.com/anthropic/messages",
  headers: { "x-gateway-key": "..." },
  model: "claude-sonnet-4-5",
});
```

> **Extended thinking:** Anthropic only emits `thinking` blocks when the request explicitly enables it via `body: { thinking: { type: "enabled", budget_tokens: <n> } }`. Without that flag the model returns no thinking content.

### Ollama

`Ollama` runs open-source models locally via Ollama's OpenAI-compatible API. It does **not** require an `api_key` and exposes `think` and `num_ctx` as first-class options.

```typescript
import { Ollama } from '@arcaelas/agent';

// Basic usage — default base_url: "http://localhost:11434/v1"
const ollama = new Ollama({ model: "qwen3:8b" });

// Fast classifier (disable thinking)
const classifier = new Ollama({ model: "qwen3:8b", think: false });

// Deep reasoner (enable thinking)
const reasoner = new Ollama({ model: "qwen3:8b", think: true });

// Extended context window
const explorer = new Ollama({ model: "qwen2.5-coder:7b", num_ctx: 16384 });

// Remote Ollama instance
const remote = new Ollama({
  model: "llama3.2:3b",
  base_url: "http://192.168.1.10:11434/v1",
});
```

**`OllamaProviderOptions`:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `model` | `string` | — | Model identifier (required) |
| `base_url` | `string` | `"http://localhost:11434/v1"` | Ollama API base URL |
| `think` | `boolean \| undefined` | `undefined` | Force thinking on/off; `undefined` lets the model decide |
| `num_ctx` | `number` | model default | Context window size in tokens |
| `temperature` | `number` | — | Sampling temperature |
| `max_tokens` | `number` | — | Maximum tokens to generate |
| `headers` | `Record<string, string>` | — | Extra HTTP headers |

All built-in providers parse model thinking natively:
- **OpenAI / Groq / DeepSeek / Ollama**: read `delta.reasoning_content` or `delta.reasoning` (stream) and `message.reasoning_content` (non-stream). Use `extra_body` for provider-specific parameters.
- **Claude**: extracts `content_block.type === "thinking"` and `signature_delta` from the Anthropic SSE stream.

Thinking content is emitted as `StreamChunk { role: "thinking" }` to the consumer. The Agent persists `thinking` and `thinking_signature` on the stored `assistant` message for providers that support it (Claude).

## Multi-Provider Setup

Configure automatic failover:

```typescript
import { Agent } from '@arcaelas/agent';

const agent = new Agent({
  description: "High-availability AI assistant",
  providers: [
    openai_provider,      // Primary (fastest)
    groq_provider,        // Backup (fast alternative)
    anthropic_provider    // Fallback (reliable)
  ]
});

// Agent automatically tries providers on failure
const [messages, success] = await agent.call("Hello");
```

## Best Practices

### 1. Handle Errors Gracefully

```typescript
const safe_provider: Provider = async (ctx) => {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    return await openai.chat.completions.create({ /* ... */ });
  } catch (error) {
    console.error("Provider failed:", error);
    throw error;  // Let agent try next provider
  }
};
```

### 2. Use Environment Variables

```typescript
const secure_provider: Provider = async (ctx) => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not configured");
  }
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return await openai.chat.completions.create({ /* ... */ });
};
```

### 3. Log Provider Usage

```typescript
const logged_provider: Provider = async (ctx) => {
  const start = Date.now();
  try {
    const response = await openai_provider(ctx);
    console.log({ provider: "openai", duration_ms: Date.now() - start, tokens: response.usage?.total_tokens });
    return response;
  } catch (error) {
    console.error({ provider: "openai", duration_ms: Date.now() - start, error: (error as Error).message });
    throw error;
  }
};
```

## Related

- **[Agent](agent.md)** - Uses providers for completions
- **[Message](message.md)** - Provider input/output format
- **[Tool](tool.md)** - Providers handle tool calls
- **[Providers Guide](../guides/providers.md)** - Detailed provider setup

---

**Next:** Learn about [Built-in Tools →](built-in-tools.md)
