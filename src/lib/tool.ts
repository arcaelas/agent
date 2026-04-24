/**
 * @fileoverview
 * Modular tool system for AI agents with dual schema support (Record and Zod).
 * Sistema de herramientas modulares para agentes de IA con soporte dual de schema (Record y Zod).
 *
 * @author Arcaelas Insiders
 * @version 3.0.0
 * @since 2.0.0
 *
 * @example
 * ```typescript
 * // Simple tool / Herramienta simple
 * const weather = new Tool('get_weather', (agent, input) => "Sunny, 24C");
 *
 * // Record parameters (legacy) / Parametros Record (legacy)
 * const customer = new Tool('find_customer', {
 *   description: 'Buscar cliente por email',
 *   parameters: { email: 'Email del cliente' },
 *   func: (agent, { email }) => database.find(email),
 * });
 *
 * // Zod parameters (typed) / Parametros Zod (tipados)
 * import { z } from 'zod';
 * const search = new Tool('search', {
 *   description: 'Buscar productos',
 *   parameters: z.object({
 *     query: z.string().describe('Termino de busqueda'),
 *     limit: z.number().optional().describe('Maximo de resultados'),
 *   }),
 *   func: (agent, { query, limit }) => catalog.search(query, limit),
 * });
 * ```
 */

import Agent from "./agent";
import { z } from "zod";

/**
 * @description
 * Infers the parameter type for func based on the schema type.
 * If T is a ZodType, infers the output type. Otherwise uses T directly.
 *
 * Infiere el tipo de parametros para func basado en el tipo de schema.
 * Si T es ZodType, infiere el tipo de salida. De lo contrario usa T directamente.
 */
export type InferParams<T> = T extends z.ZodType<infer O> ? O : T extends object ? T : { input: string };

/**
 * @description
 * Advanced tool configuration options.
 * Opciones de configuracion avanzada de herramientas.
 *
 * @template T - Parameter type: Record<string, string> for legacy or z.ZodObject for typed schemas
 */
export interface ToolOptions<T = Record<string, string>> {
  /**
   * @description
   * Clear description of what the tool does.
   * Descripcion clara de lo que hace la herramienta.
   */
  description: string;

  /**
   * @description
   * Parameter schema. Accepts either a Record<string, string> where values are descriptions,
   * or a Zod schema for typed validation and rich JSON Schema generation.
   *
   * Esquema de parametros. Acepta un Record<string, string> donde los valores son descripciones,
   * o un schema Zod para validacion tipada y generacion de JSON Schema rico.
   */
  parameters?: T;

  /**
   * @description
   * Function executed when the tool is called. Can be sync or async.
   * Funcion ejecutada cuando la herramienta es llamada. Puede ser sincrona o asincrona.
   */
  func(agent: Agent, params: InferParams<T>): any;
}

/**
 * @description
 * Simple handler function for basic tools.
 * Funcion handler simple para herramientas basicas.
 */
export type SimpleToolHandler = (agent: Agent, input: string) => any;

/**
 * @description
 * Tool class encapsulating executable functions for AI agents.
 * Supports dual schema: Record<string, string> (legacy) and Zod (typed).
 *
 * Clase Tool que encapsula funciones ejecutables para agentes de IA.
 * Soporta schema dual: Record<string, string> (legacy) y Zod (tipado).
 *
 * @example
 * ```typescript
 * // Record schema (all params as strings)
 * const ping = new Tool('ping', {
 *   description: 'Ping a host',
 *   parameters: { host: 'Host to ping' },
 *   func: (agent, { host }) => `Pong from ${host}`,
 * });
 *
 * // Zod schema (typed params)
 * const calc = new Tool('calculate', {
 *   description: 'Basic math',
 *   parameters: z.object({
 *     a: z.number().describe('First number'),
 *     b: z.number().describe('Second number'),
 *     op: z.enum(['+', '-', '*', '/']).describe('Operation'),
 *   }),
 *   func: (agent, { a, b, op }) => {
 *     switch (op) {
 *       case '+': return a + b;
 *       case '-': return a - b;
 *       case '*': return a * b;
 *       case '/': return b !== 0 ? a / b : 'Division by zero';
 *     }
 *   },
 * });
 * ```
 */
export default class Tool<T = any> {
  /**
   * @description
   * Unique name of the tool.
   * Nombre unico de la herramienta.
   */
  readonly name: string;

  /**
   * @description
   * Description of what the tool does.
   * Descripcion de lo que hace la herramienta.
   */
  readonly description: string;

  /**
   * @description
   * Parameter schema (Record or Zod).
   * Esquema de parametros (Record o Zod).
   */
  readonly parameters: T | { input: string };

  /**
   * @description
   * Executable function of the tool.
   * Funcion ejecutable de la herramienta.
   */
  readonly func: (agent: Agent, params: InferParams<T>) => any;

  /**
   * @description
   * Creates a simple tool with string input.
   * Crea una herramienta simple con entrada string.
   *
   * @param name - Unique tool name / Nombre unico de la herramienta
   * @param handler - Function processing input / Funcion que procesa la entrada
   *
   * @example
   * ```typescript
   * const weather = new Tool('get_weather', (agent, input) => "Sunny, 24C");
   * ```
   */
  constructor(name: string, handler: SimpleToolHandler);

  /**
   * @description
   * Creates an advanced tool with typed parameters.
   * Crea una herramienta avanzada con parametros tipados.
   *
   * @param name - Unique tool name / Nombre unico de la herramienta
   * @param options - Advanced configuration / Configuracion avanzada
   *
   * @example
   * ```typescript
   * const search = new Tool('search', {
   *   description: 'Search products',
   *   parameters: z.object({ query: z.string().describe('Search term') }),
   *   func: (agent, { query }) => catalog.search(query),
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
   * Converts the tool to JSON format for API serialization.
   * Auto-detects Zod schemas and generates rich JSON Schema with proper types.
   * Legacy Record schemas generate string-only properties with all params required.
   *
   * Convierte la herramienta a formato JSON para serializacion API.
   * Auto-detecta schemas Zod y genera JSON Schema rico con tipos correctos.
   * Schemas Record legacy generan propiedades tipo string con todos los params requeridos.
   *
   * @returns JSON representation compatible with OpenAI tool calling format
   *
   * @example
   * ```typescript
   * console.log(JSON.stringify(tool)); // uses toJSON() automatically
   * ```
   */
  toJSON(): {
    type: "function";
    function: {
      name: string;
      description: string;
      parameters: Record<string, any>;
    };
  } {
    if (this.parameters && typeof (this.parameters as any).parse === "function") {
      const { $schema, ...schema } = z.toJSONSchema(this.parameters as unknown as z.ZodType) as Record<string, any>;
      return {
        type: "function",
        function: {
          name: this.name,
          description: this.description,
          parameters: schema,
        },
      };
    }
    const properties: Record<string, any> = {};
    const required: string[] = [];
    for (const k in this.parameters!) {
      properties[k] = {
        type: "string",
        description: (this.parameters as any)[k],
      };
      required.push(k);
    }
    return {
      type: "function",
      function: {
        name: this.name,
        description: this.description,
        parameters: { type: "object", properties, required },
      },
    };
  }

  /**
   * @description
   * Returns string representation of the tool for debugging.
   * Retorna representacion string de la herramienta para debugging.
   *
   * @returns Readable description / Descripcion legible
   *
   * @example
   * ```typescript
   * console.log(String(tool)); // "Tool(get_weather): Friendly weather assistant"
   * ```
   */
  toString(): string {
    return `Tool(${this.name}): ${this.description}`;
  }
}
