# Providers

@arcaelas/agent ships five built-in providers. All are imported directly from the
package — no external SDKs required. Each provider uses the native `fetch` API
internally.

```typescript
import { OpenAI, Groq, DeepSeek, Claude, Ollama } from '@arcaelas/agent';
```

---

## OpenAI

Targets `https://api.openai.com/v1` by default. Compatible with any
OpenAI-compatible endpoint via `base_url`.

**Options** (`OpenAIProviderOptions`):

| Option | Type | Required | Description |
|---|---|---|---|
| `api_key` | `string` | ✅ | Bearer token for authentication |
| `model` | `string` | ✅ | Model ID (e.g. `"gpt-4o-mini"`) |
| `base_url` | `string` | — | Override endpoint (default: `https://api.openai.com/v1`) |
| `temperature` | `number` | — | Sampling temperature 0.0–2.0 |
| `max_tokens` | `number` | — | Max tokens to generate |
| `headers` | `Record<string,string>` | — | Extra HTTP headers |
| `extra_body` | `Record<string,unknown>` | — | Extra body fields (merged as-is) |

```typescript
import 'dotenv/config';
import { Agent, OpenAI } from '@arcaelas/agent';

const provider = new OpenAI({
  api_key: process.env.OPENAI_API_KEY!,
  model: "gpt-4o-mini",
  temperature: 0.7,
  max_tokens: 1024,
});

const agent = new Agent({ providers: [provider] });

const [messages, success] = await agent.call("Hello!");
if (success) console.log(messages.at(-1)?.content);
```

---

## Groq

Identical to OpenAI but defaults to `https://api.groq.com/openai/v1`. Offers
ultra-fast inference with open-source models (Llama, Mixtral, Gemma).

**Options** (`GroqProviderOptions`): same as `OpenAIProviderOptions` except
`base_url` defaults to Groq's endpoint.

```typescript
import 'dotenv/config';
import { Agent, Groq } from '@arcaelas/agent';

const provider = new Groq({
  api_key: process.env.GROQ_API_KEY!,
  model: "llama-3.1-70b-versatile",
  temperature: 0.5,
});

const agent = new Agent({ providers: [provider] });

const [messages, success] = await agent.call("What is 2 + 2?");
```

---

## DeepSeek

Identical to OpenAI but defaults to `https://api.deepseek.com/v1`. Specialises
in reasoning and code. Reasoning tokens are exposed as `thinking_delta` chunks
in stream mode.

**Options** (`DeepSeekProviderOptions`): same as `OpenAIProviderOptions` except
`base_url` defaults to DeepSeek's endpoint.

```typescript
import 'dotenv/config';
import { Agent, DeepSeek } from '@arcaelas/agent';

const provider = new DeepSeek({
  api_key: process.env.DEEPSEEK_API_KEY!,
  model: "deepseek-reasoner",
});

const agent = new Agent({ providers: [provider] });

// Streaming — inspect reasoning tokens
for await (const chunk of agent.stream("Solve: x² - 5x + 6 = 0")) {
  if (chunk.role === "thinking")  process.stdout.write(`[think] ${chunk.content}`);
  if (chunk.role === "assistant") process.stdout.write(chunk.content);
}
```

---

## Claude (Anthropic)

Targets `https://api.anthropic.com/v1/messages` by default. Translates
messages and tools between the library's neutral format and Anthropic's native
wire format automatically.

**Options** (`ClaudeProviderOptions`):

| Option | Type | Required | Description |
|---|---|---|---|
| `model` | `string` | ✅ | Claude model ID (e.g. `"claude-sonnet-4-5"`) |
| `api_key` | `string` | — | Bearer token. Optional when auth is handled via `headers` |
| `base_url` | `string` | — | Full messages endpoint URL (default: `https://api.anthropic.com/v1/messages`) |
| `temperature` | `number` | — | Sampling temperature 0.0–1.0 |
| `max_tokens` | `number` | — | Max tokens (default: `1024`) |
| `headers` | `Record<string,string>` | — | Extra HTTP headers (merged, overrides defaults) |
| `body` | `Record<string,unknown>` | — | Extra body fields (e.g. extended thinking config) |

