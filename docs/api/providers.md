# Providers

**Providers** are classes that extend `Function` and act as dual-mode AI provider callables. Each provider instance is itself a function that receives a `Context` and returns either a `ChatCompletionResponse` (non-streaming) or an `AsyncIterable<ProviderChunk>` (streaming).

## Overview

The library ships four built-in providers: **OpenAI**, **Groq**, **DeepSeek**, and **Claude**. All conform to the `Provider` type and can be used interchangeably.

- All providers extend `Function` -- the constructor returns a callable
- Without `{ stream: true }`: returns `ChatCompletionResponse | Promise<ChatCompletionResponse>`
- With `{ stream: true }`: returns `AsyncIterable<ProviderChunk>`
- OpenAI, Groq, and DeepSeek are OpenAI-compatible (same endpoint format)
- Claude automatically transforms between OpenAI and Anthropic message formats

## Provider Type

```typescript
type Provider = {
  (ctx: Context): ChatCompletionResponse | Promise<ChatCompletionResponse>;
  (ctx: Context, opts: { stream: true }): AsyncIterable<ProviderChunk>;
};
```

## ProviderChunk

```typescript
type ProviderChunk =
  | { type: "text_delta"; content: string }
  | { type: "tool_call_delta"; index: number; id?: string; name?: string; arguments_delta?: string }
  | { type: "finish"; finish_reason: string };
```

---

## OpenAI

```typescript
import { OpenAI } from '@arcaelas/agent/providers';
```

### OpenAIProviderOptions

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `api_key` | `string` | Yes | -- | OpenAI API key |
| `base_url` | `string` | No | `"https://api.openai.com/v1"` | Base URL |
| `model` | `string` | Yes | -- | Model name (e.g., `"gpt-4"`) |
| `temperature` | `number` | No | `1.0` | Randomness (0.0 - 2.0) |
| `max_tokens` | `number` | No | -- | Max tokens to generate |
| `headers` | `Record<string, string>` | No | -- | Additional HTTP headers |

### Example

```typescript
const openai = new OpenAI({
  api_key: "sk-...",
  model: "gpt-4",
  temperature: 0.7,
  max_tokens: 2048
});

// Non-streaming
const response = await openai(ctx);
console.log(response.choices[0].message.content);

// Streaming
for await (const chunk of openai(ctx, { stream: true })) {
  if (chunk.type === "text_delta") process.stdout.write(chunk.content);
}
```

---

## Groq

```typescript
import { Groq } from '@arcaelas/agent/providers';
```

OpenAI-compatible provider for Groq's ultra-fast inference with open-source models.

### GroqProviderOptions

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `api_key` | `string` | Yes | -- | Groq API key |
| `base_url` | `string` | No | `"https://api.groq.com/openai/v1"` | Base URL |
| `model` | `string` | Yes | -- | Model name (e.g., `"llama-3.1-70b-versatile"`) |
| `temperature` | `number` | No | `1.0` | Randomness (0.0 - 2.0) |
| `max_tokens` | `number` | No | -- | Max tokens to generate |
| `headers` | `Record<string, string>` | No | -- | Additional HTTP headers |

### Example

```typescript
const groq = new Groq({
  api_key: "gsk_...",
  model: "llama-3.1-70b-versatile"
});

// Non-streaming
const response = await groq(ctx);

// Streaming
for await (const chunk of groq(ctx, { stream: true })) {
  if (chunk.type === "text_delta") process.stdout.write(chunk.content);
}
```

---

## DeepSeek

```typescript
import { DeepSeek } from '@arcaelas/agent/providers';
```

OpenAI-compatible provider specialized in reasoning and code generation.

