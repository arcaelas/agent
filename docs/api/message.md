# Message

**Message** represents individual messages in a conversation between users, AI assistants, tools, and the system. It provides type-safe message handling with discriminated unions for different message roles.

## Overview

Messages are the building blocks of conversations, categorized by role:

- **user**: Messages from the end user
- **assistant**: Responses from the AI agent
- **tool**: Results from tool executions
- **system**: System-level instructions and context

### Key Features

- ✅ Type-safe role discrimination
- ✅ Automatic timestamp tracking
- ✅ Required `tool_id` for tool messages
- ✅ JSON serialization support
- ✅ Built-in validation

## Constructor

```typescript
new Message(options: MessageOptions)
```

Creates a new message with role-specific options.

### MessageOptions

```typescript
type MessageOptions =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string }
  | { role: "system"; content: string }
  | { role: "tool"; content: string; tool_id: string };
```

TypeScript enforces that tool messages must include `tool_id`.

### Examples

**User Message:**

```typescript
import { Message } from '@arcaelas/agent';

const user_message = new Message({
  role: "user",
  content: "What's the weather like today?"
});
```

**Assistant Message:**

```typescript
const assistant_message = new Message({
  role: "assistant",
  content: "It's sunny with a temperature of 24°C. Perfect weather for outdoor activities!"
});
```

**Tool Message:**

```typescript
const tool_message = new Message({
  role: "tool",
  content: JSON.stringify({ temperature: 24, condition: "sunny" }),
  tool_id: "weather_query_12345"
});
```

**System Message:**

```typescript
const system_message = new Message({
  role: "system",
  content: "You are a helpful weather assistant. Provide accurate forecasts and suggestions."
});
```

## Properties

### role

```typescript
readonly role: MessageRole
```

The message role indicating who sent the message.

**Type:**

```typescript
type MessageRole = "user" | "assistant" | "tool" | "system";
```

**Example:**

```typescript
const message = new Message({ role: "user", content: "Hello" });
console.log(message.role); // "user"
```

### content

```typescript
readonly content: string
```

The textual content of the message.

**Example:**

```typescript
const message = new Message({
  role: "assistant",
  content: "I'm here to help you today!"
});

console.log(message.content); // "I'm here to help you today!"
```

### tool_id

```typescript
readonly tool_id: string | undefined
```

Unique identifier for tool messages. Only defined when `role === "tool"`.

**Example:**

```typescript
const tool_msg = new Message({
  role: "tool",
  content: "Result data",
  tool_id: "calculation_001"
});

console.log(tool_msg.tool_id); // "calculation_001"

const user_msg = new Message({ role: "user", content: "Hi" });
console.log(user_msg.tool_id); // undefined
```

### timestamp

```typescript
readonly timestamp: Date
```

Automatic timestamp when the message was created.

**Example:**

```typescript
const message = new Message({ role: "user", content: "Hello" });
console.log(message.timestamp); // Date object
console.log(message.timestamp.toISOString()); // "2025-10-12T10:30:45.123Z"
```

### length

```typescript
get length(): number
```

Returns the character length of the message content.

**Example:**

```typescript
const message = new Message({ role: "user", content: "Hello world" });
console.log(message.length); // 11
```

## Methods

### toJSON()

```typescript
toJSON(): {
  role: MessageRole;
  content: string;
  tool_id?: string;
  timestamp: string;
}
```

Serializes the message to JSON format. The timestamp is converted to ISO 8601 string.

**Returns:** Serializable representation

**Example:**

```typescript
const message = new Message({
  role: "assistant",
  content: "Hello there!"
});

const json = JSON.stringify(message);
console.log(json);
// {
//   "role": "assistant",
//   "content": "Hello there!",
//   "timestamp": "2025-10-12T10:30:45.123Z"
// }

// Tool message with tool_id
const tool_msg = new Message({
  role: "tool",
  content: "Data",
  tool_id: "calc_123"
});

console.log(tool_msg.toJSON());
// {
//   role: "tool",
//   content: "Data",
//   tool_id: "calc_123",
//   timestamp: "..."
// }
```

### toString()

```typescript
toString(): string
```

Returns human-readable string representation. Long content is truncated to 50 characters.

**Returns:** String in format `"Message(role) [tool_id]: content"`

**Example:**

```typescript
const message = new Message({
  role: "user",
  content: "What's the weather?"
});

console.log(message.toString());
// "Message(user): What's the weather?"

const tool_msg = new Message({
  role: "tool",
  content: "Result data here",
  tool_id: "weather_001"
});

console.log(tool_msg.toString());
// "Message(tool) [weather_001]: Result data here"

const long_msg = new Message({
  role: "assistant",
  content: "This is a very long message that will be truncated when displayed as a string representation"
});

console.log(long_msg.toString());
// "Message(assistant): This is a very long message that will be trunca..."
```

## Usage Patterns

### Pattern: Conversation Building

Build conversation history:

```typescript
const conversation: Message[] = [
  new Message({
    role: "system",
    content: "You are a helpful customer service assistant"
  }),
  new Message({
    role: "user",
    content: "I need help with my order"
  }),
  new Message({
    role: "assistant",
    content: "I'd be happy to help! What's your order number?"
  }),
  new Message({
    role: "user",
    content: "Order #12345"
  })
];

// Add to agent
agent.messages = conversation;
```

### Pattern: Tool Result Messages

Handle tool execution results:

```typescript
const user_query = new Message({
  role: "user",
  content: "Search for customers named John"
});

// ... agent calls search_customers tool ...

const tool_result = new Message({
  role: "tool",
  content: JSON.stringify([
    { id: 1, name: "John Smith", email: "john@example.com" },
    { id: 2, name: "John Doe", email: "jdoe@example.com" }
  ]),
  tool_id: "search_customers_001"
});

const assistant_response = new Message({
  role: "assistant",
  content: "I found 2 customers named John..."
});
```

