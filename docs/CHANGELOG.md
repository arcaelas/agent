# Changelog

All notable changes to this project will be documented in this file.

## \[1.8.0]

### Added

- `branches` option on `AgentOptions`: array of sub-agents (`Agent`, `AgentOptions`, or description string) that run sequentially before each `call()` / `stream()` turn, building accumulated thinking injected as ephemeral `system` message.
- `Agent.stream()` method: async generator yielding `StreamChunk` (`assistant`, `thinking`, `tool_call`, `tool` roles).
- `ProviderChunk { type: "thinking_delta" }`: all built-in providers (`OpenAI`, `Groq`, `DeepSeek`, `Claude`, `ClaudeCode`) parse native model thinking.
- `ResponseMessage.reasoning_content?: string` optional field.
- Built-in tools: `AgentTool`, `AskTool`, `ChoiceTool`, `SleepTool`.
- Context constructor now accepts plain objects: `metadata` as `Record<string,string>`, `rules` as `string | string[]`, `messages` as `MessageOptions | MessageOptions[]`.

### Changed

- Context setters (`messages`, `rules`, `tools`) are now idempotent: filter inherited items by reference before storing locals.
- `AgentOptions.name` and `AgentOptions.description` are now `deprecated` — `name`/`description` props are always `undefined` at runtime; `description` is converted to a `Rule` in the internal Context.

### Removed

- `Context.appendMessages()` method.
- `Context.spliceAt()` method.

## \[1.7.0]

### Added

- Five built-in provider classes: `OpenAI`, `Groq`, `DeepSeek`, `Claude`, `ClaudeCode`.

## \[1.0.4] - 2025-07-17

### Added

- Full integration of the agent’s name and description into the system message.

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
