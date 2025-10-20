/**
 * @fileoverview
 * Provider de DeepSeek para agentes de IA.
 *
 * Este módulo proporciona una función factory que crea providers compatibles
 * con la API de DeepSeek, que ofrece modelos de IA avanzados especializados
 * en razonamiento y código con compatibilidad total con OpenAI API.
 *
 * @author Arcaelas Insiders
 * @version 1.0.0
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * import CreateDeepSeekProvider from './providers/deepseek';
 * import Agent from './static/agent';
 *
 * // Provider básico con API key
 * const deepseek_provider = CreateDeepSeekProvider({
 *   api_key: "sk-...",
 *   model: "deepseek-chat"
 * });
 *
 * // Provider con configuración completa
 * const custom_deepseek = CreateDeepSeekProvider({
 *   api_key: process.env.DEEPSEEK_API_KEY,
 *   model: "deepseek-coder",
 *   temperature: 0.3,
 *   max_tokens: 4000
 * });
 *
 * const agent = new Agent({
 *   name: "CodeAssistant",
 *   description: "AI Assistant specialized in coding powered by DeepSeek",
 *   providers: [deepseek_provider]
 * });
 * ```
 */

import { ChatCompletionResponse } from "~/static/agent";
import Context from "~/static/context";

/**
 * @description
 * Opciones de configuración para el provider de DeepSeek.
 */
export interface DeepSeekProviderOptions {
  /**
   * @description
   * API key de DeepSeek para autenticación.
   */
  api_key: string;

  /**
   * @description
   * URL base de la API de DeepSeek.
   * Por defecto: "https://api.deepseek.com/v1"
   */
  base_url?: string;

  /**
   * @description
   * Modelo de DeepSeek a utilizar.
   * Ejemplos: "deepseek-chat", "deepseek-coder"
   */
  model: string;

  /**
   * @description
   * Temperatura para controlar la aleatoriedad de las respuestas.
   * Rango: 0.0 a 2.0
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
 * Provider de DeepSeek compatible con el sistema de agentes.
 *
 * Esta clase retorna un Provider que procesa el Context del agente
 * y realiza llamadas a la API de DeepSeek. DeepSeek es compatible con OpenAI API
 * y ofrece modelos especializados en razonamiento avanzado y generación de código.
 *
 * @param options Opciones de configuración del provider
 * @returns Provider function compatible con Agent
 *
 * @example
 * ```typescript
 * // Provider para chat general
 * const chat_provider = new DeepSeek({
 *   api_key: "sk-...",
 *   model: "deepseek-chat"
 * });
 *
 * // Provider para generación de código
 * const coder_provider = new DeepSeek({
 *   api_key: process.env.DEEPSEEK_API_KEY!,
 *   model: "deepseek-coder",
 *   temperature: 0.2,
 *   max_tokens: 8000
 * });
 *
 * const agent = new Agent({
 *   name: "ReasoningBot",
 *   description: "Advanced reasoning AI assistant",
 *   providers: [chat_provider, coder_provider]
 * });
 * ```
 */
export default class DeepSeek extends Function {
  constructor(options: DeepSeekProviderOptions) {
    super();
    return (async (ctx: Context): Promise<ChatCompletionResponse> => {
      // Transformar rules a system messages
      const rules_messages = ctx.rules.length
        ? [{ role: "system" as const, content: ctx.rules.map((r) => r.description).join("\n\n") }]
        : [];

      // Transformar messages del contexto (filtrar timestamp)
      const context_messages = ctx.messages.map((m) => {
        const json = m.toJSON();
        const { timestamp, ...message } = json;
        return message;
      });

      const messages = [...rules_messages, ...context_messages];

      // Transformar tools
      const tools = ctx.tools.length
        ? ctx.tools.map((t) => t.toJSON())
        : undefined;

      const response = await fetch(
        `${options.base_url ?? "https://api.deepseek.com/v1"}/chat/completions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${options.api_key}`,
            ...(options.headers ?? {}),
          },
          body: JSON.stringify({
            model: options.model,
            messages,
            tools,
            temperature: options.temperature ?? 1.0,
            max_tokens: options.max_tokens,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `DeepSeek API error: ${response.status} ${response.statusText}`
        );
      }

      return await response.json();
    }) as any;
  }
}
