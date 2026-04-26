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
  | { type: "text_delta"; content: string }
  | { type: "thinking_delta"; content: string }
  | { type: "tool_call_delta"; index: number; id?: string; name?: string; arguments_delta?: string }
  | { type: "finish"; finish_reason: string };
```

The `thinking_delta` chunk carries model reasoning content (e.g. from Claude extended thinking or DeepSeek R1's `reasoning_content`). The agent emits these as `StreamChunk { role: "thinking" }` to the consumer but **does not** persist thinking in `messages` or re-inject it to the model.

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

## Provider Examples

> All provider examples receive a `Context` instance (`ctx`), not the `Agent`. Use `ctx.messages`, `ctx.tools`, etc.

### OpenAI Provider

```typescript
import OpenAI from 'openai';
import type { Provider } from '@arcaelas/agent';

const openai_provider: Provider = async (ctx) => {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  return await openai.chat.completions.create({
    model: "gpt-4o",
    messages: ctx.messages.map(m => ({
      role: m.role,
      content: m.content,
      ...(m.tool_call_id && { tool_call_id: m.tool_call_id }),
      ...(m.tool_calls && { tool_calls: m.tool_calls }),
    })),
    tools: ctx.tools.length
      ? ctx.tools.map(tool => tool.toJSON())
      : undefined,
  });
};
```

### Anthropic Provider (manual adapter)

The library ships a built-in `Claude` provider class. For a manual adapter example:

```typescript
import Anthropic from '@anthropic-ai/sdk';
import type { Provider } from '@arcaelas/agent';

const anthropic_provider: Provider = async (ctx) => {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await anthropic.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 4096,
    system: ctx.rules.map(r => r.description).join("\n") || undefined,
    messages: ctx.messages
      .filter(m => m.role !== "system")
      .map(m => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content ?? "",
      })),
    tools: ctx.tools.length
      ? ctx.tools.map(t => t.toJSON().function)
      : undefined,
  });

  return {
    id: response.id,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: response.model,
    choices: [{
      index: 0,
      message: {
        role: "assistant",
        content: response.content.find(b => b.type === "text")?.text ?? null,
        reasoning_content: response.content.find(b => b.type === "thinking")?.thinking,
      },
      finish_reason: response.stop_reason === "end_turn" ? "stop" : response.stop_reason,
    }],
    usage: {
      prompt_tokens: response.usage.input_tokens,
      completion_tokens: response.usage.output_tokens,
      total_tokens: response.usage.input_tokens + response.usage.output_tokens,
    },
  };
};
```

### Built-in Provider Classes

The library exports ready-to-use callable provider classes: `OpenAI`, `Groq`, `DeepSeek`, `Claude`, `ClaudeCode`. Each extends `Function` and is invocable as a provider:

```typescript
import { Claude, OpenAI as OpenAIProvider } from '@arcaelas/agent';

const claude = new Claude({ apiKey: process.env.ANTHROPIC_API_KEY, model: "claude-opus-4-5" });
const openai = new OpenAIProvider({ apiKey: process.env.OPENAI_API_KEY, model: "gpt-4o" });

const agent = new Agent({
  description: "Multi-provider assistant",
  providers: [openai, claude],
});
```

All built-in providers parse model thinking natively:
- **OpenAI / Groq / DeepSeek**: read `delta.reasoning_content` (stream) or `message.reasoning_content` (non-stream).
- **Claude**: extract `content_block.type === "thinking"` blocks.
- **ClaudeCode**: extract thinking deltas from the Anthropic SDK.

Thinking content is emitted as `StreamChunk { role: "thinking" }` but is **not** persisted in the thread or re-sent to the model.

> **Note for Claude (extended thinking):** Anthropic only emits `thinking` blocks when the request explicitly enables it via `thinking: { type: "enabled", budget_tokens: <n> }`. The built-in `Claude` provider passes through whatever you set in its `headers`/options; if you need extended thinking, configure your provider call accordingly. Without that flag the model returns no thinking content.

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
