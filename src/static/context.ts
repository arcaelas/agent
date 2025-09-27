/**
 * @fileoverview
 * Sistema de contexto simplificado con herencia reactiva de metadata, rules, tools y messages.
 *
 * Este módulo proporciona la clase Context que combina herencia automática
 * de contextos padre con metadata, rules, tools y messages locales. Utiliza reactividad nativa
 * sin proxy para crear vistas dinámicas con precedencia automática y deduplicación.
 *
 * @author Arcaelas Insiders
 * @version 4.2.0
 * @since 2.0.0
 *
 * @example
 * ```typescript
 * import Context from './context';
 * import Metadata from './metadata';
 * import Rule from './rule';
 * import Tool from './tool';
 * import Message from './message';
 *
 * // Context padre con configuración base
 * const parent_context = new Context({
 *   metadata: new Metadata().set("app", "MyApp").set("version", "1.0"),
 *   rules: [new Rule("Mantén un tono profesional")],
 *   tools: [new Tool("search", () => "search result")],
 *   messages: [new Message({ role: "user", content: "Hello" })]
 * });
 *
 * // Context hijo con herencia automática + configuración local
 * const child_context = new Context({
 *   context: parent_context,  // Herencia de metadata, rules, tools y messages
 *   metadata: new Metadata().set("theme", "dark"),     // Metadata adicional
 *   rules: [new Rule("Responde en español")],          // Rules adicionales
 *   tools: [new Tool("analyze", () => "analysis")],    // Tools adicionales
 *   messages: [new Message({ role: "assistant", content: "Hola" })]       // Messages adicionales
 * });
 *
 * // Acceso transparente a datos heredados y locales
 * console.log(child_context.metadata.get("app", ""));     // "MyApp" (heredado)
 * console.log(child_context.rules.length);                // 2 (padre + local)
 * console.log(child_context.tools.length);                // 2 (padre + local, únicos)
 * console.log(child_context.messages.length);             // 2 (padre + local)
 *
 * // Manipulación directa de messages
 * child_context.messages.push(new Message({ role: "user", content: "¿Cómo estás?" }));
 * console.log(child_context.messages.length);             // 3
 * ```
 */

import Message from "./message";
import Metadata from "./metadata";
import Rule from "./rule";
import Tool from "./tool";

/**
 * @description
 * Opciones de configuración para inicializar un Context.
 */
export interface ContextOptions {
  /**
   * @description
   * Contextos padre para herencia jerárquica.
   * Puede ser una instancia única o array de instancias de Context.
   */
  context?: Context | Context[];

  /**
   * @description
   * Metadata para herencia directa del contexto.
   * Puede ser una instancia única o array de instancias de Metadata.
   */
  metadata?: Metadata | Metadata[];

  /**
   * @description
   * Rules para configuración de comportamiento del contexto.
   * Puede ser una instancia única o array de instancias de Rule.
   */
  rules?: Rule | Rule[];

  /**
   * @description
   * Tools disponibles para el contexto.
   * Puede ser una instancia única o array de instancias de Tool.
   */
  tools?: Tool | Tool[];

  /**
   * @description
   * Messages del contexto para historial de conversación.
   * Puede ser una instancia única o array de instancias de Message.
   */
  messages?: Message | Message[];
}

/**
 * @description
 * Context con herencia reactiva de metadata, rules, tools y messages.
 *
 * Proporciona un contenedor para metadata, rules, tools y messages con herencia automática
 * desde contextos padre y configuración local. Utiliza reactividad nativa
 * para propagar cambios dinámicamente sin necesidad de proxy. Los tools se
 * deduplican automáticamente por nombre, priorizando los más recientes.
 *
 * @template T Tipo opcional para extensibilidad futura
 *
 * @example
 * ```typescript
 * // Context básico vacío
 * const basic_context = new Context({});
 * basic_context.metadata.set("local", "value");
 *
 * // Context con configuración completa
 * const full_context = new Context({
 *   metadata: new Metadata().set("app", "MyApp"),
 *   rules: [new Rule("Mantén tono profesional")],
 *   tools: [new Tool("search", () => "search result")],
 *   messages: [new Message({ role: "system", content: "Context initialized" })]
 * });
 *
 * // Context con herencia
 * const child_context = new Context({
 *   context: full_context,
 *   metadata: new Metadata().set("theme", "dark"),
 *   rules: [new Rule("Usa emojis apropiados")],
 *   tools: [new Tool("analyze", () => "analysis result")],
 *   messages: [new Message({ role: "user", content: "¿Cómo estás?" })]
 * });
 *
 * console.log(child_context.messages.length); // Total heredados + locales
 * ```
 */
export default class Context {
  /**
   * @description
   * Metadata reactivo con herencia automática de contextos y metadata.
   * Combina herencia de contextos padre con metadata locales usando el broker pattern.
   */
  readonly metadata: Metadata;

