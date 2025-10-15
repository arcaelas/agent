# Getting Started

This guide will walk you through creating your first AI agent with @arcaelas/agent, from installation to deployment.

## Prerequisites

Before you begin, ensure you have:

- **Node.js** ≥ 16.0.0 installed
- An **OpenAI API key** (get one at [platform.openai.com](https://platform.openai.com))
- Basic knowledge of **TypeScript** or **JavaScript**

## Step 1: Installation

Install @arcaelas/agent and required dependencies:

```bash
npm install @arcaelas/agent openai dotenv
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
import { Agent } from '@arcaelas/agent';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  baseURL: "https://api.openai.com/v1",
  apiKey: process.env.OPENAI_API_KEY
});

// Create the agent
const assistant = new Agent({
  name: "Personal_Assistant",
  description: "A helpful assistant that answers questions and provides information",
  providers: [
    async (ctx) => {
      return await openai.chat.completions.create({
        model: "gpt-4",
        messages: ctx.messages.map(m => ({
          role: m.role,
          content: m.content
        }))
      });
    }
  ]
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

Tools allow your agent to perform actions. Let's add a time tool:

```typescript
import { Agent, Tool } from '@arcaelas/agent';
import OpenAI from 'openai';

// Create a simple time tool
const time_tool = new Tool("get_current_time", async () => {
  return new Date().toLocaleString();
});

// Create agent with the tool
const assistant = new Agent({
  name: "Time_Assistant",
  description: "Assistant that can tell the current time",
  tools: [time_tool],
  providers: [
    async (ctx) => {
      const openai = new OpenAI({
        baseURL: "https://api.openai.com/v1",
        apiKey: process.env.OPENAI_API_KEY
      });

      return await openai.chat.completions.create({
        model: "gpt-4",
        messages: ctx.messages.map(m => ({
          role: m.role,
          content: m.content
        })),
        // Pass tools to the model
        tools: ctx.tools?.map(tool => ({
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
    }
  ]
});

// Ask for the time
const [messages, success] = await assistant.call("What time is it?");
```

The agent will:
1. Receive your question
2. Decide to use the `get_current_time` tool
3. Execute the tool automatically
4. Respond with the current time

## Step 5: Adding Rules

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
  providers: [openai_provider]
});
```

## Step 6: Multi-Provider Setup

Add automatic failover between providers:

```typescript
import { Agent } from '@arcaelas/agent';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

const resilient_agent = new Agent({
  name: "Resilient_Agent",
  description: "High-availability assistant",
  providers: [
    // Primary: OpenAI
    async (ctx) => {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      return await openai.chat.completions.create({
        model: "gpt-4",
        messages: ctx.messages.map(m => ({ role: m.role, content: m.content }))
      });
    },

    // Backup: Anthropic Claude
    async (ctx) => {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const response = await anthropic.messages.create({
        model: "claude-3-sonnet-20240229",
        max_tokens: 4000,
        messages: ctx.messages.map(m => ({
          role: m.role === "system" ? "user" : m.role,
          content: m.content
        }))
      });

      // Convert to OpenAI format
      return {
        id: response.id,
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: "claude-3-sonnet",
        choices: [{
          index: 0,
          message: {
            role: "assistant",
            content: response.content[0].text
          },
          finish_reason: "stop"
        }]
      };
    }
  ]
});
```

If OpenAI fails, the agent automatically tries Claude.

## Step 7: Context Inheritance

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
  providers: [openai_provider]
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
import { Agent, Tool, Rule, Metadata } from '@arcaelas/agent';
import OpenAI from 'openai';

// Create utility tools
const weather_tool = new Tool("get_weather", {
  description: "Get current weather for a city",
  parameters: {
    city: "City name (e.g., 'London', 'New York')"
  },
  func: async (params) => {
    // In production, call a real weather API
    return `Weather in ${params.city}: Sunny, 22°C`;
  }
});

const time_tool = new Tool("get_time", async () => {
  return new Date().toLocaleString();
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

  providers: [
    async (ctx) => {
      const openai = new OpenAI({
        baseURL: "https://api.openai.com/v1",
        apiKey: process.env.OPENAI_API_KEY
      });

      return await openai.chat.completions.create({
        model: "gpt-4",
        messages: ctx.messages.map(m => ({
          role: m.role,
          content: m.content
        })),
        tools: ctx.tools?.map(tool => ({
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
    }
  ]
});

// Interactive conversation loop
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

      const [messages, success] = await assistant.call(input);

      if (success) {
        const response = messages[messages.length - 1].content;
        console.log(`Assistant: ${response}\n`);
      } else {
        console.log("Failed to get response. Try again.\n");
      }

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
- **[API Reference](../api/agent.md)** - Complete API documentation
- **[Examples](../examples/basic-agent.md)** - More practical examples

## Common Issues

### Provider Errors

If you see connection errors:

1. Check your API key is correct
2. Verify internet connection
3. Check API provider status

### Tool Execution Failures

If tools aren't working:

1. Ensure tools are passed to the provider
2. Check tool function returns a string
3. Verify parameters match expected format

### TypeScript Errors

If TypeScript shows errors:

1. Install types: `npm install --save-dev @types/node`
2. Update `tsconfig.json` target to ES2020+
3. Enable `esModuleInterop` in tsconfig

## Support

Need help? Check these resources:

- [API Reference](../api/agent.md)
- [GitHub Issues](https://github.com/arcaelas/agent/issues)
- [Discord Community](https://discord.gg/arcaelas)
