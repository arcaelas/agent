/**
 * @fileoverview
 * Sistema de mensajes para conversaciones con agentes de IA.
 *
 * Este módulo proporciona la clase Message que representa mensajes individuales
 * dentro de una conversación. Los mensajes pueden ser de diferentes roles (user,
 * assistant, tool, system) y contienen el contenido de la conversación junto
 * con metadatos opcionales.
 *
 * @author Arcaelas Insiders
 * @version 2.0.0
 * @since 2.0.0
 *
 * @example
 * ```typescript
 * // Mensaje de usuario
 * const user_msg = new Message({
 *   role: 'user',
 *   content: '¿Cuál es el clima hoy?'
 * });
 *
 * // Mensaje de herramienta con ID
 * const tool_msg = new Message({
 *   role: 'tool',
 *   content: '{"temperature": 24, "condition": "sunny"}',
 *   tool_id: 'weather_12345'
 * });
 *
 * // Mensaje del asistente
 * const assistant_msg = new Message({
 *   role: 'assistant',
 *   content: 'Hoy está soleado con 24°C. ¡Perfecto para salir!'
 * });
 *
 * // Mensaje del sistema
 * const system_msg = new Message({
 *   role: 'system',
 *   content: 'Eres un asistente especializado en información meteorológica'
 * });
 * ```
 */

/**
 * @description
 * Roles válidos para los mensajes en una conversación.
 */
export type MessageRole = "user" | "assistant" | "tool" | "system";

/**
 * @description
 * Estructura de tool call para mensajes assistant.
 */
export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

/**
 * Text content block. The neutral textual unit shared by every provider.
 * Bloque de contenido de texto. La unidad textual neutral común a todos los providers.
 */
export interface TextBlock {
  type: "text";
  text: string;
}

/**
 * Image content block in the neutral, provider-agnostic format.
 * Each provider translates it to its own dialect:
 * - OpenAI → `{ type: "image_url", image_url: { url } }` (url or `data:...;base64,` string).
 * - Claude → `{ type: "image", source: { type: "base64" | "url", ... } }`.
 *
 * Bloque de contenido de imagen en formato neutral, agnóstico al provider.
 * Cada provider lo traduce a su propio dialecto:
 * - OpenAI → `{ type: "image_url", image_url: { url } }` (url o string `data:...;base64,`).
 * - Claude → `{ type: "image", source: { type: "base64" | "url", ... } }`.
 *
 * @example { type: "image", source: { type: "base64", media_type: "image/png", data: "iVBOR..." } }
 * @example { type: "image", source: { type: "url", url: "https://example.com/cat.jpg" } }
 */
export interface ImageBlock {
  type: "image";
  source:
  | { type: "base64"; media_type: string; data: string }
  | { type: "url"; url: string };
}

/**
 * Audio content block in the neutral, provider-agnostic format.
 * - OpenAI input  → `{ type: "input_audio", input_audio: { data, format } }`.
 * - OpenAI output → `{ type: "audio", audio: { data, ... } }` (gpt-4o-audio).
 * - Claude        → not supported (providers should drop it).
 *
 * Bloque de contenido de audio en formato neutral, agnóstico al provider.
 * - Entrada OpenAI → `{ type: "input_audio", input_audio: { data, format } }`.
 * - Salida OpenAI  → `{ type: "audio", audio: { data, ... } }` (gpt-4o-audio).
 * - Claude         → no soportado (los providers deben descartarlo).
 *
 * @example { type: "audio", source: { type: "base64", media_type: "audio/wav", data: "UklGR..." } }
 */
export interface AudioBlock {
  type: "audio";
  source: { type: "base64"; media_type: string; data: string };
}

/**
 * Document content block (PDF and similar) in the neutral format.
 * - Claude → `{ type: "document", source: { base64 | url | file } }` (native PDF).
 * - OpenAI → not supported in chat completions (providers should drop it).
 *
 * Bloque de contenido de documento (PDF y similares) en formato neutral.
 * - Claude → `{ type: "document", source: { base64 | url | file } }` (PDF nativo).
 * - OpenAI → no soportado en chat completions (los providers deben descartarlo).
 *
 * @example { type: "document", source: { type: "base64", media_type: "application/pdf", data: "JVBERi..." } }
 */
export interface DocumentBlock {
  type: "document";
  source:
  | { type: "base64"; media_type: string; data: string }
  | { type: "url"; url: string }
  | { type: "file"; file_id: string };
}