```typescript
import 'dotenv/config';
import { Agent, Claude } from '@arcaelas/agent';

// Standard API key
const provider = new Claude({
  api_key: process.env.ANTHROPIC_API_KEY!,
  model: "claude-sonnet-4-5",
  max_tokens: 2048,
});

const agent = new Agent({ providers: [provider] });

const [messages, success] = await agent.call("Explain recursion briefly.");
```

### Extended Thinking

Pass `body` to enable Claude's extended thinking mode:

```typescript
const thinker = new Claude({
  api_key: process.env.ANTHROPIC_API_KEY!,
  model: "claude-sonnet-4-5",
  body: { thinking: { type: "enabled", budget_tokens: 8000 } },
});
```

### Claude Code OAuth

When using the Claude Code OAuth flow, set `base_url` to the beta endpoint and
pass the OAuth access token as `api_key` (or supply it via a custom
`Authorization` header). No separate SDK is needed:

```typescript
const oauth_provider = new Claude({
  base_url: "https://api.anthropic.com/v1/messages?beta=true",
  api_key: process.env.CLAUDE_OAUTH_TOKEN,   // OAuth access token
  headers: { "anthropic-beta": "oauth-2025-04-20,claude-code-20250219" },
  model: "claude-sonnet-4-5",
});

const agent = new Agent({ providers: [oauth_provider] });
```

---

## Ollama

Runs open-source models locally via Ollama's OpenAI-compatible endpoint
(`http://localhost:11434/v1`). No `api_key` is required.

**Options** (`OllamaProviderOptions`):

| Option | Type | Required | Description |
|---|---|---|---|
| `model` | `string` | ✅ | Local model name (e.g. `"qwen3:8b"`) |
| `base_url` | `string` | — | Ollama endpoint (default: `http://localhost:11434/v1`) |
| `think` | `boolean` | — | `true` = enable thinking mode; `false` = disable; omit = model decides |
| `num_ctx` | `number` | — | Context window size in tokens (overrides model default) |
| `temperature` | `number` | — | Sampling temperature |
| `max_tokens` | `number` | — | Max tokens to generate |
| `headers` | `Record<string,string>` | — | Extra HTTP headers |
| `extra_body` | `Record<string,unknown>` | — | Extra body fields |

```typescript
import { Agent, Ollama } from '@arcaelas/agent';

// Fast classifier — thinking disabled
const fast = new Ollama({ model: "qwen3:8b", think: false });

// Deep reasoner — thinking enabled, larger context
const reasoner = new Ollama({
  model: "qwen3:8b",
  think: true,
  num_ctx: 16384,
});

// Remote Ollama instance
const remote = new Ollama({
  model: "llama3.2:3b",
  base_url: "http://192.168.1.10:11434/v1",
});

const agent = new Agent({ providers: [fast] });
const [messages, success] = await agent.call("Classify this text as positive or negative: 'Great product!'");
```

---

## Multi-Provider Failover

Pass multiple providers to get automatic failover. The agent selects one at
random and falls back to the others on error:

```typescript
import 'dotenv/config';
import { Agent, OpenAI, Claude, Groq } from '@arcaelas/agent';

const agent = new Agent({
  providers: [
    new OpenAI({ api_key: process.env.OPENAI_API_KEY!, model: "gpt-4o-mini" }),   // Primary
    new Claude({ api_key: process.env.ANTHROPIC_API_KEY!, model: "claude-haiku-3-5" }), // Backup
    new Groq({  api_key: process.env.GROQ_API_KEY!,     model: "llama-3.1-8b-instant" }), // Fallback
  ],
});

const [messages, success] = await agent.call("Hello!");
```

If a provider throws, it is moved to the fallback pool and another is tried
until one succeeds or all are exhausted.

---

## Streaming

Every built-in provider supports streaming via `agent.stream()`:

```typescript
for await (const chunk of agent.stream("Tell me a story")) {
  if (chunk.role === "thinking")  process.stdout.write(`[think] ${chunk.content}`);
  if (chunk.role === "assistant") process.stdout.write(chunk.content);
  if (chunk.role === "tool")      console.log(`\n[${chunk.name}]: ${chunk.content}`);
}
```

`StreamChunk` roles: `"assistant"` · `"thinking"` · `"tool_call"` · `"tool"`.

---

**[← Back to Guides](../index.md#guides)**
