# Providers

**Providers** are functions that integrate AI services (OpenAI, Anthropic, Groq, etc.) with agents. They receive context and return chat completions in OpenAI-compatible format.

## Overview

Providers enable multi-provider failover and vendor flexibility through a standard interface.

### Key Features

- ✅ Standard OpenAI ChatCompletion format
- ✅ Automatic failover between providers
- ✅ Support for any AI service (OpenAI, Anthropic, Groq, custom)
- ✅ Access to full agent context
- ✅ Tool call support

## Provider Function Signature

```typescript
type Provider = (context: Agent) => Promise<ChatCompletion>;
```

**Parameters:**
- **context**: Full agent instance with messages, tools, rules, metadata

**Returns:** OpenAI-compatible ChatCompletion object

## ChatCompletion Format

```typescript
interface ChatCompletion {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: "assistant";
      content: string;
      tool_calls?: Array<{
        id: string;
        type: "function";
        function: {
          name: string;
          arguments: string;  // JSON string
        };
      }>;
    };
    finish_reason: "stop" | "tool_calls" | "length" | null;
  }>;
}
```

## Provider Examples

### OpenAI Provider

```typescript
import OpenAI from 'openai';
import type { Provider } from '@arcaelas/agent';

const openai_provider: Provider = async (agent) => {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  return await openai.chat.completions.create({
    model: "gpt-4",
    messages: agent.messages.map(m => ({
      role: m.role,
      content: m.content,
      ...(m.tool_id && { tool_call_id: m.tool_id })
    })),
    tools: agent.tools?.map(tool => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: "object",
          properties: tool.parameters,
          required: Object.keys(tool.parameters)
        }
      }
    }))
  });
};
```

### Anthropic Provider

```typescript
import Anthropic from '@anthropic-ai/sdk';
import type { Provider } from '@arcaelas/agent';

const anthropic_provider: Provider = async (agent) => {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

  const response = await anthropic.messages.create({
    model: "claude-3-sonnet-20240229",
    max_tokens: 4000,
    messages: agent.messages
      .filter(m => m.role !== "system")
      .map(m => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content
      }))
  });

  // Convert Anthropic format to OpenAI format
  return {
    id: response.id,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: "claude-3-sonnet",
    choices: [{
      index: 0,
      message: {
        role: "assistant",
        content: response.content[0].type === "text"
          ? response.content[0].text
          : ""
      },
      finish_reason: "stop"
    }]
  };
};
```

### Groq Provider

```typescript
import Groq from 'groq-sdk';
import type { Provider } from '@arcaelas/agent';

const groq_provider: Provider = async (agent) => {
  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
  });

  return await groq.chat.completions.create({
    model: "llama-3.1-70b-versatile",
    messages: agent.messages.map(m => ({
      role: m.role,
      content: m.content
    })),
    tools: agent.tools?.map(tool => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: "object",
          properties: tool.parameters
        }
      }
    }))
  });
};
```

## Multi-Provider Setup

Configure automatic failover:

```typescript
import { Agent } from '@arcaelas/agent';

const agent = new Agent({
  name: "Resilient_Assistant",
  description: "High-availability AI assistant",
  providers: [
    openai_provider,      // Primary (fastest)
    groq_provider,        // Backup (fast alternative)
    anthropic_provider    // Fallback (reliable)
  ]
});

// Agent automatically tries providers in order on failure
const [messages, success] = await agent.call("Hello");
```

## Best Practices

### 1. Handle Errors Gracefully

```typescript
const safe_provider: Provider = async (agent) => {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    return await openai.chat.completions.create({...});
  } catch (error) {
    console.error("Provider failed:", error);
    throw error;  // Let agent try next provider
  }
};
```

### 2. Implement Timeouts

```typescript
const timeout_provider: Provider = async (agent) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);  // 30s timeout

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
};
```

### 3. Use Environment Variables

```typescript
const secure_provider: Provider = async (agent) => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL  // Optional custom endpoint
  });

  return await openai.chat.completions.create({...});
};
```

### 4. Log Provider Usage

```typescript
const logged_provider: Provider = async (agent) => {
  const start = Date.now();

  try {
    const response = await openai_provider(agent);
    const duration = Date.now() - start;

    console.log({
      provider: "openai",
      model: response.model,
      duration_ms: duration,
      tokens: response.usage?.total_tokens,
      success: true
    });

    return response;
  } catch (error) {
    console.error({
      provider: "openai",
      duration_ms: Date.now() - start,
      error: error.message,
      success: false
    });
    throw error;
  }
};
```

## Related

- **[Agent](agent.md)** - Uses providers for completions
- **[Message](message.md)** - Provider input/output format
- **[Tool](tool.md)** - Providers handle tool calls
- **[Providers Guide](../guides/providers.md)** - Detailed provider setup

---

**Next:** Learn about [Built-in Tools →](built-in-tools.md)
