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
import { Agent } from "@arcaelas/agent";

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
import { Agent } from "@arcaelas/agent";
import {
  searchProduct,
  getWeather,
  translateText,
  checkInventory,
  processPayment,
} from "./services";

// Create an advanced agent with detailed personality and intelligent failover
const shopAssistant = new Agent({
  name: "VirtualSeller",
  description:
    "Assistant specialized in electronic products. Maintains a professional yet friendly tone, has deep knowledge of the product catalog, and always suggests alternatives when a product is unavailable. Expert in handling complex multi-step transactions.",
  limits: [
    "Never disclose internal info about discounts or margins",
    "Maintain respectful tone at all times",
    "Avoid making promises about exact delivery times",
    "Always verify inventory before confirming availability",
  ],
  providers: [
    {
      baseURL: "https://api.openai.com/v1",
      model: "gpt-4",
      apiKey: process.env.OPENAI_API_KEY,
    },
    // Intelligent failover: multiple providers with automatic load balancing
    {
      baseURL: "https://api.anthropic.com/v1",
      model: "claude-3-sonnet",
      apiKey: process.env.ANTHROPIC_API_KEY,
    },
    {
      baseURL: "https://api.groq.com/openai/v1",
      model: "llama-3.1-70b",
      apiKey: process.env.GROQ_API_KEY,
    },
  ],
});

