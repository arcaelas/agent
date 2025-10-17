# Context Inheritance Example

This example demonstrates hierarchical context management with automatic inheritance for enterprise-scale agent systems.

## Overview

Context inheritance allows you to:
- Share configuration across multiple agents
- Create organizational hierarchies (company → department → team)
- Override inherited values when needed
- Maintain consistency while allowing customization

## Basic Inheritance

```typescript
import { Agent, Context, Metadata, Rule, Tool } from '@arcaelas/agent';

// Parent context - company-wide settings
const company_context = new Context({
  metadata: new Metadata()
    .set("organization", "Acme Corp")
    .set("api_version", "v2"),
  rules: [
    new Rule("Always maintain professional tone"),
    new Rule("Protect customer privacy")
  ]
});

// Child context - inherits from parent
const sales_context = new Context({
  context: company_context,  // Inheritance
  metadata: new Metadata()
    .set("department", "Sales")
    .set("region", "EMEA"),
  rules: [
    new Rule("Focus on customer value proposition")
  ]
});

// Agent using child context
const sales_agent = new Agent({
  name: "Sales_Agent",
  description: "EMEA sales specialist",
  contexts: sales_context,
  providers: [openai_provider]
});

// Agent has access to all inherited data:
console.log(sales_agent.metadata.get("organization")); // "Acme Corp" (inherited)
console.log(sales_agent.metadata.get("department"));    // "Sales" (local)
console.log(sales_agent.rules.length);                  // 3 (2 inherited + 1 local)
```

## Multi-Level Inheritance

```typescript
// Level 1: Global
const global_context = new Context({
  metadata: new Metadata()
    .set("company", "TechCorp")
    .set("compliance_level", "high"),
  rules: [new Rule("Follow data protection regulations")]
});

// Level 2: Department
const engineering_context = new Context({
  context: global_context,
  metadata: new Metadata()
    .set("department", "Engineering")
    .set("tech_stack", "TypeScript"),
  tools: [github_tool, jira_tool]
});

// Level 3: Team
const backend_team_context = new Context({
  context: engineering_context,
  metadata: new Metadata()
    .set("team", "Backend")
    .set("primary_language", "Go"),
  tools: [database_tool, api_tool]
});

// Agent at deepest level
const backend_agent = new Agent({
  name: "Backend_Engineer_Agent",
  description: "Backend engineering specialist",
  contexts: backend_team_context,
  providers: [openai_provider]
});

// Has access to all levels:
console.log(backend_agent.metadata.get("company"));      // "TechCorp" (level 1)
console.log(backend_agent.metadata.get("department"));   // "Engineering" (level 2)
console.log(backend_agent.metadata.get("team"));         // "Backend" (level 3)
console.log(backend_agent.tools.length);                 // 4 (2 from level 2 + 2 from level 3)
```

## Overriding Inherited Values

```typescript
const parent = new Context({
  metadata: new Metadata()
    .set("theme", "light")
    .set("timeout", "30000")
});

const child = new Context({
  context: parent,
  metadata: new Metadata()
    .set("theme", "dark")  // Override parent value
});

const agent = new Agent({
  name: "Custom_Agent",
  description: "Agent with overridden theme",
  contexts: child,
  providers: [openai_provider]
});

console.log(agent.metadata.get("theme"));    // "dark" (overridden)
console.log(agent.metadata.get("timeout"));  // "30000" (inherited)
```

## Tool Deduplication

Tools with the same name are automatically deduplicated, with local tools taking precedence:

```typescript
const parent_tools = [
  new Tool('search', (agent) => "Parent search implementation")
];

const child_tools = [
  new Tool('search', (agent) => "Child search implementation (enhanced)"),
  new Tool('analyze', (agent) => "Analysis tool")
];

const parent_ctx = new Context({ tools: parent_tools });
const child_ctx = new Context({
  context: parent_ctx,
  tools: child_tools
});

const agent = new Agent({
  name: "Tool_Agent",
  description: "Agent with deduplicated tools",
  contexts: child_ctx,
  providers: [openai_provider]
});

console.log(agent.tools.length); // 2 (search from child, analyze from child)
// 'search' from parent is replaced by child's version
```

