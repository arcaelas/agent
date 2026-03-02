/**
 * @fileoverview
 * Dual-mode DeepSeek provider for AI agents.
 * Supports both non-streaming (ChatCompletionResponse) and streaming (ProviderChunk) modes.
 * DeepSeek is OpenAI-compatible and specializes in reasoning and code generation.
 *
 * Provider dual-mode de DeepSeek para agentes de IA.
 * Soporta modo sin streaming (ChatCompletionResponse) y streaming (ProviderChunk).
 * DeepSeek es compatible con OpenAI y especializado en razonamiento y generación de código.
 *
 * @author Arcaelas Insiders
 * @version 2.0.0
 * @since 1.0.0
 */

import type { ChatCompletionResponse, ProviderChunk } from "~/static/agent";
import type Context from "~/static/context";
import { parse_sse } from "~/utils/sse";

/**
 * @description
 * Configuration options for the DeepSeek provider.
 * Opciones de configuración para el provider de DeepSeek.
 */
export interface DeepSeekProviderOptions {
  /**
   * @description
   * DeepSeek API key for authentication.
   */
  api_key: string;

  /**
   * @description
   * Base URL for the DeepSeek API.
   * Default: "https://api.deepseek.com/v1"
   */
  base_url?: string;

  /**
   * @description
   * DeepSeek model to use.
   */
  model: string;

  /**
   * @description
   * Temperature for response randomness control. Range: 0.0 to 2.0.
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
 * Dual-mode DeepSeek provider. Returns a function that supports both
 * non-streaming and streaming modes via the optional second argument.
 *
 * Provider dual-mode de DeepSeek. Retorna una función que soporta
 * modo sin streaming y streaming via el segundo argumento opcional.
 *
 * @example
 * ```typescript
 * const deepseek = new DeepSeek({ api_key: "sk-...", model: "deepseek-chat" });
 *
 * // Non-streaming (call)
 * const response = await deepseek(ctx);
 *
 * // Streaming (stream)
 * for await (const chunk of deepseek(ctx, { stream: true })) {
 *   // chunk: ProviderChunk
 * }
 * ```
 */
export default class DeepSeek extends Function {
  constructor(options: DeepSeekProviderOptions) {
    super();

    const base_url = options.base_url ?? "https://api.deepseek.com/v1";

    const build_payload = (ctx: Context) => {
      const rules_messages = ctx.rules.length
        ? [{ role: "system" as const, content: ctx.rules.map((r) => r.description).join("\n\n") }]
        : [];

      const context_messages = ctx.messages.map((m) => {
        const json = m.toJSON();
        const { timestamp, ...message } = json;
        return message;
      });

      const messages = [...rules_messages, ...context_messages];
      const tools = ctx.tools.length ? ctx.tools.map((t) => t.toJSON()) : undefined;

      return { messages, tools };
    };

    const build_headers = () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${options.api_key}`,
      ...(options.headers ?? {}),
    });

    return ((ctx: Context, opts?: { stream: true }): any => {
      const { messages, tools } = build_payload(ctx);

      if (!opts?.stream) {
        return (async (): Promise<ChatCompletionResponse> => {
          const response = await fetch(`${base_url}/chat/completions`, {
            method: "POST",
            headers: build_headers(),
            body: JSON.stringify({
              model: options.model,
              messages,
              tools,
              temperature: options.temperature ?? 1.0,
              max_tokens: options.max_tokens,
            }),
          });

          if (!response.ok) {
            throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
          }

          return await response.json();
        })();
      }

      return (async function* (): AsyncGenerator<ProviderChunk, void, unknown> {
        const response = await fetch(`${base_url}/chat/completions`, {
          method: "POST",
          headers: build_headers(),
          body: JSON.stringify({
            model: options.model,
            messages,
            tools,
            temperature: options.temperature ?? 1.0,
            max_tokens: options.max_tokens,
            stream: true,
          }),
        });

        if (!response.ok) {
          throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
        }

        for await (const chunk of parse_sse(response)) {
          const delta = chunk.choices?.[0]?.delta;
          if (!delta) continue;

          if (delta.content) {
            yield { type: "text_delta", content: delta.content };
          }

          if (delta.tool_calls) {
            for (const tc of delta.tool_calls) {
              yield {
                type: "tool_call_delta",
                index: tc.index,
                id: tc.id,
                name: tc.function?.name,
                arguments_delta: tc.function?.arguments,
              };
            }
          }

          if (chunk.choices?.[0]?.finish_reason) {
            yield { type: "finish", finish_reason: chunk.choices[0].finish_reason };
          }
        }
      })();
    }) as any;
  }
}
