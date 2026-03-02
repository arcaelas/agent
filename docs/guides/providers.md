# Providers

Providers are the bridge between your agent and AI services. Every provider in @arcaelas/agent implements the same dual-mode interface, making them interchangeable.

## The Provider Type

A Provider is a callable that supports two invocation signatures:

```typescript
type Provider = {
  // Non-streaming: returns full response
  (ctx: Context): ChatCompletionResponse | Promise<ChatCompletionResponse>;
  // Streaming: returns async iterable of chunks
  (ctx: Context, opts: { stream: true }): AsyncIterable<ProviderChunk>;
};
```

All built-in providers extend `Function` and return this callable from their constructor. You pass the `Context` directly -- the provider reads `ctx.messages`, `ctx.tools`, and `ctx.rules` internally.

## Built-in Providers

### OpenAI

Compatible with any OpenAI-compatible API. Uses `Authorization: Bearer` authentication.

```typescript
import { OpenAI } from '@arcaelas/agent';

const openai = new OpenAI({
  api_key: process.env.OPENAI_API_KEY!,
  model: "gpt-4",
  temperature: 0.7,       // optional, default: 1.0
  max_tokens: 2000,       // optional
  base_url: "https://api.openai.com/v1",  // optional, this is the default
  headers: {}             // optional extra headers
});
```

**Base URL:** `https://api.openai.com/v1`
**Endpoint:** `/chat/completions`
**Auth header:** `Authorization: Bearer <api_key>`

### Groq

OpenAI-compatible API with ultra-fast inference. Same internal structure as OpenAI provider.

```typescript
import { Groq } from '@arcaelas/agent';

const groq = new Groq({
  api_key: process.env.GROQ_API_KEY!,
  model: "llama-3.1-70b-versatile",
  temperature: 0.5,
  max_tokens: 8000
});
```

**Base URL:** `https://api.groq.com/openai/v1`
**Endpoint:** `/chat/completions`
**Auth header:** `Authorization: Bearer <api_key>`

### DeepSeek

OpenAI-compatible API specialized in reasoning and code generation.

```typescript
import { DeepSeek } from '@arcaelas/agent';

const deepseek = new DeepSeek({
  api_key: process.env.DEEPSEEK_API_KEY!,
  model: "deepseek-chat",
  temperature: 0.3,
  max_tokens: 4000
});
```

**Base URL:** `https://api.deepseek.com/v1`
**Endpoint:** `/chat/completions`
**Auth header:** `Authorization: Bearer <api_key>`

### Claude

Anthropic's API with automatic format transformation. This provider handles the differences between OpenAI and Anthropic message formats transparently.

```typescript
import { Claude } from '@arcaelas/agent';

const claude = new Claude({
  api_key: process.env.ANTHROPIC_API_KEY!,
  model: "claude-3-5-sonnet-20241022",
  temperature: 0.7,       // range: 0.0 to 1.0
  max_tokens: 4096        // default: 1024 if not set
});
```

**Base URL:** `https://api.anthropic.com/v1`
**Endpoint:** `/messages`
**Auth header:** `x-api-key: <api_key>` + `anthropic-version: 2023-06-01`

#### Claude Format Transformation

The Claude provider transforms messages and responses automatically:

**Messages (OpenAI -> Anthropic):**
- `system` messages are extracted and merged into a single `system` prompt parameter
- Rules are prepended to the system prompt
- `tool` messages are converted to `{ role: "user", content: [{ type: "tool_result", tool_use_id, content }] }`
- `assistant` messages with `tool_calls` are converted to content blocks with `tool_use` entries
- Other messages pass through as-is

**Tools (OpenAI -> Anthropic):**
- `tool.toJSON()` output is transformed to Anthropic's `{ name, description, input_schema }` format
- All parameter keys become required in the schema

