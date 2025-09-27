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
 * Opciones para la construcción de mensajes con tipado condicional.
 * Si el rol es "tool", tool_id es requerido. Para otros roles, tool_id es opcional.
 */
export type MessageOptions =
  | {
      role: "user";
      content: string;
    }
  | {
      role: "assistant";
      content: string;
    }
  | {
      role: "system";
      content: string;
    }
  | {
      role: "tool";
      content: string;
      tool_id: string;
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
  readonly content: string;

  /**
   * @description
   * Identificador único de herramienta (solo para mensajes de tipo 'tool').
   */
  readonly tool_id: T["role"] extends "tool" ? string : undefined;

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
    this.tool_id = (
      options.role === "tool" ? options.tool_id : undefined
    ) as T["role"] extends "tool" ? string : undefined;
    this.timestamp = new Date();

    // Validación básica
    if (!this.role) {
      throw new Error("El rol del mensaje es requerido");
    }
    if (!this.content) {
      throw new Error("El contenido del mensaje es requerido");
    }
    if (this.role === "tool" && !this.tool_id) {
      throw new Error("Los mensajes de herramienta requieren un tool_id");
    }
  }

  /**
   * @description
   * Obtiene la longitud del contenido del mensaje.
   *
   * @returns Número de caracteres en el contenido
   *
   * @example
   * ```typescript
   * const msg = new Message({ role: 'user', content: 'Hola mundo' });
   * console.log(msg.length); // 10
   * ```
   */
  get length(): number {
    return this.content.length;
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
   * const msg = new Message({
   *   role: 'user',
   *   content: 'Hola mundo',
   *   tool_id: 'optional_id'
   * });
   *
   * const msg_data = msg.toJSON();
   * console.log(JSON.stringify(msg)); // Usa automáticamente toJSON()
   * // Resultado: { "role": "user", "content": "Hola mundo", "timestamp": "..." }
   * ```
   */
  toJSON(): {
    role: MessageRole;
    content: string;
    tool_id?: string;
    timestamp: string;
  } {
    return {
      role: this.role,
      content: this.content,
      timestamp: this.timestamp.toISOString(),
      ...(this.tool_id && { tool_id: this.tool_id }),
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
    return `Message(${this.role})${this.tool_id ? ` [${this.tool_id}]` : ""}: ${
      this.content.length > 50
        ? this.content.substring(0, 47) + "..."
        : this.content
    }`;
  }
}