## Enterprise Pattern

Complete organizational structure:

```typescript
// Global company context
const acme_global = new Context({
  metadata: new Metadata()
    .set("company_name", "Acme Corporation")
    .set("founded", "1950")
    .set("compliance", "SOC2,ISO27001"),
  rules: [
    new Rule("Maintain confidentiality of customer data"),
    new Rule("Follow industry best practices")
  ],
  tools: [logging_tool, analytics_tool]
});

// Regional contexts
const acme_emea = new Context({
  context: acme_global,
  metadata: new Metadata()
    .set("region", "EMEA")
    .set("gdpr_compliant", "true"),
  rules: [new Rule("Apply GDPR data protection standards")]
});

const acme_americas = new Context({
  context: acme_global,
  metadata: new Metadata()
    .set("region", "Americas")
    .set("timezone", "EST"),
  rules: [new Rule("Apply US data protection standards")]
});

// Department contexts
const emea_sales = new Context({
  context: acme_emea,
  metadata: new Metadata()
    .set("department", "Sales"),
  tools: [crm_tool, email_tool]
});

const emea_support = new Context({
  context: acme_emea,
  metadata: new Metadata()
    .set("department", "Support"),
  tools: [ticketing_tool, knowledge_base_tool]
});

// Create specialized agents
const sales_agent_uk = new Agent({
  name: "UK_Sales_Agent",
  description: "Sales agent for UK market",
  contexts: emea_sales,
  metadata: new Metadata().set("country", "UK"),
  providers: [openai_provider]
});

const support_agent_germany = new Agent({
  name: "Germany_Support_Agent",
  description: "Support agent for German customers",
  contexts: emea_support,
  metadata: new Metadata().set("country", "Germany").set("language", "de"),
  providers: [openai_provider]
});

// Both agents inherit:
// - Company-level config and rules
// - Regional GDPR compliance
// - Department-specific tools
// Plus their own country-specific metadata
```

## Dynamic Context Creation

Create contexts dynamically based on user data:

```typescript
function create_user_context(user_profile) {
  const base_context = new Context({
    metadata: new Metadata()
      .set("app_name", "MyApp")
      .set("version", "1.0"),
    rules: [new Rule("Be helpful and concise")]
  });

  return new Context({
    context: base_context,
    metadata: new Metadata()
      .set("user_id", user_profile.id)
      .set("user_name", user_profile.name)
      .set("subscription", user_profile.plan)
      .set("preferences", JSON.stringify(user_profile.preferences))
  });
}

// Create per-user agents
function create_personalized_agent(user_profile) {
  const user_context = create_user_context(user_profile);

  return new Agent({
    name: `Agent_${user_profile.id}`,
    description: `Personalized agent for ${user_profile.name}`,
    contexts: user_context,
    providers: [openai_provider]
  });
}

// Usage
const user = { id: "123", name: "John", plan: "premium", preferences: {...} };
const agent = create_personalized_agent(user);
```

## Best Practices

### 1. Layer Contexts by Scope

```typescript
// ✅ Good: Clear hierarchy
global_ctx → regional_ctx → department_ctx → team_ctx

// ❌ Bad: Flat structure
individual_context_for_each_agent
```

### 2. Use Meaningful Metadata Keys

```typescript
// ✅ Good: Descriptive keys
metadata.set("user_subscription_tier", "premium")
metadata.set("feature_flags", JSON.stringify({...}))

// ❌ Bad: Vague keys
metadata.set("tier", "p")
metadata.set("flags", "...")
```

### 3. Document Inheritance Chain

```typescript
/**
 * Inheritance: global_ctx → region_ctx → dept_ctx
 * - global_ctx: Company-wide settings
 * - region_ctx: Regional compliance & timezone
 * - dept_ctx: Department-specific tools
 */
const dept_ctx = new Context({
  context: region_ctx,
  ...
});
```

## Next Steps

- **[Advanced Patterns](advanced-patterns.md)** - Complex multi-agent workflows
- **[API Reference: Context](../api/context.md)** - Complete Context API
- **[API Reference: Metadata](../api/metadata.md)** - Metadata broker pattern

---

**[← Back to Examples](../index.md#examples)**
