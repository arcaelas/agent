/**
 * @fileoverview
 * Dual-mode Claude (Anthropic) provider for AI agents.
 * Supports both non-streaming (ChatCompletionResponse) and streaming (ProviderChunk) modes.
 * Transforms messages and tools between OpenAI and Anthropic formats automatically.
 *
 * Provider dual-mode de Claude (Anthropic) para agentes de IA.
 * Soporta modo sin streaming (ChatCompletionResponse) y streaming (ProviderChunk).
 * Transforma mensajes y tools entre formatos OpenAI y Anthropic automáticamente.
 *
 * @author Arcaelas Insiders
 * @version 2.0.0
 * @since 1.0.0
 */

import type { ChatCompletionResponse, ProviderChunk } from "~/static/agent";
import type Context from "~/static/context";
import { parse_anthropic_sse } from "~/utils/sse";

/**
 * @description
 * Configuration options for the Claude provider.
 * Opciones de configuración para el provider de Claude.
 */
export interface ClaudeProviderOptions {
  /**
   * @description
   * Anthropic API key for authentication.
   */
  api_key: string;

  /**
   * @description
   * Base URL for the Anthropic API.
   * Default: "https://api.anthropic.com/v1"
   */
  base_url?: string;

  /**
   * @description
   * Claude model to use.
   */
  model: string;

  /**
   * @description
   * Temperature for response randomness control. Range: 0.0 to 1.0.
   */
  temperature?: number;

  /**
   * @description
   * Maximum number of tokens to generate.
   */
  max_tokens?: number;

  /**
   * @description
   * Additional HTTP headers to include in requests.
   */
  headers?: Record<string, string>;
}

/**
 * @description
 * Dual-mode Claude provider. Returns a function that supports both
 * non-streaming and streaming modes via the optional second argument.
 * Automatically transforms between OpenAI and Anthropic message formats.
 *
 * Provider dual-mode de Claude. Retorna una función que soporta
 * modo sin streaming y streaming via el segundo argumento opcional.
 * Transforma automáticamente entre formatos de mensaje OpenAI y Anthropic.
 *
 * @example
 * ```typescript
 * const claude = new Claude({ api_key: "sk-ant-...", model: "claude-3-5-sonnet-20241022" });
 *
 * // Non-streaming (call)
 * const response = await claude(ctx);
 *
 * // Streaming (stream)
 * for await (const chunk of claude(ctx, { stream: true })) {
 *   // chunk: ProviderChunk
 * }
 * ```
 */
