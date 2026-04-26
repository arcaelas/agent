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
| `name` | `string` | No | Deprecated. Not used internally. |
| `description` | `string` | No | Injected as a `Rule` into the agent's context. Defines the personality and purpose. |
| `metadata` | `Metadata \| Metadata[]` | No | Initial metadata |
| `tools` | `Tool \| Tool[]` | No | Available tools |
| `rules` | `Rule \| Rule[]` | No | Behavioral rules |
| `messages` | `Message \| Message[]` | No | Conversation history |
| `contexts` | `Context \| Context[]` | No | Parent contexts for inheritance |
| `providers` | `Provider[]` | No | AI model provider functions |
| `branches` | `Array<AgentOptions \| Agent \| string>` | No | Sub-agents that build a "thinking" context before the main turn |

> **Note:** `name` and `description` are declared as `readonly` properties but are never assigned internally — they remain `undefined` at runtime. `description` is converted into a `Rule` that is passed to the internal Context; it does not appear as a property value.

### branches

The `branches` option accepts an array of sub-agents (as `Agent` instances, `AgentOptions` objects, or description strings). Before each `call()` or `stream()` turn, the agent runs the branches sequentially. Each branch inherits the current message thread plus the accumulated thinking from previous branches as a `system` message. The last branch's assistant response is injected as an ephemeral `system` message immediately before the user prompt, then removed after the turn ends (it is never persisted in `messages`).

```typescript
const agent = new Agent({
  description: "Final answer agent",
  branches: [
    "Think step by step about the problem before answering.",
    new Agent({ description: "Verify the reasoning above.", providers: [verifier_provider] }),
  ],
  providers: [main_provider],
});
```

### Example

```typescript
import { Agent, Tool, Rule } from '@arcaelas/agent';

const agent = new Agent({
  description: "Professional customer support specialist",
  metadata: new Metadata().set("version", "1.0"),
  tools: [search_tool, ticket_tool],
  rules: [new Rule("Be professional and courteous")],
  providers: [openai_provider, claude_provider]
});
```

## Properties

### `name` (readonly, deprecated)

```typescript
readonly name?: string
```

Always `undefined` at runtime. Kept for source-level compatibility only. Do not rely on this value.

### `description` (readonly, deprecated)

```typescript
readonly description?: string
```

Always `undefined` at runtime. The description string from `AgentOptions` is converted to a `Rule` and added to the internal Context; it is not stored as a property. Do not rely on this value.

### `metadata`

```typescript
get metadata(): Metadata
```

Reactive metadata with inheritance from parent contexts.

```typescript
agent.metadata.set("user_id", "12345");
console.log(agent.metadata.get("user_id"));  // "12345"
```

**[Learn more about Metadata →](metadata.md)**

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

**[Learn more about Tools →](tool.md)**

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

**[Learn more about Rules →](rule.md)**

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

**[Learn more about Messages →](message.md)**

### `providers`

```typescript
get providers(): Provider[]
```

Configured AI provider functions.

```typescript
console.log(agent.providers.length);  // Number of providers
```

**[Learn more about Providers →](providers.md)**

## Methods

### `call()`

```typescript
async call(prompt: string, opts?: { signal?: AbortSignal }): Promise<[Message[], boolean]>
```

Processes user input with automatic tool execution and provider failover.

**Parameters:**

- `prompt` - User message to process
- `opts.signal` - Optional `AbortSignal` to cancel the operation

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

1. Runs branch pipeline (if `branches` configured), building accumulated thinking
2. Injects thinking as ephemeral `system` message before the user prompt
3. Adds user message to context
4. Tries providers (random selection with failover) until one succeeds
5. If response includes tool calls, executes them in parallel
6. Repeats until completion or all providers fail
7. Removes ephemeral thinking message before returning
8. Returns final state and success indicator

### `stream()`

```typescript
async *stream(input: StreamInput, opts?: { signal?: AbortSignal }): AsyncGenerator<StreamChunk>
```

Streams a conversation turn, yielding message-like chunks as they arrive. Handles the full agentic loop internally.

**Parameters:**

- `input` - A string, `Message` instance, or `{ role, content }` plain object
- `opts.signal` - Optional `AbortSignal` to cancel the stream

**Iteration limit:** the streaming loop is capped at 10 internal iterations (one per provider re-invocation after a tool round). This prevents runaway tool-call loops. `call()` does not impose this cap.

**Yields:** `StreamChunk` objects — one of:

```typescript
| { role: "assistant"; content: string }
| { role: "thinking"; content: string }
| { role: "tool_call"; name: string; tool_call_id: string; arguments: string }
| { role: "tool"; name: string; tool_call_id: string; content: string }
```

**Example:**

