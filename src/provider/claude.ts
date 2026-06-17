/**
 * @fileoverview
 * Dual-mode Claude (Anthropic) provider for AI agents.
 * Supports non-streaming (ChatCompletionResponse) and streaming (ProviderChunk) modes.
 * Transforms messages and tools from OpenAI format to Anthropic format automatically.
 *
 * Provider dual-mode de Claude (Anthropic) para agentes de IA.
 * Soporta modo sin streaming (ChatCompletionResponse) y streaming (ProviderChunk).
 * Transforma mensajes y tools del formato OpenAI al formato Anthropic automáticamente.
 *
 * @author Arcaelas Insiders
 * @version 3.0.0
 * @since 1.0.0
 */

import type { ChatCompletionResponse, Provider, ProviderChunk } from "~/lib/agent";
import type Context from "~/lib/context";
import type { ContentBlock, MessageContent } from "~/lib/message";
import { parse_anthropic_sse } from "~/lib/sse";

/**
 * Configuration options for the Claude provider.
 * Opciones de configuración para el provider de Claude.
 */
export interface ClaudeProviderOptions {
  /**
   * Full URL of the messages endpoint. Default points to Anthropic's official API,
   * but can target any Anthropic-compatible endpoint (proxy, gateway, `?beta=true`, etc.).
   *
   * URL completa del endpoint de mensajes. Por defecto apunta a la API oficial de Anthropic,
   * pero puede apuntar a cualquier endpoint compatible (proxy, gateway, `?beta=true`, etc.).
   *
   * Default: "https://api.anthropic.com/v1/messages"
   */
  base_url?: string;

  /**
   * Bearer token for authentication. When present, sent as `Authorization: Bearer <api_key>`.
   * Optional: omit it when authentication is fully handled via `headers`
   * (e.g. OAuth flows that set their own Authorization header).
   *
   * Token Bearer para autenticación. Cuando está presente, se envía como `Authorization: Bearer <api_key>`.
   * Opcional: omítelo cuando la autenticación se maneja por completo vía `headers`
   * (ej. flujos OAuth que setean su propio header Authorization).
   */
  api_key?: string;

  /**
   * Claude model to use.
   * Modelo de Claude a usar.
   */
  model: string;

  /**
   * Sampling temperature. Range: 0.0–1.0.
   * Temperatura de muestreo. Rango: 0.0–1.0.
   */
  temperature?: number;

  /**
   * Maximum tokens to generate. Required by Anthropic API — defaults to 1024.
   * Máximo de tokens a generar. Requerido por la API de Anthropic — por defecto 1024.
   */
  max_tokens?: number;

  /**
   * Additional HTTP headers merged into (and overriding) the defaults.
   * Use this for OAuth betas (`anthropic-beta`), custom Authorization, gateway keys, etc.
   *
   * Headers HTTP adicionales fusionados sobre (y sobreescribiendo) los defaults.
   * Útil para betas de OAuth (`anthropic-beta`), Authorization custom, claves de gateway, etc.
   */
  headers?: Record<string, string>;

  /**
   * Extra fields merged into the request body as-is.
   * For provider-specific parameters not covered here (extended thinking, system arrays,
   * `metadata`, `top_p`, server tools, etc.).
   *
   * Campos adicionales fusionados en el body de la petición sin modificación.
   * Para parámetros específicos no cubiertos aquí (thinking extendido, system como array,
   * `metadata`, `top_p`, server tools, etc.).
   *
   * @example { thinking: { type: "enabled", budget_tokens: 8000 } }
   */
  body?: Record<string, unknown>;
}

/**
 * Maps Anthropic stop reasons to OpenAI finish reasons.
 * Convierte los stop reasons de Anthropic a finish reasons de OpenAI.
 */
const to_finish_reason = (stop_reason: string): string =>
  stop_reason === "end_turn" ? "stop"
    : stop_reason === "tool_use" ? "tool_calls"
      : stop_reason === "max_tokens" ? "length"
        : stop_reason;

