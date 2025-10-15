# Tool

**Tool** encapsulates functions that AI agents can execute. It provides a flexible API supporting both simple single-parameter functions and advanced multi-parameter operations.

## Overview

Tools enable agents to interact with external systems, process data, and perform specialized tasks:

- **Simple Tools**: Quick function wrapping with string input
- **Advanced Tools**: Structured parameters with descriptions
- **Reusable**: Share tools across multiple agents and contexts
- **Type-Safe**: Full TypeScript support with generics

### Key Features

- ✅ Two-tier API (simple and advanced)
- ✅ Sync and async function support
- ✅ Parameter schema definition
- ✅ JSON serialization
- ✅ Type-safe with TypeScript generics
- ✅ Framework-agnostic

## Constructor

Tool has two constructor overloads for different use cases:

### Simple Tool

```typescript
new Tool(name: string, handler: (input: string) => any)
```

Creates a tool with a single string input parameter.

**Parameters:**
- **name**: Unique tool identifier
- **handler**: Function that processes input and returns result

**Example:**

```typescript
import { Tool } from '@arcaelas/agent';

// Weather tool
const weather_tool = new Tool('get_weather', (input: string) => {
  // input: "What's the weather in Madrid?"
  return "Sunny, 24°C in Madrid";
});

// Time tool
const time_tool = new Tool('get_time', () => {
  return new Date().toLocaleString();
});

// File reader tool
const read_file = new Tool('read_file', async (path: string) => {
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
  func(params: T): string | Promise<string>;
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
  func: async ({ query, limit, category }) => {
    const results = await database.search({
      query,
      limit: parseInt(limit || '10'),
      category: category || null
    });
    return JSON.stringify(results);
  }
});

// Calculator tool
const calculator = new Tool('calculate', {
  description: 'Perform basic mathematical operations',
  parameters: {
    operation: 'Operation to perform (+, -, *, /)',
    a: 'First number',
    b: 'Second number'
  },
  func: ({ operation, a, b }) => {
    const num_a = parseFloat(a);
    const num_b = parseFloat(b);

    switch (operation) {
      case '+': return (num_a + num_b).toString();
      case '-': return (num_a - num_b).toString();
      case '*': return (num_a * num_b).toString();
      case '/': return num_b !== 0
        ? (num_a / num_b).toString()
        : 'Error: Division by zero';
      default: return 'Invalid operation';
    }
  }
});
```

## Properties

### name

```typescript
readonly name: string
```

Unique identifier for the tool. Used for deduplication in contexts.

**Example:**

```typescript
const tool = new Tool('weather_api', () => "...");
console.log(tool.name); // "weather_api"
```

### description

```typescript
readonly description: string
```

Human-readable description of what the tool does. For simple tools, defaults to the tool name.

**Example:**

```typescript
const tool = new Tool('search', {
  description: 'Search through customer records',
  func: () => "..."
});

console.log(tool.description); // "Search through customer records"
```

### parameters

```typescript
readonly parameters: T | { input: string }
```

Parameter schema describing expected inputs. Simple tools get `{ input: string }` automatically.

**Example:**

```typescript
// Simple tool parameters
const simple = new Tool('greet', (input) => `Hello ${input}`);
console.log(simple.parameters); // { input: "Entrada para la herramienta" }

// Advanced tool parameters
const advanced = new Tool('search', {
  description: 'Search',
  parameters: {
    query: 'Search term',
    limit: 'Max results'
  },
  func: () => "..."
});

console.log(advanced.parameters);
// { query: "Search term", limit: "Max results" }
```

### func

```typescript
readonly func: (params: any) => any
```

The executable function. Can be sync or async.

**Example:**

```typescript
const tool = new Tool('process', (input) => {
  return input.toUpperCase();
});

// Execute directly
const result = tool.func({ input: "hello" });
console.log(result); // "HELLO"
```

## Methods

### toJSON()

```typescript
toJSON(): {
  name: string;
  description: string;
  parameters: T | { input: string };
}
```

Serializes tool metadata (excludes the function). Called automatically by `JSON.stringify()`.

**Returns:** Serializable representation

**Example:**

