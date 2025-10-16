/**
 * @fileoverview
 * Sistema de agentes de IA con arquitectura basada en Context.
 *
 * Este módulo proporciona la clase Agent que utiliza Context como base para
 * gestión reactiva de metadata, rules, tools y messages. El agente actúa como
 * una interfaz simplificada sobre Context con propiedades virtualizadas.
 *
 * @author Arcaelas Insiders
 * @version 3.0.0
 * @since 3.0.0
 *
 * @example
 * ```typescript
 * import Agent from './agent';
 * import Context from './context';
 * import Tool from './tool';
 * import Rule from './rule';
 * import Message from './message';
 * import Metadata from './metadata';
 *
 * // Crear agente con Context automático
 * const agent = new Agent({
 *   name: "Support_Agent",
 *   description: "Asistente de soporte técnico especializado",
 *   metadata: new Metadata().set("version", "1.0"),
 *   tools: [new Tool("search", () => "search result")],
 *   rules: [new Rule("Mantén un tono profesional")],
 *   messages: [new Message({ role: "system", content: "Agent initialized" })],
 *   contexts: [global_context]
 * });
 *
 * // Propiedades virtualizadas desde Context
 * console.log(agent.tools.length);           // Tools heredados + locales
 * console.log(agent.messages.length);       // Messages heredados + locales
 * agent.metadata.set("user_id", "123");     // Metadata reactivo
 *
 * // Manipulación directa
 * agent.rules = [...agent.rules, new Rule("Responde en español")];
 * ```
 */

import Context from "./context";
import Message, { MessageOptions, ToolCall } from "./message";
import Metadata from "./metadata";
import Rule from "./rule";
import Tool from "./tool";

/**
 * @description
 * Información de uso de tokens en la respuesta de ChatCompletion.
 */
export interface CompletionUsage {
  /**
   * @description
   * Número de tokens utilizados en el prompt de entrada.
   */
  prompt_tokens: number;

  /**
   * @description
   * Número de tokens generados en la respuesta de completado.
   */
  completion_tokens: number;

  /**
   * @description
   * Número total de tokens utilizados (prompt_tokens + completion_tokens).
   */
  total_tokens: number;
}

/**
 * @description
 * Mensaje de respuesta del modelo de IA.
 */
export interface ResponseMessage {
  /**
   * @description
   * Rol del mensaje, siempre "assistant" para respuestas del modelo.
   */
  role: "assistant";

  /**
   * @description
   * Contenido de texto de la respuesta del modelo.
   */
  content: string | null;

  /**
   * @description
   * Información sobre llamadas a funciones (si aplica).
   */
  function_call?: {
    name: string;
    arguments: string;
  } | null;

  /**
   * @description
   * Información sobre llamadas a herramientas (si aplica).
   */
  tool_calls?: ToolCall[] | null;

  /**
   * @description
   * Indicador de rechazo cuando el modelo se niega a responder.
   */
  refusal?: string | null;
}

/**
 * @description
 * Opción de completado individual en la respuesta de ChatCompletion.
 */
export interface CompletionChoice {
  /**
   * @description
   * Índice de la opción en el array de opciones.
   */
  index: number;

  /**
   * @description
   * Mensaje de respuesta generado por el modelo.
   */
  message: ResponseMessage;

  /**
   * @description
   * Información de probabilidades logarítmicas (si está habilitada).
   */
  logprobs?: {
    content: Array<{
      token: string;
      logprob: number;
      bytes?: number[];
      top_logprobs?: Array<{
        token: string;
        logprob: number;
        bytes?: number[];
      }>;
    }> | null;
  } | null;

  /**
   * @description
   * Razón por la cual el modelo terminó de generar.
   * - "stop": Completado naturalmente o por stop sequence
   * - "length": Alcanzó el límite máximo de tokens
   * - "tool_calls": El modelo llamó a una herramienta
   * - "content_filter": Contenido filtrado por políticas de seguridad
   * - "function_call": El modelo llamó a una función (deprecated)
   */
  finish_reason:
    | "stop"
    | "length"
    | "tool_calls"
    | "content_filter"
    | "function_call"
    | null;
}