/**
 * A single content block: text, image, audio or document.
 * Building unit of multimodal content. Each provider translates the blocks it
 * understands and drops the ones it does not support.
 *
 * Un bloque de contenido: texto, imagen, audio o documento.
 * Unidad de construcción del contenido multimodal. Cada provider traduce los bloques
 * que entiende y descarta los que no soporta.
 */
export type ContentBlock = TextBlock | ImageBlock | AudioBlock | DocumentBlock;

/**
 * Message content: either plain text or an array of content blocks (multimodal).
 * Contenido del mensaje: texto plano o un array de bloques de contenido (multimodal).
 */
export type MessageContent = string | ContentBlock[];

/**
 * @description
 * Opciones para la construcción de mensajes con tipado condicional.
 * - `user` admite texto plano o bloques multimodales (texto + imágenes).
 * - `assistant` puede tener content o tool_calls.
 * - `tool` requiere tool_call_id y admite bloques (resultados con imágenes/media).
 * - `system` solo texto plano.
 */
export type MessageOptions =
  | {
    role: "user";
    content: MessageContent;
  }
  | {
    role: "assistant";
    content: string | null;
    tool_calls?: ToolCall[];
    /**
     * Internal reasoning text generated by the model before responding.
     * Providers that support extended thinking (Claude, reasoning models) reinject it;
     * providers that don't (plain OpenAI) drop it.
     *
     * Texto de razonamiento interno generado por el modelo antes de responder.
     * Los providers con thinking extendido (Claude, modelos de razonamiento) lo reinyectan;
     * los que no (OpenAI plano) lo descartan.
     */
    thinking?: string;
    /**
     * Cryptographic signature of the thinking block (Anthropic). Required for the API
     * to accept the reasoning block when reinjected in subsequent turns.
     *
     * Firma criptográfica del bloque de thinking (Anthropic). Requerida para que la API
     * acepte el bloque de razonamiento al reinyectarlo en turnos posteriores.
     */
    thinking_signature?: string;
  }
  | {
    role: "system";
    content: string;
  }
  | {
    role: "tool";
    content: MessageContent;
    tool_call_id: string;
  };

/**
 * @description
 * Clase Message que representa un mensaje individual en una conversación.
 *
 * Los mensajes pueden ser de diferentes tipos según su rol: mensajes de usuario,
 * respuestas del asistente, resultados de herramientas o mensajes del sistema.
 * Cada mensaje contiene contenido textual y metadatos opcionales como el ID de
 * herramienta para mensajes de tipo 'tool'.
 *
 * @example
 * ```typescript
 * // Crear diferentes tipos de mensajes
 * const user_question = new Message({
 *   role: 'user',
 *   content: 'Busca productos de tecnología bajo 500€'
 * });
 *
 * const tool_response = new Message({
 *   role: 'tool',
 *   content: JSON.stringify([
 *     { name: 'iPhone 13', price: 449 },
 *     { name: 'Samsung Galaxy', price: 399 }
 *   ]),
 *   tool_id: 'search_products_001'
 * });
 *
 * const assistant_reply = new Message({
 *   role: 'assistant',
 *   content: 'Encontré varios productos de tecnología en tu rango de precio...'
 * });
 *
 * // Usar los mensajes
 * console.log(user_question.role);     // 'user'
 * console.log(tool_response.tool_id);  // 'search_products_001'
 * console.log(assistant_reply.content); // 'Encontré varios productos...'
 *
 * // Serialización
 * const messageData = JSON.stringify(tool_response);
 * console.log(String(user_question)); // "Message(user): Busca productos..."
 * ```
 */
export default class Message<T extends MessageOptions = MessageOptions> {
  /**
   * Raw options the message was built from. The single source of truth — every
   * public accessor derives from here. Providers read `toJSON()` and translate
   * the content (string or blocks) to their own wire format.
   *
   * Opciones crudas con las que se construyó el mensaje. La única fuente de
   * verdad — todo accesor público deriva de aquí. Los providers leen `toJSON()`
   * y traducen el contenido (string o bloques) a su propio formato wire.
   */
  protected readonly _raw: T;

  /**
   * Timestamp de creación del mensaje.
   * Message creation timestamp.
   */
  readonly timestamp: Date;

