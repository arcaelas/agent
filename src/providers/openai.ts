/**
 * @fileoverview
 * Provider de OpenAI para agentes de IA.
 *
 * Este módulo proporciona una función factory que crea providers compatibles
 * con la API de OpenAI, incluyendo modelos GPT-4, GPT-3.5 y otros modelos de OpenAI.
 *
 * @author Arcaelas Insiders
 * @version 1.0.0
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * import CreateOpenAIProvider from './providers/openai';
 * import Agent from './static/agent';
 *
 * // Provider básico con API key
 * const openai_provider = CreateOpenAIProvider({
 *   api_key: "sk-...",
 *   model: "gpt-4"
 * });
 *
 * // Provider con configuración completa
 * const custom_openai = CreateOpenAIProvider({
 *   api_key: process.env.OPENAI_API_KEY,
 *   base_url: "https://api.openai.com/v1",
 *   model: "gpt-4-turbo-preview",
 *   temperature: 0.7,
 *   max_tokens: 2000
 * });
 *
 * const agent = new Agent({
 *   name: "Assistant",
 *   description: "AI Assistant powered by OpenAI",
 *   providers: [openai_provider]
 * });
 * ```
 */

import { ChatCompletionResponse } from "~/static/agent";
import Context from "~/static/context";

/**
 * @description
 * Opciones de configuración para el provider de OpenAI.
 */
export interface OpenAIProviderOptions {
  /**
   * @description
   * API key de OpenAI para autenticación.
   */
  api_key: string;

  /**
   * @description
   * URL base de la API de OpenAI.
   * Por defecto: "https://api.openai.com/v1"
   */
  base_url?: string;

  /**
   * @description
   * Modelo de OpenAI a utilizar.
   * Ejemplos: "gpt-4", "gpt-4-turbo-preview", "gpt-3.5-turbo"
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
 * Provider de OpenAI compatible con el sistema de agentes.
 *
 * Esta clase retorna un Provider que procesa el Context del agente
 * y realiza llamadas a la API de OpenAI. Soporta streaming, tool calling y
 * todas las características estándar de OpenAI ChatCompletion API.
 *
 * @param options Opciones de configuración del provider
 * @returns Provider function compatible con Agent
 *
 * @example
 * ```typescript
 * // Provider básico
 * const basic_provider = new OpenAI({
 *   api_key: "sk-proj-...",
 *   model: "gpt-4"
 * });
 *
 * // Provider con configuración avanzada
 * const advanced_provider = new OpenAI({
 *   api_key: process.env.OPENAI_API_KEY!,
 *   base_url: "https://api.openai.com/v1",
 *   model: "gpt-4-turbo-preview",
 *   temperature: 0.8,
 *   max_tokens: 4000,
 *   headers: {
 *     "OpenAI-Organization": "org-..."
 *   }
 * });
 *
 * const agent = new Agent({
 *   name: "ChatBot",
 *   description: "Conversational AI assistant",
 *   providers: [basic_provider, advanced_provider]
 * });
 * ```
 */
export default class OpenAI extends Function {
  constructor(options: OpenAIProviderOptions) {
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
        `${options.base_url ?? "https://api.openai.com/v1"}/chat/completions`,
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
          `OpenAI API error: ${response.status} ${response.statusText}`
        );
      }

      return await response.json();
    }) as any;
  }
}