/**
 * @description
 * Respuesta completa de ChatCompletion compatible con OpenAI API.
 */
export interface ChatCompletionResponse {
  /**
   * @description
   * Identificador único para la respuesta de chat completion.
   */
  id: string;

  /**
   * @description
   * Tipo de objeto, siempre "chat.completion".
   */
  object: "chat.completion";

  /**
   * @description
   * Timestamp Unix de cuándo se creó la completion.
   */
  created: number;

  /**
   * @description
   * Modelo utilizado para generar la completion.
   */
  model: string;

  /**
   * @description
   * Fingerprint del sistema usado para generar la respuesta.
   */
  system_fingerprint?: string | null;

  /**
   * @description
   * Lista de opciones de completion. Puede contener más de una si n > 1.
   */
  choices: CompletionChoice[];

  /**
   * @description
   * Información de uso de tokens para esta petición.
   */
  usage?: CompletionUsage;

  /**
   * @description
   * Nivel de servicio utilizado para la petición (si aplica).
   */
  service_tier?: string | null;
}

/**
 * @description
 * Función de proveedor de IA que procesa un contexto y retorna una respuesta.
 * Compatible con el schema estándar de OpenAI ChatCompletion API.
 */
export type Provider = (
  ctx: Context
) => ChatCompletionResponse | Promise<ChatCompletionResponse>;

/**
 * @description
 * Opciones de configuración para inicializar un Agent.
 */
export interface AgentOptions {
  /**
   * @description
   * Nombre único del agente utilizado como identificador.
   */
  name: string;

  /**
   * @description
   * Descripción del agente que actúa como system prompt base inmutable.
   * Define la personalidad y comportamiento fundamental del agente.
   */
  description: string;

  /**
   * @description
   * Metadata inicial del agente.
   * Puede ser una instancia única o array de instancias de Metadata.
   */
  metadata?: Metadata | Metadata[];

  /**
   * @description
   * Tools iniciales del agente.
   * Puede ser una instancia única o array de instancias de Tool.
   */
  tools?: Tool | Tool[];

  /**
   * @description
   * Rules iniciales del agente.
   * Puede ser una instancia única o array de instancias de Rule.
   */
  rules?: Rule | Rule[];

  /**
   * @description
   * Messages iniciales del agente.
   * Puede ser una instancia única o array de instancias de Message.
   */
  messages?: Message | Message[];

  /**
   * @description
   * Contexts padre para herencia de configuración.
   * Puede ser una instancia única o array de instancias de Context.
   */
  contexts?: Context | Context[];

  /**
   * @description
   * Funciones de proveedores de IA disponibles para el agente.
   * Array de funciones que procesan el contexto y retornan respuestas de ChatCompletion.
   */
  providers?: Provider[];
}

/**
 * @description
 * Agente de IA con arquitectura basada en Context reactivo.
 *
 * El Agent utiliza Context internamente para gestionar metadata, rules, tools y messages
 * de forma reactiva con herencia automática. Proporciona una interfaz simplificada
 * con propiedades virtualizadas que mapean directamente al Context subyacente.
 *
 * @example
 * ```typescript
 * // Agente básico
 * const basic_agent = new Agent({
 *   name: "Assistant",
 *   description: "General purpose assistant"
 * });
 *
 * // Agente con configuración completa
 * const full_agent = new Agent({
 *   name: "Technical_Support",
 *   description: "Specialized technical support agent",
 *   metadata: new Metadata().set("department", "IT"),
 *   tools: [search_tool, database_tool],
 *   rules: [professional_rule, helpful_rule],
 *   messages: [new Message({ role: "system", content: "Ready to help" })],
 *   contexts: [company_context, support_context]
 * });
 *
 * // Uso de propiedades virtualizadas
 * console.log(full_agent.name);                    // "Technical_Support"
 * console.log(full_agent.metadata.get("department")); // "IT"
 * console.log(full_agent.tools.length);           // Total tools (heredados + locales)
 * full_agent.messages = [...full_agent.messages, welcome_message];
 * ```
 */
export default class Agent {
  /**
   * @description
   * Nombre único del agente utilizado como identificador.
   */
  readonly name: string;

