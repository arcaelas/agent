# Metadata

**Metadata** is a reactive key-value store with hierarchical inheritance using the broker pattern. It provides configuration management with automatic fallback and dynamic parent composition.

## Overview

Metadata manages configuration data through:

- **Hierarchical Inheritance**: Multiple parent nodes with automatic fallback
- **Broker Pattern**: Dynamic parent management without proxies
- **Local Overrides**: Child values override parent values by key
- **Deletion Markers**: `null` values mark keys as deleted
- **Fluent API**: Method chaining for readable configuration

### Key Features

- ✅ Multiple parent inheritance (broker pattern)
- ✅ Automatic fallback chain (child → parent1 → parent2 → ...)
- ✅ Local override capability
- ✅ Dynamic parent addition with `use()`
- ✅ Type-safe with full TypeScript support
- ✅ JSON serialization support

## Constructor

```typescript
new Metadata(...children: (Metadata | Metadata[])[])
```

Creates a new Metadata instance with optional parent nodes for inheritance.

### Parameters

- **children**: Parent Metadata instance(s) - supports individual, array, or spread syntax

### Examples

**No Inheritance:**

```typescript
import { Metadata } from '@arcaelas/agent';

const metadata = new Metadata();
metadata.set("app", "MyApp");
```

**Single Parent:**

```typescript
const parent = new Metadata();
parent.set("company", "Acme Corp");

const child = new Metadata(parent);
child.set("department", "Sales");

console.log(child.get("company"));    // "Acme Corp" (inherited)
console.log(child.get("department")); // "Sales" (local)
```

**Multiple Parents:**

```typescript
const defaults = new Metadata();
defaults.set("theme", "light");
defaults.set("timeout", "5000");

const env = new Metadata();
env.set("timeout", "10000");  // Override defaults

const config = new Metadata(defaults, env);
config.set("api_key", "secret123");

console.log(config.get("theme"));    // "light" (from defaults)
console.log(config.get("timeout"));  // "10000" (from env, overrides defaults)
console.log(config.get("api_key"));  // "secret123" (local)
```

**Array Syntax:**

```typescript
const parents = [metadata1, metadata2, metadata3];
const child = new Metadata(parents);
```

## Methods

### get()

```typescript
get(key: string, fallback: string | null = null): string | null
```

Retrieves a value with hierarchical fallback. Searches locally first, then through parent nodes in order.

**Parameters:**
- **key**: The key to retrieve
- **fallback**: Default value if key not found (default: `null`)

**Returns:** The value found or the fallback

**Example:**

```typescript
const parent = new Metadata();
parent.set("color", "blue");
parent.set("size", "large");

const child = new Metadata(parent);
child.set("color", "red");       // Override
child.set("shape", "circle");    // New local value

console.log(child.get("color"));  // "red" (local override)
console.log(child.get("size"));   // "large" (inherited)
console.log(child.get("shape"));  // "circle" (local)
console.log(child.get("missing", "default")); // "default" (fallback)
```

**Fallback Chain:**

```typescript
const m1 = new Metadata();
m1.set("key", "value1");

const m2 = new Metadata();
m2.set("key", "value2");

const m3 = new Metadata(m1, m2);

// Searches: m3 (not found) → m1 (found "value1") → m2 (found "value2")
// Returns last found: "value2"
console.log(m3.get("key")); // "value2"
```

### has()

```typescript
has(key: string): boolean
```

Checks if a key exists and is not marked as deleted. Searches locally first, then through parent nodes.

**Parameters:**
- **key**: The key to check

**Returns:** `true` if key exists and not deleted, `false` otherwise

**Example:**

```typescript
const parent = new Metadata();
parent.set("feature_a", "enabled");
parent.set("feature_b", "disabled");

const child = new Metadata(parent);
child.set("feature_c", "enabled");
child.set("feature_a", null);  // Mark as deleted locally

console.log(child.has("feature_a")); // false (deleted locally)
console.log(child.has("feature_b")); // true (inherited)
console.log(child.has("feature_c")); // true (local)
console.log(child.has("feature_d")); // false (doesn't exist)
```

