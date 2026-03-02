# Performance Optimization

Techniques to optimize @arcaelas/agent performance in production.

## Key Optimizations

### 1. Context Reuse

Reuse contexts instead of creating new ones:

```typescript
// ✅ Good: Reuse context
// Note: Context uses the "context" parameter, Agent uses "contexts"
const shared_context = new Context({ metadata: base_metadata });
const agent1 = new Agent({ name: "A1", description: "Agent 1", contexts: shared_context });
const agent2 = new Agent({ name: "A2", description: "Agent 2", contexts: shared_context });

// ❌ Bad: Recreate metadata per agent
const agent1 = new Agent({ name: "A1", description: "Agent 1", metadata: base_metadata });
const agent2 = new Agent({ name: "A2", description: "Agent 2", metadata: base_metadata });
```

### 2. Provider Caching

Cache provider responses when appropriate. Note that `JSON.stringify(ctx.messages)` includes `timestamp` fields that change on every Message instantiation, making it useless as a cache key. Instead, hash only the stable content:

```typescript
import { createHash } from "crypto";

const cache = new Map();

function content_hash(messages: Message[]): string {
  const payload = messages.map(m => `${m.role}:${m.content ?? ""}:${m.tool_call_id ?? ""}`).join("|");
  return createHash("sha256").update(payload).digest("hex");
}

const cached_provider: Provider = async (ctx) => {
  const key = content_hash(ctx.messages);
  if (cache.has(key)) return cache.get(key);

  const response = await openai.chat.completions.create({...});
  cache.set(key, response);
  return response;
};
```

### 3. Minimize Tool Count

Only include necessary tools:

```typescript
// ✅ Good: Specific tools
tools: [weather_tool, news_tool]

// ❌ Bad: Too many tools
tools: [tool1, tool2, tool3, ..., tool20]  // Slows provider calls
```

### 4. Batch Operations

Process multiple requests in parallel:

```typescript
const results = await Promise.all([
  agent.call("Query 1"),
  agent.call("Query 2"),
  agent.call("Query 3")
]);
```

## Monitoring

Track performance metrics:

```typescript
const start = Date.now();
const [messages, success] = await agent.call(prompt);
console.log(`Response time: ${Date.now() - start}ms`);
console.log(`Message count: ${messages.length}`);
console.log(`Tool executions: ${messages.filter(m => m.role === 'tool').length}`);
```

---

**[← Back to Advanced](../index.md#advanced)**
