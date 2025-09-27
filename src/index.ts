/**
 * @fileoverview
 * Sistema avanzado de agentes de IA con arquitectura reactiva basada en Context.
 *
 * Esta librería proporciona una implementación completa para crear agentes conversacionales
 * inteligentes que integran múltiples proveedores de IA (OpenAI, Anthropic, Groq, etc.),
 * gestión de herramientas personalizadas, rules de comportamiento, metadata reactivo y
 * manejo automático de conversaciones con resilience integrada.
 *
 * ## Características Principales
 *
 * - **Multi-Provider**: Soporte para múltiples proveedores de IA con failover automático
 * - **Tool System**: Sistema flexible de herramientas con ejecución paralela
 * - **Context Reactivo**: Gestión de estado con herencia automática de configuración
 * - **Conversation Engine**: Motor de conversación con resolución automática de tool calls
 * - **Enterprise Ready**: Manejo robusto de errores y resilience para producción
 *
 * ## Arquitectura del Sistema
 *
 * ```
 * Agent (Entry Point)
 *   ├── Context (Reactive State Management)
 *   │   ├── Metadata (Key-Value Store)
 *   │   ├── Rules (Behavior Guidelines)
 *   │   ├── Tools (Function Registry)
 *   │   └── Messages (Conversation History)
 *   └── Providers (Multi-API Support)
 * ```
 *
 * @author Arcaelas Insiders
 * @version 3.0.0
 * @since 3.0.0
 * @module @arcaelas/agent
 *
 * @example
 * ```typescript
 * import { Agent, Tool, Rule, Message, Metadata, Context } from '@arcaelas/agent';
 *
 * // Configuración básica de agente
 * const assistant = new Agent({
 *   name: "Technical_Assistant",
 *   description: "Asistente técnico especializado en programación",
 *   providers: [
 *     async (ctx) => {
 *       // Implementación del proveedor OpenAI
 *       const client = new OpenAI({
 *         baseURL: "https://api.openai.com/v1",
 *         apiKey: process.env.OPENAI_API_KEY
 *       });
 *       return await client.chat.completions.create({
 *         model: "gpt-4",
 *         messages: ctx.messages.map(m => ({ role: m.role, content: m.content }))
 *       });
 *     }
 *   ]
 * });
 *
 * // Añadir herramientas al agente
 * assistant.tools = [
 *   new Tool("search_docs", async (query) => {
 *     return await searchDocumentation(query);
 *   })
 * ];
 *
 * // Configurar rules de comportamiento
 * assistant.rules = [
 *   new Rule("Mantén respuestas técnicas pero comprensibles"),
 *   new Rule("Proporciona ejemplos de código cuando sea relevante")
 * ];
 *
 * // Iniciar conversación
 * const [messages, success] = await assistant.call("¿Cómo implemento un patrón Observer?");
 *
 * if (success) {
 *   console.log("Respuesta:", messages[messages.length - 1].content);
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Configuración avanzada con múltiples contextos y herencia
 * import { Agent, Context, Metadata, Rule, Tool } from '@arcaelas/agent';
 *
 * // Context corporativo compartido
 * const corporate_context = new Context({
 *   metadata: new Metadata()
 *     .set("company", "Arcaelas Insiders")
 *     .set("department", "Engineering"),
 *   rules: [
 *     new Rule("Mantén confidencialidad de información interna"),
 *     new Rule("Usa terminología técnica apropiada")
 *   ]
 * });
 *
 * // Context especializado para desarrollo
 * const dev_context = new Context({
 *   context: corporate_context, // Herencia automática
 *   metadata: new Metadata().set("team", "Backend"),
 *   tools: [
 *     new Tool("run_tests", async () => "Tests executed successfully"),
 *     new Tool("deploy_service", async (env) => `Deployed to ${env}`)
 *   ]
 * });
 *
 * // Agente especializado con herencia completa
 * const dev_agent = new Agent({
 *   name: "DevOps_Agent",
 *   description: "Agente especializado en operaciones de desarrollo",
 *   contexts: dev_context,
 *   providers: [
 *     async (ctx) => await openai_completion(ctx),
 *     async (ctx) => await anthropic_completion(ctx)
 *   ] // Failover automático
 * });
 *
 * // El agente hereda automáticamente:
 * console.log(dev_agent.metadata.get("company"));     // "Arcaelas Insiders"
 * console.log(dev_agent.metadata.get("team"));        // "Backend"
 * console.log(dev_agent.rules.length);                // Rules corporativas + dev
 * console.log(dev_agent.tools.length);                // Tools corporativas + dev
 * ```
 */

