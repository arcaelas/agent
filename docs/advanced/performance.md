# Performance Optimization

Techniques to optimize @arcaelas/agent performance in production.

## Key Optimizations

### 1. Context Reuse

Reuse contexts instead of creating new ones:

```typescript
// ✅ Good: Reuse context
const shared_context = new Context({ metadata: base_metadata });
const agent1 = new Agent({ name: "A1", contexts: shared_context });
const agent2 = new Agent({ name: "A2", contexts: shared_context });

// ❌ Bad: Recreate context
const agent1 = new Agent({ name: "A1", metadata: base_metadata });
const agent2 = new Agent({ name: "A2", metadata: base_metadata });
```

### 2. Provider Caching

Cache provider responses when appropriate:

```typescript
const cache = new Map();

const cached_provider: Provider = async (ctx) => {
  const key = JSON.stringify(ctx.messages);
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
