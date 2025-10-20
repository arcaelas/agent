/**
 * @fileoverview
 * Provider de Claude (Anthropic) para agentes de IA.
 *
 * Este módulo proporciona una función factory que crea providers compatibles
 * con la API de Anthropic Claude, transformando mensajes y herramientas al
 * formato específico de Claude y convirtiendo la respuesta al formato estándar
 * ChatCompletion compatible con OpenAI.
 *
 * @author Arcaelas Insiders
 * @version 1.0.0
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * import CreateClaudeProvider from './providers/claude';
 * import Agent from './static/agent';
 *
 * // Provider básico con API key
 * const claude_provider = CreateClaudeProvider({
 *   api_key: "sk-ant-...",
 *   model: "claude-3-5-sonnet-20241022"
 * });
 *
 * // Provider con configuración completa
 * const custom_claude = CreateClaudeProvider({
 *   api_key: process.env.ANTHROPIC_API_KEY,
 *   model: "claude-3-opus-20240229",
 *   temperature: 0.7,
 *   max_tokens: 4096
 * });
 *
 * const agent = new Agent({
 *   name: "ClaudeAssistant",
 *   description: "AI Assistant powered by Anthropic Claude",
 *   providers: [claude_provider]
 * });
 * ```
 */

import { ChatCompletionResponse } from "~/static/agent";
import type Context from "~/static/context";

/**
 * @description
 * Opciones de configuración para el provider de Claude.
 */
export interface ClaudeProviderOptions {
  /**
   * @description
   * API key de Anthropic para autenticación.
   */
  api_key: string;

  /**
   * @description
   * URL base de la API de Anthropic.
   * Por defecto: "https://api.anthropic.com/v1"
   */
  base_url?: string;

  /**
   * @description
   * Modelo de Claude a utilizar.
   * Ejemplos: "claude-3-5-sonnet-20241022", "claude-3-opus-20240229", "claude-3-haiku-20240307"
   */
  model: string;

  /**
   * @description
   * Temperatura para controlar la aleatoriedad de las respuestas.
   * Rango: 0.0 a 1.0
   */
  temperature?: number;

  /**
   * @description
   * Máximo número de tokens a generar en la respuesta.
   */
  max_tokens?: number;

  /**
   * @description
   * Headers HTTP adicionales para incluir en las peticiones.
   */
  headers?: Record<string, string>;
}

/**
 * @description
 * Provider de Claude compatible con el sistema de agentes.
 *
 * Esta clase retorna un Provider que procesa el Context del agente
 * y realiza llamadas a la API de Anthropic. Transforma automáticamente los mensajes
 * del formato OpenAI al formato de Claude, maneja system prompts y convierte
 * la respuesta de Claude al formato ChatCompletion estándar.
 *
 * @param options Opciones de configuración del provider
 * @returns Provider function compatible con Agent
 *
 * @example
 * ```typescript
 * // Provider con Claude Sonnet
 * const sonnet_provider = new Claude({
 *   api_key: "sk-ant-...",
 *   model: "claude-3-5-sonnet-20241022"
 * });
 *
 * // Provider con Claude Opus para tareas complejas
 * const opus_provider = new Claude({
 *   api_key: process.env.ANTHROPIC_API_KEY!,
 *   model: "claude-3-opus-20240229",
 *   temperature: 0.5,
 *   max_tokens: 4096
 * });
 *
 * const agent = new Agent({
 *   name: "AdvancedBot",
 *   description: "Advanced AI with reasoning capabilities",
 *   providers: [sonnet_provider, opus_provider]
 * });
 * ```
 */
export default class Claude extends Function {
  constructor(options: ClaudeProviderOptions) {
    super();
    return (async (ctx: Context): Promise<ChatCompletionResponse> => {
      // Combinar rules y system messages
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

      // Transformar messages a formato Claude
      const conversation_messages = context_messages
        .filter((m) => m.role !== "system")
        .map((m) => {
          // Transformar tool messages al formato de Claude
          if (m.role === "tool") {
            return {
              role: "user" as const,
              content: [
                {
                  type: "tool_result" as const,
                  tool_use_id: m.tool_call_id,
                  content: m.content,
                },
              ],
            };
          }

          // Transformar assistant messages con tool_calls a formato Claude
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

            return {
              role: "assistant" as const,
              content: content_blocks,
            };
          }

          return m;
        });

      // Transformar tools al formato de Claude
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

      const response = await fetch(
        `${options.base_url ?? "https://api.anthropic.com/v1"}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": options.api_key,
            "anthropic-version": "2023-06-01",
            ...(options.headers ?? {}),
          },
          body: JSON.stringify({
            model: options.model,
            ...(system_prompt && { system: system_prompt }),
            messages: conversation_messages,
            ...(tools && { tools }),
            temperature: options.temperature ?? 1.0,
            max_tokens: options.max_tokens ?? 1024,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Claude API error: ${response.status} ${response.statusText}`
        );
      }

      const claude_response = await response.json();

      // Transformar respuesta de Claude al formato ChatCompletion
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
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: text_content || null,
              tool_calls: tool_calls.length > 0 ? tool_calls : undefined,
            },
            finish_reason:
              claude_response.stop_reason === "end_turn"
                ? "stop"
                : claude_response.stop_reason === "tool_use"
                ? "tool_calls"
                : claude_response.stop_reason === "max_tokens"
                ? "length"
                : null,
          },
        ],
        usage: {
          prompt_tokens: claude_response.usage?.input_tokens ?? 0,
          completion_tokens: claude_response.usage?.output_tokens ?? 0,
          total_tokens:
            (claude_response.usage?.input_tokens ?? 0) +
            (claude_response.usage?.output_tokens ?? 0),
        },
      };
    }) as any;
  }
}
