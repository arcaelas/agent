/**
 * @fileoverview
 * Groq provider for AI agents. Extends OpenAI with Groq's base URL.
 * Groq offers ultra-fast inference with open-source models via an OpenAI-compatible API.
 *
 * Provider de Groq para agentes de IA. Extiende OpenAI con la URL base de Groq.
 * Groq ofrece inferencia ultra-rápida con modelos open-source vía API compatible con OpenAI.
 *
 * @author Arcaelas Insiders
 * @version 3.0.0
 * @since 1.0.0
 */

import OpenAI, { type OpenAIProviderOptions } from "./openai";

/**
 * Configuration options for the Groq provider.
 * Opciones de configuración para el provider de Groq.
 */
export type GroqProviderOptions = Omit<OpenAIProviderOptions, "base_url"> & {
  /**
   * Base URL for the Groq API.
   * Default: "https://api.groq.com/openai/v1"
   *
   * URL base de la API de Groq.
   * Por defecto: "https://api.groq.com/openai/v1"
   */
  base_url?: string;
};

/**
 * Groq provider. Identical behavior to OpenAI but defaults to Groq's endpoint.
 *
 * Provider de Groq. Comportamiento idéntico a OpenAI pero apunta al endpoint de Groq por defecto.
 *
 * @example
 * ```typescript
 * const groq = new Groq({ api_key: "gsk_...", model: "llama-3.1-70b-versatile" });
 * const [msgs, ok] = await new Agent({ providers: [groq] }).call("Hola");
 * ```
 */
export default class Groq extends OpenAI {
  constructor(options: GroqProviderOptions) {
    super({ base_url: "https://api.groq.com/openai/v1", ...options });
  }
}