  /**
   * @description
   * Descripción inmutable del agente que define su personalidad y comportamiento base.
   */
  readonly description: string;

  /**
   * @description
   * Context interno que gestiona toda la configuración reactiva del agente.
   */
  private readonly _context: Context;

  /**
   * @description
   * Funciones de proveedores de IA configuradas para el agente.
   */
  private readonly _providers: Provider[];

  /**
   * @description
   * Crea una nueva instancia de Agent con Context reactivo interno.
   *
   * @param options Opciones de configuración del agente
   *
   * @example
   * ```typescript
   * // Agente mínimo
   * const simple_agent = new Agent({
   *   name: "SimpleBot",
   *   description: "A simple conversational agent"
   * });
   *
   * // Agente con herencia de contextos
   * const parent_context = new Context({
   *   metadata: new Metadata().set("company", "Arcaelas"),
   *   rules: [new Rule("Always be professional")]
   * });
   *
   * const specialized_agent = new Agent({
   *   name: "Sales_Agent",
   *   description: "Specialized sales assistant",
   *   contexts: parent_context,
   *   metadata: new Metadata().set("team", "sales"),
   *   tools: [crm_tool, analytics_tool],
   *   messages: [new Message({ role: "system", content: "Sales mode activated" })],
   *   providers: [openai_provider, claude_provider]
   * });
   *
   * // Context automático con herencia
   * console.log(specialized_agent.metadata.get("company")); // "Arcaelas" (heredado)
   * console.log(specialized_agent.metadata.get("team"));    // "sales" (local)
   * ```
   */
  constructor(options: AgentOptions) {
    this.name = options.name;
    this.description = options.description;

    // Validaciones básicas
    if (!this.name) {
      throw new Error("El nombre del agente es requerido");
    }
    if (!this.description) {
      throw new Error("La descripción del agente es requerida");
    }

    // Inicializar Context interno con todas las opciones
    this._context = new Context({
      context: options.contexts,
      metadata: options.metadata,
      rules: options.rules,
      tools: options.tools,
      messages: options.messages,
    });

    // Inicializar proveedores
    this._providers = options.providers || [];
  }

  /**
   * @description
   * Metadata reactivo del agente.
   * Mapea directamente al metadata del Context interno.
   *
   * @example
   * ```typescript
   * const agent = new Agent({
   *   name: "DataAgent",
   *   description: "Data processing agent",
   *   metadata: new Metadata().set("version", "2.0")
   * });
   *
   * console.log(agent.metadata.get("version")); // "2.0"
   * agent.metadata.set("last_update", new Date().toISOString());
   * ```
   */
  get metadata(): Metadata {
    return this._context.metadata;
  }

  /**
   * @description
   * Rules del agente con herencia automática.
   * Getter que combina rules heredadas de contexts padre con rules locales.
   *
   * @returns Array de rules con herencia completa
   *
   * @example
   * ```typescript
   * const agent = new Agent({
   *   name: "ChatAgent",
   *   description: "Chat assistant",
   *   rules: [new Rule("Be concise"), new Rule("Be helpful")]
   * });
   *
   * console.log(agent.rules.length);                    // 2
   * console.log(agent.rules.map(r => r.content));       // Rules content
   * ```
   */
  get rules(): Rule[] {
    return this._context.rules;
  }

  /**
   * @description
   * Establece las rules locales del agente.
   * No afecta las rules heredadas de contexts padre.
   *
   * @param rules Array de rules a establecer como locales
   *
   * @example
   * ```typescript
   * agent.rules = [
   *   new Rule("Always greet users"),
   *   new Rule("Provide examples when explaining")
   * ];
   * ```
   */
  set rules(rules: Rule[]) {
    this._context.rules = rules;
  }

  /**
   * @description
   * Tools del agente con deduplicación automática por nombre.
   * Combina tools heredadas de contexts padre con tools locales.
   *
   * @returns Array de tools únicas con herencia completa
   *
   * @example
   * ```typescript
   * const agent = new Agent({
   *   name: "AnalyticsAgent",
   *   description: "Data analytics agent",
   *   tools: [chart_tool, export_tool]
   * });
   *
   * console.log(agent.tools.length);                    // Tools count
   * console.log(agent.tools.map(t => t.name));          // Tools names
   * ```
   */
  get tools(): Tool[] {
    return this._context.tools;
  }

