# Agent API Reference

The `Agent` class is the central orchestrator that coordinates AI providers, tools, rules, and conversation management.

## Constructor

```typescript
new Agent(options: AgentOptions)
```

Creates a new Agent instance with the specified configuration.

### AgentOptions

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | `string` | Yes | Unique identifier for the agent |
| `description` | `string` | Yes | Behavioral personality and purpose |
| `metadata` | `Metadata \| Metadata[]` | No | Initial metadata |
| `tools` | `Tool \| Tool[]` | No | Available tools |
| `rules` | `Rule \| Rule[]` | No | Behavioral rules |
| `messages` | `Message \| Message[]` | No | Conversation history |
| `contexts` | `Context \| Context[]` | No | Parent contexts for inheritance |
| `providers` | `Provider[]` | No | AI model provider functions |

### Example

```typescript
import { Agent, Tool, Rule } from '@arcaelas/agent';

const agent = new Agent({
  name: "Support_Agent",
  description: "Professional customer support specialist",
  metadata: new Metadata().set("version", "1.0"),
  tools: [search_tool, ticket_tool],
  rules: [new Rule("Be professional and courteous")],
  providers: [openai_provider, claude_provider]
});
```

## Properties

### `name` (readonly)

```typescript
readonly name: string
```

Unique identifier for the agent.

```typescript
console.log(agent.name);  // "Support_Agent"
```

### `description` (readonly)

```typescript
readonly description: string
```

Immutable description defining agent's personality and behavior.

```typescript
console.log(agent.description);  // "Professional customer support specialist"
```

### `metadata`

```typescript
get metadata(): Metadata
```

Reactive metadata with inheritance from parent contexts.

```typescript
agent.metadata.set("user_id", "12345");
console.log(agent.metadata.get("user_id"));  // "12345"
```

**[Learn more about Metadata ->](metadata.md)**

### `tools`

```typescript
get tools(): Tool[]
set tools(tools: Tool[])
```

Available tools with automatic deduplication by name. Child tools override parent tools.

```typescript
// Get all tools (inherited + local)
console.log(agent.tools.length);

// Set local tools
agent.tools = [new_tool_1, new_tool_2];
```

**[Learn more about Tools ->](tool.md)**

### `rules`

```typescript
get rules(): Rule[]
set rules(rules: Rule[])
```

Behavioral rules combined from parent contexts and local rules.

```typescript
// Get all rules
console.log(agent.rules.length);

// Set local rules
agent.rules = [
  new Rule("Maintain professional tone"),
  new Rule("Never share confidential info")
];
```

**[Learn more about Rules ->](rule.md)**

### `messages`

```typescript
get messages(): Message[]
set messages(messages: Message[])
```

Full conversation history with inheritance from parent contexts.

```typescript
// Get all messages
console.log(agent.messages.length);

// Reset conversation
agent.messages = [];
```

**[Learn more about Messages ->](message.md)**

### `providers` (readonly)

```typescript
get providers(): Provider[]
```

Readonly getter for configured AI provider functions. Returns the internal `_providers` array directly.

```typescript
console.log(agent.providers.length);  // Number of providers
```

**[Learn more about Providers ->](providers.md)**

## Type Definitions

### Provider

Dual-mode AI provider function. Supports both non-streaming and streaming invocation via overloaded signatures.

```typescript
type Provider = {
  (ctx: Context): ChatCompletionResponse | Promise<ChatCompletionResponse>;
  (ctx: Context, opts: { stream: true }): AsyncIterable<ProviderChunk>;
};
```

- Without the second argument: returns `ChatCompletionResponse | Promise<ChatCompletionResponse>` (used by `call()`).
- With `{ stream: true }`: returns `AsyncIterable<ProviderChunk>` (used by `stream()`).

### ProviderChunk

Normalized delta chunk emitted by providers in stream mode.

```typescript
type ProviderChunk =
  | { type: "text_delta"; content: string }
  | { type: "tool_call_delta"; index: number; id?: string; name?: string; arguments_delta?: string }
  | { type: "finish"; finish_reason: string };
```

### StreamChunk

Message-like chunk yielded by `Agent.stream()` to the consumer.

```typescript
type StreamChunk =
  | { role: "assistant"; content: string }
  | { role: "tool"; name: string; tool_call_id: string; content: string };
```

### StreamInput

Valid input types for `Agent.stream()`.

```typescript
type StreamInput = string | Message | { role: "user" | "assistant"; content: string };
```

- A plain `string` is converted to a user message internally.
- A `Message` instance is used as-is.
- A plain object with `role` and `content` is wrapped in a new `Message`.

### ChatCompletionResponse

```typescript
interface ChatCompletionResponse {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  system_fingerprint?: string | null;
  choices: CompletionChoice[];
  usage?: CompletionUsage;
  service_tier?: string | null;
}
```

Standard OpenAI ChatCompletion response format.

## Methods

### `call()`

```typescript
async call(prompt: string): Promise<[Message[], boolean]>
```

Processes user input with automatic tool execution and provider failover. Uses non-streaming mode (`provider(ctx)`).

**Parameters:**

- `prompt` - User message to process

**Returns:**

Tuple of `[messages, success]`:
- `messages` - Complete conversation history
- `success` - Whether processing succeeded

**Example:**

```typescript
const [messages, success] = await agent.call("What's the weather?");

if (success) {
  const response = messages[messages.length - 1].content;
  console.log("Agent:", response);
} else {
  console.log("Agent failed to respond");
}
```

**Behavior:**

