# Rule

**Rule** defines behavioral guidelines and constraints for AI agents. Rules are static text strings injected as system context in each request.

## Overview

Rules guide agent behavior through:

- **Static Rules**: Always-active behavioral guidelines injected into the provider context
- **Simple API**: Single constructor, single string argument
- **Context-Aware**: Injected by providers as part of the system prompt

### Key Features

- ✅ Simple single-constructor API
- ✅ Injected into every provider call
- ✅ Type-safe with full TypeScript support

## Constructor

```typescript
new Rule(description: string)
```

Creates a rule that is always active.

**Parameters:**
- **description**: Textual description defining the behavior. Must be a non-empty string.

**Example:**

```typescript
import { Rule } from '@arcaelas/agent';

const politeness = new Rule("Maintain a professional and courteous tone");
const privacy = new Rule("Never share user personal information");
const helpfulness = new Rule("Provide comprehensive and useful answers");
```

> **Note:** The conditional `new Rule(description, { when })` overload documented in older versions does **not** exist in the current codebase. There is only one constructor signature.

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
toJSON(): { description: string }
```

Serializes the rule to a plain object.

**Example:**

```typescript
const rule = new Rule("Be polite");

console.log(JSON.stringify(rule));
// {"description":"Be polite"}

const data = rule.toJSON();
console.log(data.description); // "Be polite"
```

### toString()

```typescript
toString(): string
```

Returns string representation for debugging. Long descriptions are truncated to 50 characters.

**Returns:** String in format `"Rule: description"`

**Example:**

```typescript
const rule = new Rule("Always provide detailed explanations");
console.log(rule.toString());
// "Rule: Always provide detailed explanations"

const long_rule = new Rule("This is a very long rule description that will be truncated when displayed");
console.log(long_rule.toString());
// "Rule: This is a very long rule description that wi..."
```

## Usage Patterns

### Pattern: Static Behavioral Guidelines

```typescript
const night_mode = new Rule(
  "Use concise responses and suggest using the callback feature when replying outside business hours."
);

const weekend_rule = new Rule(
  "Inform the user that technical support is limited on weekends."
);
```

### Pattern: Tier-Based Rules via Metadata (using metadata at provider level)

Since Rule does not support conditional evaluation, apply tier-specific rules by setting them dynamically before the agent call:

```typescript
const base_rules = [new Rule("Be helpful and concise")];
const premium_rules = [new Rule("Offer priority support and premium benefits")];

const tier = agent.metadata.get("user_tier", "basic");
agent.rules = tier === "premium"
  ? base_rules.concat(premium_rules)
  : base_rules;
```

### Pattern: Regional Compliance

```typescript
const gdpr_rule = new Rule(
  "Apply GDPR compliance: inform the user about their data rights and provide data access options."
);

const ccpa_rule = new Rule(
  "Apply CCPA compliance: provide opt-out options for data collection."
);

// Set before call based on user region
const region = agent.metadata.get("user_region", "");
if (region === "EU" || region === "UK") {
  agent.rules = agent.rules.concat(gdpr_rule);
} else if (agent.metadata.get("user_state") === "CA") {
  agent.rules = agent.rules.concat(ccpa_rule);
}
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

### 2. Actionable Descriptions

Each rule should be self-contained and actionable by the LLM:

```typescript
// ✅ Good: Specific, actionable
new Rule("Always ask for order confirmation before processing payment.");
new Rule("When the user seems frustrated, acknowledge their concern and offer to escalate.");

// ❌ Bad: Vague
new Rule("Be careful");
new Rule("Handle properly");
```

### 3. One Concern Per Rule

Keep rules focused:

```typescript
// ✅ Good: One concern per rule
const privacy = new Rule("Never share user personal information with third parties.");
const tone = new Rule("Maintain a professional and friendly tone.");

// ❌ Bad: Multiple concerns
new Rule("Be professional, never share data, and always upsell premium features.");
```

## Type Safety

Rule is fully typed with TypeScript:

```typescript
import { Rule } from '@arcaelas/agent';

const rule: Rule = new Rule("Always validate user input");

// Properties are correctly typed
const description: string = rule.description;
const length: number = rule.length;

// toJSON returns { description: string }
const json: { description: string } = rule.toJSON();
```

## Related

- **[Context](context.md)** - Manages rules with inheritance
- **[Agent](agent.md)** - Evaluates and applies rules
- **[Metadata](metadata.md)** - Used in rule conditions
- **[Core Concepts](../guides/core-concepts.md)** - Architecture overview

---

**Next:** Learn about [Message →](message.md)
