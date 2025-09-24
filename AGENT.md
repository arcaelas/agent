![Arcaelas Insiders Banner](https://raw.githubusercontent.com/arcaelas/dist/main/banner/svg/dark.svg#gh-dark-mode-only)
![Arcaelas Insiders Banner](https://raw.githubusercontent.com/arcaelas/dist/main/banner/svg/light.svg#gh-light-mode-only)

# Welcome to Arcaelas Agent Modular Architecture!

Hello, if this is your first time reading about the **Arcaelas Agent** modular system, let me tell you—you've found a powerful and flexible way to build intelligent conversational agents.

**Our team** designed this architecture to separate concerns and maximize reusability. You can now build enterprise-grade agents with modular components that work together seamlessly.

Let's begin with the installation:
`npm i --save @arcaelas/agent`
`yarn add @arcaelas/agent`

A modular system for building intelligent agents with separate **Tools**, **Context**, **Rules**, and **Agent** components. Create reusable, configurable, and enterprise-ready conversational agents.

## Introduction

The **Modular Agent Architecture** consists of four main components that work together:

- **Tool**: Reusable functions that agents can execute
- **Context**: Manages conversation state, metadata, and message history
- **Rule**: Defines dynamic behaviors and restrictions
- **Agent**: Orchestrates everything together with hooks and monitoring

This architecture allows you to create specialized agents for different domains while reusing tools, rules, and contexts across multiple implementations.

## Quick Installation

```bash
# Using yarn
yarn add @arcaelas/agent

# Using npm
npm install @arcaelas/agent
```

## Basic Usage

```typescript
import { Agent } from "@arcaelas/agent";

// Create a simple agent
const agent = new Agent({
    name: "WeatherBot",
    description: "Friendly weather assistant that helps users with weather information"
});

// Start conversation
const response = await agent("What's the weather like today?");
console.log(response);
```

## Intermediate Usage

### Adding Tools

```typescript
import { Tool, Agent } from "@arcaelas/agent";

// Create tools
const weather = new Tool('get_weather', (input: string) => {
    return "Sunny, 24°C in Madrid";
});

const location = new Tool('get_location', (input: string) => {
    return "Madrid, Spain";
});

// Create an agent
const agent = new Agent({
    name: "WeatherBot",
    description: "Weather assistant with access to current weather data"
});

// Add tools to agent's isolated environment
agent.tool(weather, location);

// Add metadata to agent's isolated context
agent.metadata("default_location", "Madrid");

// Start conversation
const response = await agent("What's the weather like?");
console.log(response);
```

### Adding Rules

```typescript
import { Rule, Agent } from "@arcaelas/agent";

// Create rules
const politenessRule = new Rule("Always be polite and helpful");
const locationRule = new Rule("Ask for user location if not provided", {
    when: "If user asks about weather without specifying location"
});

// Create an agent
const agent = new Agent({
    name: "WeatherBot",
    description: "Professional weather assistant"
});

// Add rules to agent's isolated environment
agent.rule(politenessRule, locationRule);

// Pre-load conversation context
agent.message("system", "You are now connected to weather services");

const response = await agent("Tell me about the weather");
console.log(response);
```

## Advanced Usage

```typescript
import { Tool, Context, Rule, Agent } from "@arcaelas/agent";

// Create advanced tools with complex parameters
const customerLookup = new Tool("find_customer", {
    description: "Search for customer information in database",
    parameters: {
        identifier: "Customer email, phone, or ID",
        include_history: "Include purchase history (true/false)"
    },
    func({ identifier, include_history }) {
        // Your customer lookup logic here
        return customerService.find(identifier, include_history === 'true');
    }
});

const createTicket = new Tool("create_support_ticket", {
    description: "Create a support ticket for escalation",
    parameters: {
        priority: "Priority level: low, medium, high, critical",
        category: "Issue category: technical, billing, general",
        description: "Detailed problem description"
    },
    func({ priority, category, description }) {
        return ticketSystem.create({ priority, category, description });
    }
});

// Create conditional rules
const premiumRule = new Rule("Offer premium support options", {
    when(context: Context) {
        return context.metadata("customer_tier") === "premium";
    }
});

const businessHoursRule = new Rule("Inform about business hours for phone support", {
    when: "If the current time is outside business hours"
});

// Create custom context with pre-configured tools and metadata
const supportContext = new Context("SupportAgent");
supportContext.tool(customerLookup, createTicket);
supportContext.metadata({
    customer_tier: "premium",
    preferred_language: "en",
    session_start: Date.now()
});

// Create enterprise agent with hooks and custom context
const supportAgent = new Agent({
    name: "CustomerSupport",
    description: "Professional customer support specialist with access to customer data and ticketing system",
    context: supportContext,
    rules: [premiumRule, businessHoursRule],
    before(context) {
        // Pre-execution hook for logging and validation
        console.log(`Support session started for: ${context.metadata("customer_id")}`);
        context.metadata("session_start", Date.now());
    },
    after(context) {
        // Post-execution hook for cleanup and metrics
        const duration = Date.now() - context.metadata("session_start");
        console.log(`Support session completed in ${duration}ms`);
        MetricsService.recordSession(duration);
    }
});

// Execute with direct prompt (uses internal context)
const response1 = await supportAgent("I need help with my order");

// Execute with custom context (doesn't affect internal context)
const customContext = new Context("SpecialSession");
customContext.metadata("urgency", "high");
const response2 = await supportAgent(customContext);
```

## Detailed API

### `Tool`

Creates reusable functions that agents can execute during conversations.

#### Simple Tool Constructor

- `new Tool(name: string, handler: (input: string) => any)`: Creates a simple tool with string input.

#### Advanced Tool Constructor

- `new Tool(name: string, options: AdvancedToolOptions)`: Creates a tool with typed parameters.

**AdvancedToolOptions:**
- `description: string`: What the tool does
- `parameters: Record<string, string>`: Parameter name → description mapping
- `func: (params: Record<string, any>) => any`: Function to execute

### `Context`

Manages conversation state, tools, metadata, and message history.

#### Constructor

- `new Context(identifier: string)`: Creates a new context with unique identifier.

#### Methods

**Tool Management:**
- `tool(tool: Tool)`: Add a tool to the context
- `tool(...tools: Tool[])`: Add multiple tools
- `tool(name: string)`: Get tool by name
- `tool(oldName: string, newTool: Tool)`: Replace a tool
- `tool(name: string, null)`: Remove a tool
- `tool(...names: string[], null)`: Remove multiple tools

**Metadata Management:**
- `metadata(key: string, value: any)`: Set a metadata value
- `metadata(object: Record<string, any>)`: Set multiple metadata values
- `metadata(key: string)`: Get a metadata value
- `metadata()`: Get all metadata

**Message Management:**
- `message(messages: Message[])`: Load message history
- `message(role: string, content: string)`: Add a message
- `message(toolId: string, response: string)`: Add tool response
- `message(index: number)`: Get message at index
- `message()`: Get all messages

### `Rule`

Defines dynamic behaviors and restrictions for agents.

#### Simple Rule Constructor

- `new Rule(description: string)`: Creates a static rule.

#### Conditional Rule Constructor

- `new Rule(description: string, options: RuleOptions)`: Creates a conditional rule.

**RuleOptions:**
- `when: string | ((context: Context) => boolean)`: Condition for rule application

### `Agent`

Orchestrates conversations using tools, context, and rules.

#### Constructor

- `new Agent(options: AgentOptions)`: Creates a new agent with specified configuration.

**AgentOptions:**
- `name: string`: Agent's name (required)
- `description?: string`: Agent's personality and behavior
- `context?: Context`: Base context (optional)
- `rules?: Rule[]`: List of rules to apply (optional)
- `before?: (context: Context) => void | Promise<void>`: Pre-execution hook (optional)
- `after?: (context: Context) => void | Promise<void>`: Post-execution hook (optional)

#### Methods

**Execution:**
- `agent(prompt: string)`: Execute with direct prompt, maintains internal history
- `agent(context: Context)`: Execute with custom context, doesn't affect internal context

**Agent Management (Isolated Environment):**
- `tool(tool: Tool)`: Add tool to agent's isolated context
- `tool(...tools: Tool[])`: Add multiple tools to agent
- `rule(rule: Rule)`: Add rule to agent's isolated context
- `rule(...rules: Rule[])`: Add multiple rules to agent
- `message(role: string, content: string)`: Add message to agent's internal history
- `message(messages: Message[])`: Load message history to agent
- `metadata(key: string, value: any)`: Set metadata in agent's isolated context
- `metadata(object: Record<string, any>)`: Set multiple metadata values
- `context()`: Get agent's current isolated context

## Enterprise Integration Patterns

### Database Persistence

```typescript
// Load conversation from database
app.post("/api/chat", async (req, res) => {
    const { userId, message } = req.body;

    // Load existing conversation
    const history = await ChatHistory.findByUser(userId);

    // Create context and load history
    const context = new Context(`User_${userId}`);
    context.message(history);
    context.metadata("user_id", userId);

    // Add new message and execute agent
    context.message("user", message);
    const response = await customerAgent(context);

    // Save updated conversation
    await ChatHistory.saveForUser(userId, context.message());

    res.json({ response });
});
```

### Multi-tenant Configuration

```typescript
// Create tenant-specific agents
const createTenantAgent = (tenantId: string) => {
    const context = new Context(`Tenant_${tenantId}`);

    // Load tenant-specific tools
    const tools = ToolRegistry.getByTenant(tenantId);
    context.tool(...tools);

    // Load tenant configuration
    const config = TenantConfig.get(tenantId);
    context.metadata("tenant_config", config);

    return new Agent({
        name: config.agentName,
        description: config.personality,
        context: context,
        rules: RuleRegistry.getByTenant(tenantId)
    });
};
```

## Use Cases

### Customer Support Automation

**Tools**: Customer lookup, ticket creation, knowledge base search
**Rules**: Premium user benefits, business hours notifications, escalation triggers
**Context**: Customer history, current issue details, interaction metadata

### E-commerce Assistant

**Tools**: Product search, inventory check, price calculation, cart management
**Rules**: Personalized offers, shipping promotions, recommendation engine
**Context**: User preferences, shopping cart, purchase history

### Data Analysis Agent

**Tools**: SQL execution, chart generation, report export
**Rules**: Security permissions, query complexity limits, data access controls
**Context**: Available databases, user permissions, active projects

## Best Practices

1. **Modular Design**: Create reusable tools and rules that work across different agents and contexts.

2. **Context Enrichment**: Use metadata to provide rich context that rules and tools can leverage.

3. **Dynamic Rules**: Leverage conditional rules to create adaptive agent behaviors based on current context.

4. **Hook Utilization**: Use before/after hooks for logging, validation, metrics, and state management.

5. **Error Isolation**: Design tools to handle errors gracefully without breaking the conversation flow.

6. **Security First**: Validate permissions in tools and rules, especially for database access and sensitive operations.

7. **Performance Monitoring**: Use hooks to track response times, tool usage, and conversation metrics.

8. **State Persistence**: Design contexts to be easily serializable for database storage and session management.

## Architecture Benefits

### Modularity
- **Reusable Components**: Tools and rules can be shared across multiple agents
- **Separation of Concerns**: Each component has a clear, focused responsibility
- **Easy Testing**: Individual components can be tested in isolation

### Scalability
- **Database Integration**: Native support for conversation persistence
- **Multi-tenant Support**: Context-based isolation for different organizations
- **Microservices Ready**: Components can be distributed across services

### Flexibility
- **Dynamic Configuration**: Rules and tools can be modified at runtime
- **Custom Hooks**: Extensible behavior through before/after hooks
- **Context Switching**: Agents can work with different contexts as needed

### Enterprise Ready
- **Audit Trails**: Complete conversation and action logging capabilities
- **Permission Systems**: Rule-based access control and validation
- **Monitoring Integration**: Built-in hooks for metrics and observability

## Interfaces & Types

### `ToolOptions<T>`

Interface for advanced tool configuration.

```typescript
interface ToolOptions<T> {
  description: string;                                    // Tool description for the AI model
  parameters?: T;                                        // Parameter schema (key: description)
  func: (params: T extends object ? T : { input: string }) => any; // Function to execute
}
```

**Properties:**
- `description`: Clear explanation of what the tool does
- `parameters`: Object mapping parameter names to their descriptions
- `func`: Function that receives typed parameters and returns any value

### `RuleOptions`

Interface for conditional rule configuration.

```typescript
interface RuleOptions {
  when: string | ((context: Context) => boolean);       // Condition for rule application
}
```

**Properties:**
- `when`: String description or function that determines when rule applies

### `AgentOptions`

Interface for agent configuration.

```typescript
interface AgentOptions {
  name: string;                                         // Agent's name (required)
  description?: string;                                 // Agent's personality and behavior
  context?: Context;                                    // Pre-configured base context
  rules?: Rule[];                                       // List of rules to apply
  before?: (context: Context) => void | Promise<void>; // Pre-execution hook
  after?: (context: Context) => void | Promise<void>;  // Post-execution hook
}
```

**Properties:**
- `name`: Unique identifier and display name for the agent
- `description`: Personality, behavior, and role description
- `context`: Optional pre-configured context with tools and metadata
- `rules`: Array of Rule instances that define agent behavior
- `before`: Hook executed before each conversation turn
- `after`: Hook executed after each conversation turn

### `Message`

Interface for conversation messages.

```typescript
interface Message {
  role: 'user' | 'assistant' | 'tool' | 'system';      // Message role
  content: string;                                      // Message content
  tool_id?: string;                                     // Tool identifier (for tool messages)
  metadata?: Record<string, any>;                       // Additional message metadata
}
```

**Properties:**
- `role`: Defines the message sender (user, assistant, tool, or system)
- `content`: The actual message text or response
- `tool_id`: Optional identifier when message is a tool response
- `metadata`: Optional additional data associated with the message

### `Context` Methods

Complete method signatures for the Context class.

#### Tool Management
```typescript
tool(tool: Tool): void                                  // Add single tool
tool(...tools: Tool[]): void                           // Add multiple tools
tool(name: string): Tool | undefined                    // Get tool by name
tool(oldName: string, newTool: Tool): void              // Replace tool
tool(name: string, null): void                          // Remove single tool
tool(...names: string[], null): void                    // Remove multiple tools
```

#### Metadata Management
```typescript
metadata(key: string, value: any): void                 // Set single metadata
metadata(object: Record<string, any>): void             // Set multiple metadata
metadata(key: string): any                              // Get single metadata
metadata(): Record<string, any>                         // Get all metadata
```

#### Message Management
```typescript
message(messages: Message[]): void                      // Load message array
message(role: string, content: string): void            // Add single message
message(toolId: string, response: string): void         // Add tool response
message(index: number): Message | undefined             // Get message by index
message(): Message[]                                    // Get all messages
```

### `Agent` Methods

Complete method signatures for the Agent class.

#### Execution Methods
```typescript
// Execute with direct prompt (maintains internal history)
agent(prompt: string): Promise<string>

// Execute with custom context (doesn't affect internal context)
agent(context: Context): Promise<string>
```

**Execution Behavior:**
- **Direct Prompt**: Adds user message to internal context and maintains conversation history
- **Custom Context**: Uses provided context without modifying agent's internal state

#### Agent Management Methods (Isolated Environment)
```typescript
// Tool management
tool(tool: Tool): void                                  // Add single tool
tool(...tools: Tool[]): void                           // Add multiple tools

// Rule management
rule(rule: Rule): void                                  // Add single rule
rule(...rules: Rule[]): void                           // Add multiple rules

// Message management
message(role: string, content: string): void            // Add single message
message(messages: Message[]): void                      // Load message history

// Metadata management
metadata(key: string, value: any): void                 // Set single metadata
metadata(object: Record<string, any>): void             // Set multiple metadata

// Context access
context(): Context                                      // Get agent's isolated context
```

**Isolation Behavior:**
- **Agent Methods**: Operate on agent's isolated internal context
- **Base Context**: Initial context from constructor remains unmodified
- **Runtime Changes**: Tools, rules, and metadata added via agent methods don't affect base context

## License

This project is open source and available for personal, educational, and non-commercial use. Commercial use requires a specific license from Arcaelas Insiders. For more details, refer to the LICENSE file.