**Response (Anthropic -> OpenAI):**
- `text` blocks are joined into `content`
- `tool_use` blocks become `tool_calls` with OpenAI structure
- `stop_reason` is mapped: `end_turn` -> `stop`, `tool_use` -> `tool_calls`, `max_tokens` -> `length`
- Usage tokens are mapped: `input_tokens` -> `prompt_tokens`, `output_tokens` -> `completion_tokens`

**Streaming (Anthropic -> ProviderChunk):**
- `content_block_start` with `tool_use` yields `tool_call_delta` with id and name
- `content_block_delta` with `text_delta` yields `text_delta` chunks
- `content_block_delta` with `input_json_delta` yields `tool_call_delta` with argument fragments
- `message_delta` with `stop_reason` yields `finish` chunk

## Failover Mechanism

When you provide multiple providers, the agent handles failures with this strategy:

1. **Random selection** from the primary pool
2. On failure, the provider is **removed from primary** and added to a **fallback pool**
3. When the primary pool is empty, providers are selected randomly from the fallback pool
4. If a fallback provider also fails, it is removed entirely
5. The loop continues until a provider succeeds or all providers are exhausted

```typescript
const agent = new Agent({
  name: "Resilient_Agent",
  description: "Agent with automatic failover",
  providers: [
    new OpenAI({ api_key: "...", model: "gpt-4" }),
    new Groq({ api_key: "...", model: "llama-3.1-70b-versatile" }),
    new Claude({ api_key: "...", model: "claude-3-5-sonnet-20241022", max_tokens: 4096 }),
    new DeepSeek({ api_key: "...", model: "deepseek-chat" })
  ]
});

// If OpenAI fails -> tries another random provider
// If all primary fail -> retries from fallback pool
// If all fail -> call() returns [messages, false], stream() ends
```

This applies to both `call()` and `stream()`. The selection is not sequential -- it is random within each pool.

## Streaming Usage

All providers support streaming via the second argument `{ stream: true }`. The agent's `stream()` method uses this internally:

```typescript
const agent = new Agent({
  name: "Stream_Agent",
  description: "Streaming agent",
  tools: [search_tool],
  providers: [
    new OpenAI({ api_key: "...", model: "gpt-4" })
  ]
});

for await (const chunk of agent.stream("Search for Node.js best practices")) {
  if (chunk.role === "assistant") {
    // Text delta from the model
    process.stdout.write(chunk.content);
  }
  if (chunk.role === "tool") {
    // Tool execution result
    console.log(`\n[${chunk.name}]: ${chunk.content}`);
  }
}
```

The streaming loop handles tool calls internally -- it accumulates tool call deltas, executes tools in parallel, and re-invokes the provider automatically.

## Custom Providers

You can write your own provider as a function that matches the Provider type:

```typescript
import type { Provider, ChatCompletionResponse, ProviderChunk } from '@arcaelas/agent';

const custom_provider: Provider = ((ctx, opts?) => {
  if (opts?.stream) {
    return (async function* () {
      yield { type: "text_delta", content: "Hello from custom provider" };
      yield { type: "finish", finish_reason: "stop" };
    })();
  }

  return Promise.resolve({
    id: "custom-1",
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: "custom",
    choices: [{
      index: 0,
      message: { role: "assistant", content: "Hello from custom provider" },
      finish_reason: "stop"
    }]
  });
}) as Provider;
```

The only requirement is that the non-streaming mode returns a `ChatCompletionResponse` and the streaming mode returns an `AsyncIterable<ProviderChunk>`.

## Provider Options Summary

| Option | OpenAI | Groq | DeepSeek | Claude |
|--------|--------|------|----------|--------|
| `api_key` | required | required | required | required |
| `model` | required | required | required | required |
| `base_url` | optional | optional | optional | optional |
| `temperature` | 0.0-2.0 | 0.0-2.0 | 0.0-2.0 | 0.0-1.0 |
| `max_tokens` | optional | optional | optional | default: 1024 |
| `headers` | optional | optional | optional | optional |
