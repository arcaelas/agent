# Architecture

Internal design and system architecture of @arcaelas/agent.

## System Overview

```
┌─────────────────────────────────────────┐
│             Agent Layer                  │
│  ┌─────────────────────────────────┐   │
│  │  Agent (Orchestrator)            │   │
│  │  - name, description             │   │
│  │  - providers (AI services)       │   │
│  │  - call() method                 │   │
│  └───────────┬─────────────────────┘   │
│              │                           │
└──────────────┼───────────────────────────┘
               │
┌──────────────▼───────────────────────────┐
│          Context Layer                    │
│  ┌─────────────────────────────────┐    │
│  │  Context (State Management)      │    │
│  │  - metadata (reactive KV store)  │    │
│  │  - rules (behavior guidelines)   │    │
│  │  - tools (executable functions)  │    │
│  │  - messages (conversation)       │    │
│  │  - contexts (parent inheritance) │    │
│  └─────────────────────────────────┘    │
└──────────────────────────────────────────┘
```

## Core Components

### 1. Agent

**Responsibility**: Orchestration and execution

**Key Methods**:
- `constructor(options)` - Initialize with configuration
- `call(prompt, opts?)` - Execute conversation with providers and tools
- `stream(input, opts?)` - Stream conversation turn, yielding `StreamChunk`
- `get/set metadata`, `rules`, `tools`, `messages` - Access context properties

**Execution Flow** (`call` method):
1. Run branch pipeline (if `branches` configured): each branch inherits thread + accumulated thinking as `system`
2. Inject last branch thinking as ephemeral `system` message
3. Add user message to context
4. Loop through providers with random selection and failover
5. If response includes tool_calls, execute them in parallel
6. Add tool results to context and repeat
7. Return when completion has no tool_calls; remove ephemeral thinking

### 2. Context

**Responsibility**: Hierarchical state management with inheritance

**Key Features**:
- Parent context inheritance via `contexts` parameter
- Automatic merging of metadata, rules, tools, messages
- Tool deduplication by name (child overrides parent)
- Reactive metadata updates through broker pattern

**Inheritance Rules**:
- **Metadata**: Child can override parent values (last wins)
- **Rules**: Concatenated (parent rules + child rules)
- **Tools**: Deduplicated by name (child tools replace parent)
- **Messages**: Concatenated (parent messages + child messages)

### 3. Metadata

**Responsibility**: Reactive key-value storage with broker pattern

**Architecture**:
```typescript
Metadata {
  _broker: Metadata[]              // Parent metadatas
  _data: Record<string, string | null>  // Local storage (null = deleted)

  get(key) {
    // Walk broker nodes first (accumulating last non-null)
    // Then return _data[key] ?? accumulated result
  }

  set(key, value) {
    // Store in _data (null marks as deleted)
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
- `func` - Executable function

### 5. Rule

**Responsibility**: Define behavioral guidelines

**Single constructor**: `new Rule(description)` — always active. There is no conditional `when` variant.

### 6. Message

**Responsibility**: Represent conversation messages

**Types** (discriminated union):
- `UserMessage` - User input
- `AssistantMessage` - AI response
- `ToolMessage` - Tool result
- `SystemMessage` - System instruction

### 7. Provider

**Responsibility**: Interface with AI services

**Signature**:
```typescript
type Provider = {
  (ctx: Context, opts?: { signal?: AbortSignal }): ChatCompletionResponse | Promise<ChatCompletionResponse>;
  (ctx: Context, opts: { stream: true; signal?: AbortSignal }): AsyncIterable<ProviderChunk>;
};
```

**Contract**:
- Input: `Context` with messages, tools, rules, metadata
- Output (non-stream): `ChatCompletionResponse` (OpenAI-compatible format)
- Output (stream): `AsyncIterable<ProviderChunk>` — includes `thinking_delta` for model reasoning

Built-in provider classes (`OpenAI`, `Groq`, `DeepSeek`, `Claude`, `ClaudeCode`) extend `Function` and are callable as providers. They parse model thinking natively and emit it as `thinking_delta` chunks.

## Data Flow

### Standard Conversation

```
User sends prompt
       │
       ▼
┌──────────────────┐
│ Agent.call()     │
│ - Add user msg   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Provider Loop    │──┐
│ - Random select  │  │ Failover
│ - Try provider   │◄─┘
└────────┬─────────┘
         │
         ▼
  ┌─────────────┐
  │ Tool calls? │
  └──┬──────┬───┘
     │No    │Yes
     │      ▼
     │  ┌────────────────┐
     │  │ Execute tools  │
     │  │ in parallel    │
     │  └───────┬────────┘
     │          │
     │          ▼
     │  ┌────────────────┐
     │  │ Add tool       │
     │  │ results to ctx │
     │  └───────┬────────┘
     │          │
     │          └───┐
     │              │
     ▼              ▼
┌────────────────────┐
│ Return messages    │
│ and success flag   │
└────────────────────┘
```

### Provider Failover

```
PROVIDERS = [P1, P2, P3]
FALLBACK = []

┌──────────────────────┐
│ Random select from   │
│ PROVIDERS or FALLBACK│
└──────────┬───────────┘
           │
           ▼
      ┌─────────┐
      │ Success?│
      └─┬───┬───┘
        │Yes│No
        │   │
        ▼   ▼
    ┌────┐ ┌────────────────────────┐
    │Done│ │Move to FALLBACK & retry│
    └────┘ └────────────────────────┘
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
type Message =
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string }
  | { role: 'tool'; tool_call_id: string; content: string }
  | { role: 'system'; content: string }
```

### 4. Promise.all for Tools

Parallel tool execution using Promise.all:

```typescript
const tool_results = await Promise.all(
  tool_calls.map(async (call) => {
    const tool = tools.find(t => t.name === call.function.name);
    return await tool.func(JSON.parse(call.function.arguments));
  })
);
```

## Performance Characteristics

- **Context Creation**: O(1) - Shallow copying
- **Metadata Lookup**: O(n) - Checks local then brokers
- **Tool Deduplication**: O(n) - Single pass with Map
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

**[← Back to Advanced](../index.md#advanced)**