/* ================================================================================================
 * EXPORTACIONES PRINCIPALES
 * ================================================================================================ */

/**
 * @description
 * Exporta todas las interfaces, tipos y utilidades de los módulos principales.
 * Incluye tipos de configuración, interfaces de respuesta y utilidades auxiliares.
 */
export * from "./static/agent";
export * from "./static/context";
export * from "./static/message";
export * from "./static/metadata";
export * from "./static/rule";
export * from "./static/tool";

/* ================================================================================================
 * EXPORTACIONES DE CLASES PRINCIPALES
 * ================================================================================================ */

/**
 * @description
 * Clase principal para crear y gestionar agentes conversacionales inteligentes.
 *
 * Agent utiliza Context internamente para proporcionar gestión reactiva de estado
 * con herencia automática de configuración, soporte multi-provider con failover,
 * y un sistema completo de herramientas con ejecución paralela.
 *
 * @example
 * ```typescript
 * import { Agent } from '@arcaelas/agent';
 *
 * const agent = new Agent({
 *   name: "Customer_Support",
 *   description: "Agente de soporte al cliente profesional",
 *   providers: [
 *     async (ctx) => await openai_completion(ctx)
 *   ]
 * });
 *
 * const [response, success] = await agent.call("Necesito ayuda con mi cuenta");
 * ```
 *
 * @see {@link AgentOptions} Para opciones de configuración completas
 * @see {@link Provider} Para configuración de proveedores
 */
export { default as Agent } from "./static/agent";

/**
 * @description
 * Sistema de gestión de estado reactivo con herencia automática.
 *
 * Context maneja metadata, rules, tools y messages de forma unificada,
 * permitiendo herencia de configuración entre contexts padre e hijo.
 * Es la base del sistema reactivo que utiliza Agent internamente.
 *
 * @example
 * ```typescript
 * import { Context, Metadata, Rule } from '@arcaelas/agent';
 *
 * const parent_context = new Context({
 *   metadata: new Metadata().set("env", "production"),
 *   rules: [new Rule("Mantén alta seguridad")]
 * });
 *
 * const child_context = new Context({
 *   context: parent_context, // Herencia automática
 *   metadata: new Metadata().set("service", "api"),
 *   rules: [new Rule("Valida todas las entradas")]
 * });
 *
 * // child_context hereda automáticamente configuración de parent_context
 * console.log(child_context.metadata.get("env")); // "production"
 * ```
 *
 * @see {@link ContextOptions} Para opciones de configuración
 */
export { default as Context } from "./static/context";

/**
 * @description
 * Representación de mensajes en conversaciones con soporte completo para roles y herramientas.
 *
 * Message maneja todos los tipos de mensajes en una conversación: user, assistant, system y tool.
 * Incluye soporte para tool calls, metadata de mensajes y validación automática de formato.
 *
 * @example
 * ```typescript
 * import { Message } from '@arcaelas/agent';
 *
 * // Mensaje de usuario
 * const user_message = new Message({
 *   role: "user",
 *   content: "¿Cuál es el clima hoy?"
 * });
 *
 * // Mensaje de asistente con tool call
 * const assistant_message = new Message({
 *   role: "assistant",
 *   content: "Te ayudo a consultar el clima",
 *   tool_calls: [{
 *     id: "call_123",
 *     type: "function",
 *     function: { name: "get_weather", arguments: '{"location": "Madrid"}' }
 *   }]
 * });
 *
 * // Respuesta de herramienta
 * const tool_message = new Message({
 *   role: "tool",
 *   tool_id: "call_123",
 *   content: "Temperatura: 22°C, soleado"
 * });
 * ```
 *
 * @see {@link MessageOptions} Para opciones de configuración
 */
