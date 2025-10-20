/**
 * @fileoverview
 * Provider de Groq para agentes de IA.
 *
 * Este módulo proporciona una función factory que crea providers compatibles
 * con la API de Groq, que ofrece modelos de inferencia ultra-rápidos incluyendo
 * Llama, Mixtral y Gemma con compatibilidad total con OpenAI API.
 *
 * @author Arcaelas Insiders
 * @version 1.0.0
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * import CreateGroqProvider from './providers/groq';
 * import Agent from './static/agent';
 *
 * // Provider básico con API key
 * const groq_provider = CreateGroqProvider({
 *   api_key: "gsk_...",
 *   model: "llama-3.1-70b-versatile"
 * });
 *
 * // Provider con configuración completa
 * const custom_groq = CreateGroqProvider({
 *   api_key: process.env.GROQ_API_KEY,
 *   model: "mixtral-8x7b-32768",
 *   temperature: 0.5,
 *   max_tokens: 8000
 * });
 *
 * const agent = new Agent({
 *   name: "FastAssistant",
 *   description: "Ultra-fast AI Assistant powered by Groq",
 *   providers: [groq_provider]
 * });
 * ```
 */

import { ChatCompletionResponse } from "~/static/agent";
import Context from "~/static/context";

/**
 * @description
 * Opciones de configuración para el provider de Groq.
 */
export interface GroqProviderOptions {
  /**
   * @description
   * API key de Groq para autenticación.
   */
  api_key: string;

  /**
   * @description
   * URL base de la API de Groq.
   * Por defecto: "https://api.groq.com/openai/v1"
   */
  base_url?: string;

  /**
   * @description
   * Modelo de Groq a utilizar.
   * Ejemplos: "llama-3.1-70b-versatile", "mixtral-8x7b-32768", "gemma-7b-it"
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
 * Provider de Groq compatible con el sistema de agentes.
 *
 * Esta clase retorna un Provider que procesa el Context del agente
 * y realiza llamadas a la API de Groq. Groq es compatible con OpenAI API y
 * ofrece inferencia ultra-rápida con modelos open-source como Llama 3.1,
 * Mixtral y Gemma.
 *
 * @param options Opciones de configuración del provider
 * @returns Provider function compatible con Agent
 *
 * @example
 * ```typescript
 * // Provider con Llama 3.1
 * const llama_provider = new Groq({
 *   api_key: "gsk_...",
 *   model: "llama-3.1-70b-versatile"
 * });
 *
 * // Provider con Mixtral para contextos largos
 * const mixtral_provider = new Groq({
 *   api_key: process.env.GROQ_API_KEY!,
 *   model: "mixtral-8x7b-32768",
 *   temperature: 0.7,
 *   max_tokens: 16000
 * });
 *
 * const agent = new Agent({
 *   name: "SpeedBot",
 *   description: "High-performance conversational AI",
 *   providers: [llama_provider, mixtral_provider]
 * });
 * ```
 */
export default class Groq extends Function {
  constructor(options: GroqProviderOptions) {
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
        `${
          options.base_url ?? "https://api.groq.com/openai/v1"
        }/chat/completions`,
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
          `Groq API error: ${response.status} ${response.statusText}`
        );
      }

      return await response.json();
    }) as any;
  }
}