**Deletion Behavior:**

```typescript
const m = new Metadata();
m.set("key", "value");
console.log(m.has("key")); // true

m.set("key", null);  // Mark as deleted
console.log(m.has("key")); // false

m.delete("key");  // Same as set(key, null)
console.log(m.has("key")); // false
```

### set()

```typescript
set(key: string, value: string | null | undefined): this
```

Sets a value locally in this node. If value is `null` or `undefined`, marks the key as deleted.

**Parameters:**
- **key**: The key to set
- **value**: The value to store, or `null`/`undefined` to delete

**Returns:** `this` for method chaining

**Example:**

```typescript
const metadata = new Metadata();

// Set values
metadata.set("user_id", "12345");
metadata.set("session_token", "abc123");

// Delete values (mark as null)
metadata.set("temp_data", null);
metadata.set("cache_key", undefined);

// Method chaining
metadata
  .set("config1", "value1")
  .set("config2", "value2")
  .set("old_config", null);  // Delete
```

**Override Behavior:**

```typescript
const parent = new Metadata();
parent.set("theme", "light");

const child = new Metadata(parent);
child.set("theme", "dark");  // Override parent

console.log(parent.get("theme")); // "light" (unchanged)
console.log(child.get("theme"));  // "dark" (overridden)
```

### delete()

```typescript
delete(key: string): this
```

Marks a key as deleted locally. Equivalent to `set(key, null)`.

**Parameters:**
- **key**: The key to delete

**Returns:** `this` for method chaining

**Example:**

```typescript
const parent = new Metadata();
parent.set("config", "value");

const child = new Metadata(parent);
child.delete("config");  // Delete locally, doesn't affect parent

console.log(child.has("config")); // false (deleted)
console.log(parent.has("config")); // true (not affected)
```

### clear()

```typescript
clear(): this
```

Removes all local data from this node. Does not affect parent nodes.

**Returns:** `this` for method chaining

**Example:**

```typescript
const parent = new Metadata();
parent.set("inherited", "value");

const child = new Metadata(parent);
child.set("local1", "value1");
child.set("local2", "value2");

// Clear only local data
child.clear();

console.log(child.get("local1"));    // null (cleared)
console.log(child.get("inherited")); // "value" (inherited, not affected)
```

### use()

```typescript
use(...nodes: (Metadata | Metadata[])[]): this
```

Dynamically adds parent nodes to the broker for inheritance. Supports the same flexible syntax as the constructor.

**Parameters:**
- **nodes**: Parent node(s) to add - supports individual, array, or spread syntax

**Returns:** `this` for method chaining

**Example:**

```typescript
const base = new Metadata();
base.set("app", "MyApp");

const theme = new Metadata();
theme.set("color", "blue");

const config = new Metadata();
config.set("local", "value");

// Add parents dynamically
config.use(base);           // Single node
config.use([theme]);        // Array of nodes
config.use(base, theme);    // Multiple nodes

// Method chaining
config
  .use(base)
  .use(theme)
  .set("final", "configured");

console.log(config.get("app"));   // "MyApp" (from base)
console.log(config.get("color")); // "blue" (from theme)
console.log(config.get("local")); // "value" (local)
```

**Runtime Composition:**

```typescript
const metadata = new Metadata();
metadata.set("local", "value");

// Start with no parents
console.log(metadata.get("inherited")); // null

// Add parent at runtime
const parent = new Metadata();
parent.set("inherited", "from_parent");
metadata.use(parent);

// Now inherits from parent
console.log(metadata.get("inherited")); // "from_parent"
```

### all()

```typescript
all(): Record<string, string>
```

Returns all available data by combining inheritance and local values. Excludes `null` and `undefined` values.

**Returns:** Object with all available key-value pairs

**Example:**

```typescript
const defaults = new Metadata();
defaults.set("theme", "light");
defaults.set("debug", "false");

const user = new Metadata(defaults);
user.set("theme", "dark");  // Override
user.set("lang", "es");     // New
user.set("debug", null);    // Delete

const all_config = user.all();
console.log(all_config);
// {
//   theme: "dark",  // Override local
//   lang: "es"      // Local value
//   // debug excluded (deleted with null)
// }
```

