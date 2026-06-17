/**
 * @fileoverview
 * Dual-mode OpenAI-compatible provider for AI agents.
 * Base class for all OpenAI-compatible APIs (OpenAI, Groq, DeepSeek, Ollama, etc.).
 * Supports non-streaming (ChatCompletionResponse) and streaming (ProviderChunk) modes.
 *
 * Clase base para proveedores compatibles con OpenAI (OpenAI, Groq, DeepSeek, Ollama, etc.).
 * Soporta modo sin streaming (ChatCompletionResponse) y streaming (ProviderChunk).
 *
 * @author Arcaelas Insiders
 * @version 3.0.0
 * @since 1.0.0
 */

import type { ChatCompletionResponse, Provider, ProviderChunk } from "~/lib/agent";
import type Context from "~/lib/context";
import { parse_sse } from "~/lib/sse";

/**
 * Configuration options for the OpenAI provider (and any OpenAI-compatible API).
 * Opciones de configuración para el provider de OpenAI (y cualquier API compatible).
 */
export interface OpenAIProviderOptions {
  /**
   * API key for authentication.
   * Clave de API para autenticación.
   */
  api_key: string;

  /**
   * Base URL for the API endpoint.
   * Default: "https://api.openai.com/v1"
   *
   * URL base del endpoint de la API.
   * Por defecto: "https://api.openai.com/v1"
   */
  base_url?: string;

  /**
   * Model identifier to use for completions.
   * Identificador del modelo a usar para completions.
   */
  model: string;

  /**
   * Sampling temperature. Range: 0.0–2.0. Higher = more random.
   * Temperatura de muestreo. Rango: 0.0–2.0. Mayor = más aleatorio.
   */
  temperature?: number;

  /**
   * Maximum tokens to generate in the response.
   * Máximo de tokens a generar en la respuesta.
   */
  max_tokens?: number;

  /**
   * Additional HTTP headers merged into every request.
   * Headers HTTP adicionales incluidos en cada petición.
   */
  headers?: Record<string, string>;

  /**
   * Extra fields merged into the request body as-is.
   * Useful for provider-specific parameters not covered by this interface
   * (e.g. Ollama's `think`, `num_ctx`; OpenAI's `reasoning_effort`; etc.).
   *
   * Campos adicionales fusionados en el body de la petición sin modificación.
   * Útil para parámetros específicos del proveedor no cubiertos por esta interfaz
   * (ej. `think` y `num_ctx` de Ollama, `reasoning_effort` de OpenAI, etc.).
   */
  extra_body?: Record<string, unknown>;
}

/**
 * Dual-mode OpenAI-compatible provider.
 *
 * Acts as the base class for all OpenAI-compatible providers. Subclasses
 * only need to set a different `base_url` default and can add their own
 * provider-specific options via `extra_body`.
 *
 * Provider dual-mode compatible con OpenAI.
 *
 * Actúa como clase base para todos los proveedores compatibles con OpenAI.
 * Las subclases solo necesitan cambiar el `base_url` por defecto y pueden
 * agregar parámetros específicos vía `extra_body`.
 *
 * @example
 * ```typescript
 * // OpenAI
 * const openai = new OpenAI({ api_key: "sk-...", model: "gpt-4o" });
 *
 * // Ollama (OpenAI-compatible, think mode)
 * const ollama = new OpenAI({
 *   api_key: "ollama",
 *   base_url: "http://localhost:11434/v1",
 *   model: "qwen3:8b",
 *   extra_body: { think: false },
 * });
 *
 * // Non-streaming
 * const response = await openai(ctx);
 *
 * // Streaming
 * for await (const chunk of openai(ctx, { stream: true })) {
 *   if (chunk.type === "text_delta") process.stdout.write(chunk.content);
 *   if (chunk.type === "thinking_delta") console.log("[think]", chunk.content);
 * }
 * ```
 */
export default interface OpenAI extends Provider { }
export default class OpenAI extends Function {
  constructor(options: OpenAIProviderOptions) {
    super();
    options.base_url ||= "https://api.openai.com/v1";
    return ((ctx: Context, opts?: { stream?: boolean, signal?: AbortSignal }): any => {
      const response = fetch(`${options.base_url}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${options.api_key}`,
          ...options.headers,
        },
        signal: opts?.signal,
        body: JSON.stringify({
          model: options.model,
          ...options.extra_body,
          ...(opts?.stream && { stream: true }),
          ...(options.max_tokens && { max_tokens: options.max_tokens }),
          ...(options.temperature && { temperature: options.temperature }),
          ...(ctx.tools.length && { tools: ctx.tools.map((t) => t.toJSON()) }),
          messages: [
            ...(ctx.rules.length
              ? [{ role: "system" as const, content: ctx.rules.map((r) => r.description).join("\n\n") }]
              : []),
            ...ctx.messages.map((m) => {
              const { timestamp, ...msg } = m.toJSON();
              return {
                role: msg.role,
                content: Array.isArray(msg.content)
                  ? msg.content.flatMap((b): any[] =>
                    b.type === "text" ? [{ type: "text", text: b.text }]
                      : b.type === "image" ? [{ type: "image_url", image_url: { url: b.source.type === "base64" ? `data:${b.source.media_type};base64,${b.source.data}` : b.source.url } }]
                        : b.type === "audio" ? [{ type: "input_audio", input_audio: { data: b.source.data, format: b.source.media_type.split("/")[1] ?? "wav" } }]
                          : [])
                  : msg.content ?? null,
                ...(msg.tool_calls?.length && { tool_calls: msg.tool_calls }),
                ...(msg.tool_call_id && { tool_call_id: msg.tool_call_id }),
              };
            }),
          ],
        }),
      }).then((res) => {
        if (!res.ok) {
          throw new Error(`OpenAI API error: ${res.status} ${res.statusText}`);
        }
        return res;
      });
      if (!opts?.stream) {
        return response.then((res) => res.json() as Promise<ChatCompletionResponse>);
      }
      return (async function* (): AsyncGenerator<ProviderChunk, void, unknown> {
        for await (const chunk of parse_sse(await response)) {
          const delta = chunk.choices?.[0]?.delta;
          if (!delta) continue;
          const reasoning = delta.reasoning_content ?? delta.reasoning;
          if (reasoning) yield { type: "thinking_delta", content: reasoning };
          if (delta.content) yield { type: "text_delta", content: delta.content };
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
    });
  }
}
