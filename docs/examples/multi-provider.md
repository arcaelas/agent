# Multi-Provider Setup Example

This example demonstrates how to configure an agent with multiple AI providers for automatic failover and resilience.

## Overview

Multi-provider setup is essential for production applications where reliability is critical. The agent automatically switches between providers if one fails, ensuring uninterrupted service.

Key benefits:
- **Automatic failover** - Seamless switching on provider errors
- **Load distribution** - Random selection among available providers
- **Cost optimization** - Mix expensive and cheaper providers
- **Service diversity** - Avoid single-point-of-failure

## Provider Type

The `Provider` type is dual-mode with two overloads:

```typescript
type Provider = {
  (ctx: Context): ChatCompletionResponse | Promise<ChatCompletionResponse>;
  (ctx: Context, opts: { stream: true }): AsyncIterable<ProviderChunk>;
};
```

Providers always receive `Context` as first argument, and an optional `{ stream: true }` as second.

## Complete Example

```typescript
import { Agent, Context } from '@arcaelas/agent';
import type { Provider, ChatCompletionResponse, ProviderChunk } from '@arcaelas/agent';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import Groq from 'groq-sdk';

// Initialize clients
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// --- OpenAI provider (dual-mode) ---
const openai_provider: Provider = ((ctx: Context, opts?: { stream: true }) => {
  if (opts?.stream) {
    return (async function* () {
      const stream = await openai.chat.completions.create({
        model: "gpt-4",
        stream: true,
        messages: ctx.messages.map(m => m.toJSON()),
        tools: ctx.tools.map(t => t.toJSON())
      });
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        if (delta?.content) {
          yield { type: "text_delta", content: delta.content } as ProviderChunk;
        }
        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            yield {
              type: "tool_call_delta",
              index: tc.index,
              id: tc.id,
              name: tc.function?.name,
              arguments_delta: tc.function?.arguments
            } as ProviderChunk;
          }
        }
      }
      yield { type: "finish", finish_reason: "stop" } as ProviderChunk;
    })();
  }

  return openai.chat.completions.create({
    model: "gpt-4",
    messages: ctx.messages.map(m => m.toJSON()),
    tools: ctx.tools.map(t => t.toJSON())
  });
}) as Provider;

// --- Anthropic provider (dual-mode) ---
// Transforms Claude API format to ChatCompletionResponse
const anthropic_provider: Provider = ((ctx: Context, opts?: { stream: true }) => {
  const claude_messages = ctx.messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'assistant' as const : 'user' as const,
      content: m.content || ''
    }));

  const system_message = ctx.messages.find(m => m.role === 'system');

  if (opts?.stream) {
    return (async function* () {
      const stream = anthropic.messages.stream({
        model: "claude-3-sonnet-20240229",
        max_tokens: 1024,
        system: system_message?.content || '',
        messages: claude_messages
      });
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          yield { type: "text_delta", content: event.delta.text } as ProviderChunk;
        }
      }
      yield { type: "finish", finish_reason: "stop" } as ProviderChunk;
    })();
  }

  return (async () => {
    const response = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 1024,
      system: system_message?.content || '',
      messages: claude_messages
    });

    // Map Claude finish_reason to ChatCompletion finish_reason:
    //   end_turn   -> stop
    //   tool_use   -> tool_calls
    //   max_tokens -> length
    const finish_map: Record<string, string> = {
      end_turn: "stop",
      tool_use: "tool_calls",
      max_tokens: "length"
    };

    return {
      id: response.id,
      object: 'chat.completion' as const,
      created: Math.floor(Date.now() / 1000),
      model: response.model,
      choices: [{
        index: 0,
        message: {
          role: 'assistant' as const,
          content: response.content[0]?.type === 'text'
            ? response.content[0].text
            : null
        },
        finish_reason: (finish_map[response.stop_reason ?? ''] ?? null) as any
      }],
      usage: {
        prompt_tokens: response.usage.input_tokens,
        completion_tokens: response.usage.output_tokens,
        total_tokens: response.usage.input_tokens + response.usage.output_tokens
      }
    } satisfies ChatCompletionResponse;
  })();
}) as Provider;

// --- Groq provider (dual-mode) ---
const groq_provider: Provider = ((ctx: Context, opts?: { stream: true }) => {
  if (opts?.stream) {
    return (async function* () {
      const stream = await groq.chat.completions.create({
        model: "mixtral-8x7b-32768",
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

  return groq.chat.completions.create({
    model: "mixtral-8x7b-32768",
    messages: ctx.messages.map(m => m.toJSON())
  });
}) as Provider;

// Create resilient agent with failover
const resilient_agent = new Agent({
  name: "Resilient_Assistant",
  description: "High-availability AI assistant with automatic failover",
  providers: [
    openai_provider,      // Primary (best quality)
    anthropic_provider,   // Backup 1 (reliable alternative)
    groq_provider         // Backup 2 (fast and free)
  ]
});

// --- Using call() ---
async function chat_with_failover() {
  const [messages, success] = await resilient_agent.call(
    "Explain the concept of async/await in JavaScript"
  );

  if (success) {
    const response = messages[messages.length - 1].content;
    console.log("Response:", response);
  } else {
    console.error("All providers failed");
  }
}

// --- Using stream() with failover ---
async function stream_with_failover() {
  for await (const chunk of resilient_agent.stream("Explain async/await")) {
    if (chunk.role === "assistant") {
      process.stdout.write(chunk.content);
    }
  }
}

chat_with_failover();
```

