# Basic Agent Example

This example demonstrates how to create a simple conversational AI agent with @arcaelas/agent.

## Overview

A basic agent is the simplest form of an AI-powered assistant. It combines:

- A single AI provider (OpenAI in this case)
- Simple conversation management
- No custom tools or complex rules

## Complete Example

```typescript
import { Agent, Context, Message } from '@arcaelas/agent';
import type { Provider, ChatCompletionResponse, ProviderChunk } from '@arcaelas/agent';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://api.openai.com/v1"
});

// Create dual-mode provider function
// Providers receive Context (ctx), NOT Agent
const openai_provider: Provider = ((ctx: Context, opts?: { stream: true }) => {
  if (opts?.stream) {
    // Streaming mode: return AsyncIterable<ProviderChunk>
    return (async function* () {
      const stream = await openai.chat.completions.create({
        model: "gpt-4",
        stream: true,
        messages: ctx.messages.map(m => m.toJSON())
      });
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        if (delta?.content) {
          yield { type: "text_delta", content: delta.content } as ProviderChunk;
        }
      }
      yield { type: "finish", finish_reason: "stop" } as ProviderChunk;
    })();
  }

  // Normal mode: return ChatCompletionResponse
  return openai.chat.completions.create({
    model: "gpt-4",
    messages: ctx.messages.map(m => m.toJSON())
  });
}) as Provider;

// Create basic agent
const chatbot = new Agent({
  name: "Simple_Chatbot",
  description: "A friendly conversational assistant",
  providers: [openai_provider]
});

// --- Using call() ---
async function chat() {
  const [messages1, success1] = await chatbot.call("Hello! What's your name?");

  if (success1) {
    console.log("User:", "Hello! What's your name?");
    console.log("Bot:", messages1[messages1.length - 1].content);
  }

  const [messages2, success2] = await chatbot.call("Can you help me with programming questions?");

  if (success2) {
    console.log("User:", "Can you help me with programming questions?");
    console.log("Bot:", messages2[messages2.length - 1].content);
  }
}

// --- Using stream() ---
async function chatStream() {
  for await (const chunk of chatbot.stream("Hello! What's your name?")) {
    if (chunk.role === "assistant") {
      process.stdout.write(chunk.content);
    }
    if (chunk.role === "tool") {
      console.log(`[${chunk.name}]: ${chunk.content}`);
    }
  }
}

chat();
```

## Step-by-Step Breakdown

### 1. Import Dependencies

```typescript
import { Agent, Context, Message } from '@arcaelas/agent';
import type { Provider, ChatCompletionResponse, ProviderChunk } from '@arcaelas/agent';
import OpenAI from 'openai';
```

### 2. Configure AI Provider

```typescript
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://api.openai.com/v1"
});
```

**Best Practice:** Always use environment variables for API keys.

### 3. Create Provider Function

The Provider type is dual-mode with two overloads:

```typescript
type Provider = {
  (ctx: Context): ChatCompletionResponse | Promise<ChatCompletionResponse>;
  (ctx: Context, opts: { stream: true }): AsyncIterable<ProviderChunk>;
};
```

Providers receive `Context` (not `Agent`). The context exposes `.messages`, `.tools`, `.rules`, and `.metadata`.

```typescript
const openai_provider: Provider = ((ctx: Context, opts?: { stream: true }) => {
  if (opts?.stream) {
    return (async function* () {
      const stream = await openai.chat.completions.create({
        model: "gpt-4",
        stream: true,
        messages: ctx.messages.map(m => m.toJSON())
      });
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        if (delta?.content) {
          yield { type: "text_delta", content: delta.content } as ProviderChunk;
        }
      }
      yield { type: "finish", finish_reason: "stop" } as ProviderChunk;
    })();
  }
  return openai.chat.completions.create({
    model: "gpt-4",
    messages: ctx.messages.map(m => m.toJSON())
  });
}) as Provider;
```

### 4. Initialize Agent

```typescript
const chatbot = new Agent({
  name: "Simple_Chatbot",
  description: "A friendly conversational assistant",
  contexts?: Context | Context[],   // optional parent contexts
  providers: [openai_provider]
});
```

The `contexts` option accepts a single `Context` or an array of `Context` instances for inheritance.

### 5. Send Messages

#### With `call()` (non-streaming)

```typescript
const [messages, success] = await chatbot.call("Hello!");
```

Returns:
- `messages`: Full conversation history as `Message[]`
- `success`: Boolean indicating if the call succeeded

#### With `stream()` (streaming)

```typescript
for await (const chunk of chatbot.stream("Hello!")) {
  if (chunk.role === "assistant") process.stdout.write(chunk.content);
  if (chunk.role === "tool") console.log(`[${chunk.name}]: ${chunk.content}`);
}
```

`stream()` accepts `string | Message | { role: "user" | "assistant", content: string }`.

## Running the Example

1. Install dependencies:

```bash
yarn add @arcaelas/agent openai
```

2. Set environment variable:

```bash
export OPENAI_API_KEY="your-api-key-here"
```

3. Run the script:

```bash
node basic-agent.js
```

## Expected Output

```
User: Hello! What's your name?
Bot: Hello! I'm a friendly conversational assistant. How can I help you today?

User: Can you help me with programming questions?
Bot: Absolutely! I'd be happy to help with programming questions...
```

## Key Concepts

### Conversation History

The agent automatically maintains conversation history across multiple `call()` invocations:

```typescript
await chatbot.call("What's the capital of France?");
// Bot remembers: "Paris"

await chatbot.call("What's the population?");
// Bot knows you're asking about Paris
```

### Error Handling

Always check the `success` flag:

```typescript
const [messages, success] = await chatbot.call("Hello");

if (!success) {
  console.error("Failed to get response");
  return;
}

const response = messages[messages.length - 1].content;
console.log(response);
```

## Customization

### Change Model

```typescript
const openai_provider: Provider = ((ctx: Context, opts?: { stream: true }) => {
  if (opts?.stream) { /* streaming implementation */ }
  return openai.chat.completions.create({
    model: "gpt-3.5-turbo",  // Faster, cheaper
    messages: ctx.messages.map(m => m.toJSON())
  });
}) as Provider;
```

### Add System Instructions

```typescript
import { Message } from '@arcaelas/agent';

const chatbot = new Agent({
  name: "Simple_Chatbot",
  description: "A friendly conversational assistant",
  messages: [
    new Message({
      role: "system",
      content: "You are a helpful assistant that speaks like a pirate."
    })
  ],
  providers: [openai_provider]
});
```

## Next Steps

- **[Multi-Provider Setup](multi-provider.md)** - Add resilience with automatic failover
- **[Custom Tools](custom-tools.md)** - Give your agent superpowers
- **[Context Inheritance](context-inheritance.md)** - Build scalable agent systems

---

**[Back to Home](../index.md#examples)**
