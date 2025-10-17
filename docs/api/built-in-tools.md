# Built-in Tools

@arcaelas/agent includes two production-ready tools: **RemoteTool** for HTTP requests and **TimeTool** for time/date operations.

## RemoteTool

**RemoteTool** wraps HTTP API calls as agent tools. Supports GET, POST, PUT, DELETE, and PATCH methods.

### Constructor

```typescript
new RemoteTool(name: string, options: RemoteToolOptions)
```

### RemoteToolOptions

```typescript
interface RemoteToolOptions {
  description: string;
  parameters?: Record<string, string>;
  http: {
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    headers: Record<string, string>;
    url: string;
  };
}
```

### Examples

**GET Request:**

```typescript
import { RemoteTool } from '@arcaelas/agent';

const weather_api = new RemoteTool("get_weather", {
  description: "Get current weather from external API",
  parameters: {
    city: "City name to query",
    units: "Temperature units (celsius or fahrenheit)"
  },
  http: {
    method: "GET",
    headers: {
      "X-API-Key": process.env.WEATHER_API_KEY!,
      "Accept": "application/json"
    },
    url: "https://api.weather.com/v1/current"
  }
});
```

**POST Request:**

```typescript
const create_ticket = new RemoteTool("create_support_ticket", {
  description: "Create customer support ticket",
  parameters: {
    subject: "Ticket subject",
    description: "Detailed description",
    priority: "Priority level (low, medium, high)"
  },
  http: {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.SUPPORT_API_TOKEN}`,
      "Content-Type": "application/json"
    },
    url: "https://support.example.com/api/tickets"
  }
});
```

**Usage in Agent:**

```typescript
const agent = new Agent({
  name: "Weather_Assistant",
  description: "Provides weather information",
  tools: [weather_api],
  providers: [openai_provider]
});

await agent.call("What's the weather in Madrid?");
// Agent automatically calls weather_api tool with { city: "Madrid", units: "celsius" }
```

### Behavior Notes

- **GET/DELETE**: Parameters are sent as URL query string (e.g., `?city=Madrid&units=celsius`)
- **POST/PUT/PATCH**: Parameters are sent as JSON in request body
- Returns response as plain text
- Automatic error handling by agent
- Headers support dynamic values from environment variables

## TimeTool

**TimeTool** provides current date and time with timezone support.

### Constructor

```typescript
new TimeTool(options?: { time_zone?: string })
```

**Options:**
- **time_zone**: Optional IANA timezone (e.g., "Europe/Madrid", "America/New_York", "Asia/Tokyo")

### Examples

**System Timezone:**

```typescript
import { TimeTool } from '@arcaelas/agent';

const time_tool = new TimeTool({});

// Returns current time in system timezone
// Format: "12/27/2024, 3:45:30 PM"
```

**Specific Timezone:**

```typescript
const tokyo_time = new TimeTool({
  time_zone: "Asia/Tokyo"
});

const madrid_time = new TimeTool({
  time_zone: "Europe/Madrid"
});

const utc_time = new TimeTool({
  time_zone: "UTC"
});
```

**Usage in Agent:**

```typescript
const agent = new Agent({
  name: "Time_Assistant",
  description: "Provides time information",
  tools: [
    new TimeTool({ time_zone: "Europe/Madrid" })
  ],
  providers: [openai_provider]
});

await agent.call("What time is it in Madrid?");
// Agent calls get_time tool, returns: "12/27/2024, 2:45:30 PM"
```

**Multi-Timezone Agent:**

```typescript
const world_clock_agent = new Agent({
  name: "World_Clock",
  description: "Provides time in multiple timezones",
  tools: [
    new TimeTool({ time_zone: "America/New_York" }),
    new TimeTool({ time_zone: "Europe/London" }),
    new TimeTool({ time_zone: "Asia/Tokyo" })
  ],
  providers: [openai_provider]
});
```

### Output Format

All times are returned in `en-US` locale format regardless of timezone:

```
"MM/DD/YYYY, HH:MM:SS AM/PM"