### Pattern: System Instructions

Set agent behavior with system messages:

```typescript
const system_instructions = new Message({
  role: "system",
  content: `You are a sales assistant for an e-commerce platform.
Guidelines:
- Always be enthusiastic about products
- Provide detailed product information
- Suggest complementary items
- Never discuss pricing discounts (that's for managers only)`
});

const agent = new Agent({
  name: "Sales_Assistant",
  description: "E-commerce sales specialist",
  messages: [system_instructions],
  tools: [product_search, inventory_check]
});
```

### Pattern: Message Filtering

Filter messages by role:

```typescript
// Get only user messages
const user_messages = conversation.filter(m => m.role === "user");

// Get only assistant responses
const assistant_responses = conversation.filter(m => m.role === "assistant");

// Get all tool results
const tool_results = conversation.filter(m => m.role === "tool");

// Count messages by role
const message_counts = conversation.reduce((acc, msg) => {
  acc[msg.role] = (acc[msg.role] || 0) + 1;
  return acc;
}, {} as Record<MessageRole, number>);

console.log(message_counts);
// { user: 3, assistant: 2, tool: 1, system: 1 }
```

### Pattern: Conversation Analysis

Analyze conversation history:

```typescript
function analyzeConversation(messages: Message[]) {
  const total_length = messages.reduce((sum, msg) => sum + msg.length, 0);
  const avg_length = total_length / messages.length;

  const last_user_msg = messages
    .filter(m => m.role === "user")
    .pop();

  const tool_calls = messages.filter(m => m.role === "tool").length;

  return {
    total_messages: messages.length,
    average_length: avg_length,
    last_user_message: last_user_msg?.content,
    tool_executions: tool_calls,
    duration: last_msg.timestamp.getTime() - first_msg.timestamp.getTime()
  };
}
```

## Validation

Messages are validated during construction:

```typescript
// ✅ Valid messages
new Message({ role: "user", content: "Hello" });
new Message({ role: "tool", content: "Data", tool_id: "123" });

// ❌ Invalid - missing tool_id for tool message
try {
  new Message({ role: "tool", content: "Data" } as any);
} catch (error) {
  console.error(error); // "Los mensajes de herramienta requieren un tool_id"
}

// ❌ Invalid - missing content
try {
  new Message({ role: "user", content: "" } as any);
} catch (error) {
  console.error(error); // "El contenido del mensaje es requerido"
}

// ❌ Invalid - missing role
try {
  new Message({ content: "Hello" } as any);
} catch (error) {
  console.error(error); // "El rol del mensaje es requerido"
}
```

## Best Practices

### 1. Use Appropriate Roles

Choose the correct role for each message:

```typescript
// ✅ Good: Correct role usage
new Message({ role: "user", content: "User question" });
new Message({ role: "assistant", content: "AI response" });
new Message({ role: "system", content: "Behavior instructions" });
new Message({ role: "tool", content: "Tool output", tool_id: "tool_1" });

// ❌ Bad: Using wrong roles
new Message({ role: "assistant", content: "This is from the user" });  // Wrong
```

### 2. Include Tool IDs

Always provide tool_id for tool messages:

```typescript
// ✅ Good: Tool message with ID
new Message({
  role: "tool",
  content: JSON.stringify({ result: "data" }),
  tool_id: "search_customers_12345"
});

// TypeScript prevents this at compile time:
// new Message({ role: "tool", content: "data" });  // ❌ Type error
```

### 3. Structure Tool Content

Use JSON for structured tool results:

```typescript
// ✅ Good: Structured JSON content
new Message({
  role: "tool",
  content: JSON.stringify({
    status: "success",
    results: [{ id: 1, name: "Item" }],
    count: 1
  }),
  tool_id: "search_001"
});

// ❌ Bad: Unstructured string
new Message({
  role: "tool",
  content: "Found 1 item: Item",
  tool_id: "search_001"
});
```

### 4. Preserve Message Order

Maintain chronological order:

```typescript
// ✅ Good: Chronological conversation
const conversation = [
  system_message,       // First: setup
  user_message_1,       // User starts
  assistant_response_1, // AI responds
  user_message_2,       // User continues
  tool_result_1,        // Tool executed
  assistant_response_2  // AI uses tool result
];

// ❌ Bad: Out of order
const bad_conversation = [
  assistant_response,
  user_message,         // Response before question
  system_message        // Setup after conversation started
];
```

## Type Safety

Message provides full TypeScript type safety:

```typescript
import { Message, MessageOptions, MessageRole } from '@arcaelas/agent';

// Type-safe message creation
const message: Message = new Message({
  role: "user",
  content: "Hello"
});

// Role is strictly typed
const role: MessageRole = message.role;  // ✅ "user" | "assistant" | "tool" | "system"

// Type checking enforces tool_id for tool messages
const tool_msg: Message = new Message({
  role: "tool",
  content: "data",
  tool_id: "required"  // ✅ TypeScript enforces this
});

// Discriminated union allows type narrowing
function handleMessage(msg: Message) {
  if (msg.role === "tool") {
    console.log(msg.tool_id);  // ✅ TypeScript knows tool_id exists here
  }
}
```

## Related

- **[Context](context.md)** - Manages message history
- **[Agent](agent.md)** - Creates and processes messages
- **[Tool](tool.md)** - Generates tool messages
- **[Core Concepts](../guides/core-concepts.md)** - Architecture overview

---

**Next:** Learn about [Providers →](providers.md)