export default class Claude extends Function {
  constructor(options: ClaudeProviderOptions) {
    super();

    const base_url = options.base_url ?? "https://api.anthropic.com/v1";

    const build_payload = (ctx: Context) => {
      const rules_content = ctx.rules.length
        ? ctx.rules.map((r) => r.description).join("\n\n")
        : "";

      const context_messages = ctx.messages.map((m) => {
        const json = m.toJSON();
        const { timestamp, ...message } = json;
        return message;
      });

      const system_messages = context_messages
        .filter((m) => m.role === "system")
        .map((m) => m.content)
        .filter((c): c is string => typeof c === "string");

      const system_parts = [rules_content, ...system_messages].filter(Boolean);
      const system_prompt = system_parts.length ? system_parts.join("\n\n") : undefined;

      const conversation_messages = context_messages
        .filter((m) => m.role !== "system")
        .map((m) => {
          if (m.role === "tool") {
            return {
              role: "user" as const,
              content: [{
                type: "tool_result" as const,
                tool_use_id: m.tool_call_id,
                content: m.content,
              }],
            };
          }

          if (m.role === "assistant" && m.tool_calls && m.tool_calls.length > 0) {
            const content_blocks: any[] = [];
            if (m.content) {
              content_blocks.push({ type: "text", text: m.content });
            }
            m.tool_calls.forEach((tc) => {
              content_blocks.push({
                type: "tool_use",
                id: tc.id,
                name: tc.function.name,
                input: JSON.parse(tc.function.arguments),
              });
            });
            return { role: "assistant" as const, content: content_blocks };
          }

          return m;
        });

      const tools = ctx.tools.length
        ? ctx.tools.map((t) => {
            const json = t.toJSON();
            return {
              name: json.function.name,
              description: json.function.description,
              input_schema: {
                type: "object",
                properties: json.function.parameters.properties,
                required: Object.keys(json.function.parameters.properties),
              },
            };
          })
        : undefined;

      return { system_prompt, conversation_messages, tools };
    };

    const build_headers = () => ({
      "Content-Type": "application/json",
      "x-api-key": options.api_key,
      "anthropic-version": "2023-06-01",
      ...(options.headers ?? {}),
    });

    const build_body = (payload: ReturnType<typeof build_payload>, stream: boolean) => ({
      model: options.model,
      ...(payload.system_prompt && { system: payload.system_prompt }),
      messages: payload.conversation_messages,
      ...(payload.tools && { tools: payload.tools }),
      temperature: options.temperature ?? 1.0,
      max_tokens: options.max_tokens ?? 1024,
      ...(stream && { stream: true }),
    });

    return ((ctx: Context, opts?: { stream: true }): any => {
      const payload = build_payload(ctx);

      if (!opts?.stream) {
        return (async (): Promise<ChatCompletionResponse> => {
          const response = await fetch(`${base_url}/messages`, {
            method: "POST",
            headers: build_headers(),
            body: JSON.stringify(build_body(payload, false)),
          });

          if (!response.ok) {
            throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
          }

          const claude_response = await response.json();

          const content_blocks = claude_response.content ?? [];
          const text_content = content_blocks
            .filter((block: any) => block.type === "text")
            .map((block: any) => block.text)
            .join("\n");

          const tool_calls = content_blocks
            .filter((block: any) => block.type === "tool_use")
            .map((block: any) => ({
              id: block.id,
              type: "function" as const,
              function: {
                name: block.name,
                arguments: JSON.stringify(block.input),
              },
            }));

          return {
            id: claude_response.id,
            object: "chat.completion",
            created: Math.floor(Date.now() / 1000),
            model: claude_response.model,
            choices: [{
              index: 0,
              message: {
                role: "assistant",
                content: text_content || null,
                tool_calls: tool_calls.length > 0 ? tool_calls : undefined,
              },
              finish_reason:
                claude_response.stop_reason === "end_turn" ? "stop"
                  : claude_response.stop_reason === "tool_use" ? "tool_calls"
                  : claude_response.stop_reason === "max_tokens" ? "length"
                  : null,
            }],
            usage: {
              prompt_tokens: claude_response.usage?.input_tokens ?? 0,
              completion_tokens: claude_response.usage?.output_tokens ?? 0,
              total_tokens:
                (claude_response.usage?.input_tokens ?? 0) +
                (claude_response.usage?.output_tokens ?? 0),
            },
          };
        })();
      }

      return (async function* (): AsyncGenerator<ProviderChunk, void, unknown> {
        const response = await fetch(`${base_url}/messages`, {
          method: "POST",
          headers: build_headers(),
          body: JSON.stringify(build_body(payload, true)),
        });

        if (!response.ok) {
          throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
        }

        let tool_index = -1;

        for await (const { event, data } of parse_anthropic_sse(response)) {
          if (event === "content_block_start") {
            if (data.content_block?.type === "tool_use") {
              tool_index++;
              yield {
                type: "tool_call_delta",
                index: tool_index,
                id: data.content_block.id,
                name: data.content_block.name,
              };
            }
            continue;
          }

          if (event === "content_block_delta") {
            if (data.delta?.type === "text_delta" && data.delta.text) {
              yield { type: "text_delta", content: data.delta.text };
            }
            if (data.delta?.type === "input_json_delta" && data.delta.partial_json) {
              yield {
                type: "tool_call_delta",
                index: tool_index,
                arguments_delta: data.delta.partial_json,
              };
            }
            continue;
          }

          if (event === "message_delta") {
            const stop_reason = data.delta?.stop_reason;
            if (stop_reason) {
              yield {
                type: "finish",
                finish_reason:
                  stop_reason === "end_turn" ? "stop"
                    : stop_reason === "tool_use" ? "tool_calls"
                    : stop_reason === "max_tokens" ? "length"
                    : stop_reason,
              };
            }
            continue;
          }
        }
      })();
    }) as any;
  }
}
