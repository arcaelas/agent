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
- `call(prompt)` - Execute conversation with providers and tools
- `get/set metadata`, `rules`, `tools`, `messages` - Access context properties

**Execution Flow** (`call` method):
1. Add user message to context
2. Loop through providers with failover
3. Call provider with current context
4. If response includes tool_calls, execute them in parallel
5. Add tool results to context and loop again
6. Return when completion has no tool_calls

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
  _brokers: Metadata[]   // Parent metadatas
  _storage: Map          // Local storage

  get(key) {
    // Check local first
    // Then check brokers in order
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
- `func` - Executable function

### 5. Rule

**Responsibility**: Define behavioral guidelines

**Types**:
- **Static**: `new Rule(content)` - Always applies
- **Conditional**: `new Rule(content, { when })` - Applies when condition met

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
type Provider = (ctx: Context) => ChatCompletionResponse | Promise<ChatCompletionResponse>
```

**Contract**:
- Input: Context with messages, tools, metadata
- Output: ChatCompletionResponse (OpenAI-compatible format)

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
  | { role: 'tool'; tool_id: string; content: string }
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
