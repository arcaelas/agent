# Arcaelas Agent Documentation

Welcome to **@arcaelas/agent** - a production-ready TypeScript library for building sophisticated AI agents with multi-provider support, reactive contexts, streaming, and intelligent tool orchestration.

## What is Arcaelas Agent?

@arcaelas/agent enables you to create AI agents that scale from simple chatbots to complex organizational workflows through:

- **Multi-Provider Support** - Automatic failover between OpenAI, Anthropic, Groq, and custom APIs
- **Reactive Architecture** - Hierarchical context inheritance with automatic state management
- **Tool Ecosystem** - Built-in HTTP tools and seamless custom function integration
- **Streaming** - Real-time response streaming via `Agent.stream()` with full tool-call loop support
- **Full TypeScript** - Complete type safety with discriminated unions and generics

## Quick Start

### Installation

```bash
yarn add @arcaelas/agent
```

### Your First Agent

```typescript
import { Agent, Context } from '@arcaelas/agent';
import type { Provider } from '@arcaelas/agent';

const my_provider: Provider = async (ctx: Context) => {
  // ctx contains messages, tools, metadata, rules
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: ctx.messages.map(m => ({ role: m.role, content: m.content }))
    })
  });
  return await response.json();
};

const assistant = new Agent({
  name: "Personal_Assistant",
  description: "Helpful assistant for daily tasks",
  providers: [my_provider]
});

// Non-streaming
const [messages, success] = await assistant.call("What's the weather like today?");

// Streaming
for await (const chunk of assistant.stream("Tell me a joke")) {
  if (chunk.role === "assistant") process.stdout.write(chunk.content);
}
```

**[Continue with the full tutorial ->](guides/getting-started.md)**

## Core Architecture

### Agent

Central orchestrator combining identity, behavior, tools, and AI providers.

```typescript
const agent = new Agent({
  name: "Support_Agent",
  description: "Customer support specialist",
  tools: [search_tool, database_tool],
  rules: [professional_rule],
  providers: [openai_provider]
});
```

**[Learn more ->](api/agent.md)**

### Context

Hierarchical state management with automatic inheritance.

```typescript
const parent_context = new Context({
  metadata: new Metadata().set("company", "Acme Corp"),
  rules: [new Rule("Maintain professional tone")]
});

const child_context = new Context({
  context: parent_context,  // Inherits from parent
  metadata: new Metadata().set("department", "Sales")
});
```

**[Learn more ->](api/context.md)**

### Tools

Extensible functions for external integrations.

```typescript
const weather_tool = new Tool("get_weather", {
  description: "Get current weather for any city",
  parameters: {
    city: "City name",
    units: "Temperature units (celsius/fahrenheit)"
  },
  func: async (agent, { city, units }) => {
    return `Weather in ${city}: Sunny, 24C`;
  }
});
```

**[Learn more ->](api/tool.md)**

## Documentation

### Guides

- **[Getting Started](guides/getting-started.md)** - Complete tutorial
- **[Core Concepts](guides/core-concepts.md)** - Architecture overview
- **[Providers](guides/providers.md)** - Multi-provider setup
- **[Best Practices](guides/best-practices.md)** - Production patterns

### API Reference

- **[Agent](api/agent.md)** - Main orchestrator
- **[Context](api/context.md)** - State management
- **[Metadata](api/metadata.md)** - Key-value store
- **[Tool](api/tool.md)** - Custom functions
- **[Rule](api/rule.md)** - Behavioral guidelines
- **[Message](api/message.md)** - Conversation messages
- **[Providers](api/providers.md)** - Provider functions
- **[Built-in Tools](api/built-in-tools.md)** - RemoteTool & TimeTool

### Examples

- **[Basic Agent](examples/basic-agent.md)** - Simple chatbot
- **[Multi-Provider](examples/multi-provider.md)** - Resilient setup
- **[Custom Tools](examples/custom-tools.md)** - Creating tools
- **[Context Inheritance](examples/context-inheritance.md)** - Enterprise patterns
- **[Advanced Patterns](examples/advanced-patterns.md)** - Complex scenarios

### Advanced

- **[Architecture](advanced/architecture.md)** - Internal design
- **[Performance](advanced/performance.md)** - Optimization
- **[Troubleshooting](advanced/troubleshooting.md)** - Common issues
- **[Migration Guide](advanced/migration.md)** - Version upgrades

## Requirements

- Node.js >= 16.0.0
- TypeScript >= 4.5.0 (optional)

## Links

- [GitHub Repository](https://github.com/arcaelas/agent)
- [NPM Package](https://www.npmjs.com/package/@arcaelas/agent)
- [Issue Tracker](https://github.com/arcaelas/agent/issues)
- [Discord Community](https://discord.gg/arcaelas)

---

**Ready to build intelligent AI agents?** Start with the **[Getting Started Guide](guides/getting-started.md)** ->