Examples:
- "12/27/2024, 3:45:30 PM"
- "01/01/2025, 12:00:00 AM"
- "06/15/2024, 11:23:45 PM"
```

### Supported Timezones

Uses IANA timezone database. Common timezones:

- **Americas**: `America/New_York`, `America/Los_Angeles`, `America/Chicago`, `America/Toronto`, `America/Sao_Paulo`
- **Europe**: `Europe/London`, `Europe/Paris`, `Europe/Berlin`, `Europe/Madrid`, `Europe/Rome`
- **Asia**: `Asia/Tokyo`, `Asia/Shanghai`, `Asia/Dubai`, `Asia/Kolkata`, `Asia/Singapore`
- **Pacific**: `Pacific/Auckland`, `Australia/Sydney`, `Pacific/Honolulu`
- **Special**: `UTC`

[Full list of IANA timezones](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)

## Usage Patterns

### Pattern: API Integration

```typescript
const github_api = new RemoteTool("search_github_repos", {
  description: "Search GitHub repositories",
  parameters: {
    query: "Search query",
    language: "Programming language filter",
    min_stars: "Minimum number of stars"
  },
  http: {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${process.env.GITHUB_TOKEN}`,
      "Accept": "application/vnd.github.v3+json"
    },
    url: "https://api.github.com/search/repositories"
  }
});
```

### Pattern: Multi-Service Agent

```typescript
const multi_service_agent = new Agent({
  name: "Multi_Service_Assistant",
  description: "Integrates multiple external services",
  tools: [
    new RemoteTool("get_weather", {...}),
    new RemoteTool("search_news", {...}),
    new RemoteTool("create_task", {...}),
    new TimeTool({})
  ],
  providers: [openai_provider]
});
```

### Pattern: Time-Aware Agents

```typescript
const business_hours_agent = new Agent({
  name: "Business_Hours_Assistant",
  description: "Provides time-aware responses",
  tools: [
    new TimeTool({ time_zone: "America/New_York" })
  ],
  rules: [
    new Rule("Inform about business hours", {
      when: async (agent) => {
        // Agent can use time tool to check current time
        const hour = new Date().getHours();
        return hour < 9 || hour > 17;
      }
    })
  ],
  providers: [openai_provider]
});
```

## Best Practices

### 1. Secure API Keys

```typescript
// ✅ Good: Use environment variables
const secure_tool = new RemoteTool("api_call", {
  description: "Make API call",
  http: {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.API_KEY}`
    },
    url: process.env.API_URL!
  }
});

// ❌ Bad: Hardcode credentials
const insecure_tool = new RemoteTool("api_call", {
  description: "Make API call",
  http: {
    method: "POST",
    headers: {
      "Authorization": "Bearer sk-hardcoded-key-12345"  // Never do this!
    },
    url: "https://api.example.com"
  }
});
```

### 2. Clear Parameter Descriptions

```typescript
// ✅ Good: Detailed parameter descriptions
new RemoteTool("search_products", {
  description: "Search product catalog with filters",
  parameters: {
    query: "Product search query (e.g., 'red shoes', 'laptop')",
    category: "Product category ID (optional, e.g., 'electronics')",
    max_price: "Maximum price in USD (optional, e.g., '99.99')"
  },
  http: {...}
});

// ❌ Bad: Vague descriptions
new RemoteTool("search_products", {
  description: "Search",
  parameters: {
    query: "Query",
    category: "Category",
    max_price: "Price"
  },
  http: {...}
});
```

### 3. Use Appropriate HTTP Methods

```typescript
// ✅ Good: GET for queries
new RemoteTool("get_user", {
  description: "Retrieve user information",
  http: { method: "GET", ... }
});

// ✅ Good: POST for creation
new RemoteTool("create_user", {
  description: "Create new user",
  http: { method: "POST", ... }
});

// ✅ Good: PUT/PATCH for updates
new RemoteTool("update_user", {
  description: "Update user information",
  http: { method: "PATCH", ... }
});

// ✅ Good: DELETE for removal
new RemoteTool("delete_user", {
  description: "Delete user account",
  http: { method: "DELETE", ... }
});
```

## Type Safety

Both tools are fully typed with TypeScript:

```typescript
import { RemoteTool, TimeTool } from '@arcaelas/agent';

// Type-safe RemoteTool
const api_tool: RemoteTool = new RemoteTool("api_call", {
  description: "Call external API",
  http: {
    method: "POST",  // ✅ Type-checked: only valid HTTP methods
    headers: { "Content-Type": "application/json" },
    url: "https://api.example.com"
  }
});

// Type-safe TimeTool
const time_tool: TimeTool = new TimeTool({
  time_zone: "Europe/Madrid"  // ✅ String type, validated at runtime
});
```

## Related

- **[Tool](tool.md)** - Base Tool class
- **[Agent](agent.md)** - Uses tools for capabilities
- **[Custom Tools Example](../examples/custom-tools.md)** - Creating custom tools
- **[API Integration](../examples/advanced-patterns.md#api-integration)** - Advanced patterns

---

**Congratulations!** You've completed the API Reference. Next, explore the [Examples](../examples/basic-agent.md) for practical implementations.
