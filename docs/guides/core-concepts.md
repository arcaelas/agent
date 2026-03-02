# Core Concepts

Understanding the core concepts of @arcaelas/agent will help you build sophisticated AI applications efficiently.

## Architecture Overview

@arcaelas/agent is built on interconnected concepts:

```
Agent (Entry Point)
  +-- Context (Reactive State Management)
  |   +-- Metadata (Key-Value Store with Inheritance)
  |   +-- Rules (Behavioral Guidelines)
  |   +-- Tools (Function Registry)
  |   +-- Messages (Conversation History)
  +-- Providers (Dual-Mode AI Integration)
```

### 1. Agent - The Orchestrator

**Agent** is the central class that coordinates everything. It combines:

- **Identity**: Name and description
- **Behavior**: Rules and guidelines
- **Capabilities**: Tools and functions
- **Intelligence**: Provider functions (dual-mode: call + stream)

```typescript
const agent = new Agent({
  name: "Customer_Support",
  description: "Expert customer support specialist",
  tools: [search_tool, ticket_tool],
  rules: [professional_rule],
  providers: [openai_provider, claude_provider]
});
```

**Key Features:**

- Automatic tool execution in parallel with `Promise.all`
- Provider failover with random selection
- Context inheritance
- Message history management
- `MAX_LOOPS = 10` limit per call/stream to prevent infinite loops
- Two execution modes: `agent.call()` (batch) and `agent.stream()` (streaming)

### 2. Context - Reactive State Management

**Context** provides hierarchical state management with automatic inheritance. Think of it as a configuration layer that can be shared and extended.

```typescript
// Parent context
const company_context = new Context({
  metadata: new Metadata().set("org", "Acme Corp"),
  rules: [new Rule("Be professional")]
});

// Child context inherits from parent
const sales_context = new Context({
  context: company_context,  // Inherits everything
  metadata: new Metadata().set("dept", "Sales"),
  tools: [crm_tool]
});
```

**Inheritance Rules:**

- **Metadata**: Child can override parent values. Uses spread-operator constructor `new Metadata(parent1, parent2)`.
- **Rules**: Child adds to parent rules (parent first, then local).
- **Tools**: Deduplicated by name -- child tools override parent tools with the same name.
- **Messages**: Combined from parent and child (parent first, then local).

### 3. Metadata - Key-Value Store

**Metadata** is a hierarchical key-value store with inheritance via a broker pattern. The constructor accepts spread Metadata instances as parents:

```typescript
// Multiple inheritance via spread operator
const defaults = new Metadata();
defaults.set("theme", "light");

const env = new Metadata();
env.set("theme", "dark");

// Later parents take precedence
const config = new Metadata(defaults, env);
console.log(config.get("theme", ""));  // "dark" (from env)
```

**Key operations:**

- `set(key, value)` -- stores locally. Use `null` to mark as deleted.
- `get(key, fallback)` -- reads with hierarchical fallback through parents.
- `has(key)` -- checks existence (returns false if locally set to null).
- `delete(key)` -- alias for `set(key, null)`.
- `clear()` -- removes all local data without affecting parents.
- `use(...parents)` -- adds parent nodes dynamically.
- `all()` / `toJSON()` -- returns merged view excluding null values.

### 4. Tools - Function Execution

**Tools** encapsulate functions that agents can execute. They support two constructors:

**Simple Tool** -- handler signature is `(agent: Agent, input: string) => any`:

```typescript
const time_tool = new Tool("get_time", (agent: Agent, input: string) => {
  return new Date().toLocaleString();
});
```

**Advanced Tool** -- with typed parameters via `ToolOptions`:

```typescript
const search_tool = new Tool("search_database", {
  description: "Search customer database",
  parameters: {
    query: "Search query string",
    limit: "Maximum results (default: 10)"
  },
  func: async (agent, { query, limit }) => {
    const results = await database.search(query, limit || 10);
    return JSON.stringify(results);
  }
});
```

**Tool deduplication:** When a child context defines a tool with the same name as a parent context tool, the child version overrides the parent. Tools are reduced into an object keyed by name, so the last one wins.

**`tool.toJSON()`** generates an OpenAI-compatible function calling structure automatically:

```typescript
{
  type: "function",
  function: {
    name: "search_database",
    description: "Search customer database",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query string" },
        limit: { type: "string", description: "Maximum results (default: 10)" }
      }
    }
  }
}
```

**Built-in tools:**

- `TimeTool` -- returns current date/time with optional timezone
- `RemoteTool` -- executes HTTP requests (GET, POST, PUT, DELETE, PATCH)

### 5. Rules - Behavioral Guidelines

**Rules** define how agents should behave. They can be static or conditional.

**Static Rule:**
```typescript
const professional_rule = new Rule(
  "Always maintain a professional and courteous tone"
);
```

**Conditional Rule** -- `when` receives the Agent instance:
```typescript
const business_hours_rule = new Rule(
  "Inform about office hours availability",
  {
    when: (agent) => {
      const hour = new Date().getHours();
      return hour < 9 || hour > 17;
    }
  }
);
```

Rules are injected as system messages by the built-in providers. Their descriptions are joined with `\n\n`.

### 6. Messages - Conversation History

**Messages** represent individual messages in a conversation. Types include:

- `user` -- Messages from the user
- `assistant` -- Responses from the agent (may include `tool_calls`)
- `tool` -- Results from tool execution (requires `tool_call_id`)
- `system` -- System-level instructions