  /**
   * @description
   * Establece las tools locales del agente.
   * No afecta las tools heredadas de contexts padre.
   *
   * @param tools Array de tools a establecer como locales
   *
   * @example
   * ```typescript
   * agent.tools = [
   *   new Tool("search", () => "search implementation"),
   *   new Tool("analyze", () => "analysis implementation")
   * ];
   * ```
   */
  set tools(tools: Tool[]) {
    this._context.tools = tools;
  }

  /**
   * @description
   * Messages del agente con herencia automática.
   * Combina messages heredados de contexts padre con messages locales.
   *
   * @returns Array de messages con herencia completa
   *
   * @example
   * ```typescript
   * const agent = new Agent({
   *   name: "ChatBot",
   *   description: "Interactive chat agent",
   *   messages: [new Message({ role: "system", content: "Chat started" })]
   * });
   *
   * console.log(agent.messages.length);                 // Messages count
   * console.log(agent.messages.map(m => m.content));    // Messages content
   * ```
   */
  get messages(): Message[] {
    return this._context.messages;
  }

  /**
   * @description
   * Establece los messages locales del agente.
   * No afecta los messages heredados de contexts padre.
   *
   * @param messages Array de messages a establecer como locales
   *
   * @example
   * ```typescript
   * agent.messages = [
   *   new Message({ role: "system", content: "Agent reinitialized" }),
   *   new Message({ role: "assistant", content: "How can I help?" })
   * ];
   * ```
   */
  set messages(messages: Message[]) {
    this._context.messages = messages;
  }

  /**
   * @description
   * Getter para acceder a las funciones de proveedores de IA configuradas.
   *
   * @returns Array de funciones de proveedores
   *
   * @example
   * ```typescript
   * const openai_provider = async (ctx: Context) => ({
   *   id: "chatcmpl-123",
   *   object: "chat.completion",
   *   created: Math.floor(Date.now() / 1000),
   *   model: "gpt-4",
   *   choices: [{
   *     index: 0,
   *     message: {
   *       role: "assistant",
   *       content: "Hello! How can I help you?"
   *     },
   *     finish_reason: "stop"
   *   }],
   *   usage: {
   *     prompt_tokens: 20,
   *     completion_tokens: 9,
   *     total_tokens: 29
   *   }
   * });
   *
   * const claude_provider = async (ctx: Context) => {
   *   // Process context and return ChatCompletion response
   *   return {
   *     id: "chatcmpl-claude-456",
   *     object: "chat.completion",
   *     created: Math.floor(Date.now() / 1000),
   *     model: "claude-3-sonnet",
   *     choices: [{
   *       index: 0,
   *       message: {
   *         role: "assistant",
   *         content: "I'm Claude, how may I assist you today?"
   *       },
   *       finish_reason: "stop"
   *     }],
   *     usage: {
   *       prompt_tokens: 25,
   *       completion_tokens: 12,
   *       total_tokens: 37
   *     }
   *   };
   * };
   *
   * const agent = new Agent({
   *   name: "APIAgent",
   *   description: "Agent with multiple providers",
   *   providers: [openai_provider, claude_provider]
   * });
   *
   * console.log(agent.providers.length); // 2
   * ```
   */
  get providers(): Provider[] {
    return this._providers;
  }

