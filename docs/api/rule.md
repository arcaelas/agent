# Rule

**Rule** defines behavioral guidelines and constraints for AI agents. Rules can be static (always active) or conditional (evaluated at runtime based on agent state).

## Overview

Rules guide agent behavior through:

- **Static Rules**: Always-active behavioral guidelines
- **Conditional Rules**: Applied based on runtime evaluation
- **Context-Aware**: Access to agent metadata and message history
- **Async Support**: Support for async condition evaluation

### Key Features

- ✅ Two-tier API (static and conditional)
- ✅ Runtime condition evaluation
- ✅ Access to agent context
- ✅ Sync and async conditions
- ✅ Type-safe with full TypeScript support

## Constructor

Rule has two constructor overloads:

### Static Rule

```typescript
new Rule(description: string)
```

Creates a rule that is always active.

**Parameters:**
- **description**: Textual description defining the behavior

**Example:**

```typescript
import { Rule } from '@arcaelas/agent';

// Always-active rules
const politeness = new Rule("Maintain a professional and courteous tone");
const privacy = new Rule("Never share user personal information");
const helpfulness = new Rule("Provide comprehensive and useful answers");
```

### Conditional Rule

```typescript
new Rule(description: string, options: RuleOptions)
```

Creates a rule that applies only when specific conditions are met.

**Parameters:**
- **description**: Textual description defining the behavior
- **options**: Configuration object with condition function

#### RuleOptions

```typescript
interface RuleOptions {
  /** Function determining when the rule applies */
  when: (agent: Agent) => boolean | Promise<boolean>;
}
```

**Example:**

```typescript
import { Rule } from '@arcaelas/agent';

// Time-based rule
const business_hours_rule = new Rule(
  "Inform about phone support availability",
  {
    when: (agent) => {
      const hour = new Date().getHours();
      return hour < 9 || hour > 17;  // Outside business hours
    }
  }
);

// Tier-based rule
const premium_support = new Rule(
  "Offer priority support and premium benefits",
  {
    when: (agent) => {
      const tier = agent.metadata.get("customer_tier", "");
      return tier === "gold" || tier === "platinum";
    }
  }
);

// Complex async rule
const loyalty_discount = new Rule(
  "Apply 15% loyalty discount",
  {
    when: async (agent) => {
      const purchases = agent.metadata.get("total_purchases", "0");
      const member_since = agent.metadata.get("member_since", "");

      if (!member_since) return false;

      const years_active =
        (Date.now() - new Date(member_since).getTime()) /
        (1000 * 60 * 60 * 24 * 365);

      return parseInt(purchases) > 10 && years_active > 2;
    }
  }
);
```

## Properties

### description

```typescript
readonly description: string
```

Human-readable description of the behavioral guideline.

**Example:**

```typescript
const rule = new Rule("Always validate user input");
console.log(rule.description); // "Always validate user input"
```

### when

```typescript
readonly when: (agent: Agent) => boolean | Promise<boolean>
```

Function determining when the rule applies. For static rules, always returns `true`.

**Example:**

```typescript
// Static rule when function
const static_rule = new Rule("Be helpful");
console.log(await static_rule.when(agent)); // true (always)

// Conditional rule when function
const conditional = new Rule("Escalate to human", {
  when: (agent) => {
    const messages = agent.messages;
    return messages.length > 10;  // Escalate after 10 messages
  }
});

console.log(await conditional.when(agent)); // true or false
```

### length

```typescript
get length(): number
```

Returns the character length of the description.

**Example:**

```typescript
const rule = new Rule("Maintain professional tone");
console.log(rule.length); // 26
```

## Methods

### toJSON()

```typescript
toJSON(): {
  description: string;
  when: string;
}
```

Serializes the rule metadata. The `when` function is represented as the string `"[Function]"`.

**Returns:** Serializable representation

**Example:**

```typescript
const rule = new Rule("Be polite", {
  when: (agent) => agent.metadata.get("user_type") === "customer"
});

console.log(JSON.stringify(rule));
// {"description":"Be polite","when":"[Function]"}

const data = rule.toJSON();
console.log(data.description); // "Be polite"
console.log(data.when);        // "[Function]"
```

### toString()

```typescript
toString(): string
```

Returns string representation for debugging. Long descriptions are truncated to 50 characters.

**Returns:** String in format `"Rule: description [Function]"`

**Example:**

```typescript
const rule = new Rule("Always provide detailed explanations");
console.log(rule.toString());
// "Rule: Always provide detailed explanations [Function]"

const long_rule = new Rule("This is a very long rule description that will be truncated when displayed");
console.log(long_rule.toString());
// "Rule: This is a very long rule description that wi... [Function]"
```

## Usage Patterns

### Pattern: Time-Based Rules

Apply rules based on time conditions:

