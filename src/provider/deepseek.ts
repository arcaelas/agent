/**
 * @fileoverview
 * DeepSeek provider for AI agents. Extends OpenAI with DeepSeek's base URL.
 * DeepSeek specializes in reasoning and code generation via an OpenAI-compatible API.
 *
 * Provider de DeepSeek para agentes de IA. Extiende OpenAI con la URL base de DeepSeek.
 * DeepSeek está especializado en razonamiento y generación de código vía API compatible con OpenAI.
 *
 * @author Arcaelas Insiders
 * @version 3.0.0
 * @since 1.0.0
 */

import OpenAI, { type OpenAIProviderOptions } from "./openai";

/**
 * Configuration options for the DeepSeek provider.
 * Opciones de configuración para el provider de DeepSeek.
 */
export type DeepSeekProviderOptions = Omit<OpenAIProviderOptions, "base_url"> & {
  /**
   * Base URL for the DeepSeek API.
   * Default: "https://api.deepseek.com/v1"
   *
   * URL base de la API de DeepSeek.
   * Por defecto: "https://api.deepseek.com/v1"
   */
  base_url?: string;
};

/**
 * DeepSeek provider. Identical behavior to OpenAI but defaults to DeepSeek's endpoint.
 * Thinking tokens (reasoning_content) are forwarded as `thinking_delta` chunks in stream mode.
 *
 * Provider de DeepSeek. Comportamiento idéntico a OpenAI pero apunta al endpoint de DeepSeek.
 * Los tokens de razonamiento (reasoning_content) se emiten como chunks `thinking_delta` en streaming.
 *
 * @example
 * ```typescript
 * const deepseek = new DeepSeek({ api_key: "sk-...", model: "deepseek-reasoner" });
 * for await (const chunk of new Agent({ providers: [deepseek] }).stream("Explica esto")) {
 *   if (chunk.role === "thinking") console.log("[think]", chunk.content);
 *   if (chunk.role === "assistant") process.stdout.write(chunk.content);
 * }
 * ```
 */
export default class DeepSeek extends OpenAI {
  constructor(options: DeepSeekProviderOptions) {
    super({ base_url: "https://api.deepseek.com/v1", ...options });
  }
}