## Failover Behavior

The agent implements intelligent failover:

1. **Random Selection** - Providers are selected randomly from available pool
2. **Automatic Retry** - Failed providers are moved to fallback pool
3. **Continuous Attempt** - Keeps trying until success or all fail
4. **State Preservation** - Conversation history maintained across providers

### Failover Flow

```
+--------------+
| User Prompt  |
+------+-------+
       |
       v
+------------------+
| Random Provider  |<--+
| Selection        |   |
+------+-----------+   |
       |               |
       v               |
  +---------+          |
  | Success?|--No--+   |
  +----+----+      |   |
       |Yes        |   |
       v           v   |
  +---------+  +---------------+
  | Return  |  | Move to       |
  | Response|  | Fallback &    |--+
  +---------+  | Try Next      |
               +---------------+
```

## Provider Strategy Patterns

### Pattern 1: Quality-First

Prioritize quality, use cheaper options as backup:

```typescript
const quality_first_agent = new Agent({
  name: "Premium_Agent",
  description: "Prefers best quality responses",
  providers: [
    gpt4_provider,           // Expensive but best
    claude3_opus_provider,   // Also premium
    gpt35_turbo_provider     // Cheaper fallback
  ]
});
```

### Pattern 2: Speed-First

Prioritize fast responses:

```typescript
const speed_first_agent = new Agent({
  name: "Fast_Agent",
  description: "Optimized for quick responses",
  providers: [
    groq_provider,           // Very fast
    gpt35_turbo_provider,    // Also fast
    gpt4_provider            // Slower fallback
  ]
});
```

### Pattern 3: Cost-Optimized

Balance cost and quality:

```typescript
const cost_optimized_agent = new Agent({
  name: "Budget_Agent",
  description: "Cost-effective AI assistant",
  providers: [
    groq_provider,           // Free
    gpt35_turbo_provider,    // Cheap
    claude_haiku_provider    // Also cheap
  ]
});
```

## Environment Configuration

Store API keys securely:

```bash
# .env file
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GROQ_API_KEY=gsk_...
```

Load with dotenv:

```typescript
import 'dotenv/config';
```

## Error Handling

Monitor provider failures:

```typescript
const monitored_provider: Provider = ((ctx: Context, opts?: { stream: true }) => {
  const start = Date.now();

  if (opts?.stream) {
    return (async function* () {
      try {
        const chunks = openai_provider(ctx, { stream: true });
        for await (const chunk of chunks) {
          yield chunk;
        }
        console.log(`Stream provider succeeded in ${Date.now() - start}ms`);
      } catch (error) {
        console.error('Stream provider failed:', error.message);
        throw error;
      }
    })();
  }

  return (async () => {
    try {
      const response = await openai_provider(ctx);
      console.log(`Provider succeeded in ${Date.now() - start}ms`);
      return response;
    } catch (error) {
      console.error('Provider failed:', error.message);
      throw error;
    }
  })();
}) as Provider;
```

## Testing Failover

Simulate failures to test resilience:

```typescript
// Create a failing provider (dual-mode)
const failing_provider: Provider = ((ctx: Context, opts?: { stream: true }) => {
  throw new Error('Simulated failure');
}) as Provider;

// Test agent with simulated failure
const test_agent = new Agent({
  name: "Test_Agent",
  description: "Testing failover behavior",
  providers: [
    failing_provider,  // Always fails
    openai_provider    // Should take over
  ]
});

const [messages, success] = await test_agent.call("Test message");
console.log(success); // true (failover worked)
```

## Best Practices

1. **Order Matters** - Place preferred providers first
2. **Diverse Providers** - Mix different AI services for better resilience
3. **Monitor Failures** - Log which providers fail and why
4. **Rate Limits** - Consider rate limits when using multiple instances
5. **Cost Tracking** - Monitor token usage across providers
6. **Timeout Configuration** - Set appropriate timeouts for each provider

## Common Issues

### Issue: All providers fail

```typescript
const [messages, success] = await agent.call(prompt);

if (!success) {
  // Check network connectivity
  // Verify API keys
  // Review error logs
  console.error("All providers exhausted");
}
```

### Issue: Slow failover

Add timeout to providers:

```typescript
const timeout_provider: Provider = ((ctx: Context, opts?: { stream: true }) => {
  if (opts?.stream) {
    return openai_provider(ctx, { stream: true });
  }
  return Promise.race([
    openai_provider(ctx),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), 5000)
    )
  ]);
}) as Provider;
```

## Next Steps

- **[Custom Tools](custom-tools.md)** - Add tools to your agent
- **[Context Inheritance](context-inheritance.md)** - Share configuration across agents
- **[Advanced Patterns](advanced-patterns.md)** - Complex multi-agent workflows

---

**[Back to Examples](../index.md#examples)**