```typescript
const night_mode = new Rule(
  "Use concise responses and suggest using callback feature",
  {
    when: (agent) => {
      const hour = new Date().getHours();
      return hour >= 22 || hour < 6;  // Between 10 PM and 6 AM
    }
  }
);

const weekend_rule = new Rule(
  "Inform that technical support is limited on weekends",
  {
    when: (agent) => {
      const day = new Date().getDay();
      return day === 0 || day === 6;  // Sunday or Saturday
    }
  }
);
```

### Pattern: User Tier Rules

Customize behavior based on user tier:

```typescript
const basic_tier_rule = new Rule(
  "Offer upgrade to premium tier for advanced features",
  {
    when: (agent) => {
      const tier = agent.metadata.get("user_tier", "basic");
      return tier === "basic" || tier === "free";
    }
  }
);

const enterprise_rule = new Rule(
  "Provide dedicated account manager contact information",
  {
    when: (agent) => {
      const tier = agent.metadata.get("user_tier", "");
      return tier === "enterprise";
    }
  }
);
```

### Pattern: Conversation Context Rules

Rules based on conversation state:

```typescript
const escalation_rule = new Rule(
  "Escalate to human supervisor",
  {
    when: (agent) => {
      const messages = agent.messages;
      const last_message = messages[messages.length - 1]?.content || "";

      // Escalate if keywords detected
      const escalation_keywords = ["supervisor", "manager", "frustrated", "complaint"];
      return escalation_keywords.some(keyword =>
        last_message.toLowerCase().includes(keyword)
      );
    }
  }
);

const long_conversation_rule = new Rule(
  "Suggest summarizing the conversation and next steps",
  {
    when: (agent) => agent.messages.length > 15
  }
);
```

### Pattern: Regional Compliance

Apply regional rules:

```typescript
const gdpr_rule = new Rule(
  "Apply GDPR compliance: inform about data rights and provide data access options",
  {
    when: (agent) => {
      const region = agent.metadata.get("user_region", "");
      return region === "EU" || region === "UK";
    }
  }
);

const ccpa_rule = new Rule(
  "Apply CCPA compliance: provide opt-out options for data collection",
  {
    when: (agent) => {
      const state = agent.metadata.get("user_state", "");
      return state === "CA";  // California
    }
  }
);
```

## Best Practices

### 1. Clear Descriptions

Write explicit, actionable rule descriptions:

```typescript
// ✅ Good: Clear and specific
new Rule("Always ask for order confirmation before processing payment");
new Rule("Verify user identity using two-factor authentication for account changes");

// ❌ Bad: Vague
new Rule("Be careful");
new Rule("Handle properly");
```

### 2. Simple Conditions

Keep condition logic straightforward:

```typescript
// ✅ Good: Simple, readable condition
new Rule("Offer discount", {
  when: (agent) => {
    const purchases = parseInt(agent.metadata.get("purchases", "0"));
    return purchases > 5;
  }
});

// ❌ Bad: Overly complex
new Rule("Complex logic", {
  when: (agent) => {
    return (
      parseInt(agent.metadata.get("a", "0")) > 5 &&
      (agent.metadata.get("b", "") === "x" || agent.metadata.get("c", "") === "y") &&
      agent.messages.length > 3
    );
  }
});
```

### 3. Efficient Evaluation

Optimize condition functions:

```typescript
// ✅ Good: Early return for efficiency
new Rule("Premium features", {
  when: (agent) => {
    const tier = agent.metadata.get("tier", "");
    if (tier === "premium") return true;  // Early return

    const trial = agent.metadata.get("trial", "false");
    return trial === "true";
  }
});
```

### 4. Error Handling

Handle errors in async conditions:

```typescript
new Rule("External API check", {
  when: async (agent) => {
    try {
      const user_id = agent.metadata.get("user_id", "");
      const response = await fetch(`/api/check/${user_id}`);
      const data = await response.json();
      return data.eligible === true;
    } catch (error) {
      console.error("Rule condition failed:", error);
      return false;  // Fail gracefully
    }
  }
});
```

## Type Safety

Rule is fully typed with TypeScript:

```typescript
import { Rule, RuleOptions } from '@arcaelas/agent';
import type { Agent } from '@arcaelas/agent';

// Type-safe condition function
const condition: RuleOptions['when'] = (agent: Agent) => {
  const value = agent.metadata.get("key", "");
  return value === "expected";
};

const rule = new Rule("Description", { when: condition });

// Async condition with proper typing
const async_condition: RuleOptions['when'] = async (agent: Agent) => {
  const data = await fetchData();
  return data.valid === true;
};

const async_rule = new Rule("Async rule", { when: async_condition });
```

## Related

- **[Context](context.md)** - Manages rules with inheritance
- **[Agent](agent.md)** - Evaluates and applies rules
- **[Metadata](metadata.md)** - Used in rule conditions
- **[Core Concepts](../guides/core-concepts.md)** - Architecture overview

---

**Next:** Learn about [Message →](message.md)
