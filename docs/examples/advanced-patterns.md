# Advanced Patterns

Complex multi-agent workflows and architectural patterns for production systems.

## Agent Chaining

Execute agents sequentially, passing results between them:

```typescript
const research_agent = new Agent({
  name: "Researcher",
  description: "Information gathering specialist",
  tools: [search_tool, scrape_tool],
  providers: [openai_provider]
});

const analyzer_agent = new Agent({
  name: "Analyzer",
  description: "Data analysis specialist",
  tools: [stats_tool, chart_tool],
  providers: [openai_provider]
});

const writer_agent = new Agent({
  name: "Writer",
  description: "Content writing specialist",
  tools: [grammar_tool, style_tool],
  providers: [openai_provider]
});

async function research_and_report(topic: string) {
  // Step 1: Research
  const [research_msgs, success1] = await research_agent.call(
    `Research current trends about: ${topic}`
  );

  if (!success1) throw new Error("Research failed");

  // Step 2: Analyze
  const research_data = research_msgs[research_msgs.length - 1].content;
  const [analysis_msgs, success2] = await analyzer_agent.call(
    `Analyze this research data and find key insights: ${research_data}`
  );

  if (!success2) throw new Error("Analysis failed");

  // Step 3: Write report
  const analysis_data = analysis_msgs[analysis_msgs.length - 1].content;
  const [report_msgs, success3] = await writer_agent.call(
    `Write a comprehensive report based on this analysis: ${analysis_data}`
  );

  if (!success3) throw new Error("Writing failed");

  return report_msgs[report_msgs.length - 1].content;
}

// Usage
const report = await research_and_report("AI Agent Architectures");
console.log(report);
```

## Parallel Agent Execution

Run multiple agents concurrently for better performance:

```typescript
async function parallel_analysis(text: string) {
  const [sentiment_result, summary_result, keywords_result] = await Promise.allSettled([
    sentiment_agent.call(`Analyze sentiment: ${text}`),
    summary_agent.call(`Summarize: ${text}`),
    keywords_agent.call(`Extract keywords: ${text}`)
  ]);

  return {
    sentiment: sentiment_result.status === 'fulfilled'
      ? sentiment_result.value[0]
      : null,
    summary: summary_result.status === 'fulfilled'
      ? summary_result.value[0]
      : null,
    keywords: keywords_result.status === 'fulfilled'
      ? keywords_result.value[0]
      : null
  };
}
```

## Supervisor Pattern

One agent coordinates multiple specialized agents:

```typescript
const supervisor = new Agent({
  name: "Supervisor",
  description: "Coordinates specialized agents for complex tasks",
  tools: [
    new Tool('delegate_to_researcher', async (agent, { query }) => {
      const [msgs, ok] = await research_agent.call(query);
      return ok ? msgs[msgs.length - 1].content : "Research failed";
    }),
    new Tool('delegate_to_analyst', async (agent, { data }) => {
      const [msgs, ok] = await analyzer_agent.call(data);
      return ok ? msgs[msgs.length - 1].content : "Analysis failed";
    }),
    new Tool('delegate_to_writer', async (agent, { content }) => {
      const [msgs, ok] = await writer_agent.call(content);
      return ok ? msgs[msgs.length - 1].content : "Writing failed";
    })
  ],
  providers: [openai_provider]
});

// Supervisor decides which agents to use and in what order
const [result, ok] = await supervisor.call(
  "Create a comprehensive report about quantum computing trends"
);
```

## State Machine Pattern

Agent behavior based on conversation state:

```typescript
type ConversationState = 'greeting' | 'gathering_info' | 'processing' | 'delivering_result' | 'closing';

class StatefulAgent {
  private agent: Agent;
  private state: ConversationState = 'greeting';

  constructor() {
    this.agent = new Agent({
      name: "Stateful_Agent",
      description: "Agent with conversation state management",
      providers: [openai_provider]
    });
  }

  async chat(message: string) {
    // Update state based on message
    if (message.toLowerCase().includes('bye')) {
      this.state = 'closing';
    } else if (this.state === 'greeting') {
      this.state = 'gathering_info';
    }

    // Add state to context
    this.agent.metadata.set('current_state', this.state);
    this.agent.rules = [
      new Rule(`Current conversation state: ${this.state}. Act accordingly.`)
    ];

    const [msgs, ok] = await this.agent.call(message);

    // Transition to next state
    if (this.state === 'gathering_info' && ok) {
      this.state = 'processing';
    } else if (this.state === 'processing' && ok) {
      this.state = 'delivering_result';
    }

    return [msgs, ok];
  }
}

const stateful = new StatefulAgent();
await stateful.chat("Hello");           // state: greeting → gathering_info
await stateful.chat("I need help with..."); // state: gathering_info → processing
await stateful.chat("Thanks!");         // state: processing → delivering_result
await stateful.chat("Goodbye");         // state: closing
```

## Event-Driven Architecture

Agents respond to events:

```typescript
import { EventEmitter } from 'events';

class EventDrivenAgentSystem extends EventEmitter {
  private agents: Map<string, Agent> = new Map();

  register_agent(name: string, agent: Agent, events: string[]) {
    this.agents.set(name, agent);
    events.forEach(event => {
      this.on(event, async (data) => {
        console.log(`Agent ${name} handling event: ${event}`);
        await agent.call(data.message);
      });
    });
  }

  async trigger(event: string, data: any) {
    this.emit(event, data);
  }
}

// Setup
const system = new EventDrivenAgentSystem();

system.register_agent('monitor', monitoring_agent, ['user_action', 'system_alert']);
system.register_agent('support', support_agent, ['user_question', 'error_report']);
system.register_agent('logger', logging_agent, ['user_action', 'user_question', 'system_alert']);

// Trigger events
await system.trigger('user_action', { message: 'User clicked button' });
await system.trigger('user_question', { message: 'How do I reset my password?' });
await system.trigger('system_alert', { message: 'High memory usage detected' });
```

## Tool Composition

Combine simple tools into complex workflows:

```typescript
const fetch_tool = new Tool('fetch_url', async (agent, { url }) => {
  const response = await fetch(url);
  return await response.text();
});

const parse_tool = new Tool('parse_html', async (agent, { html }) => {
  // Parse HTML and extract structured data
  return JSON.stringify({ title: "...", content: "..." });
});

const summarize_tool = new Tool('summarize_text', async (agent, { text }) => {
  // Use another agent for summarization
  const [msgs, ok] = await summary_agent.call(`Summarize: ${text}`);
  return ok ? msgs[msgs.length - 1].content : "Failed to summarize";
});

// Complex tool that combines others
const web_research_tool = new Tool('research_url', async (agent, { url }) => {
  // Fetch → Parse → Summarize
  const html = await fetch_tool.func(agent, { url });
  const data = await parse_tool.func(agent, { html });
  const summary = await summarize_tool.func(agent, { text: data });
  return summary;
});

const research_agent = new Agent({
  name: "Web_Researcher",
  description: "Researches and summarizes web content",
  tools: [web_research_tool],
  providers: [openai_provider]
});
```

## Memory and Persistence

Maintain long-term conversation memory:

```typescript
interface ConversationMemory {
  user_id: string;
  messages: Message[];
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

class PersistentAgent {
  private agent: Agent;
  private db: Database; // Your database interface

  constructor(db: Database) {
    this.db = db;
    this.agent = new Agent({
      name: "Persistent_Agent",
      description: "Agent with conversation persistence",
      providers: [openai_provider]
    });
  }

  async chat(user_id: string, message: string) {
    // Load conversation history
    const memory = await this.db.get_conversation(user_id);

    if (memory) {
      // Restore previous messages
      this.agent.messages = memory.messages;
      // Restore metadata
      Object.entries(memory.metadata).forEach(([k, v]) => {
        this.agent.metadata.set(k, v);
      });
    }

    // Process new message
    const [msgs, ok] = await this.agent.call(message);

    // Save updated conversation
    await this.db.save_conversation({
      user_id,
      messages: msgs,
      metadata: this.agent.metadata.toJSON(),
      created_at: memory?.created_at || new Date(),
      updated_at: new Date()
    });

    return [msgs, ok];
  }
}
```

## Rate Limiting and Throttling

Control request frequency:

```typescript
class ThrottledProvider {
  private last_call: number = 0;
  private min_interval: number = 1000; // 1 second between calls

  async provider(ctx: Context): Promise<ChatCompletionResponse> {
    const now = Date.now();
    const elapsed = now - this.last_call;

    if (elapsed < this.min_interval) {
      await new Promise(resolve =>
        setTimeout(resolve, this.min_interval - elapsed)
      );
    }

    this.last_call = Date.now();

    return await openai.chat.completions.create({
      model: "gpt-4",
      messages: ctx.messages.map(m => ({ role: m.role, content: m.content }))
    });
  }
}

const throttled = new ThrottledProvider();
const agent = new Agent({
  name: "Rate_Limited_Agent",
  description: "Agent with rate limiting",
  providers: [throttled.provider.bind(throttled)]
});
```

## Circuit Breaker Pattern

Prevent cascading failures:

```typescript
class CircuitBreaker {
  private failures: number = 0;
  private last_failure: number = 0;
  private readonly threshold: number = 3;
  private readonly timeout: number = 60000; // 1 minute
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  async call_provider(provider: Provider, ctx: Context): Promise<ChatCompletionResponse | null> {
    // Check circuit state
    if (this.state === 'open') {
      if (Date.now() - this.last_failure > this.timeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const response = await provider(ctx);

      // Success - reset if in half-open
      if (this.state === 'half-open') {
        this.state = 'closed';
        this.failures = 0;
      }

      return response;
    } catch (error) {
      this.failures++;
      this.last_failure = Date.now();

      if (this.failures >= this.threshold) {
        this.state = 'open';
        console.log('Circuit breaker opened due to repeated failures');
      }

      throw error;
    }
  }
}

const breaker = new CircuitBreaker();
const protected_provider: Provider = async (ctx) => {
  return await breaker.call_provider(openai_provider, ctx);
};
```

## Best Practices

1. **Error Boundaries** - Isolate failures to prevent system-wide crashes
2. **Idempotency** - Ensure operations can be safely retried
3. **Observability** - Log all agent interactions for debugging
4. **Resource Limits** - Set timeouts and max retries
5. **Graceful Degradation** - Provide fallback responses
6. **Testing** - Unit test each agent and integration test workflows

## Next Steps

- **[API Reference](../api/agent.md)** - Complete API documentation
- **[Best Practices](../guides/best-practices.md)** - Production guidelines
- **[Architecture](../advanced/architecture.md)** - System design patterns

---

**[← Back to Examples](../index.md#examples)**