```typescript
const tool = new Tool('calculator', {
  description: 'Basic math operations',
  parameters: {
    operation: '+, -, *, /',
    a: 'First number',
    b: 'Second number'
  },
  func: () => "..."
});

// Automatic serialization
const json = JSON.stringify(tool);
console.log(json);
// {
//   "name": "calculator",
//   "description": "Basic math operations",
//   "parameters": {
//     "operation": "+, -, *, /",
//     "a": "First number",
//     "b": "Second number"
//   }
// }

// Manual call
const data = tool.toJSON();
console.log(data.name); // "calculator"
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
  func: () => "..."
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
  func: async ({ query, language, stars }) => {
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
  func: async ({ email, name, role }) => {
    const user = await db.users.create({
      email,
      name,
      role: role || 'user'
    });
    return `User created with ID: ${user.id}`;
  }
});

const find_user = new Tool('find_user', {
  description: 'Find user by email',
  parameters: {
    email: 'Email address to search'
  },
  func: async ({ email }) => {
    const user = await db.users.findOne({ email });
    return user ? JSON.stringify(user) : 'User not found';
  }
});
```

### Pattern: Data Processing

Transform and analyze data:

```typescript
const analyze_text = new Tool('analyze_text', {
  description: 'Analyze text sentiment and extract keywords',
  parameters: {
    text: 'Text to analyze'
  },
  func: async ({ text }) => {
    const sentiment = await nlp.sentiment(text);
    const keywords = await nlp.keywords(text, { limit: 5 });

    return JSON.stringify({
      sentiment: sentiment.score,
      keywords: keywords.map(k => k.word)
    });
  }
});

const summarize = new Tool('summarize', {
  description: 'Generate text summary',
  parameters: {
    text: 'Text to summarize',
    max_length: 'Maximum summary length in words (default: 100)'
  },
  func: async ({ text, max_length }) => {
    const summary = await nlp.summarize(text, {
      maxLength: parseInt(max_length || '100')
    });
    return summary;
  }
});
```

### Pattern: File Operations

Handle file system tasks:

```typescript
const read_file = new Tool('read_file', {
  description: 'Read file contents',
  parameters: {
    path: 'File path to read'
  },
  func: async ({ path }) => {
    try {
      const content = await fs.readFile(path, 'utf-8');
      return content;
    } catch (error) {
      return `Error reading file: ${error.message}`;
    }
  }
});

const list_directory = new Tool('list_directory', {
  description: 'List files in directory',
  parameters: {
    path: 'Directory path',
    pattern: 'File pattern to match (optional, e.g., *.js)'
  },
  func: async ({ path, pattern }) => {
    const files = await fs.readdir(path);
    const filtered = pattern
      ? files.filter(f => minimatch(f, pattern))
      : files;
    return JSON.stringify(filtered);
  }
});
```

### Pattern: Tool Composition

Combine multiple operations:

```typescript
const process_order = new Tool('process_order', {
  description: 'Process customer order end-to-end',
  parameters: {
    order_id: 'Order ID to process',
    notify_customer: 'Send notification email (true/false)'
  },
  func: async ({ order_id, notify_customer }) => {
    // Validate order
    const order = await db.orders.findById(order_id);
    if (!order) return 'Order not found';

    // Process payment
    const payment = await stripe.charge(order.total, order.payment_method);
    if (!payment.success) return 'Payment failed';

    // Update inventory
    await inventory.decrement(order.items);

    // Send notification
    if (notify_customer === 'true') {
      await email.send(order.customer_email, 'Order Confirmed', {
        order_id,
        total: order.total
      });
    }

    return `Order ${order_id} processed successfully`;
  }
});
```

## Error Handling

Tools should handle errors gracefully:

```typescript
const safe_api_call = new Tool('api_call', {
  description: 'Make API call with error handling',
  parameters: {
    endpoint: 'API endpoint URL',
    method: 'HTTP method (GET, POST, etc.)'
  },
  func: async ({ endpoint, method }) => {
    try {
      const response = await fetch(endpoint, { method });

      if (!response.ok) {
        return JSON.stringify({
          error: true,
          status: response.status,
          message: response.statusText
        });
      }

      const data = await response.json();
      return JSON.stringify({ success: true, data });

    } catch (error) {
      return JSON.stringify({
        error: true,
        message: error.message
      });
    }
  }
});
```

## Best Practices

### 1. Clear Naming

Use descriptive, action-oriented names:

```typescript
// ✅ Good: Clear action names
new Tool('search_customers', ...);
new Tool('create_invoice', ...);
new Tool('send_email', ...);

// ❌ Bad: Vague names
new Tool('search', ...);
new Tool('create', ...);
new Tool('send', ...);
```

### 2. Detailed Descriptions