  /**
   * @description
   * Procesa un prompt del usuario con manejo resiliente de proveedores y ejecución automática de tools.
   *
   * Implementa un loop completo de conversación:
   * 1. Añade el prompt del usuario inmediatamente al contexto real
   * 2. Itera por proveedores con resilience hasta obtener respuesta exitosa
   * 3. Si la respuesta incluye tool calls, los ejecuta en paralelo con Promise.allSettled
   * 4. Repite el ciclo hasta convergencia o fallo de todos los proveedores
   * 5. Retorna el estado actual del contexto y un indicador de éxito
   *
   * @param prompt Mensaje del usuario a procesar
   * @returns Tupla [mensajes del contexto actual, éxito del procesamiento]
   *
   * @example
   * ```typescript
   * const agent = new Agent({
   *   name: "SearchAgent",
   *   description: "Agent with search capabilities",
   *   tools: [search_tool, database_tool],
   *   providers: [openai_provider, claude_provider]
   * });
   *
   * // Conversación simple
   * const [messages, success] = await agent.call("Hello, how are you?");
   * if (success) {
   *   console.log("Conversación exitosa:", messages.map(m => `${m.role}: ${m.content}`));
   * } else {
   *   console.log("Conversación falló, mensajes actuales:", messages.length);
   * }
   *
   * // Con tool calling automático
   * const [search_messages, search_success] = await agent.call("Search for TypeScript tutorials");
   * // El agente automáticamente:
   * // 1. Recibe el prompt
   * // 2. Decide usar search_tool
   * // 3. Ejecuta la búsqueda
   * // 4. Procesa los resultados
   * // 5. Responde al usuario
   * ```
   */
  async call(prompt: string): Promise<[Message[], boolean]> {
    this._context.messages = this._context.messages.concat(
      new Message({
        role: "user",
        content: prompt,
      })
    );
    const PROVIDERS: Provider[] = [...this._providers];
    const FALLBACK: Provider[] = [];
    const TOOLS = this._context.tools;

    while (PROVIDERS.length || FALLBACK.length) {
      let success = true;
      const provider =
        PROVIDERS[Math.floor(Math.random() * PROVIDERS.length)] ??
        FALLBACK[Math.floor(Math.random() * FALLBACK.length)];
      try {
        const response = await provider!(this._context);
        for (const choice of response.choices) {
          if (choice.message.content) {
            this._context.messages = this._context.messages.concat(
              new Message({
                role: "assistant",
                content: choice.message.content,
              })
            );
          }
          if ((choice.message.tool_calls ?? []).length) {
            success = false;

            // Añadir mensaje assistant con tool_calls al historial
            this._context.messages = this._context.messages.concat(
              new Message({
                role: "assistant",
                content: null,
                tool_calls: choice.message.tool_calls ?? undefined,
              })
            );

            // Ejecutar todas las herramientas en paralelo
            const _calls = await Promise.all(
              (choice.message.tool_calls ?? []).map(
                async (c): Promise<MessageOptions> => {
                  try {
                    const T = TOOLS.find((t) => t.name === c.function?.name);
                    if (!T) {
                      return {
                        role: "tool",
                        tool_call_id: c.id,
                        content: "Tool not found",
                      };
                    }

                    const result = await T.func(
                      this,
                      c.function.arguments
                        ? JSON.parse(c.function.arguments)
                        : {}
                    );

                    // Serialización segura que maneja valores especiales
                    let content: string;

                    // Verificar casos especiales antes de JSON.stringify
                    if (result === undefined) {
                      content = "undefined";
                    } else if (typeof result === "function") {
                      content = "[Function]";
                    } else if (typeof result === "bigint") {
                      content = (result as bigint).toString();
                    } else {
                      try {
                        content = JSON.stringify(result);
                      } catch {
                        // Manejar errores de serialización (ej: referencias circulares)
                        content = String(result);
                      }
                    }

                    return {
                      role: "tool",
                      tool_call_id: c.id,
                      content,
                    };
                  } catch (error: any) {
                    return {
                      role: "tool",
                      tool_call_id: c.id,
                      content: error.message ?? String(error),
                    };
                  }
                }
              )
            );

            // Añadir resultados de las herramientas al historial
            this._context.messages = this._context.messages.concat(
              _calls.map((c) => new Message(c))
            );
          }
        }
        if (success) {
          return [this._context.messages, true];
        } else continue;
      } catch (error) {
        PROVIDERS.splice(PROVIDERS.indexOf(provider!), 1);
        const idx = FALLBACK.indexOf(provider!);
        idx !== -1 ? FALLBACK.splice(idx, 1) : FALLBACK.push(provider!);
      }
    }

    return [this._context.messages, false];
  }
}
