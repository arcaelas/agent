# Changelog

All notable changes to this project will be documented in this file.

## \[1.0.25] - 2026-03-02

### Added

- `Agent.stream()` method: async generator for real-time streaming responses with full agentic loop (tool execution and provider re-invocation).
- `StreamChunk` type: discriminated union yielded by `Agent.stream()` (`{ role: "assistant"; content }` or `{ role: "tool"; name; tool_call_id; content }`).
- `ProviderChunk` type: discriminated union emitted by providers in stream mode (`text_delta`, `tool_call_delta`, `finish`).
- `StreamInput` type: accepted input for `Agent.stream()` (string, Message, or `{ role, content }` object).
- Dual-mode `Provider` type: supports both non-streaming `(ctx: Context) => ChatCompletionResponse` and streaming `(ctx: Context, opts: { stream: true }) => AsyncIterable<ProviderChunk>` overloads.
- SSE parser utilities: `parse_sse` and `parse_anthropic_sse` in `src/utils/sse.ts` for building custom streaming providers.

### Changed

- `Provider` type expanded to a dual-mode overloaded function type. No breaking changes: existing non-streaming providers continue to work with `call()`.

## \[1.0.4] - 2025-07-17

### Added

- Full integration of the agent's name and description into the system message.

### Improved

- Enhanced rule and limit handling during conversation flow.
- Optimized validation process for provider responses.

## \[1.0.3] - 2025-07-17

### Changed

- Renamed the `Bot` class to `Agent` to ensure consistent terminology.
- Refactored related interfaces to adopt the "Agent" term.

### Documentation

- Updated usage examples and improved main method documentation.

## \[1.0.2] - 2025-07-17

### Added

- Extra integrity checks prior to publishing.

### Fixed

- Minor type issues in core interfaces.

### Changed

- Publication workflow now auto-increments patch version.

## \[1.0.1] - 2025-07-17

### Changed

- Downgraded package version to `1.0.1` to comply with semantic versioning.
- Simplified internal logic for error handling in tool calls.

### Improved

- Better compatibility with various OpenAI API versions.

## \[2.0.5] _(reverted to 1.0.1)_ - 2025-07-17

### Changed

- Updated package metadata and dependencies.
- Fixed version numbering to restore correct semantic structure.

### Improved

- Optimized project metadata structure.

## \[1.0.0] - 2025-07-17

### Added

- `yarn.lock` file to ensure dependency consistency.
- Strict version control enforcement for cross-environment compatibility.

### Documentation

- Improved installation and usage instructions.

## \[0.9.0] - 2025-07-17

### Added

- Initial TypeScript compiler configuration with strict mode.
- Module aliasing for improved project structure.
- Optimized compilation options for maximum compatibility.
