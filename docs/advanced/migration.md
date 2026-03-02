# Migration Guide

Guide for upgrading between major versions.

## v3.x to v4.x

### Breaking Changes

1. **Context API** - Simplified hierarchy
2. **Message Types** - Now uses discriminated unions with conditional typing
3. **Tool Constructor** - Supports overloads (simple handler or options object)

### New Features in v4

- **`Agent.stream()`** - Async generator for real-time streaming responses
- **Dual-mode providers** - Provider type now supports both non-streaming and streaming overloads
- **StreamChunk / ProviderChunk types** - Typed chunks for streaming consumption
- **SSE parser utilities** - `parse_sse` and `parse_anthropic_sse` for building custom streaming providers

### Migration Steps

#### 1. Update Context Creation

**Before (v3)**:
```typescript
const ctx = new Context();
ctx.setMetadata("key", "value");
```

**After (v4)**:
```typescript
const ctx = new Context({
  metadata: new Metadata().set("key", "value")
});
```

#### 2. Update Message Creation

**Before (v3)**:
```typescript
const msg = { role: "user", content: "Hello" };
```

**After (v4)**:
```typescript
const msg = new Message({ role: "user", content: "Hello" });
```

MessageOptions is a discriminated union:
- `{ role: "user"; content: string }`
- `{ role: "assistant"; content: string | null; tool_calls?: ToolCall[] }`
- `{ role: "system"; content: string }`
- `{ role: "tool"; content: string; tool_call_id: string }`

#### 3. Update Tool Creation

No changes required - v4 is backward compatible with v3 tools.

#### 4. Adopt Streaming (Optional)

If you used custom polling or partial response logic, you can now use the built-in `stream()` method:

```typescript
// New: streaming support
for await (const chunk of agent.stream("Hello")) {
  if (chunk.role === "assistant") process.stdout.write(chunk.content);
  if (chunk.role === "tool") console.log(`[${chunk.name}]: ${chunk.content}`);
}
```

Providers can now implement a second overload for streaming:

```typescript
const my_provider: Provider = Object.assign(
  async (ctx: Context) => { /* return ChatCompletionResponse */ },
  { [Symbol.for("stream")]: async function*(ctx: Context, opts: { stream: true }) { /* yield ProviderChunk */ } }
) as Provider;
```

## Version History

- **v4.x** - Current, simplified API with streaming support
- **v3.x** - Previous stable
- **v2.x** - Legacy (deprecated)
- **v1.x** - Original (deprecated)

---

**[<- Back to Advanced](../index.md#advanced)**
