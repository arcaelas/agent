# Best Practices

Production patterns and recommendations for @arcaelas/agent.

## Resilience Patterns

### Provider Failover

Always configure multiple providers. Selection is random, not sequential -- if one fails, it moves to a fallback pool:

```typescript
import { Agent, OpenAI, Claude, Groq } from '@arcaelas/agent';

const agent = new Agent({
  name: "Production_Agent",
  description: "High-availability agent",
  providers: [
    new OpenAI({ api_key: process.env.OPENAI_API_KEY!, model: "gpt-4" }),
    new Groq({ api_key: process.env.GROQ_API_KEY!, model: "llama-3.1-70b-versatile" }),
    new Claude({ api_key: process.env.ANTHROPIC_API_KEY!, model: "claude-3-5-sonnet-20241022", max_tokens: 4096 })
  ]
});
```

Check the success flag from `call()`:

```typescript
const [messages, success] = await agent.call("Hello");
if (!success) {
  // All providers failed -- handle gracefully
  console.error("All providers exhausted");
}
```

### MAX_LOOPS Limit

Both `call()` and `stream()` enforce a `MAX_LOOPS = 10` limit. This prevents infinite tool-calling loops. If your agent regularly hits this limit, consider:

- Reducing tool count so the model converges faster
- Adding rules that instruct the model to summarize after N tool uses
- Splitting complex workflows across multiple `call()` invocations

## Tool Execution

### Parallel Execution

All tool calls within a single model response are executed in parallel with `Promise.all`:

```typescript
// If the model calls 3 tools at once, they all run simultaneously
const search_tool = new Tool("search", {
  description: "Search documents",
  parameters: { query: "Search query" },
  func: async (agent, { query }) => {
    return await db.search(query);
  }
});
```

This means tools should be independent and not rely on execution order within the same batch.

### Error Handling Per Tool

Each tool execution is wrapped in try/catch individually. A failing tool returns its error message as content while other tools continue normally:

```typescript
const risky_tool = new Tool("fetch_data", {
  description: "Fetch data from external API",
  parameters: { url: "API endpoint" },
  func: async (agent, { url }) => {
    // If this throws, the error message becomes the tool result
    // Other tools in the same batch are unaffected
    const res = await fetch(url);
    return await res.json();
  }
});
```

The model then sees the error message and can decide how to proceed.

### Safe Serialization

Tool results go through safe serialization before being sent back to the model:

- `undefined` -> `"undefined"`
- Functions -> `"[Function]"`
- BigInts -> string representation (e.g., `"123456789"`)
- Circular references -> falls back to `String(result)`
- Everything else -> `JSON.stringify(result)`

You don't need to manually stringify your tool results -- the agent handles it. But returning pre-formatted strings or JSON is recommended for clarity.

### Tool toJSON for Providers

`tool.toJSON()` generates the OpenAI-compatible function calling schema. The built-in providers use this automatically:

```typescript
const tool = new Tool("calculate", {
  description: "Perform arithmetic",
  parameters: {
    operation: "Operation (+, -, *, /)",
    a: "First number",
    b: "Second number"
  },
  func: (agent, params) => eval(`${params.a} ${params.operation} ${params.b}`)
});

// All parameter values become { type: "string", description: "..." }
console.log(JSON.stringify(tool));
```

## Context Inheritance

### Hierarchical Contexts

Organize contexts by scope -- from broad to specific:

```typescript
import { Context, Metadata, Rule, Tool } from '@arcaelas/agent';

// Level 1: Organization-wide
const org_context = new Context({
  metadata: new Metadata().set("org", "Acme Corp"),
  rules: [new Rule("Protect confidential information")]
});

// Level 2: Department
const support_context = new Context({
  context: org_context,
  metadata: new Metadata().set("dept", "Support"),
  tools: [kb_tool, ticket_tool]
});

// Level 3: Team
const tier2_context = new Context({
  context: support_context,
  metadata: new Metadata().set("tier", "2"),
  tools: [escalation_tool]
});
```

