# Architecture

Internal design and system architecture of @arcaelas/agent.

## System Overview

```
                         Agent Layer
 +-------------------------------------------------+
 |  Agent (Orchestrator)                            |
 |  - name, description                            |
 |  - providers (AI services)                      |
 |  - call() method (non-streaming)                |
 |  - stream() method (streaming, async generator) |
 +-----------------------+-------------------------+
                         |
          +--------------v--------------+
          |        Context Layer        |
          |  Context (State Management) |
          |  - metadata (reactive KV)   |
          |  - rules (guidelines)       |
          |  - tools (functions)        |
          |  - messages (conversation)  |
          |  - context (parent inherit) |
          +-----------------------------+
```

## Type Hierarchy

```
Provider (dual-mode function type)
  |-- (ctx: Context) => ChatCompletionResponse | Promise<ChatCompletionResponse>
  |-- (ctx: Context, opts: { stream: true }) => AsyncIterable<ProviderChunk>

ProviderChunk (discriminated union)
  |-- { type: "text_delta"; content: string }
  |-- { type: "tool_call_delta"; index; id?; name?; arguments_delta? }
  |-- { type: "finish"; finish_reason: string }

StreamChunk (discriminated union, yielded by Agent.stream())
  |-- { role: "assistant"; content: string }
  |-- { role: "tool"; name: string; tool_call_id: string; content: string }

StreamInput = string | Message | { role: "user" | "assistant"; content: string }

MessageOptions (discriminated union)
  |-- { role: "user"; content: string }
  |-- { role: "assistant"; content: string | null; tool_calls?: ToolCall[] }
  |-- { role: "system"; content: string }
  |-- { role: "tool"; content: string; tool_call_id: string }
```

## Core Components

### 1. Agent

**Responsibility**: Orchestration and execution

**Key Methods**:
- `constructor(options)` - Initialize with configuration
- `call(prompt)` - Execute conversation with providers and tools (non-streaming)
- `stream(input)` - Async generator that yields StreamChunk objects in real-time
- `get/set metadata`, `rules`, `tools`, `messages` - Access context properties

**Execution Flow** (`call` method):
1. Add user message to context
2. Loop through providers with failover
3. Call provider with current context
4. If response includes tool_calls, execute them in parallel
5. Add tool results to context and loop again
6. Return when completion has no tool_calls

**Streaming Flow** (`stream` method):
1. Add input message to context
2. Call provider with `{ stream: true }` to get `AsyncIterable<ProviderChunk>`
3. Accumulate text deltas and yield `{ role: "assistant", content }` chunks
4. Accumulate tool_call deltas by index
5. When stream ends with tool_calls, execute tools in parallel
6. Yield `{ role: "tool", ... }` chunks for each tool result
7. Loop back to step 2 (re-invoke provider) until no more tool_calls
8. Max 10 iterations as safety limit

### 2. Context

**Responsibility**: Hierarchical state management with inheritance

**Key Features**:
- Parent context inheritance via `context` parameter (singular, accepts one or array)
- Automatic merging of metadata, rules, tools, messages
- Tool deduplication by name (last wins)
- Reactive metadata updates through broker pattern

**Note**: Context uses `context` as the option name. Agent uses `contexts` in its AgentOptions, but internally passes it to Context's `context` parameter.

**Inheritance Rules**:
- **Metadata**: Child can override parent values (last wins via broker)
- **Rules**: Concatenated (parent rules + child rules)
- **Tools**: Deduplicated by name using `reduce` with object spread -- last definition wins
- **Messages**: Concatenated (parent messages + child messages)

**Tool Deduplication Implementation**:
```typescript
get tools(): Tool[] {
  return Object.values(
    [...this._contexts.map(c => c.tools).flat(), ...this._tools].reduce(
      (acc, tool) => ({ ...acc, [tool.name]: tool }),
      {} as Record<string, Tool>
    )
  );
}
```
Tools are collected from parents first, then locals. The `reduce` with spread means if a child defines a tool with the same name as a parent, the child's version replaces the parent's (last wins).

### 3. Metadata

**Responsibility**: Reactive key-value storage with broker pattern

**Constructor**: Accepts spread arguments of `Metadata | Metadata[]`:
```typescript
new Metadata()                        // No inheritance
new Metadata(parent1)                 // Single parent
new Metadata(parent1, parent2)        // Multiple parents
new Metadata(parent1, [parent2])      // Mixed spread + array
```

**Architecture**:
```typescript
Metadata {
  _data: Record<string, string | null>  // Local storage
  _broker: Metadata[]                    // Parent metadatas

  get(key, fallback) {
    // Check brokers in order, then local overrides
  }

  set(key, value) {
    // Always store locally
    return this  // For chaining
  }
}
```

### 4. Tool

**Responsibility**: Encapsulate executable functions

**Two Constructor Modes**:
1. **Simple**: `new Tool(name, func)` - String input only
2. **Advanced**: `new Tool(name, options)` - Typed parameters

**Properties**:
- `name` - Unique identifier
- `description` - What the tool does
- `parameters` - Schema of expected parameters
- `func` - Executable function `(agent: Agent, params) => any`

### 5. Rule

**Responsibility**: Define behavioral guidelines

**Types**:
- **Static**: `new Rule(description)` - Always applies
- **Conditional**: `new Rule(description, { when })` - Applies when condition met

### 6. Message