// Add advanced tools with complex parameter validation
shopAssistant.tool("search_product", {
  description:
    "Search products in the catalog by name, features, or specifications. Returns detailed product information including availability, pricing, and alternatives.",
  parameters: {
    query: "Search term or product name",
    category:
      "Product category (electronics, computers, phones, etc.) - optional",
    max_price: "Maximum price in USD - optional",
    min_rating: "Minimum customer rating (1-5) - optional",
    in_stock_only:
      "Filter to only show available products (true/false) - optional",
  },
  func: async (params) => {
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
        model: "claude-3-sonnet-20240229",
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
      func: async (params) => {
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
      func: async (params) => {
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
  name: string;                           // Unique agent identifier
  description: string;                    // Behavioral personality description
  metadata?: Metadata | Metadata[];      // Initial metadata
  tools?: Tool | Tool[];                  // Available tools
  rules?: Rule | Rule[];                  // Behavioral rules
  messages?: Message | Message[];         // Conversation history
  contexts?: Context | Context[];         // Parent contexts for inheritance
  providers?: ProviderFunction[];         // AI model provider functions
}
```

### Properties
- `readonly name: string` - Agent identifier
- `readonly description: string` - Agent behavior description
- `metadata: Metadata` - Reactive metadata with inheritance
- `rules: Rule[]` - Combined inherited and local rules
- `tools: Tool[]` - Deduplicated tools by name (latest wins)
- `messages: Message[]` - Full conversation history
- `providers: ProviderFunction[]` - Configured AI provider functions

### Methods
```typescript
async call(prompt: string): Promise<[Message[], boolean]>
```
Processes user input with automatic tool execution and provider failover.

**Returns:** Tuple of `[conversation_messages, success_status]`

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
  context?: Context | Context[];         // Parent contexts
  metadata?: Metadata | Metadata[];     // Metadata sources
  rules?: Rule | Rule[];                 // Behavioral rules
  tools?: Tool | Tool[];                 // Available tools
  messages?: Message | Message[];        // Message history
}
```

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
  tools: [new Tool("deploy", async (env) => `Deployed to ${env}`)]
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
new Tool(name: string, handler: (input: string) => any)

// Advanced tool
new Tool<T>(name: string, options: ToolOptions<T>)
```

### ToolOptions Interface
```typescript
interface ToolOptions<T = Record<string, string>> {
  description: string;                          // Tool functionality description
  parameters?: T;                               // Parameter schema object
  func: (params: T) => string | Promise<string>; // Execution function
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
const time_tool = new Tool("get_time", async () => {
  return new Date().toLocaleString();
});

// Advanced tool with parameters
const calculator = new Tool("calculate", {
  description: "Perform mathematical calculations",
  parameters: {
    expression: "Mathematical expression to evaluate",
    precision: "Number of decimal places (optional)"
  },
  func: async (params) => {
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
  | { role: "user"; content: string; }
  | { role: "assistant"; content: string; }
  | { role: "system"; content: string; }
  | { role: "tool"; content: string; tool_id: string; };
```

### Properties
- `readonly role: MessageRole` - Message role
- `readonly content: string` - Message content
- `readonly tool_id?: string` - Tool ID (for tool messages)
- `readonly timestamp: Date` - Creation timestamp
- `readonly length: number` - Content length

### Example
```typescript
const user_msg = new Message({
  role: "user",
  content: "What's the weather like?"
});

const tool_msg = new Message({
  role: "tool",
  content: "Sunny, 22°C",
  tool_id: "weather_123"
});

console.log(user_msg.timestamp); // Date object
console.log(user_msg.length);    // 23
```

</details>

<details>
<summary><strong>📋 Rule Class</strong> - Behavioral constraints and guidelines</summary>

### Constructors
```typescript
// Always active rule
new Rule(description: string)

// Conditional rule
new Rule(description: string, options: RuleOptions)
```

### RuleOptions Interface
```typescript
interface RuleOptions {
  when: (ctx: Agent) => boolean | Promise<boolean>; // Evaluation function
}
```

### Properties
- `readonly description: string` - Rule description
- `readonly when: Function` - Evaluation function

### Examples
```typescript
// Always active rule
const professional_rule = new Rule("Maintain professional communication tone");

// Conditional rule
const business_hours_rule = new Rule(
  "Outside business hours, inform customer of support availability",
  {
    when: (agent) => {
      const hour = new Date().getHours();
      return hour < 9 || hour > 17;
    }
  }
);

// Async conditional rule
const premium_rule = new Rule(
  "Offer priority support features",
  {
    when: async (agent) => {
      const tier = agent.metadata.get("customer_tier");
      return tier === "premium" || tier === "enterprise";
    }
  }
);
```

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
    url: string;
    headers?: Record<string, string>;
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
<summary><strong>🔧 Provider Function</strong> - AI model integration</summary>

### Type Definition
```typescript
type ProviderFunction = (
  ctx: Context
) => ChatCompletionResponse | Promise<ChatCompletionResponse>;
```

### ChatCompletionResponse Interface
```typescript
interface ChatCompletionResponse {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  choices: CompletionChoice[];
  usage?: CompletionUsage;
}

interface CompletionChoice {
  index: number;
  message: ResponseMessage;
  finish_reason: "stop" | "length" | "tool_calls" | "content_filter" | null;
}

interface ResponseMessage {
  role: "assistant";
  content: string | null;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string; };
  }> | null;
}
```

### Examples
```typescript
// OpenAI Provider
const openai_provider: ProviderFunction = async (ctx) => {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return await openai.chat.completions.create({
    model: "gpt-4",
    messages: ctx.messages.map(m => ({ role: m.role, content: m.content })),
    tools: ctx.tools?.map(tool => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: { type: "object", properties: tool.parameters }
      }
    }))
  });
};

// Anthropic Provider
const claude_provider: ProviderFunction = async (ctx) => {
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
    created: Date.now(),
    model: "claude-3-sonnet-20240229",
    choices: [{
      index: 0,
      message: {
        role: "assistant",
        content: response.content[0].text
      },
      finish_reason: "stop"
    }]
  };
};

// Multi-provider agent
const resilient_agent = new Agent({
  name: "Resilient_Assistant",
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
      const results = await searchProduct({
        query: params.query,
        category: params.category,
        maxPrice: params.max_price ? parseFloat(params.max_price) : undefined,
        minRating: params.min_rating
          ? parseFloat(params.min_rating)
          : undefined,
        inStockOnly: params.in_stock_only === "true",
      });
      return JSON.stringify({
        products: results,
        total: results.length,
        searchTerm: params.query,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return `Search error: ${error.message}. Please try a different search term.`;
    }
  },
});

// Multiple tools working together for complex workflows
shopAssistant.tool("check_inventory", {
  description: "Check real-time inventory levels for specific products",
  parameters: {
    product_id: "Product ID to check",
    location: "Store location or 'online' - optional",
  },
  func: async (params) => {
    const inventory = await checkInventory(params.product_id, params.location);
    return JSON.stringify({
      productId: params.product_id,
      available: inventory.quantity > 0,
      quantity: inventory.quantity,
      location: params.location || "online",
      lastUpdated: inventory.lastUpdated,
    });
  },
});

shopAssistant.tool("process_payment", {
  description:
    "Process payment for selected products (requires prior authorization)",
  parameters: {
    items: "JSON array of items with product_id and quantity",
    payment_method: "Payment method (card, paypal, etc.)",
    shipping_address: "Full shipping address",
  },
  func: async (params) => {
    try {
      const items = JSON.parse(params.items);
      const result = await processPayment({
        items,
        paymentMethod: params.payment_method,
        shippingAddress: params.shipping_address,
      });
      return JSON.stringify({
        success: true,
        transactionId: result.transactionId,
        total: result.total,
        estimatedDelivery: result.estimatedDelivery,
      });
    } catch (error) {
      return `Payment processing failed: ${error.message}`;
    }
  },
});

shopAssistant.tool("get_weather", {
  description: "Get weather forecast for a location",
  parameters: {
    location: "City name or coordinates",
  },
  func: async (params) => {
    return await getWeather(params.location);
  },
});

shopAssistant.tool("translate", {
  description: "Translate text to another language",
  parameters: {
    text: "Text to translate",
    target_lang: "Target language code (en, es, fr, etc.)",
  },
  func: async (params) => {
    return await translateText(params.text, params.target_lang);
  },
});

// Example of a complex multi-step conversation with parallel tool usage
const conversation = await shopAssistant.answer([
  {
    role: "user",
    content:
      "Hi, I need a smartphone with excellent camera under €800, and I want to make sure it's in stock before I decide",
  },
  // The agent will automatically:
  // 1. Search for products matching criteria
  // 2. Check inventory for found products
  // 3. Provide recommendations with real-time availability
  // 4. Handle any follow-up questions about specifications
  // 5. Process payment if user decides to purchase
  // All tool calls and responses are automatically managed
]);

// Advanced conversation with error recovery
const conversationWithErrorHandling = await shopAssistant.answer([
  { role: "user", content: "Process my order for items [invalid-json}" },
  // Agent handles JSON parsing errors gracefully and asks for clarification
  {
    role: "user",
    content: "Let me try again: process order for product ID 12345, quantity 2",
  },
  // Agent successfully processes the corrected request
]);
```

## Detailed API

### `Agent<T extends AgentOptions>`

Main class to create and manage agents.

#### Constructor

- `new Agent(options: AgentOptions)`: Creates a new agent with the given options.

#### Methods

- `tool(name: string, options: ToolOptions<T>): () => void`: Adds a tool with complex parameters and specific schema.
- `answer(messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]): Promise<OpenAI.Chat.Completions.ChatCompletionMessageParam[]>`: Processes the conversation and returns the updated history. Handles up to 6 iterations to resolve tool calls automatically.

### Interfaces

#### `ProviderOptions`

- `baseURL: string`: Base URL of the model provider.
- `model: string`: Language model to use.
- `apiKey?: string`: API key (optional if provided via environment).

#### `AgentOptions`

- `name: string`: Agent’s name.
- `description: string`: Agent’s description/personality.
- `limits?: string[]`: Rules or restrictions applied to the agent’s responses.
- `providers: ProviderOptions[]`: List of available providers.

#### `ToolOptions<T>`

- `description: string`: Tool description that explains what the tool does.
- `parameters?: T`: Object where each key is a parameter name and each value is a description of that parameter.
- `func: Noop<[params: T extends object ? T : { input: string }], string>`: Function to execute when the tool is called. Must return a string.

## Recommendations & Best Practices

1. **Well-defined tools**: Provide clear descriptions and specific parameters for every tool.

2. **Robust error handling**: Implement proper error handling in all tool functions to avoid breaking conversations.

3. **Consistent personality**: Define a detailed description to maintain the agent’s tone throughout interactions.

4. **Multiple providers**: Set up fallback providers in case the main one fails.

5. **Clear limits**: Use the `limits` parameter to set rules on what the agent can or cannot do/say.

6. **Conversation cycles**: The `answer()` method handles up to 6 internal iterations to resolve tool calls automatically. Each iteration can process multiple tool calls in sequence.

7. **Tool function returns**: All tool functions must return strings. If you need to return complex data, use `JSON.stringify()`.

8. **Error handling**: Tool functions should handle their own errors gracefully and return descriptive error messages as strings.

9. **Provider fallback**: The agent automatically tries different providers if one fails, ensuring better reliability.

10. **API security**: Never hardcode API keys; use environment variables instead.

## Internal Architecture & Smart Systems

The agent leverages sophisticated internal systems to provide reliable, scalable, and intelligent conversation handling.

### Intelligent Provider Management

The agent implements a **smart multi-provider system** with automatic load balancing and failover:

```typescript
// Each provider becomes a specialized function wrapper
const providers = this.providers.map(({ baseURL, apiKey, model }) => {
  const client = new OpenAI({ baseURL, apiKey });
  return (params) => client.chat.completions.create({ ...params, model });
});

// Random selection for load balancing + automatic failover
const idx = Math.floor(Math.random() * providers.length);
const selectedProvider = providers[idx];
// If provider fails, it's automatically removed and next one is tried
```

**Provider System Benefits:**

- 🔄 **Load Balancing**: Random selection distributes requests across providers
- 🛡️ **Automatic Failover**: Failed providers are removed, conversation continues seamlessly
- 🌐 **Multi-API Support**: Works with OpenAI, Anthropic, Groq, or any OpenAI-compatible API
- ⚙️ **Independent Configuration**: Each provider has its own baseURL, apiKey, and model
- 📊 **Transparent Operations**: Provider switching is invisible to the user

### Advanced Conversation Resolution Engine

The agent uses a **6-iteration resolution cycle** to handle complex multi-step workflows:

```typescript
for (let iteration = 0; iteration < 6; iteration++) {
  // 1. Inject system context (name, description, limits)
  // 2. Process ALL choices in the response (not just first)
  // 3. Handle multiple tool calls in parallel
  // 4. Continue until final response or max iterations reached
}
```

**Resolution Engine Features:**

- 🔄 **Multi-Turn Resolution**: Automatically handles complex tool sequences
- ⚡ **Parallel Tool Processing**: Multiple tools can be called simultaneously
- 🧠 **Context Preservation**: System messages (personality, rules) injected automatically
- 🛑 **Loop Prevention**: 6-iteration limit prevents infinite tool call cycles
- 📝 **History Management**: All messages and tool results preserved in conversation

### Robust Error Handling & Recovery

Enterprise-grade error handling across all system layers:

**Provider Level Error Recovery:**

```typescript
try {
  response = await selectedProvider(request);
} catch (error) {
  // Provider fails → remove from pool and try next automatically
  providers.splice(providerIndex, 1);
  continue; // Seamlessly switch to next available provider
}
```

**Tool Level Error Management:**

```typescript
try {
  const result = await tool.func(parsedArgs);
  // Tool succeeds → add result to conversation
} catch (error) {
  // Tool fails → add descriptive error message and continue conversation
  messages.push({
    role: "tool",
    tool_call_id: call.id,
    content: `Tool error: ${error.message}`,
  });
}
```

**JSON Parsing with Graceful Fallback:**

```typescript
try {
  args = JSON.parse(toolArguments);
} catch {
  // Invalid JSON → inform model with helpful error message
  return "Error: Invalid JSON in tool arguments. Please check format and try again.";
}
```

**Error Scenarios Handled:**

- ✅ **Provider failures**: Transparent failover to backup providers
- ✅ **Network timeouts**: Automatic retry with different providers
- ✅ **Tool not found**: Descriptive error messages returned to conversation
- ✅ **Malformed JSON**: Clear parsing error feedback with suggestions
- ✅ **Tool exceptions**: Caught and converted to helpful user messages
- ✅ **Empty responses**: Intelligent fallback when all providers fail
- ✅ **Rate limiting**: Provider rotation distributes load naturally

## Advanced Features

### Flexible Tool Registration System

The agent supports **two distinct approaches** for tool registration, optimized for different use cases:

```typescript
// Method 1: Named tools with explicit parameter schemas
const removeSearchTool = agent.tool("analyze_sentiment", {
  description:
    "Analyze sentiment of text and return detailed breakdown with confidence scores",
  parameters: {
    text: "Text to analyze for sentiment",
    language:
      "Language code (en, es, fr, de, etc.) - optional, defaults to auto-detect",
    detailed:
      "Include confidence scores and emotional breakdown (true/false) - optional",
    format:
      "Output format: 'simple' or 'detailed' - optional, defaults to 'simple'",
  },
  func: async (params) => {
    // Full parameter object with type-safe access
    const analysis = await sentimentAnalyzer.analyze({
      text: params.text,
      language: params.language || "auto",
      detailed: params.detailed === "true",
    });

    return JSON.stringify({
      sentiment: analysis.sentiment, // 'positive', 'negative', 'neutral'
      confidence: analysis.confidence, // 0.0 to 1.0
      emotions: params.detailed === "true" ? analysis.emotions : undefined,
      language: analysis.detectedLanguage,
      processedAt: new Date().toISOString(),
    });
  },
});

// Method 2: Quick tools with auto-generated names (perfect for utilities)
const removeTimestampTool = agent.tool(
  "Get current timestamp in ISO format with timezone information",
  async (params) => {
    // params.input contains the user's request context
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      unix: Date.now(),
      formatted: new Date().toLocaleString(),
      context: params.input, // What the user was asking about
    });
  }
);

