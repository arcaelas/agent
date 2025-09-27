![Arcaelas Insiders Banner](https://raw.githubusercontent.com/arcaelas/dist/main/banner/svg/dark.svg#gh-dark-mode-only)
![Arcaelas Insiders Banner](https://raw.githubusercontent.com/arcaelas/dist/main/banner/svg/light.svg#gh-light-mode-only)

# Welcome to Arcaelas Insiders!

Hello, if this is your first time reading the **Arcaelas Insiders** documentation, let me tell you—you’ve found a great place to learn.

**Our team** and _community_ take pride in writing and simplifying methods to make them easy to implement and understand. But you probably already knew that.

Let’s begin with the basic setup steps:
`npm i --save @arcaelas/agent`
`yarn add --save @arcaelas/agent`

A library for building intelligent agents using OpenAI APIs, allowing you to add custom tools, define the agent’s personality, and manage conversations with language models in a structured way.

## Introduction

An **Agent**, in the context of this library, is a conversational entity that:

- Has a defined **name** and **personality**
- Can use **tools** to perform specific tasks
- Manages conversations via OpenAI APIs
- Automatically handles the flow between responses and tool calls

The library allows you to create customizable agents capable of solving complex tasks by combining OpenAI's reasoning power with the specific tools you define.

## Quick Installation

```bash
# Using yarn
yarn add @arcaelas/agent

# Using npm
npm install @arcaelas/agent
```

## Basic Usage

```typescript
import Agent from "@arcaelas/agent";

// Create a basic agent
const assistant = new Agent({
  name: "Helper", // Agent's name
  description: "A kind and professional assistant who replies concisely", // Personality
  providers: [
    {
      // OpenAI configuration
      baseURL: "https://api.openai.com/v1",
      model: "gpt-3.5-turbo",
      apiKey: "your-api-key-here",
    },
  ],
});

// Add a simple tool to the agent
assistant.tool("get_date", {
  description: "Get current date and time",
  func: async () => {
    return new Date().toLocaleString();
  },
});

// Start a conversation
const history = await assistant.answer([
  { role: "user", content: "What day is today?" },
]);

console.log(history);
```

## Advanced Usage

```typescript
import Agent from "@arcaelas/agent";
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

## License

This project is open source and available for personal, educational, and non-commercial use. Commercial use requires a specific license from Arcaelas Insiders. For more details, refer to the LICENSE file.
