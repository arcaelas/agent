# Custom Tools Example

This example demonstrates how to create custom tools for your agents, from simple functions to advanced tools with parameter validation.

## Overview

Tools extend agent capabilities by providing access to external data, APIs, and custom logic. The @arcaelas/agent library supports two types of tools:

- **Simple Tools** - Basic function with string input
- **Advanced Tools** - Complex functions with typed parameters and descriptions

## Simple Tool Example

### Basic Weather Tool

```typescript
import { Agent, Tool } from '@arcaelas/agent';

// Simple tool with string input
const weather_tool = new Tool('get_weather', (agent, input: string) => {
  // input contains the natural language request
  // In production, you would call a real weather API
  return `Weather for ${input}: Sunny, 24°C`;
});

const agent = new Agent({
  name: "Weather_Agent",
  description: "Helpful weather assistant",
  tools: [weather_tool],
  providers: [openai_provider]
});

// Agent will automatically call the tool when needed
const [messages, success] = await agent.call("What's the weather in Madrid?");
// Agent calls weather_tool automatically
// Returns: "Weather for Madrid: Sunny, 24°C"
```

### Timestamp Tool

```typescript
const timestamp_tool = new Tool('get_current_time', (agent) => {
  return new Date().toISOString();
});
```

### Random Number Tool

```typescript
const random_tool = new Tool('generate_random', (agent, input: string) => {
  const max = parseInt(input) || 100;
  return Math.floor(Math.random() * max).toString();
});
```

## Advanced Tool Example

### Database Search Tool

```typescript
import { Tool } from '@arcaelas/agent';

const search_customers = new Tool('search_customers', {
  description: 'Search customers in database by various criteria',
  parameters: {
    query: 'Search query string',
    limit: 'Maximum number of results (default: 10)',
    status: 'Filter by customer status: active, inactive, or all'
  },
  func: async (agent, { query, limit, status }) => {
    // Parse parameters
    const max_results = limit ? parseInt(limit) : 10;
    const filter_status = status || 'all';

    // Query database (example)
    const results = await database.customers.find({
      $text: { $search: query },
      ...(filter_status !== 'all' && { status: filter_status })
    }).limit(max_results);

    return JSON.stringify(results);
  }
});
```

### API Integration Tool

```typescript
const github_search = new Tool('search_github_repos', {
  description: 'Search GitHub repositories by keywords and filters',
  parameters: {
    query: 'Search keywords',
    language: 'Programming language filter (optional)',
    sort: 'Sort by: stars, forks, or updated (default: stars)',
    order: 'Order: asc or desc (default: desc)'
  },
  func: async (agent, { query, language, sort, order }) => {
    const search_params = new URLSearchParams({
      q: language ? `${query} language:${language}` : query,
      sort: sort || 'stars',
      order: order || 'desc'
    });

    const response = await fetch(
      `https://api.github.com/search/repositories?${search_params}`
    );

    const data = await response.json();

    return JSON.stringify({
      total: data.total_count,
      repositories: data.items.slice(0, 5).map(repo => ({
        name: repo.full_name,
        stars: repo.stargazers_count,
        description: repo.description,
        url: repo.html_url
      }))
    });
  }
});
```

### Calculator Tool

```typescript
const calculator = new Tool('calculate', {
  description: 'Perform mathematical calculations',
  parameters: {
    operation: 'Mathematical operation: add, subtract, multiply, divide, power, sqrt',
    a: 'First number',
    b: 'Second number (not required for sqrt)'
  },
  func: (agent, { operation, a, b }) => {
    const num_a = parseFloat(a);
    const num_b = b ? parseFloat(b) : 0;

    switch (operation.toLowerCase()) {
      case 'add':
        return (num_a + num_b).toString();
      case 'subtract':
        return (num_a - num_b).toString();
      case 'multiply':
        return (num_a * num_b).toString();
      case 'divide':
        if (num_b === 0) return 'Error: Division by zero';
        return (num_a / num_b).toString();
      case 'power':
        return Math.pow(num_a, num_b).toString();
      case 'sqrt':
        if (num_a < 0) return 'Error: Square root of negative number';
        return Math.sqrt(num_a).toString();
      default:
        return 'Error: Unknown operation';
    }
  }
});
```

## Complete Agent with Custom Tools

```typescript
import { Agent, Tool } from '@arcaelas/agent';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Define custom tools
const weather_tool = new Tool('get_weather', {
  description: 'Get current weather for any city',
  parameters: {
    city: 'City name',
    units: 'Temperature units: celsius or fahrenheit (default: celsius)'
  },
  func: async (agent, { city, units }) => {
    const unit_system = units === 'fahrenheit' ? 'imperial' : 'metric';

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=${unit_system}&appid=${process.env.WEATHER_API_KEY}`
    );

    const data = await response.json();

    return JSON.stringify({
      city: data.name,
      temperature: data.main.temp,
      feels_like: data.main.feels_like,
      description: data.weather[0].description,
      humidity: data.main.humidity,
      wind_speed: data.wind.speed,
      units: unit_system === 'metric' ? '°C' : '°F'
    });
  }
});

const news_tool = new Tool('get_latest_news', {
  description: 'Get latest news articles by topic',
  parameters: {
    topic: 'News topic or category',
    count: 'Number of articles to return (default: 5)'
  },
  func: async (agent, { topic, count }) => {
    const max_results = count ? parseInt(count) : 5;

    const response = await fetch(
      `https://newsapi.org/v2/everything?q=${topic}&pageSize=${max_results}&apiKey=${process.env.NEWS_API_KEY}`
    );

    const data = await response.json();

    return JSON.stringify(
      data.articles.map(article => ({
        title: article.title,
        description: article.description,
        url: article.url,
        published: article.publishedAt
      }))
    );
  }
});