// Method 3: Dynamic tool management
const dynamicTools = new Map();

// Add tools conditionally
if (userHasPermission("database_access")) {
  dynamicTools.set(
    "db_query",
    agent.tool("execute_database_query", {
      description: "Execute SQL queries on authorized databases",
      parameters: {
        query: "SQL query to execute",
        database: "Target database name",
        readonly: "Read-only mode (true/false) - defaults to true",
      },
      func: async (params) => {
        // Complex database operations with validation
        return await secureDbQuery(
          params.query,
          params.database,
          params.readonly !== "false"
        );
      },
    })
  );
}

// Remove tools when no longer needed
removeSearchTool(); // Removes the sentiment analysis tool
removeTimestampTool(); // Removes the timestamp tool
```

**Tool System Features:**

- 🔧 **Dual Registration**: Named tools for complex operations, quick tools for utilities
- 🗂️ **Dynamic Management**: Add/remove tools at runtime based on context
- 📋 **Rich Parameter Schemas**: Detailed parameter descriptions with type hints
- 🛡️ **Error Isolation**: Tool failures don't break the conversation flow
- 🔄 **Return Functions**: Each tool registration returns a cleanup function
- 📊 **JSON Response**: Tools can return complex data structures as JSON strings

### Enterprise Use Cases & Scalability

The agent is designed to handle **production-grade scenarios** with enterprise requirements:

**Customer Support Automation:**

```typescript
const supportAgent = new Agent({
  name: "SupportBot",
  description:
    "Professional customer support specialist with access to knowledge base, ticketing system, and escalation procedures. Maintains empathetic tone while efficiently resolving issues.",
  limits: [
    "Never provide account credentials or sensitive information",
    "Always verify customer identity before accessing account details",
    "Escalate to human agents for complex billing disputes",
    "Log all interactions for quality assurance",
  ],
  providers: [
    {
      baseURL: "https://api.openai.com/v1",
      model: "gpt-4",
      apiKey: process.env.OPENAI_KEY,
    },
    {
      baseURL: "https://api.anthropic.com/v1",
      model: "claude-3-sonnet",
      apiKey: process.env.ANTHROPIC_KEY,
    },
  ],
});

