# Message

**Message** represents individual messages in a conversation between users, AI assistants, tools, and the system. It provides type-safe message handling with discriminated unions for different message roles.

## Overview

Messages are the building blocks of conversations, categorized by role:

- **user**: Messages from the end user
- **assistant**: Responses from the AI agent
- **tool**: Results from tool executions
- **system**: System-level instructions and context

## Constructor

```typescript
new Message<T extends MessageOptions>(options: T)
```

Creates a new message with role-specific options. The class is generic over `T` which determines the conditional types of `tool_call_id` and `tool_calls`.

### MessageOptions (Discriminated Union)

```typescript
type MessageOptions =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: ToolCall[] }
  | { role: "system"; content: string }
  | { role: "tool"; content: string; tool_call_id: string };
```

TypeScript enforces that:
- Tool messages **must** include `tool_call_id`
- Assistant messages can have `null` content only when `tool_calls` is provided
- Assistant messages with `content: null` and no `tool_calls` throw an error at construction

### ToolCall

```typescript
interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}
```

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
  content: "It's sunny with a temperature of 24C."
});
```

**Assistant Message with Tool Calls:**

```typescript
const assistant_tool_msg = new Message({
  role: "assistant",
  content: null,
  tool_calls: [{
    id: "call_abc123",
    type: "function",
    function: { name: "get_weather", arguments: '{"city":"Madrid"}' }
  }]
});
```

**Tool Message:**

```typescript
const tool_message = new Message({
  role: "tool",
  content: JSON.stringify({ temperature: 24, condition: "sunny" }),
  tool_call_id: "call_abc123"
});
```

**System Message:**

```typescript
const system_message = new Message({
  role: "system",
  content: "You are a helpful weather assistant."
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

### content

```typescript
readonly content: string | null
```

The textual content of the message. Can be `null` only for assistant messages that include `tool_calls`.

### tool_call_id

```typescript
readonly tool_call_id: T["role"] extends "tool" ? string : undefined
```

Unique identifier linking a tool result to its corresponding tool call. Conditionally typed: only `string` when `T["role"]` is `"tool"`, otherwise `undefined`.

```typescript
const tool_msg = new Message({
  role: "tool",
  content: "Result data",
  tool_call_id: "call_123"
});
console.log(tool_msg.tool_call_id); // "call_123"

const user_msg = new Message({ role: "user", content: "Hi" });
console.log(user_msg.tool_call_id); // undefined
```

### tool_calls

```typescript
readonly tool_calls: T["role"] extends "assistant" ? ToolCall[] | undefined : undefined
```

Tool calls requested by the assistant. Conditionally typed: only `ToolCall[] | undefined` when `T["role"]` is `"assistant"`, otherwise `undefined`.

```typescript
const assistant_msg = new Message({
  role: "assistant",
  content: null,
  tool_calls: [{
    id: "call_456",
    type: "function",
    function: { name: "search", arguments: '{"q":"test"}' }
  }]
});
console.log(assistant_msg.tool_calls?.length); // 1

const user_msg = new Message({ role: "user", content: "Hi" });
console.log(user_msg.tool_calls); // undefined
```

### timestamp

```typescript
readonly timestamp: Date
```

Automatic timestamp when the message was created.

### length

```typescript
get length(): number
```

Returns the character length of the message content. Returns 0 if content is `null`.

## Validation

Messages are validated during construction:

```typescript
// Missing role
new Message({ content: "Hello" } as any);
// throws: "El rol del mensaje es requerido"

// Tool message without tool_call_id
new Message({ role: "tool", content: "Data" } as any);
// throws: "Los mensajes de herramienta requieren un tool_call_id"

// Assistant with null content and no tool_calls
new Message({ role: "assistant", content: null } as any);
// throws: "Los mensajes assistant con content null requieren tool_calls"
```

## Methods

### toJSON()

```typescript
toJSON(): {
  role: MessageRole;
  content: string | null;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
  timestamp: string;
}
```

Serializes the message to JSON format. The timestamp is converted to ISO 8601 string. Only includes `tool_call_id` and `tool_calls` when they are truthy.

**Example:**

```typescript
const msg = new Message({
  role: "assistant",
  content: null,
  tool_calls: [{
    id: "call_789",
    type: "function",
    function: { name: "search", arguments: '{}' }
  }]
});

console.log(JSON.stringify(msg, null, 2));
// {
//   "role": "assistant",
//   "content": null,
//   "tool_calls": [{ "id": "call_789", "type": "function", "function": { "name": "search", "arguments": "{}" } }],
//   "timestamp": "2025-10-12T10:30:45.123Z"
// }
```

### toString()

```typescript
toString(): string
```

Returns human-readable string representation. Long content is truncated to 50 characters.

**Returns:** String in format `"Message(role) [tool_call_id] [N tool calls]: content"`

```typescript
const msg = new Message({
  role: "assistant",
  content: null,
  tool_calls: [{ id: "c1", type: "function", function: { name: "search", arguments: "{}" } }]
});

console.log(msg.toString());
// "Message(assistant) [1 tool calls]: (no content)"
```

## Usage Patterns

### Pattern: Conversation Building

```typescript
const conversation: Message[] = [
  new Message({ role: "system", content: "You are a helpful assistant" }),
  new Message({ role: "user", content: "I need help with my order" }),
  new Message({ role: "assistant", content: "What's your order number?" }),
  new Message({ role: "user", content: "Order #12345" })
];

agent.messages = conversation;
```

### Pattern: Full Tool Call Flow

```typescript
// 1. User asks
const user_msg = new Message({
  role: "user",
  content: "What's the weather in Madrid?"
});

// 2. Assistant decides to call tool (content null, tool_calls present)
const assistant_call = new Message({
  role: "assistant",
  content: null,
  tool_calls: [{
    id: "call_weather_001",
    type: "function",
    function: { name: "get_weather", arguments: '{"city":"Madrid"}' }
  }]
});

// 3. Tool returns result
const tool_result = new Message({
  role: "tool",
  content: JSON.stringify({ temperature: 24, condition: "sunny" }),
  tool_call_id: "call_weather_001"
});

// 4. Assistant responds with tool result
const assistant_response = new Message({
  role: "assistant",
  content: "It's sunny in Madrid with a temperature of 24C!"
});
```

### Pattern: Message Filtering

```typescript
const user_messages = conversation.filter(m => m.role === "user");
const assistant_responses = conversation.filter(m => m.role === "assistant");
const tool_results = conversation.filter(m => m.role === "tool");
```

## Related

- **[Context](context.md)** - Manages message history
- **[Agent](agent.md)** - Creates and processes messages
- **[Tool](tool.md)** - Generates tool messages
- **[Core Concepts](../guides/core-concepts.md)** - Architecture overview

---

**Next:** Learn about [Providers ->](providers.md)
