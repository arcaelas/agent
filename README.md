![Arcaelas Insiders Banner](https://raw.githubusercontent.com/arcaelas/dist/main/banner/svg/dark.svg#gh-dark-mode-only)
![Arcaelas Insiders Banner](https://raw.githubusercontent.com/arcaelas/dist/main/banner/svg/light.svg#gh-light-mode-only)

# @arcaelas/agent

**Advanced AI agent library with multi-provider support, reactive contexts, and intelligent tool orchestration.**

[![npm version](https://badge.fury.io/js/@arcaelas%2Fagent.svg)](https://www.npmjs.com/package/@arcaelas/agent)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-Custom-orange.svg)](LICENSE)

Build sophisticated conversational AI agents with automatic failover, reactive state management, and extensible tool systems. Compatible with OpenAI, Anthropic, Groq, and any OpenAI-compatible API.

---

## Features

✨ **Multi-Provider Support** - Automatic failover between OpenAI, Anthropic, Groq, and custom providers
🔄 **Reactive Context System** - Hierarchical state inheritance with automatic propagation
🛠️ **Extensible Tools** - Built-in HTTP tools, custom functions, and parallel execution
📝 **Message Management** - Type-safe conversation handling with tool call support
⚡ **Performance Optimized** - Intelligent load balancing and error recovery
🎯 **TypeScript Native** - Full type safety with discriminated unions and generics
🏢 **Enterprise Ready** - Scalable architecture for complex organizational needs

---

## Installation

```bash
# Using npm
npm install @arcaelas/agent

# Using yarn
yarn add @arcaelas/agent

# Using pnpm
pnpm add @arcaelas/agent
```

**Requirements:**
- Node.js ≥ 16.0.0
- TypeScript ≥ 4.5.0 (for TypeScript projects)

---

## Quick Start

### Basic Agent Setup

```typescript
import { Agent } from '@arcaelas/agent';

const assistant = new Agent({
  name: "Support_Assistant",
  description: "Professional customer support agent with technical expertise",
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

// Simple conversation
const [messages, success] = await assistant.call("How can I reset my password?");
if (success) {
  console.log("Response:", messages[messages.length - 1].content);
}
```

### Adding Tools

```typescript
import { Tool } from '@arcaelas/agent';

// Simple tool
const time_tool = new Tool("get_time", async () => {
  return new Date().toLocaleString();
});

// Advanced tool with parameters
const weather_tool = new Tool("get_weather", {
  description: "Get current weather for a location",
  parameters: {
    location: "City name or coordinates",
    units: "Temperature units (celsius/fahrenheit)"
  },
  func: async (params) => {
    const weather_data = await fetch(`https://api.weather.com/v1/current?location=${params.location}&units=${params.units}`);
    const result = await weather_data.json();
    return JSON.stringify(result);
  }
});

// Add tools to agent
assistant.tools = [time_tool, weather_tool];
```

---

## Core Concepts

### Agent Architecture

An **Agent** is the main orchestrator that combines:
- **Identity**: Name and behavioral description
- **Context**: Hierarchical state with inheritance
- **Tools**: Executable functions for specific tasks
- **Rules**: Behavioral constraints and guidelines
- **Providers**: AI model endpoints with automatic failover

### Reactive Context System

Contexts provide hierarchical state management with automatic inheritance:

```typescript
import { Context, Metadata, Rule } from '@arcaelas/agent';

// Corporate base context
const corporate_context = new Context({
  metadata: new Metadata()
    .set("company", "Arcaelas Insiders")
    .set("department", "Engineering"),
  rules: [
    new Rule("Maintain professional tone"),
    new Rule("Protect confidential information")
  ]
});

// Team-specific context inheriting from corporate
const dev_context = new Context({
  context: corporate_context,  // Automatic inheritance
  metadata: new Metadata().set("team", "Backend"),
  tools: [
    new Tool("deploy", async (env) => `Deployed to ${env}`),
    new Tool("run_tests", async () => "Tests completed successfully")
  ]
});

// Agent inherits complete hierarchy
const dev_agent = new Agent({
  name: "DevOps_Agent",
  description: "Development operations specialist",
  contexts: dev_context
});

// Access inherited and local data
console.log(dev_agent.metadata.get("company"));  // "Arcaelas Insiders"
console.log(dev_agent.metadata.get("team"));     // "Backend"
console.log(dev_agent.rules.length);             // Corporate + team rules
```

### Message System

Type-safe message handling with role-based validation:

```typescript
import { Message } from '@arcaelas/agent';

// Different message types
const user_message = new Message({ role: "user", content: "Hello assistant" });
const system_message = new Message({ role: "system", content: "You are helpful" });
const tool_message = new Message({ role: "tool", content: "Result: 42", tool_id: "calc_123" });

// Access properties
console.log(user_message.role);       // "user"
console.log(user_message.content);    // "Hello assistant"
console.log(user_message.timestamp);  // Date object
console.log(user_message.length);     // Content length
```

### Tool Registration

Two approaches for tool registration:

```typescript
// Method 1: Named tools with explicit schemas
const analytics_tool = new Tool("analyze_data", {
  description: "Perform statistical analysis on datasets",
  parameters: {
    dataset: "CSV data or JSON array",
    analysis_type: "Type of analysis (mean, median, correlation, etc.)",
    format: "Output format (table, chart, summary)"
  },
  func: async (params) => {
    const data = JSON.parse(params.dataset);
    const result = await performAnalysis(data, params.analysis_type);
    return JSON.stringify(result);
  }
});

// Method 2: Quick utilities with auto-generated names
const uuid_tool = new Tool("generate_uuid", async () => {
  return crypto.randomUUID();
});

agent.tools = [analytics_tool, uuid_tool];
```

---

## API Reference

### Agent Class

#### Constructor
```typescript
new Agent(options: AgentOptions)
```

**AgentOptions:**
- `name: string` - Unique agent identifier
- `description: string` - Behavioral personality description
- `metadata?: Metadata | Metadata[]` - Initial metadata
- `tools?: Tool | Tool[]` - Available tools
- `rules?: Rule | Rule[]` - Behavioral rules
- `messages?: Message | Message[]` - Conversation history
- `contexts?: Context | Context[]` - Parent contexts for inheritance
- `providers?: Provider[]` - AI model provider functions

#### Properties
- `readonly name: string` - Agent identifier
- `readonly description: string` - Agent behavior description
- `metadata: Metadata` - Reactive metadata with inheritance
- `rules: Rule[]` - Combined inherited and local rules
- `tools: Tool[]` - Deduplicated tools by name (latest wins)
- `messages: Message[]` - Full conversation history
- `providers: Provider[]` - Configured AI provider functions

#### Methods
```typescript
async call(prompt: string): Promise<[Message[], boolean]>
```
Processes user input with automatic tool execution and provider failover.

**Returns:** Tuple of `[conversation_messages, success_status]`

---

### Context Class

#### Constructor
```typescript
new Context(options: ContextOptions)
```

**ContextOptions:**
- `context?: Context | Context[]` - Parent contexts
- `metadata?: Metadata | Metadata[]` - Metadata sources
- `rules?: Rule | Rule[]` - Behavioral rules
- `tools?: Tool | Tool[]` - Available tools
- `messages?: Message | Message[]` - Message history

#### Properties
- `metadata: Metadata` - Reactive metadata with inheritance
- `rules: Rule[]` - Combined rules from hierarchy
- `tools: Tool[]` - Deduplicated tools (child overrides parent)
- `messages: Message[]` - Combined message history

---

### Metadata Class

#### Constructor
```typescript
new Metadata(...children: (Metadata | Metadata[])[])
```

#### Methods
```typescript
get(key: string, fallback?: string | null): string | null
has(key: string): boolean
set(key: string, value: string | null | undefined): this
delete(key: string): this
clear(): this
use(...nodes: (Metadata | Metadata[])[]): this
all(): Record<string, string>
```

---

### Tool Class

#### Constructors
```typescript
// Simple tool
new Tool(name: string, handler: (input: string) => any)

// Advanced tool
new Tool<T>(name: string, options: ToolOptions<T>)
```

**ToolOptions:**
- `description: string` - Tool functionality description
- `parameters?: T` - Parameter schema object
- `func: (params: T) => string | Promise<string>` - Execution function

#### Properties
- `readonly name: string` - Unique tool identifier
- `readonly description: string` - Functionality description
- `readonly parameters: T | { input: string }` - Parameter schema
- `readonly func: Function` - Execution function

---

### Message Class

#### Constructor
```typescript
new Message(options: MessageOptions)
```

**MessageOptions (Union Type):**
```typescript
| { role: "user"; content: string; }
| { role: "assistant"; content: string; }
| { role: "system"; content: string; }
| { role: "tool"; content: string; tool_id: string; }
```

#### Properties
- `readonly role: MessageRole` - Message role
- `readonly content: string` - Message content
- `readonly tool_id?: string` - Tool ID (for tool messages)
- `readonly timestamp: Date` - Creation timestamp
- `readonly length: number` - Content length

---

### Rule Class

#### Constructors
```typescript
// Always active rule
new Rule(description: string)

// Conditional rule
new Rule(description: string, options: RuleOptions)
```

**RuleOptions:**
- `when: (ctx: Agent) => boolean | Promise<boolean>` - Evaluation function

#### Properties
- `readonly description: string` - Rule description
- `readonly when: Function` - Evaluation function

---

## Built-in Tools

### RemoteTool

HTTP tool for external API integration:

```typescript
import { RemoteTool } from '@arcaelas/agent';

const translation_tool = new RemoteTool("translate_text", {
  description: "Translate text between languages using external API",
  parameters: {
    text: "Text to translate",
    source_lang: "Source language code (en, es, fr, etc.)",
    target_lang: "Target language code"
  },
  http: {
    method: "POST",
    headers: {
      "Authorization": "Bearer your_api_key",
      "Content-Type": "application/json"
    },
    url: "https://api.translate.service.com/v1/translate"
  }
});
```

**Features:**
- Automatic JSON serialization of arguments
- Support for all HTTP methods (GET, POST, PUT, DELETE, PATCH)
- Custom headers and authentication
- Returns response as plain text

**Note:** Sends body for ALL HTTP methods including GET (may not be compatible with all APIs)

---

### TimeTool

Timezone-aware time information:

```typescript
import { TimeTool } from '@arcaelas/agent';

// System timezone
const local_time = new TimeTool();

// Specific timezone
const tokyo_time = new TimeTool({ time_zone: "Asia/Tokyo" });
const madrid_time = new TimeTool({ time_zone: "Europe/Madrid" });

agent.tools = [local_time, tokyo_time, madrid_time];
```

**Features:**
- Automatic system timezone detection
- IANA timezone support
- Consistent "en-US" formatting regardless of timezone
- ISO date handling

---

## Advanced Usage

### Multi-Provider Setup with Failover

```typescript
const enterprise_agent = new Agent({
  name: "Enterprise_Assistant",
  description: "High-availability assistant with intelligent failover",
  providers: [
    async (ctx) => {
      const openai = new OpenAI({ baseURL: "https://api.openai.com/v1", apiKey: process.env.OPENAI_API_KEY });
      return await openai.chat.completions.create({
        model: "gpt-4",
        messages: ctx.messages.map(m => ({ role: m.role, content: m.content }))
      });
    },
    async (ctx) => {
      const anthropic = new Anthropic({ baseURL: "https://api.anthropic.com/v1", apiKey: process.env.ANTHROPIC_API_KEY });
      // Implementation for Anthropic API
      return await anthropic.messages.create({
        model: "claude-3-sonnet-20240229",
        messages: ctx.messages.map(m => ({ role: m.role, content: m.content }))
      });
    },
    async (ctx) => {
      const groq = new Groq({ baseURL: "https://api.groq.com/openai/v1", apiKey: process.env.GROQ_API_KEY });
      return await groq.chat.completions.create({
        model: "llama-3.1-70b-versatile",
        messages: ctx.messages.map(m => ({ role: m.role, content: m.content }))
      });
    }
    }
  ]
});
```

**Failover Features:**
- Random provider selection for load balancing
- Automatic removal of failed providers
- Seamless conversation continuation
- No user-visible interruption

### Complex Tool Orchestration

```typescript
// Multi-step workflow with error handling
const ecommerce_agent = new Agent({
  name: "Sales_Assistant",
  description: "E-commerce specialist with inventory and payment capabilities",
  tools: [
    new Tool("search_products", {
      description: "Search product catalog with filters",
      parameters: {
        query: "Search terms",
        category: "Product category (optional)",
        max_price: "Maximum price filter (optional)",
        in_stock_only: "Filter to available products (true/false)"
      },
      func: async (params) => {
        try {
          const products = await productService.search({
            query: params.query,
            category: params.category,
            maxPrice: params.max_price ? parseFloat(params.max_price) : undefined,
            inStockOnly: params.in_stock_only === "true"
          });
          return JSON.stringify({
            products: products.slice(0, 10),
            total: products.length,
            query: params.query
          });
        } catch (error) {
          return `Search failed: ${error.message}. Please try different terms.`;
        }
      }
    }),

    new Tool("check_inventory", {
      description: "Check real-time product availability",
      parameters: {
        product_id: "Product identifier",
        location: "Store location (optional, defaults to online)"
      },
      func: async (params) => {
        const inventory = await inventoryService.check(params.product_id, params.location);
        return JSON.stringify({
          productId: params.product_id,
          available: inventory.quantity > 0,
          quantity: inventory.quantity,
          location: params.location || "online",
          lastUpdated: inventory.lastUpdated
        });
      }
    }),

    new Tool("process_payment", {
      description: "Process customer payment for selected items",
      parameters: {
        items: "JSON array of {product_id, quantity} objects",
        payment_method: "Payment method (card, paypal, etc.)",
        billing_address: "Customer billing address"
      },
      func: async (params) => {
        try {
          const items = JSON.parse(params.items);
          const result = await paymentService.process({
            items,
            paymentMethod: params.payment_method,
            billingAddress: params.billing_address
          });
          return JSON.stringify({
            success: true,
            transactionId: result.transactionId,
            total: result.total,
            estimatedDelivery: result.estimatedDelivery
          });
        } catch (error) {
          return `Payment failed: ${error.message}`;
        }
      }
    })
  ]
});