export { default as Message } from "./static/message";

/**
 * @description
 * Sistema de almacenamiento clave-valor reactivo para configuración y estado.
 *
 * Metadata proporciona un store reactivo que permite almacenar y recuperar
 * configuración, estado de aplicación y datos contextuales de forma estructurada.
 * Incluye validación de tipos, serialización automática y herencia entre contextos.
 *
 * @example
 * ```typescript
 * import { Metadata } from '@arcaelas/agent';
 *
 * const config = new Metadata()
 *   .set("api_version", "v2")
 *   .set("timeout", 5000)
 *   .set("features", ["tool_calling", "streaming"])
 *   .set("user_preferences", {
 *     language: "es",
 *     theme: "dark",
 *     notifications: true
 *   });
 *
 * // Acceso a configuración
 * console.log(config.get("timeout"));           // 5000
 * console.log(config.get("features"));          // ["tool_calling", "streaming"]
 * console.log(config.has("api_version"));       // true
 *
 * // Iteración y transformación
 * config.forEach((key, value) => {
 *   console.log(`${key}: ${JSON.stringify(value)}`);
 * });
 *
 * const api_config = config.entries()
 *   .filter(([key]) => key.startsWith("api_"))
 *   .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
 * ```
 *
 * @see {@link MetadataValue} Para tipos de valores soportados
 */
export { default as Metadata } from "./static/metadata";

/**
 * @description
 * Definición de reglas de comportamiento y restricciones para agentes.
 *
 * Rule permite definir pautas de comportamiento, restricciones operativas
 * y guidelines que el agente debe seguir durante las conversaciones.
 * Las rules se inyectan automáticamente como context en cada petición.
 *
 * @example
 * ```typescript
 * import { Rule } from '@arcaelas/agent';
 *
 * // Rules de comportamiento general
 * const professional_rule = new Rule(
 *   "Mantén un tono profesional y cortés en todas las interacciones"
 * );
 *
 * const accuracy_rule = new Rule(
 *   "Verifica la información antes de proporcionarla. Si no estás seguro, indícalo claramente"
 * );
 *
 * // Rules operativas específicas
 * const security_rule = new Rule(
 *   "NUNCA proporciones información sensible como contraseñas, tokens API o datos personales"
 * );
 *
 * const escalation_rule = new Rule(
 *   "Escala a soporte humano si el usuario expresa frustración o el problema es complejo"
 * );
 *
 * // Rules contextuales por dominio
 * const medical_rule = new Rule(
 *   "Para consultas médicas, recuerda que no puedes diagnosticar. Recomienda consultar profesionales"
 * );
 *
 * const financial_rule = new Rule(
 *   "Para consejos financieros, proporciona información general. No des consejos de inversión específicos"
 * );
 *
 * // Uso en agente
 * agent.rules = [
 *   professional_rule,
 *   accuracy_rule,
 *   security_rule,
 *   escalation_rule
 * ];
 * ```
 */
export { default as Rule } from "./static/rule";

