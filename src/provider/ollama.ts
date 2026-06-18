/**
 * @fileoverview
 * Ollama provider for AI agents. Extends OpenAI with Ollama-specific parameters.
 * Ollama runs open-source models locally via an OpenAI-compatible API.
 *
 * Provider de Ollama para agentes de IA. Extiende OpenAI con parámetros específicos de Ollama.
 * Ollama ejecuta modelos open-source localmente vía API compatible con OpenAI.
 *
 * @author Arcaelas Insiders
 * @version 3.0.0
 * @since 3.0.0
 */

import OpenAI, { type OpenAIProviderOptions } from "~/provider/openai";

/**
 * Configuration options for the Ollama provider.
 * Opciones de configuración para el provider de Ollama.
 */
export interface OllamaProviderOptions extends Omit<OpenAIProviderOptions, "api_key" | "base_url" | "extra_body"> {
  /**
   * Base URL for the local Ollama instance.
   * Default: "http://localhost:11434/v1"
   *
   * URL base de la instancia local de Ollama.
   * Por defecto: "http://localhost:11434/v1"
   */
  base_url?: string;

  /**
   * Enable or disable the model's internal thinking/reasoning mode.
   * - `true`: model reasons before answering (slower, higher quality — ideal for auditors/planners).
   * - `false`: model answers directly (faster — ideal for classifiers/explorers).
   * - `undefined`: model decides based on the prompt (default Ollama behavior).
   *
   * Habilita o deshabilita el modo de razonamiento interno del modelo.
   * - `true`: el modelo razona antes de responder (más lento, mayor calidad — ideal para auditores/planificadores).
   * - `false`: el modelo responde directamente (más rápido — ideal para clasificadores/exploradores).
   * - `undefined`: el modelo decide según el prompt (comportamiento por defecto de Ollama).
   */
  think?: boolean;

  /**
   * Context window size in tokens. Overrides the model's default.
   * Higher values allow longer conversations but use more VRAM.
   *
   * Tamaño de la ventana de contexto en tokens. Sobreescribe el valor por defecto del modelo.
   * Valores más altos permiten conversaciones más largas pero consumen más VRAM.
   */
  num_ctx?: number;
}

/**
 * Ollama provider. Runs local open-source models via Ollama's OpenAI-compatible API.
 * Adds `think` and `num_ctx` as first-class options on top of the OpenAI base.
 *
 * Provider de Ollama. Ejecuta modelos locales open-source vía la API compatible con OpenAI de Ollama.
 * Agrega `think` y `num_ctx` como opciones de primera clase sobre la base OpenAI.
 *
 * @example
 * ```typescript
 * // Clasificador rápido (sin thinking)
 * const classifier = new Ollama({ model: "qwen3:8b", think: false });
 *
 * // Auditor con razonamiento profundo
 * const auditor = new Ollama({ model: "qwen3:8b", think: true });
 *
 * // Explorador de código con contexto extendido
 * const explorer = new Ollama({ model: "qwen2.5-coder:7b", num_ctx: 16384 });
 *
 * // Instancia remota
 * const remote = new Ollama({ model: "llama3.2:3b", base_url: "http://192.168.1.10:11434/v1" });
 * ```
 */
export default class Ollama extends OpenAI {
  constructor({ think, num_ctx, base_url, ...options }: OllamaProviderOptions) {
    super({
      api_key: "ollama",
      base_url: base_url ?? "http://localhost:11434/v1",
      extra_body: {
        ...(think !== undefined && { think }),
        ...(num_ctx !== undefined && { num_ctx }),
      },
      ...options,
    });
  }
}