// Agent automatically orchestrates: search → inventory check → payment
const [conversation, success] = await ecommerce_agent.call(
  "I need a laptop under $1000, check if it's available and process payment with my Visa card"
);
```

### Conditional Rules and Business Logic

```typescript
// Time-based rules
const support_hours_rule = new Rule(
  "Outside business hours, inform customer of support availability",
  {
    when: (agent) => {
      const now = new Date();
      const hour = now.getHours();
      const is_weekend = now.getDay() === 0 || now.getDay() === 6;
      return hour < 9 || hour > 17 || is_weekend;
    }
  }
);

// Context-aware rules
const premium_rule = new Rule(
  "Offer priority support and exclusive features",
  {
    when: (agent) => {
      const tier = agent.metadata.get("customer_tier", "");
      return tier === "premium" || tier === "enterprise";
    }
  }
);

// Async rules with external validation
const compliance_rule = new Rule(
  "Apply regulatory compliance for financial services",
  {
    when: async (agent) => {
      const region = agent.metadata.get("user_region", "");
      const compliance_check = await complianceService.check(region);
      return compliance_check.requiresFinancialCompliance;
    }
  }
);

agent.rules = [support_hours_rule, premium_rule, compliance_rule];
```

### Enterprise Context Hierarchy

```typescript
// Organization-wide base context
const organization_context = new Context({
  metadata: new Metadata()
    .set("organization", "Arcaelas Insiders")
    .set("compliance_level", "enterprise")
    .set("data_retention", "7_years"),
  rules: [
    new Rule("Maintain data privacy according to GDPR"),
    new Rule("Log all interactions for audit purposes"),
    new Rule("Never expose internal system information")
  ]
});

