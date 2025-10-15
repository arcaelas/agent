/**
 * @fileoverview
 * Sistema de herramientas modulares para agentes de IA.
 *
 * Este módulo proporciona la clase Tool que encapsula funcionalidades específicas
 * que los agentes pueden ejecutar durante conversaciones. Las herramientas son
 * completamente reutilizables entre diferentes contextos y agentes.
 *
 * @author Arcaelas Insiders
 * @version 2.0.0
 * @since 2.0.0
 *
 * @example
 * ```typescript
 * // Herramienta simple
 * const weather = new Tool('get_weather', (agent: Agent, input: string) => {
 *   return "Sunny, 24°C";
 * });
 *
 * // Herramienta avanzada
 * const customer = new Tool('find_customer', {
 *   description: 'Buscar información de cliente en la base de datos',
 *   parameters: {
 *     email: 'Email del cliente a buscar',
 *     include_history: 'Incluir historial de transacciones (true/false)'
 *   },
 *   func: (agent, { email, include_history }) => {
 *     return database.find(email, include_history === 'true');
 *   }
 * });
 * ```
 */

import Agent from "./agent";

/**
 * @description
 * Opciones para configuración avanzada de herramientas.
 * @template T Tipo de parámetros de la herramienta
 */
export interface ToolOptions<T = Record<string, string>> {
  /**
   * @description
   * Descripción clara de lo que hace la herramienta.
   */
  description: string;

  /**
   * @description
   * Esquema de parámetros donde cada clave es el nombre del parámetro
   * y cada valor es la descripción de ese parámetro.
   */
  parameters?: T;

  /**
   * @description
   * Función que se ejecuta cuando la herramienta es llamada.
   * Debe retornar un valor que pueda ser serializado como string.
   * Puede ser síncrona o asíncrona.
   */
  func(
    agent: Agent,
    params: T extends object ? T : { input: string }
  ): string | Promise<string>;
}

/**
 * @description
 * Función simple para herramientas básicas.
 */
export type SimpleToolHandler = (
  agent: Agent,
  input: string
) => string | Promise<string>;

/**
 * @description
 * Clase Tool que encapsula funcionalidades ejecutables por agentes de IA.
 *
 * Las herramientas pueden ser simples (con entrada string) o avanzadas
 * (con parámetros tipados y validación). Son completamente reutilizables
 * entre diferentes contextos y agentes.
 *
 * @example
 * ```typescript
 * // Herramienta simple para obtener timestamp
 * const timestamp = new Tool('get_timestamp', (agent: Agent, input: string) => {
 *   return new Date().toISOString();
 * });
 *
 * // Herramienta avanzada para búsqueda de productos
 * const product_search = new Tool('search_products', {
 *   description: 'Buscar productos en el catálogo con filtros avanzados',
 *   parameters: {
 *     query: 'Términos de búsqueda',
 *     category: 'Categoría específica (opcional)',
 *     max_price: 'Precio máximo (opcional)'
 *   },
 *   func: (agent, { query, category, max_price }) => {
 *     return data_service.search({
 *       query,
 *       category: category || null,
 *       max_price: max_price ? parseFloat(max_price) : null
 *     });
 *   }
 * });
 *
 * // Uso de las herramientas
 * console.log(timestamp.name); // 'get_timestamp'
 * console.log(product_search.description); // 'Buscar productos...'
 * ```
 */
export default class Tool<
  T extends Record<string, string> = Record<string, string>
> {
  /**
   * @description
   * Nombre único de la herramienta.
   */
  readonly name: string;

  /**
   * @description
   * Descripción de lo que hace la herramienta.
   */
  readonly description: string;

  /**
   * @description
   * Esquema de parámetros de la herramienta.
   */
  readonly parameters: T | { input: string };

  /**
   * @description
   * Función ejecutable de la herramienta.
   */
  readonly func: (
    agent: Agent,
    params: T extends object ? T : { input: string }
  ) => string | Promise<string>;

  /**
   * @description
   * Crea una herramienta simple con entrada string.
   *
   * @param name Nombre único de la herramienta
   * @param handler Función que procesa la entrada y retorna el resultado
   *
   * @example
   * ```typescript
   * const weather = new Tool('get_weather', (agent: Agent, input: string) => {
   *   // input contiene la consulta del usuario
   *   return "Sunny, 24°C in Madrid";
   * });
   * ```
   */
  constructor(name: string, handler: SimpleToolHandler);

  /**
   * @description
   * Crea una herramienta avanzada con parámetros tipados.
   *
   * @param name Nombre único de la herramienta
   * @param options Configuración avanzada de la herramienta
   *
   * @example
   * ```typescript
   * const calculator = new Tool('calculate', {
   *   description: 'Realizar cálculos matemáticos básicos',
   *   parameters: {
   *     operation: 'Operación a realizar (+, -, *, /)',
   *     a: 'Primer número',
   *     b: 'Segundo número'
   *   },
   *   func: (agent, { operation, a, b }) => {
   *     const num_a = parseFloat(a);
   *     const num_b = parseFloat(b);
   *     switch (operation) {
   *       case '+': return num_a + num_b;
   *       case '-': return num_a - num_b;
   *       case '*': return num_a * num_b;
   *       case '/': return num_b !== 0 ? num_a / num_b : 'Error: División por cero';
   *       default: return 'Operación no válida';
   *     }
   *   }
   * });
   * ```
   */
  constructor(name: string, options: ToolOptions<T>);

  constructor(
    name: string,
    handler_or_options: SimpleToolHandler | ToolOptions<T>
  ) {
    this.name = name;
    const options = {
      ...(typeof handler_or_options === "function"
        ? {
            description: name,
            parameters: { input: "<tool-input>" },
            func: handler_or_options,
          }
        : handler_or_options),
    };
    this.description = options.description || this.name;
    this.parameters = options.parameters!;
    this.func = options.func as any;
  }

  /**
   * @description
   * Convierte la herramienta a formato JSON para serialización.
   * Implementa el método nativo toJSON() de Node.js para compatibilidad
   * con JSON.stringify() y otras operaciones de serialización.
   *
   * @returns Representación JSON de la herramienta
   *
   * @example
   * ```typescript
   * const tool_data = tool.toJSON();
   * console.log(JSON.stringify(tool)); // Usa automáticamente toJSON()
   * // Resultado: { name: 'get_weather', description: '...', parameters: {...} }
   * ```
   */
  toJSON(): {
    type: "function";
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: T | { input: string };
    };
  } {
    const parameters = {};
    for (const k in this.parameters!) {
      parameters[k] = {
        type: "string",
        description: this.parameters[k],
      };
    }
    return {
      type: "function",
      name: this.name,
      description: this.description,
      parameters: {
        type: "object",
        properties: parameters as any,
      },
    };
  }

  /**
   * @description
   * Retorna representación string de la herramienta para debugging.
   *
   * @returns Descripción legible de la herramienta
   *
   * @example
   * ```typescript
   * console.log(tool.toString()); // "Tool(get_weather): Friendly weather assistant"
   * console.log(String(tool));    // Usa automáticamente toString()
   * ```
   */
  toString(): string {
    return `Tool(${this.name}): ${this.description}`;
  }
}