Write helpful descriptions for users and AI:

```typescript
// ✅ Good: Detailed description
new Tool('search_products', {
  description: 'Search product catalog by name, category, or SKU. Returns product details including price, stock, and images.',
  parameters: {...},
  func: ...
});

// ❌ Bad: Vague description
new Tool('search_products', {
  description: 'Search products',
  parameters: {...},
  func: ...
});
```

### 3. Parameter Documentation

Document each parameter clearly:

```typescript
// ✅ Good: Clear parameter descriptions
parameters: {
  query: 'Search query string (e.g., "red shoes")',
  max_price: 'Maximum price in USD (optional, e.g., "99.99")',
  category: 'Product category filter (optional, e.g., "electronics")'
}

// ❌ Bad: Minimal descriptions
parameters: {
  query: 'Query',
  max_price: 'Price',
  category: 'Category'
}
```

### 4. Return Structured Data

Return JSON for complex data:

```typescript
// ✅ Good: Structured JSON response
func: async ({ user_id }) => {
  const user = await db.findUser(user_id);
  return JSON.stringify({
    id: user.id,
    name: user.name,
    email: user.email,
    created_at: user.created_at
  });
}

// ❌ Bad: Unstructured string
func: async ({ user_id }) => {
  const user = await db.findUser(user_id);
  return `User: ${user.name}, Email: ${user.email}`;
}
```

### 5. Async for I/O

Use async for operations involving I/O:

```typescript
// ✅ Good: Async for database/API calls
const db_tool = new Tool('query_db', {
  description: 'Query database',
  func: async ({ query }) => {
    const results = await db.query(query);
    return JSON.stringify(results);
  }
});

// ❌ Bad: Sync with blocking operations
const bad_tool = new Tool('query_db', {
  description: 'Query database',
  func: ({ query }) => {
    const results = db.querySync(query);  // Blocks event loop
    return JSON.stringify(results);
  }
});
```

### 6. Validate Inputs

Validate and sanitize parameters:

```typescript
const validated_tool = new Tool('update_user', {
  description: 'Update user information',
  parameters: {
    user_id: 'User ID (numeric)',
    email: 'New email address'
  },
  func: async ({ user_id, email }) => {
    // Validate user_id
    const id = parseInt(user_id);
    if (isNaN(id) || id <= 0) {
      return 'Error: Invalid user ID';
    }

    // Validate email
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return 'Error: Invalid email format';
    }

    // Process
    await db.users.update(id, { email });
    return 'User updated successfully';
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
  func: ({ query, limit, category }) => {
    // TypeScript knows the parameter types
    const num_limit = parseInt(limit);
    return database.search(query, num_limit, category);
  }
});

// Type inference
const inferred = new Tool('inferred', {
  description: 'Inferred params',
  parameters: {
    foo: 'Foo param',
    bar: 'Bar param'
  },
  func: ({ foo, bar }) => {
    // TypeScript infers foo and bar as strings
    return `${foo} ${bar}`;
  }
});
```

## Testing Tools

Test tools independently:

```typescript
import { Tool } from '@arcaelas/agent';

describe('calculator_tool', () => {
  const calculator = new Tool('calculate', {
    description: 'Basic calculator',
    parameters: {
      operation: 'Math operation',
      a: 'First number',
      b: 'Second number'
    },
    func: ({ operation, a, b }) => {
      const num_a = parseFloat(a);
      const num_b = parseFloat(b);

      switch (operation) {
        case '+': return (num_a + num_b).toString();
        case '-': return (num_a - num_b).toString();
        default: return 'Invalid operation';
      }
    }
  });

  test('addition', () => {
    const result = calculator.func({ operation: '+', a: '5', b: '3' });
    expect(result).toBe('8');
  });

  test('subtraction', () => {
    const result = calculator.func({ operation: '-', a: '10', b: '4' });
    expect(result).toBe('6');
  });

  test('invalid operation', () => {
    const result = calculator.func({ operation: '%', a: '5', b: '2' });
    expect(result).toBe('Invalid operation');
  });
});
```

## Related

- **[Context](context.md)** - Manages tools in hierarchical contexts
- **[Agent](agent.md)** - Executes tools during conversations
- **[Built-in Tools](built-in-tools.md)** - Pre-built RemoteTool and TimeTool
- **[Custom Tools Example](../examples/custom-tools.md)** - Practical implementations

---

**Next:** Learn about [Rule →](rule.md)