supportAgent.tool("search_knowledge_base", {
  description: "Search company knowledge base for solutions and documentation",
  parameters: {
    query: "Search terms or keywords",
    category: "Category filter (technical, billing, general) - optional",
    priority: "Issue priority (low, medium, high, critical) - optional",
  },
  func: async (params) => {
    const results = await knowledgeBase.search(params.query, {
      category: params.category,
      priority: params.priority,
    });
    return JSON.stringify({
      articles: results.slice(0, 5), // Limit to most relevant
      totalFound: results.length,
      searchTime: Date.now(),
    });
  },
});

supportAgent.tool("create_ticket", {
  description: "Create support ticket for issues requiring human intervention",
  parameters: {
    title: "Ticket title summarizing the issue",
    description: "Detailed description of the customer's problem",
    priority: "Priority level (low, medium, high, critical)",
    category: "Issue category for proper routing",
    customer_id: "Customer identifier",
  },
  func: async (params) => {
    const ticket = await ticketingSystem.create({
      title: params.title,
      description: params.description,
      priority: params.priority,
      category: params.category,
      customerId: params.customer_id,
      source: "ai_agent",
    });
    return JSON.stringify({
      ticketId: ticket.id,
      status: "created",
      estimatedResolutionTime: ticket.estimatedResolution,
      assignedAgent: ticket.assignedTo,
    });
  },
});
```

**Data Analysis & Reporting:**

```typescript
const analyticsAgent = new Agent({
  name: "DataAnalyst",
  description:
    "Expert data analyst specializing in business intelligence, statistical analysis, and automated reporting. Provides insights with proper context and confidence intervals.",
  providers: [
    {
      baseURL: "https://api.openai.com/v1",
      model: "gpt-4",
      apiKey: process.env.OPENAI_KEY,
    },
  ],
});