```typescript
const user_msg = new Message({
  role: "user",
  content: "What's the weather?"
});

const tool_msg = new Message({
  role: "tool",
  tool_call_id: "call_abc123",
  content: "Sunny, 22C"
});

const assistant_msg = new Message({
  role: "assistant",
  content: null,
  tool_calls: [{
    id: "call_abc123",
    type: "function",
    function: { name: "get_weather", arguments: '{"city":"Madrid"}' }
  }]
});
```

Note: tool messages use `tool_call_id` (not `tool_id`). This matches the OpenAI format used throughout the system.

### 7. Providers - AI Integration

**Providers** are dual-mode functions that receive a `Context` and return completions:

```typescript
type Provider = {
  (ctx: Context): ChatCompletionResponse | Promise<ChatCompletionResponse>;
  (ctx: Context, opts: { stream: true }): AsyncIterable<ProviderChunk>;
};
```

Without `{ stream: true }`, they return a `ChatCompletionResponse`. With it, they return an `AsyncIterable<ProviderChunk>`.

The library includes 4 built-in providers: `OpenAI`, `Groq`, `DeepSeek`, `Claude`. All implement this dual-mode interface.

**Multi-Provider Failover:**

```typescript
const agent = new Agent({
  name: "Resilient_Agent",
  description: "High-availability agent",
  providers: [
    new OpenAI({ api_key: "...", model: "gpt-4" }),
    new Claude({ api_key: "...", model: "claude-3-5-sonnet-20241022", max_tokens: 4096 }),
    new Groq({ api_key: "...", model: "llama-3.1-70b-versatile" })
  ]
});
```

Providers are selected **randomly** from the pool. On failure, the provider moves to a fallback pool and is retried only if no primary providers remain. This is not sequential ordering -- it's random selection with retry.

### 8. Streaming

`agent.stream()` yields `StreamChunk` objects as they arrive from the provider:

```typescript
type StreamChunk =
  | { role: "assistant"; content: string }
  | { role: "tool"; name: string; tool_call_id: string; content: string };
```

The stream method handles the full agentic loop internally:

1. Sends the input to a randomly selected provider with `{ stream: true }`
2. Yields text deltas as `{ role: "assistant", content: "..." }` chunks
3. Accumulates tool call deltas
4. Executes tools in parallel with `Promise.all`
5. Yields tool results as `{ role: "tool", ... }` chunks
6. Re-invokes the provider for a new loop iteration
7. Continues until the model stops or `MAX_LOOPS = 10` is reached

```typescript
for await (const chunk of agent.stream("Search for TypeScript tutorials")) {
  if (chunk.role === "assistant") {
    process.stdout.write(chunk.content);
  }
  if (chunk.role === "tool") {
    console.log(`[${chunk.name}]: ${chunk.content}`);
  }
}
```

Input types accepted: `string`, `Message` instance, or `{ role: "user" | "assistant", content: string }`.

## Data Flow

Understanding how data flows through the system:

1. **User Input** -- Agent receives prompt via `call()` or `stream()`
2. **Context Building** -- Agent prepares context with messages, tools, rules
3. **Provider Call** -- Provider receives Context, returns completion or stream
4. **Tool Execution** -- If completion includes tool calls, execute them in parallel with `Promise.all`
5. **Loop** -- Repeat steps 3-4 until completion or `MAX_LOOPS` (10) reached
6. **Response** -- `call()` returns `[Message[], boolean]`, `stream()` yields `StreamChunk`

```typescript
// Batch mode
const [messages, success] = await agent.call("Hello");

// Streaming mode
for await (const chunk of agent.stream("Hello")) { ... }
```

## Tool Execution Details

Tools are executed with error isolation per tool. Each tool call is wrapped in try/catch so a single failing tool does not break the entire batch:

```typescript
// Internal behavior (simplified):
const results = await Promise.all(
  tool_calls.map(async (tc) => {
    try {
      const tool = TOOLS.find(t => t.name === tc.function.name);
      if (!tool) return { content: "Tool not found" };
      const result = await tool.func(agent, JSON.parse(tc.function.arguments));
      // Safe serialization: handles undefined, functions, bigints, circular refs
      return { content: JSON.stringify(result) };
    } catch (error) {
      return { content: error.message };
    }
  })
);
```

## Common Patterns

### Pattern: Specialized Agents

Create specialized agents for different tasks:

```typescript
const search_agent = new Agent({
  name: "Search_Agent",
  description: "Expert in searching and finding information",
  tools: [web_search, doc_search, db_search],
  providers: [openai]
});
```

### Pattern: Agent Chaining

Chain agents for complex workflows:

```typescript
async function complex_task(input: string) {
  const [research] = await research_agent.call(input);
  const analysis_input = research[research.length - 1].content!;
  const [analysis] = await analysis_agent.call(analysis_input);
  const report_input = analysis[analysis.length - 1].content!;
  const [report] = await writer_agent.call(report_input);
  return report;
}
```

### Pattern: Context Composition

Compose contexts from multiple sources:

```typescript
const auth_context = new Context({ ... });
const logging_context = new Context({ ... });

const agent = new Agent({
  name: "Multi_Context_Agent",
  description: "Agent with multiple parent contexts",
  contexts: [auth_context, logging_context],
  providers: [openai]
});
```

## Next Steps

- **[Providers Guide](providers.md)** - Advanced provider configuration
- **[Best Practices](best-practices.md)** - Production patterns
- **[API Reference](../api/agent.md)** - Complete API documentation
