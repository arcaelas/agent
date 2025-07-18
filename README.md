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
assistant.tool("get_date", async () => {
  return new Date().toLocaleString();
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
import { searchProduct, getWeather, translateText } from "./services";

// Create an advanced agent with a detailed personality and rules
const shopAssistant = new Agent({
  name: "VirtualSeller",
  description:
    "Assistant specialized in electronic products. Maintains a professional yet friendly tone, has deep knowledge of the product catalog, and always suggests alternatives when a product is unavailable.",
  limits: [
    "Never disclose internal info about discounts or margins",
    "Maintain respectful tone at all times",
    "Avoid making promises about exact delivery times",
  ],
  providers: [
    {
      baseURL: "https://api.openai.com/v1",
      model: "gpt-4",
      apiKey: process.env.OPENAI_API_KEY,
    },
    // Fallback provider in case the primary one fails
    {
      baseURL: "https://api.alternativa.com/v1",
      model: "alternative-model",
      apiKey: process.env.API_KEY_ALTERNATIVA,
    },
  ],
});

// Add advanced tools with specific parameters
shopAssistant.tool("search_product", {
  description: "Search products in the catalog by name or features",
  parameters: {
    query: "Search term",
    category: "Product category (optional)",
    max_price: "Maximum price (optional)",
  },
  func: async (params) => {
    try {
      const results = await searchProduct(
        params.query,
        params.category,
        params.max_price
      );
      return JSON.stringify(results);
    } catch (error) {
      return `Search error: ${error.message}`;
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

// Example of a multi-interaction conversation
const conversation = await shopAssistant.answer([
  {
    role: "user",
    content: "Hi, I’m looking for a smartphone with a good camera under €800",
  },
  // The agent might invoke the search_product tool here

  // Agent replies and tool responses will be automatically added to the history
]);
```

## Detailed API

### `Agent<T extends AgentOptions>`

Main class to create and manage agents.

#### Constructor

- `new Agent(options: AgentOptions)`: Creates a new agent with the given options.

#### Methods

- `tool(name: string, options: ToolOptions<T>): () => void`: Adds a tool with complex parameters.
- `tool(desc: string, func: Noop<[input: string], string>): () => void`: Adds a simple tool.
- `answer(messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]): Promise<OpenAI.Chat.Completions.ChatCompletionMessageParam[]>`: Processes the conversation and returns the updated history.

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

- `description: string`: Tool description.
- `parameters?: T`: Parameters accepted by the tool.
- `func: Noop<[params: T extends object ? T : { input: string }], string>`: Function to execute.

## Recommendations & Best Practices

1. **Well-defined tools**: Provide clear descriptions and specific parameters for every tool.

2. **Robust error handling**: Implement proper error handling in all tool functions to avoid breaking conversations.

3. **Consistent personality**: Define a detailed description to maintain the agent’s tone throughout interactions.

4. **Multiple providers**: Set up fallback providers in case the main one fails.

5. **Clear limits**: Use the `limits` parameter to set rules on what the agent can or cannot do/say.

6. **Conversation cycles**: The `answer()` method handles up to 6 internal steps to resolve tools, but avoid excessive nesting.

7. **API security**: Never hardcode API keys; use environment variables instead.

## License

This project is open source and available for personal, educational, and non-commercial use. Commercial use requires a specific license from Arcaelas Insiders. For more details, refer to the LICENSE file.