analyticsAgent.tool("execute_sql_query", {
  description: "Execute SQL queries on data warehouse for analysis",
  parameters: {
    query: "SQL query to execute (SELECT statements only)",
    database: "Target database (sales, marketing, operations)",
    format: "Output format (table, chart, summary)",
  },
  func: async (params) => {
    // Validate query is read-only
    if (!/^SELECT/i.test(params.query.trim())) {
      return "Error: Only SELECT queries are allowed";
    }

    const results = await dataWarehouse.query(params.query, params.database);
    return JSON.stringify({
      data: results.rows,
      columns: results.columns,
      executionTime: results.executionTime,
      rowCount: results.rows.length,
      format: params.format,
    });
  },
});
```

### Production Considerations & Limitations

**Performance & Scalability:**

- 🚀 **Concurrent Conversations**: Handles multiple conversations simultaneously
- ⏱️ **Response Times**: Typical response time 1-3 seconds (depends on provider and tool complexity)
- 🔄 **Iteration Limit**: Maximum 6 iterations per conversation to prevent infinite loops
- 📊 **Tool Parallelization**: Multiple tools can execute simultaneously within one iteration
- 🎯 **Provider Load Balancing**: Random selection distributes load across multiple APIs

**Security & Best Practices:**

- 🔐 **API Key Management**: Never hardcode keys; use environment variables or secret managers
- 🛡️ **Input Validation**: Always validate and sanitize tool parameters
- 🔍 **Audit Logging**: Log all tool executions for compliance and debugging
- 🚫 **Permission Control**: Implement role-based access for sensitive tools
- 🔒 **Data Encryption**: Use HTTPS for all API communications

**Technical Limitations:**

- 📝 **Tool Return Format**: All tool functions must return strings (use JSON.stringify for complex data)
- 🔄 **Max Iterations**: 6-iteration limit prevents infinite tool call loops
- 🎛️ **Provider Dependency**: Requires at least one working OpenAI-compatible provider
- 💾 **Memory Management**: Large conversation histories may impact performance
- ⏰ **Timeout Handling**: Long-running tools should implement their own timeout logic

**Monitoring & Observability:**

```typescript
// Add monitoring to your agent
const monitoredAgent = new Agent({
  name: "ProductionAgent",
  description: "Production agent with comprehensive monitoring",
  providers: [...providers],
});

