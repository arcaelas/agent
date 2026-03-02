# Getting Started

This guide will walk you through creating your first AI agent with @arcaelas/agent, from installation to deployment.

## Prerequisites

Before you begin, ensure you have:

- **Node.js** >= 16.0.0 installed
- An **OpenAI API key** (get one at [platform.openai.com](https://platform.openai.com))
- Basic knowledge of **TypeScript** or **JavaScript**

## Step 1: Installation

Install @arcaelas/agent and required dependencies:

```bash
yarn add @arcaelas/agent
```

## Step 2: Environment Setup

Create a `.env` file in your project root:

```env
OPENAI_API_KEY=sk-your-actual-api-key-here
```

## Step 3: Your First Agent

Create a file `my-first-agent.ts`:

```typescript
import 'dotenv/config';
import { Agent, OpenAI } from '@arcaelas/agent';

// Create an OpenAI provider
const openai = new OpenAI({
  api_key: process.env.OPENAI_API_KEY!,
  model: "gpt-4"
});

// Create the agent
const assistant = new Agent({
  name: "Personal_Assistant",
  description: "A helpful assistant that answers questions and provides information",
  providers: [openai]
});

// Start conversation
async function main() {
  const [messages, success] = await assistant.call("Hello! Can you introduce yourself?");

  if (success) {
    console.log("Assistant:", messages[messages.length - 1].content);
  } else {
    console.log("Failed to get response");
  }
}

main();
```

Run your agent:

```bash
npx tsx my-first-agent.ts
```

**Expected Output:**
```
Assistant: Hello! I'm your Personal Assistant, here to help answer questions and provide information. How can I assist you today?
```

## Step 4: Adding Tools

Tools allow your agent to perform actions. There are two ways to create tools:

**Simple Tool** -- receives `(agent: Agent, input: string)`:

```typescript
import { Agent, Tool, OpenAI } from '@arcaelas/agent';

const time_tool = new Tool("get_current_time", (agent: Agent, input: string) => {
  return new Date().toLocaleString();
});
```

**Advanced Tool** -- receives typed parameters via `ToolOptions`:

```typescript
const weather_tool = new Tool("get_weather", {
  description: "Get current weather for a city",
  parameters: {
    city: "City name (e.g., 'London', 'New York')"
  },
  func: (agent, { city }) => {
    return `Weather in ${city}: Sunny, 22C`;
  }
});
```

Create agent with tools:

```typescript
const openai = new OpenAI({
  api_key: process.env.OPENAI_API_KEY!,
  model: "gpt-4"
});

const assistant = new Agent({
  name: "Time_Assistant",
  description: "Assistant that can tell the current time",
  tools: [time_tool],
  providers: [openai]
});

const [messages, success] = await assistant.call("What time is it?");
```

The providers automatically receive the tools through the Context. Each built-in provider (OpenAI, Groq, DeepSeek, Claude) passes `ctx.tools` to the API using `tool.toJSON()`, which generates an OpenAI-compatible function calling structure automatically:

```typescript
// tool.toJSON() returns:
{
  type: "function",
  function: {
    name: "get_weather",
    description: "Get current weather for a city",
    parameters: {
      type: "object",
      properties: {
        city: { type: "string", description: "City name (e.g., 'London', 'New York')" }
      }
    }
  }
}
```

The agent will:
1. Receive your question
2. Decide to use the `get_current_time` tool
3. Execute the tool automatically
4. Respond with the current time

## Step 5: Built-in Tools

The library includes two built-in tools ready to use:

**TimeTool** -- provides current date and time with timezone support:

```typescript
import { TimeTool } from '@arcaelas/agent';

const system_time = new TimeTool({});
const madrid_time = new TimeTool({ time_zone: "Europe/Madrid" });
```

**RemoteTool** -- executes HTTP requests to external APIs:

```typescript
import { RemoteTool } from '@arcaelas/agent';

const weather_api = new RemoteTool("get_weather", {
  description: "Get weather information",
  parameters: {
    city: "City name to query"
  },
  http: {
    method: "GET",
    headers: { "X-API-Key": "your-key" },
    url: "https://api.weather.com/v1/current"
  }
});
```

## Step 6: Adding Rules

Rules define how your agent should behave:

```typescript
import { Agent, Rule } from '@arcaelas/agent';

const assistant = new Agent({
  name: "Professional_Assistant",
  description: "Professional customer support agent",
  rules: [
    new Rule("Always maintain a professional and courteous tone"),
    new Rule("Never share confidential information"),
    new Rule("If unsure, admit it rather than making up information")
  ],
  providers: [openai]
});
```

## Step 7: Multi-Provider Setup

Add automatic failover between providers:

```typescript
import { Agent, OpenAI, Claude, Groq } from '@arcaelas/agent';

const resilient_agent = new Agent({
  name: "Resilient_Agent",
  description: "High-availability assistant",
  providers: [
    new OpenAI({ api_key: process.env.OPENAI_API_KEY!, model: "gpt-4" }),
    new Claude({ api_key: process.env.ANTHROPIC_API_KEY!, model: "claude-3-5-sonnet-20241022", max_tokens: 4096 }),
    new Groq({ api_key: process.env.GROQ_API_KEY!, model: "llama-3.1-70b-versatile" })
  ]
});
```

Providers are selected randomly. If one fails, it moves to a fallback pool and retries from remaining providers.

## Step 8: Streaming

Use `agent.stream()` to receive chunks as they arrive instead of waiting for the full response:

```typescript
import { Agent, OpenAI } from '@arcaelas/agent';

const agent = new Agent({
  name: "Stream_Agent",
  description: "Agent with streaming support",
  providers: [new OpenAI({ api_key: process.env.OPENAI_API_KEY!, model: "gpt-4" })]
});

for await (const chunk of agent.stream("Tell me about TypeScript")) {
  if (chunk.role === "assistant") {
    process.stdout.write(chunk.content);
  }
  if (chunk.role === "tool") {
    console.log(`\n[Tool ${chunk.name}]: ${chunk.content}`);
  }
}
```

`stream()` accepts a string, a `Message` instance, or a `{ role, content }` object. It handles the full agentic loop internally: text streaming, tool execution, and re-invocation of the provider. The streaming loop has a `MAX_LOOPS = 10` limit per call.

## Step 9: Context Inheritance

Create reusable contexts for organizational structure:

```typescript
import { Agent, Context, Metadata, Rule } from '@arcaelas/agent';

// Company-wide base context
const company_context = new Context({
  metadata: new Metadata()
    .set("organization", "Acme Corp")
    .set("compliance", "enterprise"),
  rules: [
    new Rule("Maintain professional communication"),
    new Rule("Protect confidential information")
  ]
});

// Department-specific context
const support_context = new Context({
  context: company_context,  // Inherits from company
  metadata: new Metadata().set("department", "Support"),
  tools: [kb_search_tool, ticket_tool]
});

// Create agent with inherited context
const support_agent = new Agent({
  name: "Support_Agent",
  description: "Customer support specialist",
  contexts: support_context,  // Has access to everything
  providers: [openai]
});

// Agent automatically has:
// - Company metadata ("organization", "compliance")
// - Department metadata ("department")
// - Company rules + department rules
// - Department tools
```

## Complete Example

Here's a complete, production-ready example:

```typescript
import 'dotenv/config';
import { Agent, Tool, Rule, Metadata, OpenAI, TimeTool } from '@arcaelas/agent';

// Create utility tools
const weather_tool = new Tool("get_weather", {
  description: "Get current weather for a city",
  parameters: {
    city: "City name (e.g., 'London', 'New York')"
  },
  func: async (agent, { city }) => {
    return `Weather in ${city}: Sunny, 22C`;
  }
});

const time_tool = new TimeTool({});

// Create the provider
const openai = new OpenAI({
  api_key: process.env.OPENAI_API_KEY!,
  model: "gpt-4"
});

// Create the agent
const assistant = new Agent({
  name: "Smart_Assistant",
  description: "Intelligent assistant with weather and time capabilities",

  metadata: new Metadata()
    .set("version", "1.0")
    .set("environment", "production"),

  tools: [weather_tool, time_tool],

  rules: [
    new Rule("Be concise and helpful"),
    new Rule("Use tools when appropriate"),
    new Rule("Admit when you don't know something")
  ],

  providers: [openai]
});

// Streaming conversation loop
async function startChat() {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log("Chat started! Type 'exit' to quit.\n");

  const prompt = () => {
    readline.question('You: ', async (input: string) => {
      if (input.toLowerCase() === 'exit') {
        readline.close();
        return;
      }

      process.stdout.write('Assistant: ');
      for await (const chunk of assistant.stream(input)) {
        if (chunk.role === "assistant") {
          process.stdout.write(chunk.content);
        }
      }
      console.log('\n');

      prompt();
    });
  };

  prompt();
}

startChat();
```

## Next Steps

Now that you've created your first agent, explore these topics:

- **[Core Concepts](core-concepts.md)** - Deep dive into architecture
- **[Providers](providers.md)** - Advanced provider configuration
- **[Best Practices](best-practices.md)** - Production patterns
- **[API Reference](../api/agent.md)** - Complete API documentation

## Common Issues

### Provider Errors

If you see connection errors:

1. Check your API key is correct
2. Verify internet connection
3. Check API provider status

### Tool Execution Failures

If tools aren't working:

1. Ensure the tool name matches what the model returns
2. Check tool function returns a serializable value
3. Verify parameters match expected format

### TypeScript Errors

If TypeScript shows errors:

1. Install types: `yarn add --dev @types/node`
2. Update `tsconfig.json` target to ES2020+
3. Enable `esModuleInterop` in tsconfig
