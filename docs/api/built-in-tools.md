# Built-in Tools

@arcaelas/agent includes two production-ready tools: **RemoteTool** for HTTP requests and **TimeTool** for time/date operations.

## TimeTool

**TimeTool** provides current date and time with timezone support. It extends `Tool` directly.

### Constructor

```typescript
new TimeTool(options?: { time_zone?: string })
```

The `options` parameter defaults to `{}`. The tool name is hardcoded as `"get_time"`.

**Options:**
- **time_zone**: Optional IANA timezone string (e.g., `"Europe/Madrid"`). Used as fallback when the AI does not provide a timezone in the tool call arguments.

### Internal Behavior

The constructor calls `super("get_time", { ... })` with:

- **description**: `"Obtener la fecha y hora actual del sistema"`
- **parameters**: `{ time_zone: "Opcional - Zona horaria IANA para obtener la hora (ej: Europe/Madrid). Si no se proporciona, usa la zona horaria del sistema" }`
- **func**: Receives `(agent: Agent, args: { time_zone: string })`. The timezone resolution order is:
  1. `args.time_zone` (provided by the AI in the tool call)
  2. `options.time_zone` (configured at construction)
  3. `Intl.DateTimeFormat().resolvedOptions().timeZone` (system timezone)

Returns `new Date().toLocaleString("en-US", { timeZone })`.

### Examples

**System Timezone:**

```typescript
import { TimeTool } from '@arcaelas/agent';

const time_tool = new TimeTool({});
// Tool name: "get_time"
// Uses system timezone as final fallback
```

**Specific Timezone:**

```typescript
const tokyo_time = new TimeTool({ time_zone: "Asia/Tokyo" });
const madrid_time = new TimeTool({ time_zone: "Europe/Madrid" });
const utc_time = new TimeTool({ time_zone: "UTC" });
```

**Usage in Agent:**

```typescript
const agent = new Agent({
  name: "Time_Assistant",
  description: "Provides time information",
  tools: [new TimeTool({ time_zone: "Europe/Madrid" })],
  providers: [openai_provider]
});

await agent.call("What time is it?");
// The AI can call get_time with or without a time_zone argument.
// If no time_zone is provided by the AI, falls back to "Europe/Madrid".
```

### Output Format

All times are returned in `en-US` locale format regardless of timezone:

```
"MM/DD/YYYY, HH:MM:SS AM/PM"

Examples:
- "12/27/2024, 3:45:30 PM"
- "01/01/2025, 12:00:00 AM"
```

---

## RemoteTool

**RemoteTool** wraps HTTP API calls as agent tools. It extends `Tool` directly. Supports GET, POST, PUT, DELETE, and PATCH methods.

### Constructor

```typescript
new RemoteTool(name: string, options: RemoteToolOptions)
```

### RemoteToolOptions

```typescript
interface RemoteToolOptions extends Omit<ToolOptions, "func"> {
  description: string;
  parameters?: Record<string, string>;
  http: {
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    headers: Record<string, string>;
    url: string;
  };
}
```

The `func` property is omitted because `RemoteTool` generates its own HTTP function internally.

### HTTP Method Behavior

The internal function handles parameters differently based on the HTTP method:

- **GET**: Parameters are sent as URL query string via `URLSearchParams`. Example: `https://api.example.com/data?city=Madrid&units=celsius`. No request body.
- **POST, PUT, PATCH**: Parameters are sent as JSON in the request body (`JSON.stringify(args)`).
- **DELETE**: Parameters are sent as JSON in the request body (same as POST/PUT/PATCH -- not as query parameters).

All methods:
- Return the response body as plain text on success (`response.text()`)
- On HTTP error (non-2xx): return `JSON.stringify({ error: true, status, message: statusText })`
- On fetch exception: return `JSON.stringify({ error: true, message: error.message })`

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
// GET https://api.weather.com/v1/current?city=Madrid&units=celsius
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
// POST body: {"subject":"...","description":"...","priority":"high"}
```

**DELETE Request:**

```typescript
const delete_item = new RemoteTool("delete_item", {
  description: "Delete an item by ID",
  parameters: {
    item_id: "ID of the item to delete"
  },
  http: {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${process.env.API_TOKEN}`
    },
    url: "https://api.example.com/items"
  }
});
// DELETE body: {"item_id":"123"} (NOT as query parameters)
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
```

## Usage Patterns

### Pattern: Multi-Service Agent

```typescript
const multi_service_agent = new Agent({
  name: "Multi_Service_Assistant",
  description: "Integrates multiple external services",
  tools: [
    new RemoteTool("get_weather", { ... }),
    new RemoteTool("search_news", { ... }),
    new RemoteTool("create_task", { ... }),
    new TimeTool({})
  ],
  providers: [openai_provider]
});
```

## Best Practices

### 1. Secure API Keys

```typescript
// Use environment variables
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
```

### 2. Clear Parameter Descriptions

```typescript
new RemoteTool("search_products", {
  description: "Search product catalog with filters",
  parameters: {
    query: "Product search query (e.g., 'red shoes', 'laptop')",
    category: "Product category ID (optional, e.g., 'electronics')",
    max_price: "Maximum price in USD (optional, e.g., '99.99')"
  },
  http: { ... }
});
```

## Related

- **[Tool](tool.md)** - Base Tool class
- **[Agent](agent.md)** - Uses tools for capabilities

---

**Congratulations!** You've completed the API Reference. Next, explore the [Examples](../examples/basic-agent.md) for practical implementations.
