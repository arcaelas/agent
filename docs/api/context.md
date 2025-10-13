# Context

**Context** provides reactive state management with hierarchical inheritance for AI agents. It combines metadata, rules, tools, and messages with automatic propagation from parent contexts.

## Overview

Context is a container class that manages configuration and state for agents through:

- **Reactive Metadata**: Key-value store with automatic inheritance
- **Rules**: Behavioral guidelines that cascade from parent to child
- **Tools**: Function collections with automatic deduplication
- **Messages**: Conversation history with complete lineage

### Key Features

- ✅ Hierarchical inheritance (parent → child)
- ✅ Automatic metadata propagation using broker pattern
- ✅ Tool deduplication by name (child overrides parent)
- ✅ Message history composition (parent + child)
- ✅ Rule aggregation (combined, not replaced)
- ✅ Type-safe with full TypeScript support

## Constructor

```typescript
new Context(options: ContextOptions)
```

### ContextOptions

```typescript
interface ContextOptions {
  /** Parent context(s) for hierarchical inheritance */
  context?: Context | Context[];

  /** Metadata instance(s) for configuration */
  metadata?: Metadata | Metadata[];

  /** Rule instance(s) for behavioral guidelines */
  rules?: Rule | Rule[];

  /** Tool instance(s) for available functions */
  tools?: Tool | Tool[];

  /** Message instance(s) for conversation history */
  messages?: Message | Message[];
}
```

All properties are optional, allowing you to create empty contexts or fully configured ones.

### Examples

**Empty Context:**

```typescript
import { Context } from '@arcaelas/agent';

const ctx = new Context({});
```

**Basic Context:**

```typescript
import { Context, Metadata, Rule } from '@arcaelas/agent';

const ctx = new Context({
  metadata: new Metadata().set("app", "MyApp").set("version", "1.0"),
  rules: [new Rule("Maintain professional tone")]
});

console.log(ctx.metadata.get("app")); // "MyApp"
console.log(ctx.rules.length);        // 1
```

**Context with Inheritance:**

```typescript
const parent_ctx = new Context({
  metadata: new Metadata().set("company", "Acme Corp"),
  rules: [new Rule("Be helpful and courteous")]
});

const child_ctx = new Context({
  context: parent_ctx,  // Inherits everything from parent
  metadata: new Metadata().set("department", "Sales"),
  rules: [new Rule("Focus on customer needs")]
});

console.log(child_ctx.metadata.get("company"));    // "Acme Corp" (inherited)
console.log(child_ctx.metadata.get("department")); // "Sales" (local)
console.log(child_ctx.rules.length);                // 2 (parent + local)
```

**Multiple Parent Contexts:**

```typescript
const auth_ctx = new Context({
  metadata: new Metadata().set("auth_enabled", true)
});

const logging_ctx = new Context({
  metadata: new Metadata().set("log_level", "info")
});

const app_ctx = new Context({
  context: [auth_ctx, logging_ctx],  // Inherits from both
  metadata: new Metadata().set("app_name", "Dashboard")
});

console.log(app_ctx.metadata.get("auth_enabled")); // true
console.log(app_ctx.metadata.get("log_level"));    // "info"
console.log(app_ctx.metadata.get("app_name"));     // "Dashboard"
```

## Properties

### metadata

```typescript
readonly metadata: Metadata
```

Reactive metadata store with automatic inheritance from parent contexts.

**Behavior:**
- Inherits all metadata from parent context(s)
- Local metadata can override inherited values
- Changes propagate using broker pattern

**Example:**

```typescript
const parent = new Context({
  metadata: new Metadata()
    .set("theme", "light")
    .set("lang", "en")
});

const child = new Context({
  context: parent,
  metadata: new Metadata().set("theme", "dark")  // Override
});

console.log(child.metadata.get("theme")); // "dark" (overridden)
console.log(child.metadata.get("lang"));  // "en" (inherited)
```

### rules

```typescript
get rules(): Rule[]
set rules(rules: Rule[])
```

Combined rules from parent context(s) and local rules.