// Department-specific context
const engineering_context = new Context({
  context: organization_context,
  metadata: new Metadata()
    .set("department", "Engineering")
    .set("access_level", "technical"),
  tools: [
    new Tool("system_status", async () => await systemMonitor.getStatus()),
    new Tool("deploy_service", async (env) => await deployment.deploy(env))
  ]
});

// Team-specific context
const backend_context = new Context({
  context: engineering_context,
  metadata: new Metadata()
    .set("team", "Backend")
    .set("tech_stack", "Node.js"),
  tools: [
    new Tool("database_query", async (query) => await db.execute(query)),
    new Tool("api_metrics", async () => await metrics.getApiStats())
  ]
});

// Individual agent with full hierarchy
const backend_agent = new Agent({
  name: "Backend_Specialist",
  description: "Senior backend engineer with full system access",
  contexts: backend_context,
  providers: [openai_provider, claude_provider]
});

// Agent inherits complete organizational hierarchy:
// - Organization policies and compliance
// - Engineering department tools and access
// - Backend team specific capabilities
// - Individual specialized behavior
```

---

## Error Handling

### Provider Resilience

The agent automatically handles provider failures:

```typescript
// If primary provider fails, agent automatically tries next available
const resilient_agent = new Agent({
  name: "Resilient_Assistant",
  description: "High-availability agent with automatic failover",
  providers: [primary_provider, backup_provider, emergency_provider]
});

