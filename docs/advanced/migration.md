# Migration Guide

Guide for upgrading between versions.

## Migrating to v2.x

v2 introduces multimodal messages, extended thinking, the `Ollama` provider, a reworked `Claude` provider, and tool lifecycle hooks. Most code keeps working — the breaking changes are scoped.

### Renamed (breaking): `AgentOptions` → `IAgent`

The Agent options interface was renamed. Only type imports are affected; the runtime shape is the same (minus `name`/`description`, see below).

**Before** (v1.x):
```typescript
import type { AgentOptions } from '@arcaelas/agent';
const opts: AgentOptions = { providers: [...] };
```

**After** (v2.x):
```typescript
import type { IAgent } from '@arcaelas/agent';
const opts: IAgent = { providers: [...] };
```

### Removed (breaking): `Agent` `name` and `description` options

`Agent` no longer accepts `name` or `description`. Behavior that used `description` should be passed as a `Rule`.

**Before** (v1.x):
```typescript
const agent = new Agent({ name: "Bot", description: "Helpful assistant", providers: [...] });
```

**After** (v2.x):
```typescript
import { Agent, Rule } from '@arcaelas/agent';
const agent = new Agent({ rules: [new Rule("You are a helpful assistant.")], providers: [...] });
```

### New: tool lifecycle hooks (`PreFunc` / `PostFunc`)

`IAgent.hooks` lets you run logic around every tool execution, in both `call()` and `stream()`. Each array is a chainable pipe.

```typescript
const agent = new Agent({
  providers: [provider],
  tools: [search_tool],
  hooks: {
    // Runs before the tool. ctx and tool are mutable instances.
    PreFunc: [(ctx, tool, params) => {
      console.log(`Calling ${tool.name} with`, params);
    }],
    // Runs after the tool. Its return value replaces the response downstream.
    PostFunc: [(ctx, tool, params, response) => {
      return typeof response === "string" ? response.trim() : response;
    }],
  },
});
```

### Removed (breaking): `ClaudeCode` provider

The `ClaudeCode` provider and `ClaudeCodeOptions` were removed. The standard `Claude` provider now covers the Claude Code OAuth flow through its configurable `base_url`, `api_key`, and `headers`.

**Before** (v1.x):
```typescript
import { ClaudeCode } from '@arcaelas/agent';
const provider = new ClaudeCode({ model: "sonnet", think: "none", dirname: "/path/to/profile" });
```

**After** (v2.x) — classic API key:
```typescript
import { Claude } from '@arcaelas/agent';
const provider = new Claude({ api_key: "sk-ant-...", model: "claude-sonnet-4-5" });
```

**After** (v2.x) — Claude Code OAuth:
```typescript
const provider = new Claude({
  base_url: "https://api.anthropic.com/v1/messages?beta=true",
  api_key: oauth_access_token,                                  // OAuth token
  headers: { "anthropic-beta": "oauth-2025-04-20,claude-code-20250219" },
  model: "claude-sonnet-4-5",
});
```

### Changed (breaking): `Claude` provider options

- `base_url` is now the **full endpoint URL** (it is no longer suffixed with `/messages`). Default: `https://api.anthropic.com/v1/messages`.
- `api_key` is now **optional** and sent as `Authorization: Bearer <api_key>`. Omit it when auth is handled entirely via `headers`.
- Use **`body`** (not `extra_body`) to extend the request payload. Extended thinking goes here:

```typescript
const thinker = new Claude({
  api_key: "sk-ant-...",
  model: "claude-sonnet-4-5",
  body: { thinking: { type: "enabled", budget_tokens: 8000 } },
});
```

> Note: `OpenAI` (and its subclasses `Groq`, `DeepSeek`, `Ollama`) use `extra_body`; only `Claude` uses `body`.

### Changed (breaking): `Message.content` is multimodal

`content` widened from `string` to `string | ContentBlock[]`. Plain strings are fully backward-compatible. Multimodal content uses neutral blocks each provider translates:

```typescript
new Message({
  role: "user",
  content: [
    { type: "text", text: "What's in this image?" },
    { type: "image", source: { type: "base64", media_type: "image/png", data: "iVBOR..." } },
  ],
});
```

If your code reads `m.content` assuming it is always a string, guard it:
```typescript
const text = typeof m.content === "string" ? m.content : "";
```

### New: `Ollama` provider (local models)

```typescript
import { Ollama } from '@arcaelas/agent';
const classifier = new Ollama({ model: "qwen3:8b", think: false });   // fast
const auditor    = new Ollama({ model: "qwen3:8b", think: true });    // reasoning
```

### New: Extended thinking on `Message`

`assistant` messages may carry `thinking` and `thinking_signature`. The Agent persists them and reinjects the signature on the next turn so Anthropic accepts multi-turn thinking automatically. No action required — it works out of the box when the model emits thinking.

## Migrating to v1.8.x

### Removed: `Context.appendMessages()` and `Context.spliceAt()`

**Before**:
```typescript
ctx.appendMessages(new Message({ role: "user", content: "Hello" }));
```

**After** — use the idempotent setter:
```typescript
ctx.messages = ctx.messages.concat(new Message({ role: "user", content: "Hello" }));
```

The setter filters inherited messages by reference equality, so this pattern is safe.

### Changed: `AgentOptions.name` and `AgentOptions.description`

`name` and `description` are now **deprecated**. They are declared as `readonly` but remain `undefined` at runtime — they are never assigned internally. `description` is converted into a `Rule` added to the agent's internal Context.

**Before** (relied on `agent.name` / `agent.description` at runtime):
```typescript
const agent = new Agent({ name: "Bot", description: "Helpful assistant" });
console.log(agent.name);        // ❌ Was "Bot", now undefined
console.log(agent.description); // ❌ Was "Helpful assistant", now undefined
```

**After** — store name/description externally if needed:
```typescript
const AGENT_NAME = "Bot";
const agent = new Agent({ description: "Helpful assistant" });
// description is injected as a Rule; agent.description is undefined
```

### New: `branches` pipeline

```typescript
const agent = new Agent({
  description: "Final answer agent",
  branches: [
    "Reason step by step before answering.",
    new Agent({ description: "Verify the above reasoning.", providers: [verifier] }),
  ],
  providers: [main_provider],
});
```

### New: `stream()` method

```typescript
for await (const chunk of agent.stream("Hello")) {
  if (chunk.role === "assistant") process.stdout.write(chunk.content);
  if (chunk.role === "thinking") console.log("[thinking]", chunk.content);
  if (chunk.role === "tool_call") console.log("[call]", chunk.name);
  if (chunk.role === "tool") console.log("[result]", chunk.content);
}
```

### New: Plain objects in Context constructor

```typescript
// All equivalent — Context now auto-converts plain objects
const ctx = new Context({
  metadata: { app: "MyApp" },                     // Record<string,string>
  rules: ["Be concise", "Be helpful"],            // string[]
  messages: [{ role: "user", content: "Hi" }],   // MessageOptions[]
});
```

### New: Built-in tools

```typescript
import { AgentTool, AskTool, ChoiceTool, SleepTool, TimeTool, RemoteTool } from '@arcaelas/agent';
```

## Version History

- **v2.3.x** - Current: tool lifecycle hooks (`PreFunc`/`PostFunc`); `AgentOptions` renamed to `IAgent`; removed `Agent` `name`/`description`
- **v2.1.x** - `Ollama` provider, multimodal `Message.content`, extended thinking with signature, reworked `Claude` provider; removed `ClaudeCode`
- **v2.0.x** - `Message.content` widened to `string | ContentBlock[]`
- **v1.8.x** - branches, stream(), built-in tools, thinking support
- **v1.7.x** - Built-in provider classes
- **v1.0.x** - Initial stable release
- **v0.x** - Pre-release

---

**[← Back to Advanced](../index.md#advanced)**