### toJSON()

```typescript
toJSON(): Record<string, string>
```

Native JSON serialization that combines inheritance and local data. Called automatically by `JSON.stringify()`.

**Returns:** Serializable object with all available values

**Example:**

```typescript
const parent = new Metadata();
parent.set("inherited", "value");

const child = new Metadata(parent);
child.set("local", "data");

// Automatic serialization
const json_string = JSON.stringify(child);
console.log(json_string); // {"inherited":"value","local":"data"}

// Manual call for object spread
const combined = { ...child.toJSON(), extra: "value" };
console.log(combined); // { inherited: "value", local: "data", extra: "value" }
```

## Inheritance Rules

### Fallback Chain

Metadata searches for values in this order:

1. **Local data** - Values set directly on this instance
2. **Broker nodes** - Parent nodes in the order they were added
3. **Fallback** - Default value provided to `get()`

```typescript
const m1 = new Metadata();
m1.set("key", "from_m1");

const m2 = new Metadata();
m2.set("key", "from_m2");

const m3 = new Metadata(m1, m2);
m3.set("other", "local");

console.log(m3.get("key"));   // "from_m2" (last broker wins)
console.log(m3.get("other")); // "local" (local value)
```

### Override Behavior

Local values always take precedence:

```typescript
const parent = new Metadata();
parent.set("config", "parent_value");

const child = new Metadata(parent);
child.set("config", "child_value");

console.log(child.get("config")); // "child_value" (local override)
console.log(parent.get("config")); // "parent_value" (unchanged)
```

### Deletion Markers

Using `null` marks a key as deleted locally without affecting parent:

```typescript
const parent = new Metadata();
parent.set("feature", "enabled");

const child = new Metadata(parent);
console.log(child.get("feature")); // "enabled" (inherited)

child.set("feature", null);  // Mark as deleted
console.log(child.has("feature")); // false (deleted locally)
console.log(parent.has("feature")); // true (parent unaffected)
```

## Common Patterns

### Pattern: Configuration Layers

Build configuration from multiple sources:

```typescript
// Default configuration
const defaults = new Metadata();
defaults.set("timeout", "5000");
defaults.set("retries", "3");
defaults.set("log_level", "info");

// Environment-specific overrides
const production = new Metadata();
production.set("timeout", "30000");
production.set("log_level", "error");

// User preferences
const user_prefs = new Metadata();
user_prefs.set("theme", "dark");

// Final configuration
const config = new Metadata(defaults, production, user_prefs);

console.log(config.get("timeout"));   // "30000" (from production)
console.log(config.get("retries"));   // "3" (from defaults)
console.log(config.get("log_level")); // "error" (from production)
console.log(config.get("theme"));     // "dark" (from user_prefs)
```

### Pattern: Feature Flags

Manage feature toggles with inheritance:

```typescript
const global_features = new Metadata();
global_features.set("analytics", "true");
global_features.set("beta_ui", "false");
global_features.set("experimental", "false");

const beta_features = new Metadata(global_features);
beta_features.set("beta_ui", "true");  // Enable for beta users

const admin_features = new Metadata(beta_features);
admin_features.set("experimental", "true");  // Enable for admins

// Check features
if (admin_features.get("analytics") === "true") {
  // Track analytics
}

if (admin_features.get("experimental") === "true") {
  // Show experimental features
}
```

### Pattern: Multi-Tenant Configuration

Separate tenant-specific configuration:

```typescript
const app_config = new Metadata();
app_config.set("app_name", "MyApp");
app_config.set("version", "1.0.0");

const tenant_a = new Metadata(app_config);
tenant_a.set("tenant_id", "A");
tenant_a.set("branding_color", "#FF0000");

const tenant_b = new Metadata(app_config);
tenant_b.set("tenant_id", "B");
tenant_b.set("branding_color", "#00FF00");

console.log(tenant_a.get("app_name")); // "MyApp" (inherited)
console.log(tenant_a.get("tenant_id")); // "A" (local)
console.log(tenant_b.get("tenant_id")); // "B" (local)
```

