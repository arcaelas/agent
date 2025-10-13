# Installation

This guide covers different methods to install **@arcaelas/agent** in your project.

## Package Managers

### NPM

```bash
npm install @arcaelas/agent
```

### Yarn

```bash
yarn add @arcaelas/agent
```

### PNPM

```bash
pnpm add @arcaelas/agent
```

### Bun

```bash
bun add @arcaelas/agent
```

## Requirements

Ensure your environment meets these minimum requirements:

- **Node.js** ≥ 16.0.0
- **TypeScript** ≥ 4.5.0 (for TypeScript projects)
- **Modern Browser** (ES2020+ support for browser usage)

## Environment Setup

### API Keys

Create a `.env` file in your project root:

```env
# OpenAI (Primary provider)
OPENAI_API_KEY=your_openai_api_key

# Anthropic Claude (Optional backup)
ANTHROPIC_API_KEY=your_anthropic_api_key

# Groq (Optional backup)
GROQ_API_KEY=your_groq_api_key
```

### TypeScript Configuration

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

## Browser Usage

### ES Modules

```html
<script type="module">
  import { Agent, Tool } from 'https://cdn.skypack.dev/@arcaelas/agent';

  // Your code here
</script>
```

### UMD (Global)

```html
<script src="https://unpkg.com/@arcaelas/agent/dist/index.umd.js"></script>
<script>
  const { Agent, Tool } = ArcaelasAgent;

  // Your code here
</script>
```

## Verification

Test your installation with this simple example:

```typescript
import { Agent } from '@arcaelas/agent';
import OpenAI from 'openai';

// Create a test agent
const agent = new Agent({
  name: "Test_Agent",
  description: "Verification agent",
  providers: [
    async (ctx) => {
      const openai = new OpenAI({
        baseURL: "https://api.openai.com/v1",
        apiKey: process.env.OPENAI_API_KEY
      });

      return await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: ctx.messages.map(m => ({
          role: m.role,
          content: m.content
        }))
      });
    }
  ]
});

// Test the agent
console.log("Testing agent...");
const [conversation, success] = await agent.call("Say hello");

if (success) {
  console.log("✅ Installation successful!");
  console.log("Response:", conversation[conversation.length - 1].content);
} else {
  console.log("❌ Installation failed. Check your API key.");
}
```

**Expected Output:**
```
Testing agent...
✅ Installation successful!
Response: Hello! How can I assist you today?
```

## Next Steps

- **[Getting Started Guide](guides/getting-started.md)** - Build your first agent
- **[Core Concepts](guides/core-concepts.md)** - Understand the architecture
- **[Examples](examples/basic-agent.md)** - See practical implementations

## Troubleshooting

### Module Not Found

If you get "Module not found" errors:

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

If TypeScript shows errors:

1. Ensure TypeScript version ≥ 4.5.0
2. Check `tsconfig.json` configuration
3. Run `npm install --save-dev @types/node`

### API Key Issues

If your agent fails to connect:

1. Verify API key in `.env` file
2. Check key format (should start with `sk-`)
3. Ensure `.env` is loaded (use `dotenv` package)

```typescript
import 'dotenv/config';  // Load environment variables
import { Agent } from '@arcaelas/agent';
```

## Support

Need help? Check these resources:

- [GitHub Issues](https://github.com/arcaelas/agent/issues)
- [Discussions](https://github.com/arcaelas/agent/discussions)
- [Discord Community](https://discord.gg/arcaelas)