try {
  const [messages, success] = await resilient_agent.call("Process this request");
  if (!success) {
    console.log("All providers failed - check connectivity and API keys");
  }
} catch (error) {
  console.error("Unexpected error:", error.message);
}
```

### Tool Error Recovery

Tools with error handling maintain conversation flow:

```typescript
const robust_tool = new Tool("external_api_call", {
  description: "Call external service with retry logic",
  parameters: {
    endpoint: "API endpoint to call",
    data: "Data to send"
  },
  func: async (params) => {
    try {
      const response = await fetch(params.endpoint, {
        method: 'POST',
        body: JSON.stringify(params.data),
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return JSON.stringify(result);
    } catch (error) {
      // Return error as string - conversation continues
      return `Service temporarily unavailable: ${error.message}. Please try again later.`;
    }
  }
});
```

---

## Performance Considerations

### Memory Management

```typescript
// For long-running applications, manage conversation history
const efficient_agent = new Agent({
  name: "Production_Agent",
  description: "Memory-efficient agent for long-running sessions"
});

// Periodically trim conversation history
function trimConversationHistory(agent: Agent, maxMessages: number = 50) {
  if (agent.messages.length > maxMessages) {
    // Keep system messages and recent conversation
    const system_messages = agent.messages.filter(m => m.role === "system");
    const recent_messages = agent.messages.slice(-maxMessages + system_messages.length);
    agent.messages = [...system_messages, ...recent_messages];
  }
}

// Use in production
setInterval(() => {
  trimConversationHistory(efficient_agent);
}, 300000); // Every 5 minutes
```

### Provider Load Balancing

```typescript
// Random provider selection distributes load automatically
const load_balanced_agent = new Agent({
  name: "Load_Balanced_Agent",
  description: "Agent with automatic load distribution",
  providers: [
    openai_provider_1,
    openai_provider_2,
    openai_provider_3,
    claude_provider_1,
    claude_provider_2
  ] // Random selection provides natural load balancing
});
```

### Tool Optimization

```typescript
// Optimize tools for performance
const optimized_tool = new Tool("fast_computation", {
  description: "Optimized computation with caching",
  parameters: {
    input: "Computation input"
  },
  func: async (params) => {
    // Use caching for expensive operations
    const cache_key = `computation_${params.input}`;
    const cached = await cache.get(cache_key);

    if (cached) {
      return cached;
    }

    const result = await performExpensiveComputation(params.input);
    await cache.set(cache_key, result, 3600); // Cache for 1 hour

    return result;
  }
});
```

---

## Type Definitions

### Core Types

```typescript
// Message roles
type MessageRole = "user" | "assistant" | "tool" | "system";

// Provider function signature
type ProviderFunction = (ctx: Context) => ChatCompletionResponse | Promise<ChatCompletionResponse>;

// Tool handler signatures
type SimpleToolHandler = (input: string) => any;
type AdvancedToolHandler<T> = (params: T extends object ? T : { input: string }) => string | Promise<string>;

// Rule evaluation function
type RuleEvaluator = (ctx: Agent) => boolean | Promise<boolean>;
```

### Configuration Interfaces

```typescript
interface AgentOptions {
  name: string;
  description: string;
  metadata?: Metadata | Metadata[];
  tools?: Tool | Tool[];
  rules?: Rule | Rule[];
  messages?: Message | Message[];
  contexts?: Context | Context[];
  providers?: Provider[];
}

interface ContextOptions {
  context?: Context | Context[];
  metadata?: Metadata | Metadata[];
  rules?: Rule | Rule[];
  tools?: Tool | Tool[];
  messages?: Message | Message[];
}

type Provider = (
  ctx: Context
) => ChatCompletionResponse | Promise<ChatCompletionResponse>;

interface ToolOptions<T = Record<string, string>> {
  description: string;
  parameters?: T;
  func: AdvancedToolHandler<T>;
}

interface RuleOptions {
  when: RuleEvaluator;
}
```

### Response Types

```typescript
interface ChatCompletionResponse {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  system_fingerprint?: string | null;
  choices: CompletionChoice[];
  usage?: CompletionUsage;
  service_tier?: string | null;
}

interface CompletionChoice {
  index: number;
  message: ResponseMessage;
  logprobs?: { content: Array<any> | null; } | null;
  finish_reason: "stop" | "length" | "tool_calls" | "content_filter" | "function_call" | null;
}

interface ResponseMessage {
  role: "assistant";
  content: string | null;
  function_call?: { name: string; arguments: string; } | null;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string; };
  }> | null;
  refusal?: string | null;
}