  /**
   * @description
   * Contextos padre almacenados localmente para herencia jerárquica.
   */
  private readonly _contexts: Context[];

  /**
   * @description
   * Rules locales almacenadas para configuración de comportamiento.
   */
  private readonly _rules: Rule[];

  /**
   * @description
   * Tools locales almacenadas para funcionalidades específicas del contexto.
   */
  private readonly _tools: Tool[];

  /**
   * @description
   * Messages locales almacenadas para historial de conversación del contexto.
   */
  private readonly _messages: Message[];

  /**
   * @description
   * Crea una nueva instancia de Context con herencia reactiva de metadata, rules, tools y messages.
   *
   * El constructor inicializa todos los componentes del contexto con herencia automática:
   * - **Metadata**: Herencia con reactividad de contextos padre + metadata locales
   * - **Rules**: Combinación de rules heredadas + rules locales
   * - **Tools**: Deduplicación por nombre priorizando tools más recientes
   * - **Messages**: Combinación de messages heredados + messages locales
   *
   * @param options Opciones de configuración del contexto
   *
   * @example
   * ```typescript
   * // Context vacío con operaciones dinámicas de messages
   * const empty_context = new Context({});
   * empty_context.metadata.set("local", "value");
   * empty_context.messages.push(new Message({ role: "user", content: "Hello" }));
   * empty_context.messages.push(new Message({ role: "assistant", content: "Hi there!" }));
   * console.log(empty_context.messages.length); // 2
   *
   * // Context con herencia completa de contexto padre
   * const parent_context = new Context({
   *   metadata: new Metadata().set("parent", "config"),
   *   rules: [new Rule("Regla del padre")],
   *   tools: [new Tool("parent_tool", () => "parent result")],
   *   messages: [new Message({ role: "system", content: "Parent context initialized" })]
   * });
   *
   * const child_context = new Context({
   *   context: parent_context,  // Herencia automática de metadata, rules, tools y messages
   *   metadata: new Metadata().set("child", "config"),
   *   rules: [new Rule("Regla del hijo")],
   *   tools: [new Tool("child_tool", () => "child result")],
   *   messages: [new Message({ role: "user", content: "Child context ready" })]
   * });
   *
   * // Acceso a messages heredados y locales
   * console.log(child_context.messages.length); // 2 (1 parent + 1 local)
   * console.log(child_context.messages.map(m => m.content)); // ["Parent context initialized", "Child context ready"]
   *
   * // Context con herencia múltiple y override de tools
   * const base_context = new Context({
   *   metadata: new Metadata().set("base", "value"),
   *   tools: [new Tool("shared", () => "base version")],
   *   messages: [new Message({ role: "system", content: "Base initialized" })]
   * });
   *
   * const enhanced_context = new Context({
   *   context: base_context,
   *   metadata: new Metadata().set("enhanced", "true"),
   *   tools: [new Tool("shared", () => "enhanced version")], // Override tool
   *   messages: [new Message({ role: "system", content: "Enhanced ready" })]
   * });
   *
   * // Acceso a messages combinados
   * console.log(enhanced_context.messages.length); // 2 (base + enhanced)
   * console.log(enhanced_context.messages.map(m => m.content)); // ["Base initialized", "Enhanced ready"]
   * ```
   */
  constructor(options: ContextOptions) {
    this._contexts = ([] as Context[])
      .concat(options.context ?? [])
      .filter((c: Context) => c instanceof Context);
    this._rules = ([] as Rule[])
      .concat(options.rules ?? [])
      .filter((r: Rule) => r instanceof Rule);
    this._tools = ([] as Tool[])
      .concat(options.tools ?? [])
      .filter((t: Tool) => t instanceof Tool);

    this._messages = ([] as Message[])
      .concat(options.messages ?? [])
      .filter((m: Message) => m instanceof Message);

    this.metadata = new Metadata(
      ...this._contexts.map((c) => c.metadata), // Metadata de contextos padre
      ...([] as Metadata[])
        .concat(options.metadata ?? [])
        .filter((m: Metadata) => m instanceof Metadata) // Metadata locales/iniciales
    );
  }

  /**
   * @description
   * Getter que combina rules heredadas de contextos padre con rules locales.
   *
   * @returns Array de rules con herencia completa: padre(s) primero, luego locales
   *
   * @example
   * ```typescript
   * const global_context = new Context({
   *   rules: [new Rule("Mantén tono profesional")]
   * });
   *
   * const specialized_context = new Context({
   *   context: global_context,
   *   rules: [
   *     new Rule("Responde en español"),
   *     new Rule("Usa ejemplos técnicos")
   *   ]
   * });
   *
   * const all_rules = specialized_context.rules;
   * console.log(all_rules.length); // 3
   * ```
   */
  get rules(): Rule[] {
    return this._contexts
      .map((c) => c.rules)
      .flat()
      .concat(this._rules);
  }

