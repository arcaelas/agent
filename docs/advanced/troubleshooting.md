# Troubleshooting

Common issues and solutions.

## Provider Failures

**Problem**: All providers fail

**Solutions**:
1. Check API keys are valid
2. Verify network connectivity
3. Check rate limits
4. Review error logs

```typescript
const [messages, success] = await agent.call(prompt);
if (!success) {
  console.error("All providers failed");
  console.log("Last messages:", messages);
}
```

## Tool Execution Errors

**Problem**: Tools throwing errors

**Solutions**:
1. Validate tool parameters
2. Add try-catch in tool functions
3. Return error messages as strings

```typescript
const robust_tool = new Tool('my_tool', {
  description: "Tool with error handling",
  parameters: { input: "Input value" },
  func: async (agent, { input }) => {
    try {
      return await process(input);
    } catch (error) {
      return JSON.stringify({ error: true, message: error.message });
    }
  }
});
```

## Memory Issues

**Problem**: High memory usage

**Solutions**:
1. Limit message history
2. Clear old conversations
3. Use external storage

```typescript
// Limit message history
if (agent.messages.length > 100) {
  agent.messages = agent.messages.slice(-50);  // Keep last 50
}
```

## Slow Responses

**Problem**: Agent responses are slow

**Solutions**:
1. Use faster models (gpt-3.5-turbo vs gpt-4)
2. Reduce tool count
3. Implement timeouts
4. Use streaming responses

---

**[← Back to Advanced](../index.md#advanced)**
