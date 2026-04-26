![Arcaelas Insiders Banner](https://raw.githubusercontent.com/arcaelas/dist/main/banner/svg/dark.svg#gh-dark-mode-only)
![Arcaelas Insiders Banner](https://raw.githubusercontent.com/arcaelas/dist/main/banner/svg/light.svg#gh-light-mode-only)

# @arcaelas/agent

**Advanced AI agent library with multi-provider support, reactive contexts, and intelligent tool orchestration.**

[![npm version](https://badge.fury.io/js/@arcaelas%2Fagent.svg)](https://www.npmjs.com/package/@arcaelas/agent)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-Custom-orange.svg)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/arcaelas/agent?style=social)](https://github.com/arcaelas/agent)
[![GitHub Issues](https://img.shields.io/github/issues/arcaelas/agent)](https://github.com/arcaelas/agent/issues)
[![Downloads](https://img.shields.io/npm/dm/@arcaelas/agent.svg)](https://www.npmjs.com/package/@arcaelas/agent)

## Modern AI Agent Architecture for Enterprise Applications

**@arcaelas/agent** is a production-ready TypeScript library that enables developers to build sophisticated conversational AI agents with enterprise-grade features. Our architecture combines reactive context inheritance, intelligent multi-provider failover, and extensible tool orchestration to create agents that scale from simple chatbots to complex organizational workflows.

**Why Choose @arcaelas/agent?**
- 🔄 **Intelligent Failover**: Automatic provider switching ensures 99.9% uptime across OpenAI, Anthropic, Groq, and custom APIs
- 🏗️ **Reactive Architecture**: Context inheritance system that scales from individual agents to enterprise-wide organizational hierarchies
- 🛠️ **Tool Ecosystem**: Built-in HTTP tools, time utilities, and seamless custom function integration with parallel execution
- 💎 **Type Safety**: Full TypeScript support with discriminated unions, generics, and comprehensive IDE integration
- ⚡ **Performance First**: Optimized for high-throughput applications with intelligent load balancing and memory management
- 🎯 **Developer Experience**: Intuitive API design that reduces complexity while maintaining full control over agent behavior

---

## 📖 Table of Contents

### Quick Navigation
- [🚀 Get Started](#-get-started)
  - [Installation](#installation)
  - [Basic Setup](#basic-setup)
  - [First Agent](#first-agent)
- [💡 Use Cases & Examples](#-use-cases--examples)
  - [Simple Agent](#simple-agent)
  - [Advanced Multi-Provider](#advanced-multi-provider)
  - [Enterprise Architecture](#enterprise-architecture)
- [🏗️ Core Architecture](#️-core-architecture)
  - [Agent System](#agent-system)
  - [Context Inheritance](#context-inheritance)
  - [Tool Orchestration](#tool-orchestration)
  - [Provider Management](#provider-management)

### API Reference
- [📘 Agent Class](#-agent-class)
- [🔗 Context System](#-context-system)
- [🛠️ Tool System](#️-tool-system)
  - [Built-in Tools](#built-in-tools)
  - [Custom Tools](#custom-tools)
- [📨 Message Management](#-message-management)
- [⚙️ Advanced Configuration](#️-advanced-configuration)

### Resources
- [🔧 Migration Guide](#-migration-guide)
- [🎯 Performance Tips](#-performance-tips)
- [❓ Troubleshooting](#-troubleshooting)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## 🚀 Get Started

### Installation

**@arcaelas/agent** supports multiple installation methods for different environments:

#### Package Managers

```bash
# npm (recommended)
npm install @arcaelas/agent

# yarn
yarn add @arcaelas/agent

# pnpm
pnpm add @arcaelas/agent

# bun
bun add @arcaelas/agent
```

#### CDN (Browser)

```html
<!-- ES Modules -->
<script type="module">
  import { Agent, Tool } from 'https://cdn.skypack.dev/@arcaelas/agent';
</script>

<!-- UMD (Global) -->
<script src="https://unpkg.com/@arcaelas/agent/dist/index.umd.js"></script>
<script>
  const { Agent, Tool } = ArcaelasAgent;
</script>
```

#### Requirements

- **Node.js** ≥ 16.0.0
- **TypeScript** ≥ 4.5.0 (for TypeScript projects)
- **Modern Browser** (ES2020+ support for browser usage)

### Basic Setup

#### Environment Configuration

Create a `.env` file in your project root:

```env
# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Anthropic (optional)
ANTHROPIC_API_KEY=your_anthropic_api_key

# Groq (optional)
GROQ_API_KEY=your_groq_api_key
```

#### TypeScript Configuration

Ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

### First Agent

Create your first AI agent in **3 simple steps**:

#### Step 1: Import and Setup

```typescript
import { Agent } from '@arcaelas/agent';
import OpenAI from 'openai';

// Initialize your AI provider
const openai = new OpenAI({
  baseURL: "https://api.openai.com/v1",
  apiKey: process.env.OPENAI_API_KEY
});
```

#### Step 2: Create Agent

```typescript
const assistant = new Agent({
  name: "Personal_Assistant",
  description: "Helpful assistant for daily tasks and questions",
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
```

#### Step 3: Start Conversation

```typescript
// Simple interaction
const [messages, success] = await assistant.call("What's the weather like today?");

if (success) {
  const response = messages[messages.length - 1].content;
  console.log("Assistant:", response);
} else {
  console.log("Failed to get response");
}
```

### Verification

Test your installation with this complete example:

```typescript
import { Agent, Tool } from '@arcaelas/agent';
import OpenAI from 'openai';

// Create a simple time tool
const time_tool = new Tool("get_current_time", async (agent) => {
  return new Date().toLocaleString();
});

// Create agent with tool
const agent = new Agent({
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
        messages: ctx.messages.map(m => ({ role: m.role, content: m.content })),
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

// Test the agent
console.log("Testing agent...");
const [conversation, success] = await agent.call("What time is it?");

if (success) {
  console.log("✅ Installation successful!");
  console.log("Response:", conversation[conversation.length - 1].content);
} else {
  console.log("❌ Installation failed. Check your API key.");
}
```

**Expected Output:**
```
Testing agent...
✅ Installation successful!
Response: The current time is [current date and time].
```

---

## 💡 Use Cases & Examples

### Simple Agent

Perfect for getting started with basic conversational AI:

```typescript
import { Agent } from '@arcaelas/agent';
import OpenAI from 'openai';

// Create a simple chatbot
const chatbot = new Agent({
  name: "Simple_Chatbot",
  description: "Friendly assistant for basic questions and conversations",
  providers: [
    async (ctx) => {
      const openai = new OpenAI({
        baseURL: "https://api.openai.com/v1",
        apiKey: process.env.OPENAI_API_KEY
      });

      return await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: ctx.messages.map(m => ({
          role: m.role,
          content: m.content
        }))
      });
    }
  ]
});

// Use the chatbot
const [conversation, success] = await chatbot.call("Tell me a joke about programming");
console.log("Bot:", conversation[conversation.length - 1].content);
```

### Advanced Multi-Provider

Production-ready setup with automatic failover and tools:

```typescript
import { Agent, Tool, TimeTool } from '@arcaelas/agent';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

// Create utility tools
const weather_tool = new Tool("get_weather", {
  description: "Get current weather for any city",
  parameters: {
    city: "City name (e.g., 'London', 'New York')",
    units: "Temperature units: 'celsius' or 'fahrenheit'"
  },
  func: async (agent, params) => {
    // Mock weather API call
    const temp = params.units === 'celsius' ? '22°C' : '72°F';
    return `Weather in ${params.city}: Sunny, ${temp}`;
  }
});

const time_tool = new TimeTool({ time_zone: "America/New_York" });

// Multi-provider agent with tools
const advanced_agent = new Agent({
  name: "Advanced_Assistant",
  description: "Intelligent assistant with weather and time capabilities",
  tools: [weather_tool, time_tool],
  providers: [
    // Primary: OpenAI GPT-4
    async (ctx) => {
      const openai = new OpenAI({
        baseURL: "https://api.openai.com/v1",
        apiKey: process.env.OPENAI_API_KEY
      });

      return await openai.chat.completions.create({
        model: "gpt-4",
        messages: ctx.messages.map(m => ({ role: m.role, content: m.content })),
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
    },

    // Backup: Anthropic Claude
    async (ctx) => {
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });

      return await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 4000,
        messages: ctx.messages.map(m => ({
          role: m.role === "system" ? "user" : m.role,
          content: m.content
        }))
      });
    }
  ]
});

// Test with tool usage
const [messages, success] = await advanced_agent.call(
  "What's the weather like in Tokyo and what time is it in New York?"
);
```

### Enterprise Architecture

Scalable setup for organizational use with context inheritance:

```typescript
import { Agent, Context, Metadata, Rule, Tool } from '@arcaelas/agent';

// Organization-wide base context
const company_context = new Context({
  metadata: new Metadata()
    .set("organization", "Acme Corp")
    .set("compliance_level", "enterprise")
    .set("data_retention", "7_years"),
  rules: [
    new Rule("Maintain professional communication"),
    new Rule("Protect confidential information"),
    new Rule("Log all interactions for audit purposes")
  ]
});

// Department-specific context
const sales_context = new Context({
  context: company_context, // Inherits from company
  metadata: new Metadata()
    .set("department", "Sales")
    .set("target_region", "North America"),
  tools: [
    new Tool("get_customer_info", {
      description: "Retrieve customer information from CRM",
      parameters: {
        customer_id: "Customer ID or email address"
      },
      func: async (agent, params) => {
        // Mock CRM integration
        return `Customer ${params.customer_id}: Premium tier, active since 2023`;
      }
    }),

    new Tool("create_quote", {
      description: "Generate sales quote for products",
      parameters: {
        products: "Comma-separated list of product names",
        customer_tier: "Customer tier: 'standard', 'premium', or 'enterprise'"
      },
      func: async (agent, params) => {
        // Mock quote generation
        const discount = params.customer_tier === 'enterprise' ? '15%' : '5%';
        return `Quote generated for ${params.products} with ${discount} discount`;
      }
    })
  ]
});

// Specialized sales agent
const sales_agent = new Agent({
  name: "Sales_Specialist",
  description: "Expert sales representative with CRM access and pricing tools",
  contexts: sales_context, // Inherits complete hierarchy
  providers: [
    async (ctx) => {
      const openai = new OpenAI({
        baseURL: "https://api.openai.com/v1",
        apiKey: process.env.OPENAI_API_KEY
      });

      // Build system message with context
      const system_message = `You are a ${ctx.metadata.get("department")} representative for ${ctx.metadata.get("organization")}.

Rules:
${ctx.rules.map(rule => `- ${rule.description}`).join('\n')}

Available tools: ${ctx.tools?.map(t => t.name).join(', ')}`;

      return await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: system_message },
          ...ctx.messages.map(m => ({ role: m.role, content: m.content }))
        ],
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

// Sales interaction example
const [conversation, success] = await sales_agent.call(
  "I need a quote for our enterprise software package for customer john@company.com"
);

// The agent has access to:
// - Company policies and compliance rules
// - Sales department tools and metadata
// - CRM integration and quote generation
// - Professional communication guidelines
```

---

## 🏗️ Core Architecture

**@arcaelas/agent** is built on four core principles that enable scalable, maintainable AI agent development:

### Agent System
The **Agent** is the central orchestrator that combines identity, behavior, tools, and intelligence providers into a cohesive conversational experience.

### Context Inheritance
**Reactive Context System** provides hierarchical state management where child contexts automatically inherit parent properties while maintaining their own specialized behavior.

### Tool Orchestration
**Extensible Tool System** allows agents to execute custom functions, make HTTP requests, and interact with external services through a unified interface.

### Provider Management
**Multi-Provider Architecture** ensures high availability through automatic failover across OpenAI, Anthropic, Groq, and custom AI endpoints.

---

## 📘 API Reference

<details>
<summary><strong>📌 Agent Class</strong> - Main orchestrator for AI conversations</summary>

### Constructor
```typescript
new Agent(options: AgentOptions)
```

### AgentOptions Interface
```typescript
interface AgentOptions {
  name?: string;                          // Deprecated — unused internally
  description?: string;                   // Injected as a Rule into the agent's context
  metadata?: Metadata | Metadata[];      // Initial metadata
  tools?: Tool | Tool[];                  // Available tools
  rules?: Rule | Rule[];                  // Behavioral rules
  messages?: Message | Message[];         // Conversation history
  contexts?: Context | Context[];         // Parent contexts for inheritance
  providers?: Provider[];                 // AI model provider functions
  branches?: Array<AgentOptions | Agent | string>; // Sub-agent pipeline for pre-turn thinking
}
```

> `name` and `description` are `readonly` but never assigned at runtime (always `undefined`). `description` is converted to a `Rule` added to the internal Context.

### Properties
- `readonly name?: string` - Deprecated, always `undefined`
- `readonly description?: string` - Deprecated, always `undefined`
- `metadata: Metadata` - Reactive metadata with inheritance
- `rules: Rule[]` - Combined inherited and local rules
- `tools: Tool[]` - Deduplicated tools by name (latest wins)
- `messages: Message[]` - Full conversation history
- `providers: Provider[]` - Configured AI provider functions

### Methods
```typescript
async call(prompt: string, opts?: { signal?: AbortSignal }): Promise<[Message[], boolean]>
```
Processes user input with automatic tool execution and provider failover. Runs branch pipeline first if configured.

**Returns:** Tuple of `[conversation_messages, success_status]`

```typescript
async *stream(input: StreamInput, opts?: { signal?: AbortSignal }): AsyncGenerator<StreamChunk>
```
Streams a conversation turn. Yields `StreamChunk` objects: `{ role: "assistant" | "thinking" | "tool_call" | "tool", ... }`.

**Returns:** `AsyncGenerator<StreamChunk>`

### Example
```typescript
const agent = new Agent({
  name: "Assistant",
  description: "Helpful AI assistant",
  providers: [
    async (ctx) => {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      return await openai.chat.completions.create({
        model: "gpt-4",
        messages: ctx.messages.map(m => ({ role: m.role, content: m.content }))
      });
    }
  ]
});
```

</details>

<details>
<summary><strong>🔗 Context Class</strong> - Hierarchical state management</summary>

### Constructor
```typescript
new Context(options: ContextOptions)
```

### ContextOptions Interface
```typescript
interface ContextOptions {
  context?: Context | Context[];
  metadata?: Metadata | Metadata[] | Record<string, string>;
  rules?: Rule | Rule[] | string | string[];
  tools?: Tool | Tool[];
  messages?: Message | Message[] | MessageOptions | MessageOptions[];
}
```

Plain objects are auto-converted: `Record<string,string>` → `Metadata`, strings → `Rule`, `MessageOptions` → `Message`. Setters for `rules`, `tools`, and `messages` are idempotent (filter inherited by reference before storing locals).

### Properties
- `metadata: Metadata` - Reactive metadata with inheritance
- `rules: Rule[]` - Combined rules from hierarchy
- `tools: Tool[]` - Deduplicated tools (child overrides parent)
- `messages: Message[]` - Combined message history

### Example
```typescript
const base_context = new Context({
  metadata: new Metadata().set("company", "Acme Corp"),
  rules: [new Rule("Maintain professional tone")]
});

const team_context = new Context({
  context: base_context,  // Inherits from base
  metadata: new Metadata().set("team", "Engineering"),
  tools: [new Tool("deploy", async (agent, env) => `Deployed to ${env}`)]
});
```

</details>

<details>
<summary><strong>📊 Metadata Class</strong> - Key-value state management with inheritance</summary>

### Constructor
```typescript
new Metadata(...children: (Metadata | Metadata[])[])
```

### Methods
```typescript
get(key: string, fallback?: string | null): string | null
has(key: string): boolean
set(key: string, value: string | null | undefined): this
delete(key: string): this
clear(): this
use(...nodes: (Metadata | Metadata[])[]): this
all(): Record<string, string>
```

### Example
```typescript
const parent_metadata = new Metadata()
  .set("organization", "Acme Corp")
  .set("tier", "enterprise");

const child_metadata = new Metadata(parent_metadata)
  .set("department", "Sales")
  .set("region", "North America");

console.log(child_metadata.get("organization")); // "Acme Corp" (inherited)
console.log(child_metadata.get("department"));   // "Sales" (local)
```

</details>

<details>
<summary><strong>🛠️ Tool Class</strong> - Function execution system</summary>

### Constructors
```typescript
// Simple tool
new Tool(name: string, handler: (agent: Agent, input: string) => any)

// Advanced tool
new Tool<T>(name: string, options: ToolOptions<T>)
```

### ToolOptions Interface
```typescript
interface ToolOptions<T = Record<string, string>> {
  description: string;                          // Tool functionality description
  parameters?: T;                               // Parameter schema object
  func: (agent: Agent, params: T) => string | Promise<string>; // Execution function
}
```

### Properties
- `readonly name: string` - Unique tool identifier
- `readonly description: string` - Functionality description
- `readonly parameters: T | { input: string }` - Parameter schema
- `readonly func: Function` - Execution function

### Examples
```typescript
// Simple tool
const time_tool = new Tool("get_time", async (agent) => {
  return new Date().toLocaleString();
});

// Advanced tool with parameters
const calculator = new Tool("calculate", {
  description: "Perform mathematical calculations",
  parameters: {
    expression: "Mathematical expression to evaluate",
    precision: "Number of decimal places (optional)"
  },
  func: async (agent, params) => {
    const result = eval(params.expression);
    const precision = parseInt(params.precision) || 2;
    return result.toFixed(precision);
  }
});
```

</details>

<details>
<summary><strong>📨 Message Class</strong> - Type-safe conversation handling</summary>

### Constructor
```typescript
new Message(options: MessageOptions)
```

### MessageOptions (Union Type)
```typescript
type MessageOptions =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: ToolCall[] }
  | { role: "system"; content: string }
  | { role: "tool"; content: string; tool_call_id: string };
```

### Properties
- `readonly role: MessageRole` - Message role
- `readonly content: string | null` - Message content (null allowed for assistant tool-call messages)
- `readonly tool_call_id?: string` - Tool call ID (for tool messages)
- `readonly tool_calls?: ToolCall[]` - Tool calls (for assistant messages)
- `readonly timestamp: Date` - Creation timestamp
- `readonly length: number` - Content length (0 if null)

### Example
```typescript
const user_msg = new Message({
  role: "user",
  content: "What's the weather like?"
});

const tool_msg = new Message({
  role: "tool",
  content: "Sunny, 22°C",
  tool_call_id: "weather_123"
});

console.log(user_msg.timestamp); // Date object
console.log(user_msg.length);    // 23
```

</details>

<details>
<summary><strong>📋 Rule Class</strong> - Behavioral constraints and guidelines</summary>

### Constructor
```typescript
new Rule(description: string)
```

### Properties
- `readonly description: string` - Rule text
- `readonly length: number` - Character count

### Example
```typescript
const professional_rule = new Rule("Maintain professional communication tone");
const privacy_rule = new Rule("Never share user personal information with third parties.");
```

> The conditional `new Rule(description, { when })` overload does **not** exist. Rules are always static. To apply rules conditionally, set `agent.rules` dynamically before calling `agent.call()`.


</details>

<details>
<summary><strong>🌐 RemoteTool Class</strong> - HTTP API integration</summary>

### Constructor
```typescript
new RemoteTool(name: string, options: RemoteToolOptions)
```

### RemoteToolOptions Interface
```typescript
interface RemoteToolOptions {
  description: string;
  parameters?: Record<string, string>;
  http: {
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    headers: Record<string, string>;  // required
    url: string;
  };
}
```

### Features
- Automatic JSON serialization of arguments
- Support for all HTTP methods
- Custom headers and authentication
- Returns response as plain text

### Example
```typescript
import { RemoteTool } from '@arcaelas/agent';

const weather_api = new RemoteTool("get_weather", {
  description: "Get current weather for a city",
  parameters: {
    city: "City name (e.g., 'London', 'Tokyo')",
    units: "Temperature units: 'metric' or 'imperial'"
  },
  http: {
    method: "GET",
    url: "https://api.weather.com/v1/current",
    headers: {
      "Authorization": "Bearer your_api_key",
      "Content-Type": "application/json"
    }
  }
});

// Usage in agent
const agent = new Agent({
  name: "Weather_Assistant",
  description: "Assistant with weather capabilities",
  tools: [weather_api]
});
```

</details>

<details>
<summary><strong>⏰ TimeTool Class</strong> - Timezone-aware time utilities</summary>

### Constructor
```typescript
new TimeTool(options?: TimeToolOptions)
```

### TimeToolOptions Interface
```typescript
interface TimeToolOptions {
  time_zone?: string; // IANA timezone (e.g., "America/New_York", "Europe/London")
}
```

### Features
- Automatic system timezone detection
- IANA timezone support
- Consistent "en-US" formatting
- ISO date handling

### Examples
```typescript
import { TimeTool } from '@arcaelas/agent';

// System timezone
const local_time = new TimeTool();

// Specific timezones
const tokyo_time = new TimeTool({ time_zone: "Asia/Tokyo" });
const london_time = new TimeTool({ time_zone: "Europe/London" });
const ny_time = new TimeTool({ time_zone: "America/New_York" });

// Usage in agent
const global_agent = new Agent({
  name: "Global_Assistant",
  description: "Assistant with multi-timezone awareness",
  tools: [local_time, tokyo_time, london_time, ny_time]
});

// Agent can now tell time in multiple zones
await global_agent.call("What time is it in Tokyo and London?");
```

</details>

<details>
<summary><strong>🔧 Provider</strong> - AI model integration</summary>

### Type Definition
```typescript
type Provider = {
  (ctx: Context, opts?: { signal?: AbortSignal }): ChatCompletionResponse | Promise<ChatCompletionResponse>;
  (ctx: Context, opts: { stream: true; signal?: AbortSignal }): AsyncIterable<ProviderChunk>;
};
```

Dual-mode: non-stream returns `ChatCompletionResponse`; with `stream: true` returns `AsyncIterable<ProviderChunk>`.

### ProviderChunk
```typescript
type ProviderChunk =
  | { type: "text_delta"; content: string }
  | { type: "thinking_delta"; content: string }
  | { type: "tool_call_delta"; index: number; id?: string; name?: string; arguments_delta?: string }
  | { type: "finish"; finish_reason: string };
```

### ResponseMessage
```typescript
interface ResponseMessage {
  role: "assistant";
  content: string | null;
  tool_calls?: ToolCall[] | null;
  reasoning_content?: string;  // model thinking, if exposed by the provider
  refusal?: string | null;
}
```

### Built-in Providers

The library exports callable provider classes: `OpenAI`, `Groq`, `DeepSeek`, `Claude`, `ClaudeCode`. All parse model thinking natively.

### Custom Provider Example
```typescript
import OpenAI from 'openai';
import type { Provider } from '@arcaelas/agent';

const openai_provider: Provider = async (ctx) => {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return await openai.chat.completions.create({
    model: "gpt-4o",
    messages: ctx.messages.map(m => ({
      role: m.role,
      content: m.content,
      ...(m.tool_call_id && { tool_call_id: m.tool_call_id }),
      ...(m.tool_calls && { tool_calls: m.tool_calls }),
    })),
    tools: ctx.tools.length ? ctx.tools.map(t => t.toJSON()) : undefined,
  });
};

const resilient_agent = new Agent({
  description: "High-availability assistant with automatic failover",
  providers: [openai_provider, claude_provider]
});
```

</details>

---

## 🎯 Performance Tips

### Memory Optimization
```typescript
// Trim conversation history for production
function manage_conversation_memory(agent: Agent, max_messages: number = 100) {
  if (agent.messages.length > max_messages) {
    const system_msgs = agent.messages.filter(m => m.role === "system");
    const recent_msgs = agent.messages.slice(-max_messages + system_msgs.length);
    agent.messages = [...system_msgs, ...recent_msgs];
  }
}

// Use in production environments
setInterval(() => manage_conversation_memory(production_agent), 300000);
```

### Provider Optimization
```typescript
// Load balancing with health checks
const optimized_providers = [
  async (ctx) => {
    try {
      const openai = new OpenAI({ timeout: 30000, apiKey: process.env.OPENAI_API_KEY });
      return await openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: ctx.messages.map(m => ({ role: m.role, content: m.content }))
      });
    } catch (error) {
      throw new Error(`OpenAI failed: ${error.message}`);
    }
  },
  // Additional providers...
];
```

### Tool Caching
```typescript
const cached_tool = new Tool("expensive_computation", {
  description: "Cached computation for better performance",
  parameters: { data: "Input data for processing" },
  func: async (agent, params) => {
    const cache_key = `compute_${JSON.stringify(params.data)}`;
    const cached_result = cache.get(cache_key);

    if (cached_result) return cached_result;

    const result = await heavy_computation(params.data);
    cache.set(cache_key, result, 3600); // 1 hour TTL
    return result;
  }
});
```

---

## ❓ Troubleshooting

### Common Issues

**Provider Connection Errors**
```typescript
// Check API key validity
const test_provider = async (ctx) => {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.models.list();
    console.log("✅ API connection successful");
    return response;
  } catch (error) {
    console.error("❌ API connection failed:", error.message);
    throw error;
  }
};
```

**Tool Execution Failures**
```typescript
// Debug tool execution
const debug_tool = new Tool("debug_example", {
  description: "Tool with comprehensive error handling",
  parameters: { input: "Test input" },
  func: async (agent, params) => {
    try {
      console.log("Tool input:", params);
      const result = await risky_operation(params.input);
      console.log("Tool output:", result);
      return result;
    } catch (error) {
      console.error("Tool error:", error);
      return `Error: ${error.message}`;
    }
  }
});
```

**Context Inheritance Issues**
```typescript
// Verify context chain
function debug_context_chain(context: Context) {
  console.log("Metadata:", context.metadata.all());
  console.log("Rules:", context.rules.map(r => r.description));
  console.log("Tools:", context.tools.map(t => t.name));
}
```

### Environment Setup
```bash
# Verify Node.js version
node --version  # Should be >= 16.0.0

# Check TypeScript installation
tsc --version   # Should be >= 4.5.0

# Validate environment variables
echo $OPENAI_API_KEY | cut -c1-10  # Should show: sk-proj-...
```

---

## 🔧 Migration Guide

### v1.x to v2.x Migration

<details>
<summary><strong>Step-by-step migration process</strong></summary>

#### 1. Update Dependencies
```bash
npm uninstall @arcaelas/agent@1.x
npm install @arcaelas/agent@latest
```

#### 2. Update Agent Configuration
```typescript
// Before (v1.x)
const agent = new Agent({
  name: "Assistant",
  personality: "helpful and professional",
  tools: {
    calculator: calculatorFunction,
    weather: weatherFunction
  },
  providers: [
    {
      base_url: "https://api.openai.com/v1",
      model: "gpt-4",
      api_key: process.env.OPENAI_API_KEY,
      func: openaiFunction
    }
  ]
});

// After (v2.x)
const agent = new Agent({
  name: "Assistant",
  description: "Helpful and professional assistant",
  tools: [
    new Tool("calculator", {
      description: "Perform mathematical calculations",
      parameters: { expression: "Math expression to evaluate" },
      func: calculatorFunction
    }),
    new Tool("weather", {
      description: "Get weather information",
      parameters: { location: "City name or coordinates" },
      func: weatherFunction
    })
  ],
  providers: [
    async (ctx) => {
      const openai = new OpenAI({
        baseURL: "https://api.openai.com/v1",
        apiKey: process.env.OPENAI_API_KEY
      });
      return await openai.chat.completions.create({
        model: "gpt-4",
        messages: ctx.messages.map(m => ({ role: m.role, content: m.content }))
      });
    }
  ]
});
```

#### 3. Update Message Handling
```typescript
// Before (v1.x)
const response = await agent.ask("Hello");

// After (v2.x)
const [messages, success] = await agent.call("Hello");
if (success) {
  const response = messages[messages.length - 1].content;
}
```

</details>

### Key Breaking Changes
- **Property Names**: `personality` → `description`
- **Tool Format**: Plain objects → `Tool` class instances
- **Provider Format**: Config objects → Functions returning `ChatCompletionResponse`
- **Response Format**: String response → `[Message[], boolean]` tuple
- **Import Changes**: Some built-in tools moved to separate exports

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help improve @arcaelas/agent:

### Quick Start for Contributors

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/your-username/agent.git
cd agent

# Install dependencies
yarn install

# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes and test
yarn build
yarn lint

# Commit and push
git commit -m "feat: add your feature description"
git push origin feature/your-feature-name

# Create a Pull Request on GitHub
```

### Development Workflow

#### Local Development
```bash
# Watch mode for development
npm run dev

# Run tests with coverage
npm run test:coverage

# Type checking
npm run type-check

# Linting and formatting
npm run lint
npm run format
```

#### Testing Guidelines
```typescript
// Example test structure
import { Agent, Tool } from '../src';

describe('Agent Core Functionality', () => {
  test('should create agent with tools', async () => {
    const test_tool = new Tool("test", async (agent) => "test result");
    const agent = new Agent({
      name: "Test_Agent",
      description: "Test agent",
      tools: [test_tool]
    });

    expect(agent.tools).toHaveLength(1);
    expect(agent.tools[0].name).toBe("test");
  });
});
```

### Code Standards

- **TypeScript**: Strict mode enabled with comprehensive type safety
- **Testing**: Jest with >95% coverage requirement
- **Linting**: ESLint with Arcaelas configuration
- **Formatting**: Prettier with consistent style
- **Documentation**: JSDoc for all public APIs

### Pull Request Guidelines

1. **Clear Description**: Explain what your PR does and why
2. **Tests**: Include tests for new functionality
3. **Documentation**: Update README and JSDoc as needed
4. **Breaking Changes**: Clearly mark and document any breaking changes
5. **Performance**: Consider performance implications of changes

---

## 📄 License

**Custom License with Commercial Flexibility**

This project is licensed under a custom license designed for maximum flexibility. See [LICENSE](LICENSE) file for complete details.

### License Summary

| Use Case | Allowed | Requirements |
|----------|---------|--------------|
| **Personal Projects** | ✅ Free | None |
| **Educational Use** | ✅ Free | None |
| **Open Source Projects** | ✅ Free | None |
| **Commercial Applications** | ✅ Allowed | Attribution required |
| **SaaS/Cloud Services** | ✅ Allowed | Attribution + notification |
| **Enterprise Solutions** | ✅ Allowed | Contact for enterprise license |

### Restrictions
- ❌ **No Redistribution**: Cannot redistribute as competing library
- ❌ **No Trademark Use**: Cannot use "Arcaelas" trademark without permission
- ❌ **No Warranty**: Software provided "as-is" without warranties

### Commercial Licensing
For enterprise use, custom licensing, or removing attribution requirements:
📧 **Contact**: [licensing@arcaelas.com](mailto:licensing@arcaelas.com)

---

## 🆘 Support & Community

### 💬 Community Resources

| Platform | Purpose | Link |
|----------|---------|------|
| **Discord** | Real-time chat, questions, discussions | [Join Community](https://discord.gg/arcaelas) |
| **GitHub Issues** | Bug reports, feature requests | [Open Issue](https://github.com/arcaelas/agent/issues) |
| **GitHub Discussions** | Architecture discussions, ideas | [Join Discussion](https://github.com/arcaelas/agent/discussions) |
| **Documentation** | Comprehensive guides and tutorials | [docs.arcaelas.com](https://docs.arcaelas.com/agent) |
| **Stack Overflow** | Technical Q&A | Tag: `arcaelas-agent` |

### 🏢 Enterprise Support

**Professional support for production deployments and enterprise use cases.**

#### Support Tiers

| Tier | Response Time | Features | Price |
|------|---------------|----------|-------|
| **Community** | Best effort | Discord, GitHub Issues | Free |
| **Professional** | 24-48 hours | Email support, architecture review | Contact us |
| **Enterprise** | 4-8 hours | Phone support, custom development | Contact us |
| **Mission Critical** | 1-2 hours | Dedicated engineer, SLA guarantees | Contact us |

#### Enterprise Services
- 🛠️ **Custom Development**: Tailored features for your specific needs
- 🏗️ **Architecture Review**: Expert review of your agent implementation
- 📚 **Training**: On-site or remote training for your development team
- 🔧 **Integration Support**: Help integrating with your existing systems
- 📞 **Priority Support**: Direct access to our engineering team

**Contact**: [enterprise@arcaelas.com](mailto:enterprise@arcaelas.com)

### 🌟 Contributing to the Community

Help others and improve the ecosystem:

- **Answer Questions**: Help other developers on Discord or GitHub
- **Share Examples**: Submit real-world usage examples
- **Write Tutorials**: Create blog posts or tutorials
- **Report Issues**: Help identify and fix bugs
- **Suggest Features**: Propose new functionality

---

## 📈 Changelog & Roadmap

### Recent Releases

#### v1.8.0 (Current)
- ✨ **New**: `branches` pipeline — sub-agents that build accumulated thinking before the main turn
- ✨ **New**: `stream()` method on Agent yielding `StreamChunk` with `thinking`, `tool_call`, and `tool` roles
- ✨ **New**: Built-in tools: `AgentTool`, `AskTool`, `ChoiceTool`, `SleepTool`
- ✨ **New**: `ProviderChunk { type: "thinking_delta" }` — all built-in providers parse model thinking
- ✨ **New**: `ResponseMessage.reasoning_content` optional field
- 🔧 **Improved**: Context constructor accepts plain objects (`Record<string,string>`, strings, `MessageOptions`)
- 🔧 **Improved**: Context setters for `rules`, `tools`, `messages` are idempotent (filter by reference)
- 🗑️ **Removed**: `Context.appendMessages()` and `Context.spliceAt()` methods

[View Complete Changelog](https://github.com/arcaelas/agent/blob/main/CHANGELOG.md)

---

<div align="center">

## 🚀 Ready to Build?

**Start creating intelligent AI agents today with @arcaelas/agent**

[![Get Started](https://img.shields.io/badge/Get%20Started-4CAF50?style=for-the-badge&logo=rocket&logoColor=white)](https://docs.arcaelas.com/agent/getting-started)
[![View Examples](https://img.shields.io/badge/View%20Examples-2196F3?style=for-the-badge&logo=github&logoColor=white)](https://github.com/arcaelas/agent-examples)
[![Join Discord](https://img.shields.io/badge/Join%20Discord-7289DA?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/arcaelas)

---

### 🌟 Star us on GitHub | 🐦 Follow [@ArcaelasHQ](https://twitter.com/ArcaelasHQ) | 📧 [hello@arcaelas.com](mailto:hello@arcaelas.com)

**Built with ❤️ by [Arcaelas Insiders](https://arcaelas.com)**

*Empowering developers to create the next generation of AI experiences*

</div>