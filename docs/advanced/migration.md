# Migration Guide

Guide for upgrading between versions.

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

- **v1.8.x** - Current: branches, stream(), new built-in tools, thinking support
- **v1.7.x** - Built-in provider classes
- **v1.0.x** - Initial stable release
- **v0.x** - Pre-release

---

**[← Back to Advanced](../index.md#advanced)**
