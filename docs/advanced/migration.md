# Migration Guide

Guide for upgrading between major versions.

## v3.x to v4.x

### Breaking Changes

1. **Context API** - Simplified hierarchy
2. **Message Types** - Now uses discriminated unions
3. **Tool Constructor** - Supports overloads

### Migration Steps

#### 1. Update Context Creation

**Before (v3)**:
```typescript
const ctx = new Context();
ctx.setMetadata("key", "value");
```

**After (v4)**:
```typescript
const ctx = new Context({
  metadata: new Metadata().set("key", "value")
});
```

#### 2. Update Message Creation

**Before (v3)**:
```typescript
const msg = { role: "user", content: "Hello" };
```

**After (v4)**:
```typescript
const msg = new Message({ role: "user", content: "Hello" });
```

#### 3. Update Tool Creation

No changes required - v4 is backward compatible with v3 tools.

## Version History

- **v4.x** - Current, simplified API
- **v3.x** - Previous stable
- **v2.x** - Legacy (deprecated)
- **v1.x** - Original (deprecated)

---

**[← Back to Advanced](../index.md#advanced)**