/**
 * @description
 * Sistema de registro y ejecución de herramientas personalizadas para agentes.
 *
 * Tool permite definir funciones que el agente puede ejecutar automáticamente
 * durante las conversaciones. Incluye validación de parámetros, manejo de errores,
 * ejecución paralela y integración seamless con el motor de conversación.
 *
 * @example
 * ```typescript
 * import { Tool } from '@arcaelas/agent';
 *
 * // Herramienta simple de utilidad
 * const timestamp_tool = new Tool("get_timestamp", async () => {
 *   return new Date().toISOString();
 * });
 *
 * // Herramienta con parámetros complejos
 * const search_tool = new Tool("search_database", async (params) => {
 *   const { query, filters, limit = 10 } = params;
 *
 *   try {
 *     const results = await database.search({
 *       query: query,
 *       filters: filters || {},
 *       limit: Math.min(limit, 100) // Límite de seguridad
 *     });
 *
 *     return JSON.stringify({
 *       results: results.items,
 *       total: results.total,
 *       executionTime: results.duration,
 *       timestamp: new Date().toISOString()
 *     });
 *   } catch (error) {
 *     return `Error en búsqueda: ${error.message}`;
 *   }
 * });
 *
 * // Herramienta con validación avanzada
 * const payment_tool = new Tool("process_payment", async (params) => {
 *   // Validación de parámetros requeridos
 *   const required_fields = ["amount", "currency", "payment_method"];
 *   const missing = required_fields.filter(field => !params[field]);
 *
 *   if (missing.length > 0) {
 *     return `Parámetros requeridos faltantes: ${missing.join(", ")}`;
 *   }
 *
 *   // Validación de tipos y rangos
 *   if (typeof params.amount !== "number" || params.amount <= 0) {
 *     return "El monto debe ser un número positivo";
 *   }
 *
 *   if (!["USD", "EUR", "GBP"].includes(params.currency)) {
 *     return "Moneda no soportada. Use: USD, EUR, GBP";
 *   }
 *
 *   // Procesamiento seguro
 *   const transaction = await paymentProcessor.process({
 *     amount: params.amount,
 *     currency: params.currency,
 *     method: params.payment_method,
 *     timestamp: Date.now()
 *   });
 *
 *   return JSON.stringify({
 *     success: true,
 *     transaction_id: transaction.id,
 *     status: transaction.status,
 *     processedAt: transaction.timestamp
 *   });
 * });
 *
 * // Uso en agente
 * agent.tools = [timestamp_tool, search_tool, payment_tool];
 * ```
 *
 * @see {@link ToolFunction} Para definición de funciones de herramientas
 */
export { default as Tool } from "./static/tool";

/* ================================================================================================
 * EXPORTACIONES DE HERRAMIENTAS INCORPORADAS
 * ================================================================================================ */

/**
 * @description
 * Herramienta para realizar peticiones HTTP remotas de forma encapsulada.
 *
 * RemoteTool permite a los agentes ejecutar llamadas HTTP a APIs externas
 * de forma transparente, con soporte para todos los métodos HTTP estándar
 * y configuración completa de headers y parámetros.
 *
 * @example
 * ```typescript
 * import { RemoteTool } from '@arcaelas/agent';
 *
 * const weather_api = new RemoteTool("get_weather", {
 *   description: "Obtener información meteorológica",
 *   parameters: {
 *     city: "Ciudad para consultar el clima",
 *     units: "Unidades de temperatura (celsius/fahrenheit)"
 *   },
 *   http: {
 *     method: "GET",
 *     headers: {
 *       "X-API-Key": "weather_api_key_123",
 *       "Accept": "application/json"
 *     },
 *     url: "https://api.weather.com/v1/current"
 *   }
 * });
 * ```
 */
export { default as RemoteTool } from "./tools/RemoteTool";

/**
 * @description
 * Herramienta para obtener información temporal del sistema.
 *
 * TimeTool proporciona acceso a la fecha y hora actual con soporte
 * para diferentes zonas horarias usando la API nativa de JavaScript.
 *
 * @example
 * ```typescript
 * import { TimeTool } from '@arcaelas/agent';
 *
 * // Herramienta básica (zona horaria del sistema)
 * const system_time = new TimeTool({});
 *
 * // Herramienta con zona horaria personalizada
 * const madrid_time = new TimeTool({
 *   time_zone: "Europe/Madrid"
 * });
 *
 * // Uso en agente
 * agent.tools = [system_time, madrid_time];
 * ```
 */
export { default as TimeTool } from "./tools/Time";
