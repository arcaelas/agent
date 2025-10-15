# Providers

Documentation for setting up and configuring AI providers is coming soon.

For now, see the [Getting Started Guide](getting-started.md) for basic provider examples.

## Multi-Provider Example

```typescript
const agent = new Agent({
  name: "Resilient_Agent",
  description: "Agent with automatic failover",
  providers: [
    openai_provider,    // Primary
    claude_provider,    // Backup
    groq_provider       // Fallback
  ]
});
```

More comprehensive documentation coming soon.