interface CompletionUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}
```

---

## Migration Guide

### From v1.x to v2.x

```typescript
// v1.x (deprecated)
const oldAgent = new Agent({
  name: "Assistant",
  personality: "helpful",
  tools: { calculator: calculatorFunction }
});

// v2.x (current)
const newAgent = new Agent({
  name: "Assistant",
  description: "Helpful assistant with calculation capabilities",
  tools: [
    new Tool("calculator", {
      description: "Perform mathematical calculations",
      parameters: {
        expression: "Mathematical expression to evaluate"
      },
      func: calculatorFunction
    })
  ]
});
```

### Breaking Changes

- `personality` property renamed to `description`
- Tools must use `Tool` class instead of plain objects
- Provider configuration requires `func` implementation
- Message format standardized to OpenAI schema

---

## Examples Repository

Find complete working examples in our [examples repository](https://github.com/arcaelas/agent-examples):

- 🤖 **Customer Support Bot** - Multi-channel support with knowledge base
- 🛒 **E-commerce Assistant** - Product search, inventory, and payments
- 📊 **Data Analysis Agent** - SQL queries and report generation
- 🔧 **DevOps Automation** - Deployment, monitoring, and incident response
- 🏥 **Healthcare Assistant** - Patient information and appointment scheduling
- 📚 **Educational Tutor** - Personalized learning with progress tracking

---

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone repository
git clone https://github.com/arcaelas/agent.git
cd agent

# Install dependencies
npm install

# Run tests
npm test

# Build library
npm run build
```