// Wrap tools with monitoring
const originalTool = monitoredAgent.tool;
monitoredAgent.tool = function (name, options) {
  const wrappedFunc = async (params) => {
    const startTime = Date.now();
    try {
      const result = await options.func(params);
      logger.info(`Tool ${name} succeeded in ${Date.now() - startTime}ms`);
      return result;
    } catch (error) {
      logger.error(`Tool ${name} failed: ${error.message}`);
      throw error;
    }
  };

  return originalTool.call(this, name, { ...options, func: wrappedFunc });
};
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
npm install

# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes and test
npm run test
npm run build
npm run lint

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
    const test_tool = new Tool("test", async () => "test result");
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

#### v1.0.15 (Current)
- ✨ **New**: Enhanced provider function typing with better error handling
- 🔧 **Improved**: Context inheritance performance optimization
- 📝 **Documentation**: Complete README restructure with examples
- 🐛 **Fixed**: Tool parameter validation edge cases
- 🔒 **Security**: Enhanced input sanitization for tools

#### v1.0.14
- ✨ **New**: TimeTool with comprehensive timezone support
- 🔧 **Improved**: RemoteTool error handling and retry logic
- 📝 **Documentation**: Expanded API reference with examples
- 🐛 **Fixed**: Context metadata inheritance issues

#### v1.0.13
- 🚀 **New**: Multi-provider failover system
- ⚡ **Performance**: Optimized memory usage for long conversations
- 🔒 **Security**: Enhanced tool execution sandboxing
- 📊 **Monitoring**: Better error reporting and logging

### Upcoming Features (Roadmap)

#### v1.1.0 (Q1 2024)
- 🔌 **Plugin System**: Extensible plugin architecture
- 📊 **Analytics**: Built-in usage analytics and monitoring
- 🎯 **Smart Routing**: Intelligent provider selection based on request type
- 🛡️ **Security**: Advanced security features and audit logging

#### v1.2.0 (Q2 2024)
- 🌐 **Multi-Modal**: Support for images, audio, and video
- 🧠 **Memory**: Long-term memory and knowledge persistence
- 🔄 **Streaming**: Real-time streaming responses
- 📱 **Mobile**: React Native and mobile platform support

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