/**
 * Translates our neutral message content (string or content blocks) into Anthropic's
 * content blocks. Text passes through; image and document map to their Anthropic shape;
 * audio is dropped (Anthropic does not support audio input).
 *
 * Traduce nuestro contenido neutral (string o bloques) a los bloques de Anthropic.
 * El texto pasa directo; imagen y documento se mapean a su forma Anthropic;
 * el audio se descarta (Anthropic no soporta entrada de audio).
 */
const to_anthropic_content = (content: MessageContent | null): string | Array<Record<string, unknown>> => {
  if (typeof content === "string" || content === null) {
    return content ?? "";
  }
  return content.flatMap((b: ContentBlock): Array<Record<string, unknown>> =>
    b.type === "text" ? [{ type: "text", text: b.text }]
      : b.type === "image" ? [{ type: "image", source: b.source.type === "base64" ? { type: "base64", media_type: b.source.media_type, data: b.source.data } : { type: "url", url: b.source.url } }]
        : b.type === "document" ? [{ type: "document", source: b.source.type === "base64" ? { type: "base64", media_type: b.source.media_type, data: b.source.data } : b.source.type === "url" ? { type: "url", url: b.source.url } : { type: "file", file_id: b.source.file_id } }]
          : []);
};

/**
 * Dual-mode Claude provider.
 * Normalizes Claude's native message/tool format to the OpenAI-compatible
 * ChatCompletionResponse and ProviderChunk interfaces used by the Agent.
 *
 * Provider dual-mode de Claude.
 * Normaliza el formato nativo de mensajes y tools de Claude a las interfaces
 * ChatCompletionResponse y ProviderChunk compatibles con OpenAI que usa el Agent.
 *
 * @example
 * ```typescript
 * // API key clásica
 * const claude = new Claude({ api_key: "sk-ant-...", model: "claude-sonnet-4-5" });
 *
 * // Streaming
 * for await (const chunk of claude(ctx, { stream: true })) {
 *   if (chunk.type === "thinking_delta") console.log("[think]", chunk.content);
 *   if (chunk.type === "text_delta") process.stdout.write(chunk.content);
 * }
 *
 * // Extended thinking (vía body)
 * const thinker = new Claude({
 *   api_key: "sk-ant-...",
 *   model: "claude-sonnet-4-5",
 *   body: { thinking: { type: "enabled", budget_tokens: 8000 } },
 * });
 *
 * // Claude Code OAuth — endpoint con ?beta=true + headers de betas
 * const oauth = new Claude({
 *   base_url: "https://api.anthropic.com/v1/messages?beta=true",
 *   api_key: oauth_access_token,
 *   headers: { "anthropic-beta": "oauth-2025-04-20,claude-code-20250219" },
 *   model: "claude-sonnet-4-5",
 * });
 *
 * // Endpoint compatible de un tercero (gateway/proxy)
 * const proxy = new Claude({
 *   base_url: "https://gateway.midominio.com/anthropic/messages",
 *   headers: { "x-gateway-key": "..." },
 *   model: "claude-sonnet-4-5",
 * });
 * ```
 */