1. Adds user message to context immediately
2. Picks a random provider from the pool
3. If response includes tool calls, executes them in parallel with `Promise.all()`
4. Repeats until completion or all providers fail
5. Failed providers move to a fallback pool and can be retried
6. Returns final state and success indicator

### `stream()`

```typescript
async *stream(input: StreamInput): AsyncGenerator<StreamChunk, void, unknown>
```

Streams a conversation turn, yielding message-like chunks as they arrive. Handles the full agentic loop internally: text streaming, tool execution, and provider re-invocation. Uses streaming mode (`provider(ctx, { stream: true })`).

**Parameters:**

- `input` - A string (converted to user message), a `Message` instance, or an object `{ role: "user" | "assistant", content: string }`

**Yields:**

`StreamChunk` objects:
- `{ role: "assistant", content: string }` - Text delta from the model
- `{ role: "tool", name: string, tool_call_id: string, content: string }` - Tool execution result

**Example:**

```typescript
for await (const chunk of agent.stream("Search the weather in Madrid")) {
  if (chunk.role === "assistant") {
    process.stdout.write(chunk.content);
  }
  if (chunk.role === "tool") {
    console.log(`[${chunk.name}]: ${chunk.content}`);
  }
}
```

**Behavior:**

1. Converts input to a `Message` and appends it to context
2. Picks a random provider and calls it with `{ stream: true }`
3. Yields `{ role: "assistant", content }` for each text delta
4. Accumulates tool call deltas internally
5. If tool calls are present, executes them in parallel, yields tool results, and loops back to step 2
6. Maximum of 10 iterations per call
7. Failed providers move to a fallback pool

## Complete Examples

### Basic Usage

```typescript
import { Agent } from '@arcaelas/agent';
import { OpenAI } from '@arcaelas/agent/providers';

const agent = new Agent({
  name: "Simple_Agent",
  description: "Basic conversational agent",
  providers: [
    new OpenAI({ api_key: process.env.OPENAI_API_KEY!, model: "gpt-4" })
  ]
});

const [messages, success] = await agent.call("Hello!");
```

### Streaming

```typescript
import { Agent } from '@arcaelas/agent';
import { OpenAI } from '@arcaelas/agent/providers';

const agent = new Agent({
  name: "Stream_Agent",
  description: "Streaming conversational agent",
  providers: [
    new OpenAI({ api_key: process.env.OPENAI_API_KEY!, model: "gpt-4" })
  ]
});

for await (const chunk of agent.stream("Tell me a story")) {
  if (chunk.role === "assistant") {
    process.stdout.write(chunk.content);
  }
}
```

### With Tools

```typescript
import { Agent, Tool } from '@arcaelas/agent';

const weather_tool = new Tool("get_weather", {
  description: "Get current weather",
  parameters: { city: "City name" },
  func: async (agent, { city }) => `Weather in ${city}: Sunny`
});

const agent = new Agent({
  name: "Weather_Agent",
  description: "Agent with weather capabilities",
  tools: [weather_tool],
  providers: [openai_provider]
});

await agent.call("What's the weather in London?");
```

### Multi-Provider Resilience

```typescript
import { Agent } from '@arcaelas/agent';
import { OpenAI, Claude, Groq } from '@arcaelas/agent/providers';

const agent = new Agent({
  name: "Resilient_Agent",
  description: "High-availability agent",
  providers: [
    new OpenAI({ api_key: process.env.OPENAI_API_KEY!, model: "gpt-4" }),
    new Claude({ api_key: process.env.ANTHROPIC_API_KEY!, model: "claude-3-5-sonnet-20241022" }),
    new Groq({ api_key: process.env.GROQ_API_KEY!, model: "llama-3.1-70b-versatile" })
  ]
});

// If one provider fails, automatically tries the next
const [messages, success] = await agent.call("Hello");
```

### Context Inheritance

```typescript
import { Agent, Context, Metadata, Rule } from '@arcaelas/agent';

// Company-wide context
const company_context = new Context({
  metadata: new Metadata()
    .set("organization", "Acme Corp")
    .set("compliance", "enterprise"),
  rules: [new Rule("Maintain professional communication")]
});

// Specialized agent
const sales_agent = new Agent({
  name: "Sales_Agent",
  description: "Sales specialist",
  contexts: company_context,
  metadata: new Metadata().set("department", "Sales"),
  tools: [crm_tool, quote_tool],
  providers: [openai_provider]
});

// Agent has access to company and department config
console.log(sales_agent.metadata.get("organization"));  // "Acme Corp"
console.log(sales_agent.metadata.get("department"));    // "Sales"
```

## Error Handling

The `call()` method handles errors internally by trying failover providers. Check the `success` boolean to determine if the operation succeeded.

```typescript
const [messages, success] = await agent.call(prompt);

if (!success) {
  console.error("All providers failed");
}
```

## Performance Considerations

- **Tool Execution**: Tools execute in parallel using `Promise.all()`
- **Provider Failover**: Failed providers move to a fallback pool and can be retried
- **Message History**: Consider trimming old messages for long conversations
- **Stream Loop Limit**: `stream()` has a maximum of 10 iterations per call

```typescript
// Trim conversation history
if (agent.messages.length > 100) {
  const recent = agent.messages.slice(-50);
  agent.messages = recent;
}
```

## See Also

- [Context API](context.md)
- [Tool API](tool.md)
- [Rule API](rule.md)
- [Message API](message.md)
- [Providers API](providers.md)
- [Getting Started Guide](../guides/getting-started.md)
- [Core Concepts](../guides/core-concepts.md)