// Create OpenAI provider with tool support
const openai_provider = async (ctx) => {
  return await openai.chat.completions.create({
    model: "gpt-4",
    messages: ctx.messages.map(m => ({
      role: m.role === 'tool' ? 'tool' : m.role,
      content: m.content || '',
      ...(m.role === 'tool' && { tool_call_id: m.tool_call_id })
    })),
    tools: ctx.tools.map(tool => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: "object",
          properties: Object.entries(tool.parameters).reduce(
            (acc, [key, desc]) => ({
              ...acc,
              [key]: {
                type: "string",
                description: desc
              }
            }),
            {}
          ),
          required: Object.keys(tool.parameters)
        }
      }
    }))
  });
};

// Create agent with custom tools
const assistant = new Agent({
  name: "Multi_Tool_Assistant",
  description: "Helpful assistant with weather and news capabilities",
  tools: [weather_tool, news_tool],
  providers: [openai_provider]
});

// Usage
async function demo() {
  // Weather request
  const [weather_response, success1] = await assistant.call(
    "What's the weather like in Tokyo?"
  );

  if (success1) {
    console.log(weather_response[weather_response.length - 1].content);
  }

  // News request
  const [news_response, success2] = await assistant.call(
    "Show me the latest news about artificial intelligence"
  );

  if (success2) {
    console.log(news_response[news_response.length - 1].content);
  }
}

demo();
```

## Tool Execution Flow

When an agent receives a prompt:

1. **Provider Call** - Agent sends prompt to AI provider with tool definitions
2. **Tool Decision** - AI decides whether to use tools and which ones
3. **Tool Execution** - Agent executes requested tools in parallel
4. **Result Processing** - Tool results are added to conversation
5. **Final Response** - AI processes tool results and responds to user

```
User: "What's the weather in Paris and latest tech news?"
   │
   ▼
┌─────────────────────┐
│ Agent receives      │
│ prompt              │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Provider decides:   │
│ - Use weather_tool  │
│ - Use news_tool     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Execute tools in    │
│ parallel:           │
│ ✓ weather_tool      │
│ ✓ news_tool         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Provider processes  │
│ results and         │
│ generates response  │
└──────────┬──────────┘
           │
           ▼
