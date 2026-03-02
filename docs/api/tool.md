# Tool

**Tool** encapsulates functions that AI agents can execute. It provides a flexible API supporting both simple single-parameter functions and advanced multi-parameter operations.

## Overview

Tools enable agents to interact with external systems, process data, and perform specialized tasks:

- **Simple Tools**: Quick function wrapping with string input
- **Advanced Tools**: Structured parameters with descriptions
- **Reusable**: Share tools across multiple agents and contexts
- **Type-Safe**: Full TypeScript support with generics

## Constructor

Tool has two constructor overloads for different use cases:

### Simple Tool

```typescript
new Tool(name: string, handler: (agent: Agent, input: string) => any)
```

Creates a tool with a single string input parameter. The default parameters for a simple tool are `{ input: "<tool-input>" }`, where the value is the literal string `"<tool-input>"` used as the parameter description. The description defaults to the tool name.

**Parameters:**
- **name**: Unique tool identifier
- **handler**: Function that processes input and returns result

**Example:**

```typescript
import { Tool } from '@arcaelas/agent';

// Weather tool
const weather_tool = new Tool('get_weather', (agent: Agent, input: string) => {
  return "Sunny, 24C in Madrid";
});

// Time tool
const time_tool = new Tool('get_time', (agent: Agent) => {
  return new Date().toLocaleString();
});

// File reader tool
const read_file = new Tool('read_file', async (agent: Agent, path: string) => {
  const content = await fs.readFile(path, 'utf-8');
  return content;
});
```

### Advanced Tool

```typescript
new Tool<T>(name: string, options: ToolOptions<T>)
```

Creates a tool with structured parameters and detailed configuration.

**Parameters:**
- **name**: Unique tool identifier
- **options**: Advanced configuration object

#### ToolOptions

```typescript
interface ToolOptions<T = Record<string, string>> {
  /** Clear description of what the tool does */
  description: string;

  /** Parameter schema with descriptions */
  parameters?: T;

  /** Function to execute (sync or async) */
  func(agent: Agent, params: T extends object ? T : { input: string }): any;
}
```

**Example:**

```typescript
import { Tool } from '@arcaelas/agent';

// Database search tool
const search_tool = new Tool('search_database', {
  description: 'Search customer database with filters',
  parameters: {
    query: 'Search query string',
    limit: 'Maximum results to return (default: 10)',
    category: 'Filter by category (optional)'
  },
  func: async (agent, { query, limit, category }) => {
    const results = await database.search({
      query,
      limit: parseInt(limit || '10'),
      category: category || null
    });
    return JSON.stringify(results);
  }
});
```

## Properties

### name

```typescript
readonly name: string
```

Unique identifier for the tool. Used for deduplication in contexts.

### description

```typescript
readonly description: string
```

Human-readable description of what the tool does. For simple tools, defaults to the tool name.

### parameters

```typescript
readonly parameters: T | { input: string }
```

Parameter schema describing expected inputs. Simple tools get `{ input: "<tool-input>" }` automatically.

```typescript
// Simple tool parameters
const simple = new Tool('greet', (agent, input) => `Hello ${input}`);
console.log(simple.parameters); // { input: "<tool-input>" }

// Advanced tool parameters
const advanced = new Tool('search', {
  description: 'Search',
  parameters: {
    query: 'Search term',
    limit: 'Max results'
  },
  func: (agent) => "..."
});

console.log(advanced.parameters);
// { query: "Search term", limit: "Max results" }
```

### func

```typescript
readonly func: (agent: Agent, params: T extends object ? T : { input: string }) => any
```

The executable function. Can be sync or async. Returns any value; the Agent serializes the result automatically.

## Methods

### toJSON()

```typescript
toJSON(): {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, { type: "string"; description: string }>;
    };
  };
}
```

Serializes the tool to OpenAI function-calling format. Each parameter key is transformed into `{ type: "string", description: <original_value> }`. Called automatically by `JSON.stringify()`.

**Returns:** OpenAI-compatible tool definition

**Example:**

```typescript
const tool = new Tool('calculator', {
  description: 'Basic math operations',
  parameters: {
    operation: '+, -, *, /',
    a: 'First number',
    b: 'Second number'
  },
  func: (agent) => "..."
});

console.log(JSON.stringify(tool, null, 2));
// {
//   "type": "function",
//   "function": {
//     "name": "calculator",
//     "description": "Basic math operations",
//     "parameters": {
//       "type": "object",
//       "properties": {
//         "operation": { "type": "string", "description": "+, -, *, /" },
//         "a": { "type": "string", "description": "First number" },
//         "b": { "type": "string", "description": "Second number" }
//       }
//     }
//   }
// }
```

### toString()

```typescript
toString(): string
```

Returns human-readable string representation for debugging.

**Returns:** String in format `"Tool(name): description"`

**Example:**

```typescript
const tool = new Tool('weather', {
  description: 'Get current weather',
  func: (agent) => "..."
});

console.log(tool.toString()); // "Tool(weather): Get current weather"
console.log(String(tool));    // Same result
```

## Usage Patterns

### Pattern: API Integration

Wrap external API calls:

```typescript
const github_search = new Tool('github_search', {
  description: 'Search GitHub repositories',
  parameters: {
    query: 'Search query',
    language: 'Programming language filter (optional)',
    stars: 'Minimum stars (optional)'
  },
  func: async (agent, { query, language, stars }) => {
    const params = new URLSearchParams({ q: query });
    if (language) params.append('language', language);
    if (stars) params.append('stars', `>=${stars}`);

    const response = await fetch(
      `https://api.github.com/search/repositories?${params}`
    );

    const data = await response.json();
    return JSON.stringify(data.items.slice(0, 5));
  }
});
```

### Pattern: Database Operations

Create CRUD tools:

```typescript
const create_user = new Tool('create_user', {
  description: 'Create new user account',
  parameters: {
    email: 'User email address',
    name: 'User full name',
    role: 'User role (admin, user, guest)'
  },
  func: async (agent, { email, name, role }) => {
    const user = await db.users.create({
      email,
      name,
      role: role || 'user'
    });
    return `User created with ID: ${user.id}`;
  }
});
```

## Type Safety

Tool supports TypeScript generics for parameter type safety:

```typescript
import { Tool, ToolOptions } from '@arcaelas/agent';

// Define parameter interface
interface SearchParams {
  query: string;
  limit: string;
  category: string;
}

// Create typed tool
const search_tool = new Tool<SearchParams>('search', {
  description: 'Search with typed parameters',
  parameters: {
    query: 'Search query',
    limit: 'Max results',
    category: 'Category filter'
  },
  func: (agent, { query, limit, category }) => {
    const num_limit = parseInt(limit);
    return database.search(query, num_limit, category);
  }
});
```

## Related

- **[Context](context.md)** - Manages tools in hierarchical contexts
- **[Agent](agent.md)** - Executes tools during conversations
- **[Built-in Tools](built-in-tools.md)** - Pre-built RemoteTool and TimeTool

---

**Next:** Learn about [Rule ->](rule.md)