**Responsibility**: Represent conversation messages

**Discriminated union** via MessageOptions:
- `{ role: "user"; content: string }` - User input
- `{ role: "assistant"; content: string | null; tool_calls?: ToolCall[] }` - AI response, may include tool_calls
- `{ role: "tool"; content: string; tool_call_id: string }` - Tool result
- `{ role: "system"; content: string }` - System instruction

Each Message instance also has a `timestamp: Date` set at creation time.

### 7. Provider

**Responsibility**: Interface with AI services

**Signature** (dual-mode):
```typescript
type Provider = {
  (ctx: Context): ChatCompletionResponse | Promise<ChatCompletionResponse>;
  (ctx: Context, opts: { stream: true }): AsyncIterable<ProviderChunk>;
};
```

**Contract**:
- Non-streaming: Input Context, output ChatCompletionResponse (OpenAI-compatible format)
- Streaming: Input Context + `{ stream: true }`, output `AsyncIterable<ProviderChunk>`

## Data Flow

### Standard Conversation (`call`)

```
User sends prompt
       |
       v
+------------------+
| Agent.call()     |
| - Add user msg   |
+--------+---------+
         |
         v
+------------------+
| Provider Loop    |--+
| - Random select  |  | Failover
| - Try provider   |<-+
+--------+---------+
         |
         v
  +-------------+
  | Tool calls? |
  +--+------+---+
     |No    |Yes
     |      v
     |  +----------------+
     |  | Execute tools  |
     |  | in parallel    |
     |  +-------+--------+
     |          |
     |          v
     |  +----------------+
     |  | Add tool       |
     |  | results to ctx |
     |  +-------+--------+
     |          |
     |          +---+
     |              |
     v              v
+--------------------+
| Return messages    |
| and success flag   |
+--------------------+
```

### Streaming Conversation (`stream`)

```
Input (string | Message | {role, content})
       |
       v
+--------------------+
| Agent.stream()     |
| - Add input msg    |
+--------+-----------+
         |
         v
+------------------------+
| provider(ctx, {stream})|
| yields ProviderChunk   |
+--------+---------------+
         |
    +----v----+
    | Chunk   |
    | type?   |
    +--+---+--+
       |   |
  text |   | tool_call
  delta|   | delta
       v   v
  yield  accumulate
  to     by index
  consumer
         |
         v
  +-------------+
  | Tool calls? |
  +--+------+---+
     |No    |Yes
     |      v
     |  Execute tools
     |  yield tool chunks
     |  loop back to provider
     v
  Return (done)
```

### Provider Failover

```
PROVIDERS = [P1, P2, P3]
FALLBACK = []

+----------------------+
| Random select from   |
| PROVIDERS or FALLBACK|
+----------+-----------+
           |
           v
      +---------+
      | Success?|
      +-+---+---+
        |Yes|No
        |   |
        v   v
    +----+ +------------------------+
    |Done| |Move to FALLBACK & retry|
    +----+ +------------------------+
```

## Design Patterns

### 1. Broker Pattern (Metadata)

Metadata uses broker pattern for hierarchical value resolution:

```typescript
// Parent metadata
const parent = new Metadata().set('theme', 'light');

// Child metadata with parent as broker
const child = new Metadata(parent).set('color', 'blue');

child.get('theme'); // 'light' (from broker)
child.get('color'); // 'blue' (local)
```

### 2. Virtual Properties (Agent)

Agent virtualizes Context properties for cleaner API:

```typescript
class Agent {
  private _context: Context;

  get metadata() { return this._context.metadata; }
  get rules() { return this._context.rules; }
  // etc.
}
```

### 3. Discriminated Unions (Message)

TypeScript discriminated unions for type-safe message handling:

```typescript
type MessageOptions =
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string | null; tool_calls?: ToolCall[] }
  | { role: 'tool'; content: string; tool_call_id: string }
  | { role: 'system'; content: string }
```

### 4. Promise.all for Tools

Parallel tool execution using Promise.all:

```typescript
const tool_results = await Promise.all(
  tool_calls.map(async (call) => {
    const tool = tools.find(t => t.name === call.function.name);
    const args = call.function.arguments ? JSON.parse(call.function.arguments) : {};
    return await tool.func(agent, args);
  })
);
```

## Performance Characteristics

- **Context Creation**: O(1) - Shallow copying
- **Metadata Lookup**: O(n) - Checks brokers then local
- **Tool Deduplication**: O(n) - Single pass with reduce + object spread
- **Message Concatenation**: O(n) - Array concat
- **Provider Failover**: O(p) worst case - p = number of providers

## Scalability

**Vertical Scaling**:
- Single agent instance per conversation
- In-memory state management
- Stateless providers

**Horizontal Scaling**:
- Multiple agent instances across processes
- External state storage (database) if needed
- Load balancing across provider instances

## Security Considerations

1. **API Keys**: Never hardcode, use environment variables
2. **Input Validation**: Validate tool parameters
3. **Rate Limiting**: Implement provider-level throttling
4. **Error Handling**: Catch and sanitize error messages
5. **Logging**: Avoid logging sensitive user data

## Next Steps

- **[Performance](performance.md)** - Optimization techniques
- **[Troubleshooting](troubleshooting.md)** - Common issues
- **[Migration Guide](migration.md)** - Version upgrades

---

**[<- Back to Advanced](../index.md#advanced)**