### Pattern: Runtime Configuration

Add configuration sources dynamically:

```typescript
const config = new Metadata();
config.set("app", "MyApp");

// Load defaults
const defaults = new Metadata();
defaults.set("timeout", "5000");
config.use(defaults);

// Load from environment
const env_config = new Metadata();
env_config.set("api_url", process.env.API_URL || "");
config.use(env_config);

// Load user preferences
const user_prefs = await loadUserPreferences();
config.use(user_prefs);

// All configs now available
console.log(config.all());
```

## Best Practices

### 1. Use Descriptive Keys

Choose clear, namespaced keys:

```typescript
// ✅ Good: Clear, namespaced keys
metadata.set("database.host", "localhost");
metadata.set("database.port", "5432");
metadata.set("feature.analytics", "true");

// ❌ Bad: Vague keys
metadata.set("host", "localhost");
metadata.set("port", "5432");
metadata.set("flag", "true");
```

### 2. Provide Sensible Defaults

Always provide fallback values:

```typescript
// ✅ Good: Always provide defaults
const timeout = parseInt(config.get("timeout", "5000"));
const theme = config.get("theme", "light");

// ❌ Bad: No fallback (might be null)
const timeout = parseInt(config.get("timeout"));  // NaN if not found
```

### 3. Document Inheritance Layers

Make inheritance hierarchies clear:

```typescript
// ✅ Good: Clear hierarchy
const global_config = new Metadata();       // Layer 1: Global defaults
const app_config = new Metadata(global_config);    // Layer 2: App config
const user_config = new Metadata(app_config);      // Layer 3: User prefs

// ❌ Bad: Unclear relationships
const config1 = new Metadata(config2, config3, config4);
```

### 4. Use Type Conversion

Convert string values appropriately:

```typescript
const config = new Metadata();
config.set("port", "3000");
config.set("debug", "true");
config.set("timeout", "5000");

// Convert to appropriate types
const port = parseInt(config.get("port", "3000"));
const debug = config.get("debug", "false") === "true";
const timeout = parseFloat(config.get("timeout", "5000"));
```

### 5. Clean Up Temporary Data

Use `clear()` to remove temporary values:

```typescript
const session = new Metadata();
session.set("temp_token", "abc123");
session.set("cache_data", "...");

// Clean up after use
session.clear();

// But keep inherited config
console.log(session.get("app_name")); // Still available from parent
```

## Type Safety

Metadata is fully typed with TypeScript:

```typescript
import { Metadata } from '@arcaelas/agent';

// Create instance
const metadata: Metadata = new Metadata();

// Type-safe methods
metadata.set("key", "value");              // ✅ string value
metadata.set("key", null);                 // ✅ null (deletion marker)
const value: string | null = metadata.get("key");  // ✅ Correctly typed

// Method chaining preserves type
const result: Metadata = metadata
  .set("a", "1")
  .set("b", "2")
  .use(other_metadata);

// Serialization types
const all: Record<string, string> = metadata.all();
const json: Record<string, string> = metadata.toJSON();
```

## Performance Considerations

### Efficient Lookups

Lookups are O(n) where n is the number of broker nodes. Keep broker lists small:

```typescript
// ✅ Good: Few broker nodes
const config = new Metadata(defaults, env, user);  // 3 nodes

// ❌ Bad: Too many broker nodes
const config = new Metadata(
  defaults, env1, env2, env3, user1, user2, user3, ...  // Many nodes
);
```

### Memory Management

Metadata instances are lightweight. Create them freely:

```typescript
// ✅ Fine: Create per-request metadata
app.use((req, res, next) => {
  req.metadata = new Metadata(global_config);
  req.metadata.set("request_id", generateId());
  next();
});
```

## Related

- **[Context](context.md)** - Uses Metadata for configuration
- **[Agent](agent.md)** - Accepts Metadata in configuration
- **[Core Concepts](../guides/core-concepts.md)** - Architecture overview

---

**Next:** Learn about [Tool →](tool.md)