export default interface Claude extends Provider { }
export default class Claude extends Function {
  constructor(options: ClaudeProviderOptions) {
    super();
    options.base_url ||= "https://api.anthropic.com/v1/messages";
    return ((ctx: Context, opts?: { stream?: boolean; signal?: AbortSignal }): any => {
      const system = [
        ...ctx.rules.map((r) => r.description),
        ...ctx.messages.filter((m) => m.role === "system").map((m) => m.content ?? ""),
      ].filter(Boolean).join("\n\n") || undefined;
      const response = fetch(options.base_url!, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01",
          ...(options.api_key && { Authorization: `Bearer ${options.api_key}` }),
          ...options.headers,
        },
        signal: opts?.signal,
        body: JSON.stringify({
          model: options.model,
          max_tokens: options.max_tokens ?? 1024,
          ...(options.temperature !== undefined && { temperature: options.temperature }),
          ...(system && { system }),
          ...(ctx.tools.length && {
            tools: ctx.tools.map((t) => {
              const { function: fn } = t.toJSON();
              return {
                name: fn.name,
                description: fn.description,
                input_schema: {
                  type: "object" as const,
                  properties: fn.parameters.properties,
                  required: fn.parameters.required ?? Object.keys(fn.parameters.properties ?? {}),
                },
              };
            }),
          }),
          ...options.body,
          ...(opts?.stream && { stream: true }),
          messages: ctx.messages
            .filter((m) => m.role !== "system")
            .map((m) => {
              const { timestamp, ...msg } = m.toJSON();
              if (msg.role === "tool") {
                return {
                  role: "user" as const,
                  content: [{ type: "tool_result" as const, tool_use_id: msg.tool_call_id, content: to_anthropic_content(msg.content) }],
                };
              }
              if (msg.role === "assistant" && (msg.tool_calls?.length || (msg.thinking && msg.thinking_signature))) {
                return {
                  role: "assistant" as const,
                  content: [
                    ...(msg.thinking && msg.thinking_signature ? [{ type: "thinking" as const, thinking: msg.thinking, signature: msg.thinking_signature }] : []),
                    ...(typeof msg.content === "string" && msg.content ? [{ type: "text" as const, text: msg.content }] : []),
                    ...(msg.tool_calls ?? []).map((tc) => ({
                      type: "tool_use" as const,
                      id: tc.id,
                      name: tc.function.name,
                      input: JSON.parse(tc.function.arguments),
                    })),
                  ],
                };
              }
              return { role: msg.role as "user" | "assistant", content: to_anthropic_content(msg.content) };
            }),
        }),
      }).then((res) => {
        if (!res.ok) {
          throw new Error(`Claude API error: ${res.status} ${res.statusText}`);
        }
        return res;
      });

      if (!opts?.stream) {
        return response.then(async (res) => {
          const data = await res.json();
          const blocks = data.content ?? [];
          const thinking_block = blocks.find((b: any) => b.type === "thinking");
          const tool_calls = blocks
            .filter((b: any) => b.type === "tool_use")
            .map((b: any) => ({ id: b.id, type: "function" as const, function: { name: b.name, arguments: JSON.stringify(b.input) } }));
          return {
            id: data.id,
            object: "chat.completion",
            created: Math.floor(Date.now() / 1000),
            model: data.model,
            choices: [{
              index: 0,
              message: {
                role: "assistant",
                content: blocks.filter((b: any) => b.type === "text").map((b: any) => b.text).join("\n") || null,
                tool_calls: tool_calls.length ? tool_calls : undefined,
                reasoning_content: thinking_block?.thinking,
                reasoning_signature: thinking_block?.signature,
              },
              finish_reason: to_finish_reason(data.stop_reason ?? ""),
            }],
            usage: {
              prompt_tokens: data.usage?.input_tokens ?? 0,
              completion_tokens: data.usage?.output_tokens ?? 0,
              total_tokens: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
            },
          } as ChatCompletionResponse;
        });
      }

      return (async function* (): AsyncGenerator<ProviderChunk, void, unknown> {
        let tool_index = -1;
        for await (const { event, data } of parse_anthropic_sse(await response)) {
          if (event === "content_block_start" && data.content_block?.type === "tool_use") {
            tool_index++;
            yield { type: "tool_call_delta", index: tool_index, id: data.content_block.id, name: data.content_block.name };
          }
          if (event === "content_block_delta") {
            if (data.delta?.type === "thinking_delta" && data.delta.thinking) yield { type: "thinking_delta", content: data.delta.thinking };
            if (data.delta?.type === "signature_delta" && data.delta.signature) yield { type: "signature_delta", content: data.delta.signature };
            if (data.delta?.type === "text_delta" && data.delta.text) yield { type: "text_delta", content: data.delta.text };
            if (data.delta?.type === "input_json_delta" && data.delta.partial_json) yield { type: "tool_call_delta", index: tool_index, arguments_delta: data.delta.partial_json };
          }
          if (event === "message_delta" && data.delta?.stop_reason) {
            yield { type: "finish", finish_reason: to_finish_reason(data.delta.stop_reason) };
          }
        }
      })();
    }) as any;
  }
}