User: "Paris: Sunny, 22°C. Latest tech news: [articles]"
```

## Tool Best Practices

### 1. Clear Descriptions

```typescript
// ✅ Good: Clear, specific description
const good_tool = new Tool('search_products', {
  description: 'Search e-commerce product catalog by name, category, or SKU',
  parameters: { ... }
});

// ❌ Bad: Vague description
const bad_tool = new Tool('search', {
  description: 'Search stuff',
  parameters: { ... }
});
```

### 2. Detailed Parameters

```typescript
// ✅ Good: Descriptive parameter names and descriptions
parameters: {
  start_date: 'Start date in ISO 8601 format (e.g., 2024-01-01)',
  end_date: 'End date in ISO 8601 format (e.g., 2024-12-31)',
  include_weekends: 'Include weekends in results: true or false (default: true)'
}

// ❌ Bad: Unclear parameters
parameters: {
  date1: 'date',
  date2: 'date',
  flag: 'option'
}
```

### 3. Error Handling

```typescript
const robust_tool = new Tool('fetch_data', {
  description: 'Fetch data from external API',
  parameters: {
    endpoint: 'API endpoint path',
    method: 'HTTP method: GET or POST'
  },
  func: async (agent, { endpoint, method }) => {
    try {
      const response = await fetch(`https://api.example.com/${endpoint}`, {
        method: method.toUpperCase()
      });

      if (!response.ok) {
        return JSON.stringify({
          error: true,
          message: `HTTP ${response.status}: ${response.statusText}`
        });
      }

      const data = await response.json();
      return JSON.stringify({ error: false, data });

    } catch (error) {
      return JSON.stringify({
        error: true,
        message: error.message
      });
    }
  }
});
```

### 4. Return JSON for Complex Data

```typescript
// ✅ Good: Structured JSON response
func: async (agent, { query }) => {
  const results = await search(query);
  return JSON.stringify({
    total: results.length,
    items: results,
    timestamp: new Date().toISOString()
  });
}

// ❌ Bad: Unstructured string
func: async (agent, { query }) => {
  const results = await search(query);
  return `Found ${results.length} results: ${results.join(', ')}`;
}
```

### 5. Async Operations

```typescript
// ✅ Good: Proper async/await
func: async (agent, { url }) => {
  const response = await fetch(url);
  const data = await response.json();
  return JSON.stringify(data);
}

// ❌ Bad: Unhandled promises
func: (agent, { url }) => {
  fetch(url).then(r => r.json()).then(d => JSON.stringify(d));
  // Returns undefined!
}
```

## Tool Testing

Test tools independently:

```typescript
// Create tool
const test_tool = new Tool('my_tool', {
  description: 'Test tool',
  parameters: {
    input: 'Test input'
  },
  func: async (agent, { input }) => {
    return `Processed: ${input}`;
  }
});

// Test tool function directly
const result = await test_tool.func({ input: 'test value' });
console.log(result); // "Processed: test value"

// Verify tool metadata
console.log(test_tool.name);        // "my_tool"
console.log(test_tool.description); // "Test tool"
console.log(test_tool.parameters);  // { input: 'Test input' }
```

## Built-in Tools

The library provides built-in tools:

### RemoteTool

HTTP requests with various methods:

```typescript
import { RemoteTool } from '@arcaelas/agent';

const http_tool = new RemoteTool();

// Use in agent
const agent = new Agent({
  tools: [http_tool],
  // ...
});

// Agent can now make HTTP requests automatically
await agent.call("Fetch data from https://api.example.com/users");
```

### TimeTool

Timezone and date operations:

```typescript
import { TimeTool } from '@arcaelas/agent';

const time_tool = new TimeTool();

// Agent can now handle timezone conversions and date queries
```

**[Learn more about built-in tools →](../api/built-in-tools.md)**

## Next Steps

- **[Context Inheritance](context-inheritance.md)** - Share tools across agents
- **[Advanced Patterns](advanced-patterns.md)** - Complex tool orchestration
- **[API Reference: Tool](../api/tool.md)** - Complete Tool API

---

**[← Back to Examples](../index.md#examples)**
