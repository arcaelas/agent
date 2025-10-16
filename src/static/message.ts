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
 * @description
 * Opciones para la construcción de mensajes con tipado condicional.
 * - Si el rol es "tool", tool_call_id es requerido
 * - Si el rol es "assistant", puede tener content o tool_calls (mutuamente excluyentes)
 */
export type MessageOptions =
  | {
      role: "user";
      content: string;
    }
  | {
      role: "assistant";
      content: string | null;
      tool_calls?: ToolCall[];
    }
  | {
      role: "system";
      content: string;
    }
  | {
      role: "tool";
      content: string;
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
   * @description
   * Rol del mensaje que define quién lo envía.
   */
  readonly role: MessageRole;

  /**
   * @description
   * Contenido textual del mensaje.
   */
  readonly content: string | null;

  /**
   * @description
   * Identificador único de herramienta (solo para mensajes de tipo 'tool').
   */
  readonly tool_call_id: T["role"] extends "tool" ? string : undefined;

  /**
   * @description
   * Tool calls solicitados por el assistant (solo para mensajes de tipo 'assistant').
   */
  readonly tool_calls: T["role"] extends "assistant" ? ToolCall[] | undefined : undefined;

  /**
   * @description
   * Timestamp de creación del mensaje.
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
   * // Mensaje básico de usuario
   * const msg = new Message({
   *   role: 'user',
   *   content: 'Hola, ¿cómo estás?'
   * });
   *
   * // Mensaje de herramienta con ID
   * const tool_msg = new Message({
   *   role: 'tool',
   *   content: 'Operación completada exitosamente',
   *   tool_id: 'calc_operation_123'
   * });
   *
   * // Mensaje del sistema
   * const sysMsg = new Message({
   *   role: 'system',
   *   content: 'Eres un asistente especializado en ventas'
   * });
   * ```
   */
  constructor(options: T) {
    this.role = options.role;
    this.content = options.content;
    this.tool_call_id = (
      options.role === "tool" ? options.tool_call_id : undefined
    ) as T["role"] extends "tool" ? string : undefined;
    this.tool_calls = (
      options.role === "assistant" ? options.tool_calls : undefined
    ) as T["role"] extends "assistant" ? ToolCall[] | undefined : undefined;
    this.timestamp = new Date();

    // Validación básica
    if (!this.role) {
      throw new Error("El rol del mensaje es requerido");
    }
    if (this.role === "tool" && !this.tool_call_id) {
      throw new Error("Los mensajes de herramienta requieren un tool_call_id");
    }
    if (this.role === "assistant" && this.content === null && !this.tool_calls) {
      throw new Error("Los mensajes assistant con content null requieren tool_calls");
    }
  }

  /**
   * @description
   * Obtiene la longitud del contenido del mensaje.
   *
   * @returns Número de caracteres en el contenido (0 si content es null)
   *
   * @example
   * ```typescript
   * const msg = new Message({ role: 'user', content: 'Hola mundo' });
   * console.log(msg.length); // 10
   * ```
   */
  get length(): number {
    return this.content?.length ?? 0;
  }

  /**
   * @description
   * Convierte el mensaje a formato JSON para serialización.
   * Implementa el método nativo toJSON() de Node.js para compatibilidad
   * con JSON.stringify() y otras operaciones de serialización.
   *
   * @returns Representación JSON del mensaje
   *
   * @example
   * ```typescript
   * const msg = new Message({ role: 'tool', content: 'Resultado', tool_call_id: 'tool_call_123' });
   *
   * const msg_data = msg.toJSON();
   * console.log(JSON.stringify(msg)); // Usa automáticamente toJSON()
   * // Resultado: { "role": "tool", "content": "Resultado", "tool_call_id": "tool_call_123", "timestamp": "..." }
   * ```
   */
  toJSON(): {
    role: MessageRole;
    content: string | null;
    tool_call_id?: string;
    tool_calls?: ToolCall[];
    timestamp: string;
  } {
    return {
      role: this.role,
      content: this.content,
      timestamp: this.timestamp.toISOString(),
      ...(this.tool_call_id && { tool_call_id: this.tool_call_id }),
      ...(this.tool_calls && { tool_calls: this.tool_calls }),
    };
  }

  /**
   * @description
   * Retorna representación string del mensaje para debugging.
   *
   * @returns Descripción legible del mensaje
   *
   * @example
   * ```typescript
   * const msg = new Message({
   *   role: 'user',
   *   content: 'Este es un mensaje de prueba muy largo...'
   * });
   *
   * console.log(msg.toString()); // "Message(user): Este es un mensaje de..."
   * console.log(String(msg));    // Usa automáticamente toString()
   * ```
   */
  toString(): string {
    const id_suffix = this.tool_call_id ? ` [${this.tool_call_id}]` : "";
    const tool_suffix = this.tool_calls ? ` [${this.tool_calls.length} tool calls]` : "";
    const content_display = this.content
      ? (this.content.length > 50 ? this.content.substring(0, 47) + "..." : this.content)
      : "(no content)";
    return `Message(${this.role})${id_suffix}${tool_suffix}: ${content_display}`;
  }
}