  /**
   * @description
   * Crea una nueva instancia de Message.
   *
   * @param options Opciones de configuración del mensaje
   *
   * @example
   * ```typescript
   * const msg = new Message({ role: 'user', content: 'Hola, ¿cómo estás?' });
   * const tool_msg = new Message({ role: 'tool', content: 'OK', tool_call_id: 'calc_123' });
   * const sys = new Message({ role: 'system', content: 'Eres un asistente de ventas' });
   * const vision = new Message({
   *   role: 'user',
   *   content: [
   *     { type: 'text', text: '¿Qué ves?' },
   *     { type: 'image', source: { type: 'url', url: 'https://example.com/cat.jpg' } },
   *   ],
   * });
   * ```
   */
  constructor(options: T) {
    this._raw = options;
    this.timestamp = new Date();

    if (!options.role) {
      throw new Error("El rol del mensaje es requerido");
    }
    if (options.role === "tool" && !options.tool_call_id) {
      throw new Error("Los mensajes de herramienta requieren un tool_call_id");
    }
    if (options.role === "assistant" && options.content === null && !options.tool_calls) {
      throw new Error("Los mensajes assistant con content null requieren tool_calls");
    }
  }

  /**
   * Rol del mensaje que define quién lo envía.
   * Message role identifying the sender.
   */
  get role(): MessageRole {
    return this._raw.role;
  }

  /**
   * Contenido del mensaje: texto plano o bloques multimodales (texto, imagen, audio, documento).
   * Message content: plain text or multimodal blocks (text, image, audio, document).
   */
  get content(): MessageContent | null {
    return this._raw.content;
  }

  /**
   * Identificador de herramienta (solo en mensajes 'tool'), `undefined` en el resto.
   * Tool identifier (only on 'tool' messages), `undefined` otherwise.
   */
  get tool_call_id(): T["role"] extends "tool" ? string : undefined {
    return (this._raw.role === "tool" ? this._raw.tool_call_id : undefined) as T["role"] extends "tool" ? string : undefined;
  }

  /**
   * Tool calls solicitados por el assistant (solo en mensajes 'assistant').
   * Tool calls requested by the assistant (only on 'assistant' messages).
   */
  get tool_calls(): T["role"] extends "assistant" ? ToolCall[] | undefined : undefined {
    return (this._raw.role === "assistant" ? this._raw.tool_calls : undefined) as T["role"] extends "assistant" ? ToolCall[] | undefined : undefined;
  }

  /**
   * Texto de razonamiento del assistant, si el modelo lo expuso (`undefined` en el resto).
   * Assistant reasoning text when the model exposed it (`undefined` otherwise).
   */
  get thinking(): string | undefined {
    return this._raw.role === "assistant" ? this._raw.thinking : undefined;
  }

  /**
   * Firma criptográfica del bloque de thinking (`undefined` cuando no aplica).
   * Cryptographic signature of the thinking block (`undefined` when not applicable).
   */
  get thinking_signature(): string | undefined {
    return this._raw.role === "assistant" ? this._raw.thinking_signature : undefined;
  }

  /**
   * Longitud del contenido en caracteres (suma del texto en los bloques; 0 si no hay texto).
   * Content length in characters (sum of text across blocks; 0 when no text).
   */
  get length(): number {
    if (typeof this.content === "string") {
      return this.content.length;
    }
    if (Array.isArray(this.content)) {
      return this.content.reduce((sum, b) => sum + (b.type === "text" ? b.text.length : 0), 0);
    }
    return 0;
  }

  /**
   * @description
   * Serializa el mensaje a JSON (usado por JSON.stringify y por los providers).
   * Serializes the message to JSON (used by JSON.stringify and by providers).
   */
  toJSON(): {
    role: MessageRole;
    content: MessageContent | null;
    tool_call_id?: string;
    tool_calls?: ToolCall[];
    thinking?: string;
    thinking_signature?: string;
    timestamp: string;
  } {
    return {
      role: this.role,
      content: this.content,
      timestamp: this.timestamp.toISOString(),
      ...(this.tool_call_id && { tool_call_id: this.tool_call_id }),
      ...(this.tool_calls && { tool_calls: this.tool_calls }),
      ...(this.thinking && { thinking: this.thinking }),
      ...(this.thinking_signature && { thinking_signature: this.thinking_signature }),
    };
  }

  /**
   * @description
   * Representación legible del mensaje para debugging.
   * Human-readable representation for debugging.
   */
  toString(): string {
    const id_suffix = this.tool_call_id ? ` [${this.tool_call_id}]` : "";
    const tool_suffix = this.tool_calls ? ` [${this.tool_calls.length} tool calls]` : "";
    const text = typeof this.content === "string"
      ? this.content
      : Array.isArray(this.content)
        ? this.content.map((b) => b.type === "text" ? b.text : `[${b.type}]`).join(" ")
        : "";
    const content_display = text
      ? (text.length > 50 ? text.substring(0, 47) + "..." : text)
      : "(no content)";
    return `Message(${this.role})${id_suffix}${tool_suffix}: ${content_display}`;
  }
}