  /**
   * @description
   * Establece las rules locales del contexto, reemplazando las existentes.
   * No afecta las rules heredadas de contextos padre.
   *
   * @param rules Array de rules a establecer como locales
   *
   * @example
   * ```typescript
   * const parent_context = new Context({
   *   rules: [new Rule("Regla heredada")]
   * });
   *
   * const child_context = new Context({
   *   context: parent_context
   * });
   *
   * // Establecer rules locales (no afecta herencia)
   * child_context.rules = [
   *   new Rule("Nueva regla local"),
   *   new Rule("Otra regla local")
   * ];
   *
   * console.log(child_context.rules.length); // 3 (1 heredada + 2 locales)
   * ```
   */
  set rules(rules: Rule[]) {
    this._rules.length = 0; // Limpiar array existente
    this._rules.push(...rules.filter((r) => r instanceof Rule));
  }

  /**
   * @description
   * Getter que combina tools heredadas con deduplicación por nombre.
   *
   * @returns Array de tools únicas con herencia completa
   *
   * @example
   * ```typescript
   * const base_context = new Context({
   *   tools: [new Tool("search", "Search function", {}, () => {})]
   * });
   *
   * const specialized_context = new Context({
   *   context: base_context,
   *   tools: [
   *     new Tool("analyze", "Analysis function", {}, () => {}),
   *     new Tool("search", "Enhanced search", {}, () => {}) // Override
   *   ]
   * });
   *
   * const all_tools = specialized_context.tools;
   * console.log(all_tools.map(t => t.name)); // ["analyze", "search"]
   * ```
   */
  get tools(): Tool[] {
    return Object.values(
      [...this._contexts.map((c) => c.tools).flat(), ...this._tools].reduce(
        (acc, tool) => ({ ...acc, [tool.name]: tool }),
        {} as Record<string, Tool>
      )
    );
  }

  /**
   * @description
   * Establece las tools locales del contexto, reemplazando las existentes.
   * No afecta las tools heredadas de contextos padre.
   *
   * @param tools Array de tools a establecer como locales
   *
   * @example
   * ```typescript
   * const parent_context = new Context({
   *   tools: [new Tool("inherited", "Inherited tool", {}, () => {})]
   * });
   *
   * const child_context = new Context({
   *   context: parent_context
   * });
   *
   * // Establecer tools locales (no afecta herencia)
   * child_context.tools = [
   *   new Tool("local1", "Local tool 1", {}, () => {}),
   *   new Tool("local2", "Local tool 2", {}, () => {})
   * ];
   *
   * console.log(child_context.tools.length); // 3 (1 heredada + 2 locales)
   * ```
   */
  set tools(tools: Tool[]) {
    this._tools.length = 0; // Reiniciamos los tools locales
    this._tools.push(...tools.filter((t) => t instanceof Tool)); // Agregamos los nuevos tools locales
  }

  /**
   * @description
   * Getter que combina messages heredados de contextos padre con messages locales.
   *
   * @returns Array de messages con herencia completa: padre(s) primero, luego locales
   *
   * @example
   * ```typescript
   * const parent_context = new Context({
   *   messages: [new Message({ role: "system", content: "Parent message" })]
   * });
   *
   * const child_context = new Context({
   *   context: parent_context,
   *   messages: [
   *     new Message({ role: "user", content: "Child message 1" }),
   *     new Message({ role: "assistant", content: "Child message 2" })
   *   ]
   * });
   *
   * const all_messages = child_context.messages;
   * console.log(all_messages.length); // 3
   * console.log(all_messages.map(m => m.content));
   * ```
   */
  get messages(): Message[] {
    return this._contexts
      .map((c) => c.messages)
      .flat()
      .concat(this._messages);
  }

  /**
   * @description
   * Establece los messages locales del contexto, reemplazando los existentes.
   * No afecta los messages heredados de contextos padre.
   *
   * @param messages Array de messages a establecer como locales
   *
   * @example
   * ```typescript
   * const parent_context = new Context({
   *   messages: [new Message({ role: "system", content: "Message heredado" })]
   * });
   *
   * const child_context = new Context({
   *   context: parent_context
   * });
   *
   * // Establecer messages locales (no afecta herencia)
   * child_context.messages = [
   *   new Message({ role: "user", content: "Nuevo message local" }),
   *   new Message({ role: "assistant", content: "Otro message local" })
   * ];
   *
   * console.log(child_context.messages.length); // 3 (1 heredado + 2 locales)
   * ```
   */
  set messages(messages: Message[]) {
    this._messages.length = 0; // Limpiar array existente
    this._messages.push(...messages.filter((m) => m instanceof Message));
  }
}