The agent at tier 2 inherits metadata, rules, and tools from all parent contexts. Rules and messages are concatenated (parent first). Tools are deduplicated by name.

### Tool Deduplication

When a child context defines a tool with the same name as a parent tool, the child version wins:

```typescript
const parent = new Context({
  tools: [new Tool("search", (agent, input) => "basic search")]
});

const child = new Context({
  context: parent,
  tools: [new Tool("search", (agent, input) => "enhanced search")]
});

// child.tools has 1 tool: the enhanced version
```

Internally, tools are reduced into an object keyed by name (`{ ...acc, [tool.name]: tool }`), so the last one (child) overrides the first (parent).

### Rule and Message Combination

Rules and messages from parent contexts come first, then local ones:

```typescript
const parent = new Context({
  rules: [new Rule("Rule A")],
  messages: [new Message({ role: "system", content: "System message" })]
});

const child = new Context({
  context: parent,
  rules: [new Rule("Rule B")],
  messages: [new Message({ role: "user", content: "Hello" })]
});

// child.rules = [Rule A, Rule B]
// child.messages = [System message, Hello]
```

## Metadata Hierarchies

### Multiple Inheritance

Metadata supports multiple parents via the spread constructor. Later parents take precedence:

```typescript
import { Metadata } from '@arcaelas/agent';

const defaults = new Metadata();
defaults.set("timeout", "5000");
defaults.set("retries", "3");

const env_config = new Metadata();
env_config.set("timeout", "10000");

// env_config overrides defaults for "timeout"
const config = new Metadata(defaults, env_config);
console.log(config.get("timeout", "0")); // "10000"
console.log(config.get("retries", "0")); // "3"
```

### Null for Deletion

Setting a value to `null` marks it as deleted locally, hiding the parent value:

```typescript
const parent = new Metadata();
parent.set("feature_x", "enabled");

const child = new Metadata(parent);
child.set("feature_x", null);

console.log(child.has("feature_x")); // false
console.log(child.get("feature_x", "default")); // null (not "default")
console.log(parent.has("feature_x")); // true (parent unaffected)
```

### Precedence Order

When reading a key, Metadata checks in this order:
1. Local data (highest priority)
2. Broker nodes (parents) in order they were added
3. Fallback value from `get(key, fallback)`

`toJSON()` / `all()` merges everything, excludes nulls, and returns a flat `Record<string, string>`.

## Streaming Best Practices

### Consuming Chunks

`agent.stream()` yields two types of chunks:

```typescript
for await (const chunk of agent.stream("query")) {
  if (chunk.role === "assistant") {
    // Text delta -- write incrementally
    process.stdout.write(chunk.content);
  }
  if (chunk.role === "tool") {
    // Tool result -- contains name, tool_call_id, and content
    console.log(`[${chunk.name}]: ${chunk.content}`);
  }
}
```

### Handling Tool Results in Stream

Tool results appear as `{ role: "tool" }` chunks between assistant text chunks. The stream handles re-invocation automatically -- after tool results, the provider is called again and more assistant chunks follow:

```
assistant: "Let me search for that..."  (text deltas)
tool: [search] "Results: ..."           (tool execution)
assistant: "Based on the results..."    (new provider call, text deltas)
```

### Stream Input Types

`stream()` accepts three input formats:

```typescript
// String (converted to user message)
agent.stream("Hello")

// Message instance
agent.stream(new Message({ role: "user", content: "Hello" }))

// Plain object
agent.stream({ role: "user", content: "Hello" })
```

### Stream vs Call

Use `stream()` when you need real-time output (chat UIs, CLI tools). Use `call()` when you need the full response at once (background processing, batch operations):

```typescript
// Real-time UI
for await (const chunk of agent.stream(input)) {
  renderChunk(chunk);
}

// Background processing
const [messages, success] = await agent.call(input);
if (success) {
  const final = messages[messages.length - 1].content;
  await saveToDatabase(final);
}
```

Both methods share the same failover and tool execution logic. The MAX_LOOPS = 10 limit applies to both.