**Behavior:**
- Returns parent rules first, then local rules
- Setter replaces only local rules (doesn't affect parent)
- Rules aggregate (don't deduplicate)

**Example:**

```typescript
const global_ctx = new Context({
  rules: [new Rule("Always be polite")]
});

const sales_ctx = new Context({
  context: global_ctx,
  rules: [new Rule("Focus on benefits")]
});

console.log(sales_ctx.rules.length); // 2

// Replace local rules only
sales_ctx.rules = [
  new Rule("Focus on ROI"),
  new Rule("Use customer testimonials")
];

console.log(sales_ctx.rules.length); // 3 (1 parent + 2 new local)
```

### tools

```typescript
get tools(): Tool[]
set tools(tools: Tool[])
```

Combined tools from parent context(s) and local tools with automatic deduplication by name.

**Behavior:**
- Local tools override parent tools with same name
- Returns unique tools only (no duplicates)
- Setter replaces only local tools

**Example:**

```typescript
import { Tool } from '@arcaelas/agent';

const base_ctx = new Context({
  tools: [
    new Tool("search", async () => "base search"),
    new Tool("analyze", async () => "base analyze")
  ]
});

const enhanced_ctx = new Context({
  context: base_ctx,
  tools: [
    new Tool("search", async () => "enhanced search"),  // Overrides parent
    new Tool("translate", async () => "translation")     // New tool
  ]
});

const all_tools = enhanced_ctx.tools;
console.log(all_tools.map(t => t.name)); // ["analyze", "translate", "search"]

// "search" uses enhanced version, not base version
```

### messages

```typescript
get messages(): Message[]
set messages(messages: Message[])
```

Combined message history from parent context(s) and local messages.

**Behavior:**
- Returns parent messages first, then local messages
- Maintains chronological order (parent → child)
- Setter replaces only local messages

**Example:**

```typescript
import { Message } from '@arcaelas/agent';

const parent_ctx = new Context({
  messages: [
    new Message({ role: "system", content: "You are a helpful assistant" })
  ]
});

const child_ctx = new Context({
  context: parent_ctx,
  messages: [
    new Message({ role: "user", content: "Hello!" })
  ]
});

console.log(child_ctx.messages.length); // 2

// Add new message
child_ctx.messages.push(
  new Message({ role: "assistant", content: "Hi there!" })
);

console.log(child_ctx.messages.length); // 3
```

## Inheritance Rules

Understanding how properties are inherited:

| Property | Inheritance Behavior | Override Behavior | Deduplication |
|----------|---------------------|-------------------|---------------|
| **metadata** | Merged (parent + child) | Child overrides parent keys | By key |
| **rules** | Concatenated (parent + child) | No override, aggregates | None |
| **tools** | Merged (parent + child) | Child overrides by name | By name |
| **messages** | Concatenated (parent + child) | No override, aggregates | None |

### Visualization

```typescript
const parent = new Context({
  metadata: new Metadata().set("a", 1).set("b", 2),
  rules: [new Rule("R1")],
  tools: [new Tool("T1", async () => "parent")],
  messages: [new Message({ role: "system", content: "M1" })]
});

const child = new Context({
  context: parent,
  metadata: new Metadata().set("b", 3).set("c", 4),  // 'b' overrides
  rules: [new Rule("R2")],                             // Adds to R1
  tools: [new Tool("T1", async () => "child")],       // Replaces T1
  messages: [new Message({ role: "user", content: "M2" })]  // Adds to M1
});

// Results:
// metadata.all() = { a: 1, b: 3, c: 4 }
// rules.length = 2 (R1, R2)
// tools.length = 1 (T1 from child)
// messages.length = 2 (M1, M2)
```

## Common Patterns

### Pattern: Configuration Layers

Create hierarchical configuration with global → department → team layers:

```typescript
// Global company context
const company_ctx = new Context({
  metadata: new Metadata()
    .set("company", "Acme Corp")
    .set("compliance", "GDPR"),
  rules: [new Rule("Protect customer privacy")]
});

// Department context
const sales_ctx = new Context({
  context: company_ctx,
  metadata: new Metadata().set("department", "Sales"),
  rules: [new Rule("Focus on customer value")],
  tools: [crm_tool, quote_tool]
});

// Team context
const team_a_ctx = new Context({
  context: sales_ctx,
  metadata: new Metadata().set("team", "Team A").set("region", "EMEA"),
  rules: [new Rule("Respond in customer's timezone")]
});
```

### Pattern: Feature Flags

Use metadata for feature toggles:

```typescript
const base_ctx = new Context({
  metadata: new Metadata()
    .set("feature_analytics", true)
    .set("feature_experimental", false)
});

const beta_ctx = new Context({
  context: base_ctx,
  metadata: new Metadata().set("feature_experimental", true)  // Enable for beta
});

// Check feature flags
if (beta_ctx.metadata.get("feature_experimental")) {
  // Use experimental features
}
```

### Pattern: Tool Composition

Build specialized tool sets through inheritance:

```typescript
const basic_tools_ctx = new Context({
  tools: [time_tool, weather_tool]
});

const advanced_tools_ctx = new Context({
  context: basic_tools_ctx,
  tools: [database_tool, api_tool]  // Adds to basic tools
});

const specialized_ctx = new Context({
  context: advanced_tools_ctx,
  tools: [
    new Tool("weather", custom_weather_impl)  // Override weather
  ]
});
```

### Pattern: Conversation Templates

Reuse conversation starters:

```typescript
const support_template = new Context({
  messages: [
    new Message({
      role: "system",
      content: "You are a customer support specialist. Be helpful and empathetic."
    }),
    new Message({
      role: "assistant",
      content: "Hello! How can I help you today?"
    })
  ]
});

// Create new conversation from template
const customer_session = new Context({
  context: support_template,
  metadata: new Metadata()
    .set("customer_id", "12345")
    .set("priority", "high")
});
```

## Best Practices

### 1. Keep Contexts Focused

Each context should represent a single concern:

```typescript
// ✅ Good: Focused contexts
const auth_ctx = new Context({
  metadata: new Metadata().set("auth_enabled", true)
});

const logging_ctx = new Context({
  metadata: new Metadata().set("log_level", "info")
});

// ❌ Bad: Too many concerns in one context
const everything_ctx = new Context({
  metadata: new Metadata()
    .set("auth_enabled", true)
    .set("log_level", "info")
    .set("theme", "dark")
    .set("cache_ttl", 3600)
    // ... many more unrelated settings
});
```

### 2. Use Clear Naming

Name contexts based on their scope:

```typescript
const global_ctx = new Context({ /* ... */ });
const company_ctx = new Context({ context: global_ctx });
const department_ctx = new Context({ context: company_ctx });
const team_ctx = new Context({ context: department_ctx });
const user_ctx = new Context({ context: team_ctx });
```

### 3. Minimize Context Depth

Avoid deeply nested hierarchies (max 3-4 levels):

```typescript
// ✅ Good: Reasonable depth
app → department → team

// ❌ Bad: Too deep
global → org → region → country → state → city → office → department → team
```

### 4. Document Override Behavior

When overriding tools or metadata, document why:

```typescript
const custom_ctx = new Context({
  context: base_ctx,
  tools: [
    // Override default search with custom implementation
    // for better performance with our database
    new Tool("search", custom_search_implementation)
  ]
});
```

## Type Safety

Context is fully typed with TypeScript:

```typescript
import { Context, ContextOptions, Metadata, Rule, Tool, Message } from '@arcaelas/agent';

// All types are inferred
const ctx = new Context({
  metadata: new Metadata(),  // Type: Metadata
  rules: [new Rule("...")],  // Type: Rule[]
  tools: [new Tool("...", async () => "")],  // Type: Tool[]
  messages: [new Message({ role: "user", content: "..." })]  // Type: Message[]
});

// Property types are enforced
const metadata: Metadata = ctx.metadata;        // ✅
const rules: Rule[] = ctx.rules;                // ✅
const tools: Tool[] = ctx.tools;                // ✅
const messages: Message[] = ctx.messages;       // ✅
```

## Related

- **[Metadata](metadata.md)** - Key-value store used by Context
- **[Rule](rule.md)** - Behavioral guidelines managed by Context
- **[Tool](tool.md)** - Functions orchestrated by Context
- **[Message](message.md)** - Conversation history in Context
- **[Agent](agent.md)** - Uses Context for configuration
- **[Context Inheritance Example](../examples/context-inheritance.md)** - Practical patterns

---

**Next:** Learn about [Metadata →](metadata.md)