```typescript
for await (const chunk of agent.stream("What time is it in Tokyo?")) {
  if (chunk.role === "assistant") process.stdout.write(chunk.content);
  if (chunk.role === "thinking") console.log("[thinking]", chunk.content);
  if (chunk.role === "tool_call") console.log(`[call] ${chunk.name}(${chunk.arguments})`);
  if (chunk.role === "tool") console.log(`[result] ${chunk.name}: ${chunk.content}`);
}
```

## Complete Examples

### Basic Usage

```typescript
import { Agent } from '@arcaelas/agent';
import OpenAI from 'openai';

const agent = new Agent({
  name: "Simple_Agent",
  description: "Basic conversational agent",
  providers: [
    async (ctx) => {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      return await openai.chat.completions.create({
        model: "gpt-4",
        messages: ctx.messages.map(m => ({ role: m.role, content: m.content }))
      });
    }
  ]
});

const [messages, success] = await agent.call("Hello!");
```

### With Tools

```typescript
import { Agent, Tool } from '@arcaelas/agent';

const weather_tool = new Tool("get_weather", {
  description: "Get current weather",
  parameters: { city: "City name" },
  func: async (agent, params) => `Weather in ${params.city}: Sunny`
});

const agent = new Agent({
  name: "Weather_Agent",
  description: "Agent with weather capabilities",
  tools: [weather_tool],
  providers: [
    async (ctx) => {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      return await openai.chat.completions.create({
        model: "gpt-4",
        messages: ctx.messages.map(m => ({ role: m.role, content: m.content })),
        tools: ctx.tools?.map(tool => ({
          type: "function",
          function: {
            name: tool.name,
            description: tool.description,
            parameters: { type: "object", properties: tool.parameters }
          }
        }))
      });
    }
  ]
});

await agent.call("What's the weather in London?");
```

### Multi-Provider Resilience

```typescript
const agent = new Agent({
  name: "Resilient_Agent",
  description: "High-availability agent",
  providers: [
    // Primary: OpenAI
    async (ctx) => {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      return await openai.chat.completions.create({
        model: "gpt-4",
        messages: ctx.messages.map(m => ({ role: m.role, content: m.content }))
      });
    },

    // Backup: Claude
    async (ctx) => {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 4000,
        messages: ctx.messages.map(m => ({
          role: m.role === "system" ? "user" : m.role,
          content: m.content
        }))
      });

      // Convert to OpenAI format
      return {
        id: response.id,
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: "claude-sonnet-4-5",
        choices: [{
          index: 0,
          message: { role: "assistant", content: response.content[0].text },
          finish_reason: "stop"
        }]
      };
    }
  ]
});

// If OpenAI fails, automatically tries Claude
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
  contexts: company_context,  // Inherits company config
  metadata: new Metadata().set("department", "Sales"),
  tools: [crm_tool, quote_tool],
  providers: [openai_provider]
});

// Agent has access to company and department config
console.log(sales_agent.metadata.get("organization"));  // "Acme Corp"
console.log(sales_agent.metadata.get("department"));    // "Sales"
```

## Type Definitions

### Provider

```typescript
type Provider = {
  (ctx: Context, opts?: { signal?: AbortSignal }): ChatCompletionResponse | Promise<ChatCompletionResponse>;
  (ctx: Context, opts: { stream: true; signal?: AbortSignal }): AsyncIterable<ProviderChunk>;
};
```

Dual-mode provider function. Without `stream: true` returns a `ChatCompletionResponse`. With `stream: true` returns an `AsyncIterable<ProviderChunk>`.

### ProviderChunk

```typescript
type ProviderChunk =
  | { type: "text_delta"; content: string }
  | { type: "thinking_delta"; content: string }
  | { type: "tool_call_delta"; index: number; id?: string; name?: string; arguments_delta?: string }
  | { type: "finish"; finish_reason: string };
```

### StreamChunk

```typescript
type StreamChunk =
  | { role: "assistant"; content: string }
  | { role: "thinking"; content: string }
  | { role: "tool_call"; name: string; tool_call_id: string; arguments: string }
  | { role: "tool"; name: string; tool_call_id: string; content: string };
```

### ChatCompletionResponse

```typescript
interface ChatCompletionResponse {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  choices: CompletionChoice[];
  usage?: CompletionUsage;
}
```

Standard OpenAI ChatCompletion response format.

## Error Handling

The `call()` method handles errors internally by trying failover providers. Check the `success` boolean to determine if the operation succeeded.

```typescript
const [messages, success] = await agent.call(prompt);

if (!success) {
  console.error("All providers failed");
  // Implement retry logic or fallback behavior
}
```

## Performance Considerations

- **Tool Execution**: Tools execute in parallel using `Promise.all()`
- **Provider Failover**: Failed providers are removed from the active pool
- **Message History**: Consider trimming old messages for long conversations

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