### DeepSeekProviderOptions

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `api_key` | `string` | Yes | -- | DeepSeek API key |
| `base_url` | `string` | No | `"https://api.deepseek.com/v1"` | Base URL |
| `model` | `string` | Yes | -- | Model name (e.g., `"deepseek-chat"`) |
| `temperature` | `number` | No | `1.0` | Randomness (0.0 - 2.0) |
| `max_tokens` | `number` | No | -- | Max tokens to generate |
| `headers` | `Record<string, string>` | No | -- | Additional HTTP headers |

### Example

```typescript
const deepseek = new DeepSeek({
  api_key: "sk-...",
  model: "deepseek-chat"
});

// Non-streaming
const response = await deepseek(ctx);

// Streaming
for await (const chunk of deepseek(ctx, { stream: true })) {
  if (chunk.type === "text_delta") process.stdout.write(chunk.content);
}
```

---

## Claude

```typescript
import { Claude } from '@arcaelas/agent/providers';
```

Anthropic provider with automatic format transformation. Internally:

- Extracts `system` role messages and rules into Anthropic's `system` parameter
- Converts `tool` messages to `tool_result` content blocks inside `user` messages
- Converts `assistant` messages with `tool_calls` to `tool_use` content blocks
- Converts tool definitions from OpenAI format to Anthropic `input_schema` format
- Non-streaming responses are transformed back to `ChatCompletionResponse` format
- Streaming uses `parse_anthropic_sse` and normalizes events to `ProviderChunk`
- Uses `x-api-key` header instead of `Authorization: Bearer`
- Sends `anthropic-version: 2023-06-01` header

### ClaudeProviderOptions

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `api_key` | `string` | Yes | -- | Anthropic API key |
| `base_url` | `string` | No | `"https://api.anthropic.com/v1"` | Base URL |
| `model` | `string` | Yes | -- | Model name (e.g., `"claude-3-5-sonnet-20241022"`) |
| `temperature` | `number` | No | `1.0` | Randomness (0.0 - 1.0) |
| `max_tokens` | `number` | No | `1024` | Max tokens to generate |
| `headers` | `Record<string, string>` | No | -- | Additional HTTP headers |

### Example

```typescript
const claude = new Claude({
  api_key: "sk-ant-...",
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 4096
});

// Non-streaming -- returns ChatCompletionResponse (OpenAI format)
const response = await claude(ctx);
console.log(response.choices[0].message.content);

// Streaming
for await (const chunk of claude(ctx, { stream: true })) {
  if (chunk.type === "text_delta") process.stdout.write(chunk.content);
  if (chunk.type === "tool_call_delta") {
    // Accumulated tool call data
  }
  if (chunk.type === "finish") {
    // finish_reason mapped: "end_turn" -> "stop", "tool_use" -> "tool_calls", "max_tokens" -> "length"
  }
}
```

### Claude Format Mapping

| Anthropic stop_reason | Mapped finish_reason |
|----------------------|---------------------|
| `"end_turn"` | `"stop"` |
| `"tool_use"` | `"tool_calls"` |
| `"max_tokens"` | `"length"` |

---

## Multi-Provider Setup

Configure automatic failover:

```typescript
import { Agent } from '@arcaelas/agent';
import { OpenAI, Claude, Groq } from '@arcaelas/agent/providers';

const agent = new Agent({
  name: "Resilient_Assistant",
  description: "High-availability AI assistant",
  providers: [
    new OpenAI({ api_key: process.env.OPENAI_API_KEY!, model: "gpt-4" }),
    new Groq({ api_key: process.env.GROQ_API_KEY!, model: "llama-3.1-70b-versatile" }),
    new Claude({ api_key: process.env.ANTHROPIC_API_KEY!, model: "claude-3-5-sonnet-20241022" })
  ]
});

// Agent picks a random provider. On failure, tries others.
const [messages, success] = await agent.call("Hello");
```

## Related

- **[Agent](agent.md)** - Uses providers for completions
- **[Message](message.md)** - Provider input/output format
- **[Tool](tool.md)** - Providers handle tool calls

---

**Next:** Learn about [Built-in Tools ->](built-in-tools.md)