### Code Standards

- TypeScript strict mode enabled
- ESLint configuration with Arcaelas standards
- 100% test coverage requirement
- Comprehensive JSDoc documentation

---

## License

This project is licensed under a Custom License. See [LICENSE](LICENSE) file for details.

**Summary:**
- ✅ Free for personal, educational, and open-source projects
- ✅ Commercial use allowed with attribution
- ❌ Redistribution as competing library prohibited
- ❌ Trademark usage without permission prohibited

---

## Support

### Community

- 💬 [Discord Community](https://discord.gg/arcaelas) - Get help and discuss features
- 🐛 [GitHub Issues](https://github.com/arcaelas/agent/issues) - Report bugs and request features
- 📖 [Documentation Site](https://docs.arcaelas.com/agent) - Comprehensive guides and tutorials

### Enterprise Support

- 🏢 **Enterprise License** - Commercial licenses with support
- 🛠️ **Custom Development** - Tailored solutions for your organization
- 📞 **Priority Support** - Direct access to our engineering team

Contact: [enterprise@arcaelas.com](mailto:enterprise@arcaelas.com)

---

## Changelog

### v1.0.5 (Latest)
- ✨ Added TimeTool with timezone support
- 🔧 Enhanced RemoteTool with better error handling
- 📝 Improved TypeScript definitions
- 🐛 Fixed context inheritance edge cases

### v1.0.4
- 🚀 Multi-provider failover system
- ⚡ Performance optimizations for large conversations
- 🔒 Enhanced security for tool execution
- 📊 Better error reporting and logging

[View Full Changelog](CHANGELOG.md)

---

**Built with ❤️ by [Arcaelas Insiders](https://arcaelas.com)**