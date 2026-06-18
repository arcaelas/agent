import { Noop } from "@arcaelas/utils";
import Context from "~/lib/context";
import Message, { ToolCall } from "~/lib/message";
import Metadata from "~/lib/metadata";
import Rule from "~/lib/rule";
import Tool from "~/lib/tool";

/**
 * @description
 * Dual-mode AI provider function.
 * Without stream option: returns a ChatCompletionResponse (non-streaming).
 * With { stream: true }: returns an AsyncIterable of ProviderChunk (streaming).
 *
 * Función de proveedor de IA dual-mode.
 * Sin opción stream: retorna ChatCompletionResponse (sin streaming).
 * Con { stream: true }: retorna AsyncIterable de ProviderChunk (streaming).
 */
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
     * Texto de razonamiento (thinking) del modelo, si lo expone el provider.
     * Cuando está presente, el Agent persiste el mensaje como `Think` para
     * preservar el razonamiento entre turnos.
     * Reasoning (thinking) text exposed by the provider. When present, the
     * Agent persists the message as a `Think` to preserve reasoning across turns.
     */
    reasoning_content?: string;

    /**
     * @description
     * Firma criptográfica del bloque de razonamiento (específico de Anthropic).
     * Se reinyecta en turnos posteriores para que la API acepte el thinking.
     * Cryptographic signature of the reasoning block (Anthropic-specific).
     * Reinjected in later turns so the API accepts the thinking block.
     */
    reasoning_signature?: string;

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
 * Chunk emitted by providers in stream mode.
 * Normalized delta format for text and tool call accumulation.
 *
 * Chunk emitido por providers en modo stream.
 * Formato delta normalizado para texto y acumulación de tool calls.
 */
export type ProviderChunk =
    | { type: "text_delta"; content: string }
    | { type: "thinking_delta"; content: string }
    | { type: "signature_delta"; content: string }
    | { type: "tool_call_delta"; index: number; id?: string; name?: string; arguments_delta?: string }
    | { type: "finish"; finish_reason: string };

/**
 * @description
 * Chunk yielded by Agent.stream() to the consumer.
 * Message-like format that the consumer can render directly.
 *
 * Chunk emitido por Agent.stream() al consumidor.
 * Formato tipo mensaje que el consumidor puede renderizar directamente.
 */
export type StreamChunk =
    | { role: "assistant"; content: string }
    | { role: "thinking"; content: string }
    | { role: "tool_call"; name: string; tool_call_id: string; arguments: string }
    | { role: "tool"; name: string; tool_call_id: string; content: string };

/**
 * @description
 * Valid input types for Agent.stream().
 * Accepts a plain string (converted to user message), a Message instance,
 * or a plain object with role and content.
 *
 * Tipos de entrada válidos para Agent.stream().
 * Acepta un string (convertido a mensaje de usuario), una instancia de Message,
 * o un objeto plano con role y content.
 */
export type StreamInput = string | Message | { role: "user" | "assistant"; content: string };

export type Provider = {
    (ctx: Context, opts: { stream: true; signal?: AbortSignal }): AsyncIterable<ProviderChunk>;
    (ctx: Context, opts?: { signal?: AbortSignal }): ChatCompletionResponse | Promise<ChatCompletionResponse>;
};

/**
 * Configuration options for initializing an Agent. Every field is optional;
 * an empty Agent is valid and can be configured later via its setters.
 *
 * Opciones de configuración para inicializar un Agent. Todos los campos son
 * opcionales; un Agent vacío es válido y puede configurarse luego vía sus setters.
 */
export interface IAgent {
    /**
     * Initial metadata (single instance or array). Merged into the internal Context.
     * Metadata inicial (instancia única o array). Se fusiona en el Context interno.
     */
    metadata?: Metadata | Metadata[];

    /**
     * Tools exposed to the model (single instance or array).
     * Tools expuestas al modelo (instancia única o array).
     */
    tools?: Tool | Tool[];

    /**
     * Behavior rules injected as system context on every request.
     * Reglas de comportamiento inyectadas como contexto system en cada petición.
     */
    rules?: Rule | Rule[];

    /**
     * Initial conversation messages (history).
     * Mensajes iniciales de la conversación (historial).
     */
    messages?: Message | Message[];

    /**
     * Parent contexts to inherit metadata, rules, tools and messages from.
     * Contexts padre de los que heredar metadata, rules, tools y messages.
     */
    contexts?: Context | Context[];

    /**
     * AI provider functions tried with random selection and failover.
     * Funciones de proveedor de IA, elegidas aleatoriamente con failover.
     */
    providers?: Provider[];

    /**
     * Sub-agents (Agent, IAgent options, or a rule string) executed sequentially
     * before each turn. Each branch's output is accumulated as thinking and
     * injected as a system message into the next branch and the main agent.
     *
     * Sub-agentes (Agent, opciones IAgent, o un string de rule) ejecutados en
     * secuencia antes de cada turno. La salida de cada branch se acumula como
     * thinking y se inyecta como mensaje system al siguiente branch y al agente principal.
     */
    branches?: Array<IAgent | Agent | string>

    /**
     * Lifecycle hooks around tool execution. Each array is a chainable pipe:
     * hooks run in order before/after the tool runs.
     *
     * Hooks de ciclo de vida alrededor de la ejecución de tools. Cada array es
     * un pipe encadenable: los hooks corren en orden antes/después del tool.
     */
    hooks?: {
        /**
         * Runs before the tool executes. Receives the agent (`ctx`), the `Tool`
         * instance and the parsed `params`. `ctx` and `tool` are mutable instances.
         *
         * Corre antes de ejecutar el tool. Recibe el agente (`ctx`), la instancia
         * `Tool` y los `params` parseados. `ctx` y `tool` son instancias mutables.
         */
        PreFunc?: [
            Noop<[ctx: Agent, tool: Tool, params: any]>
        ]
        /**
         * Runs after the tool executes. Receives the agent (`ctx`), the `Tool`
         * instance, the `params` used and the `response` returned. Its return value
         * replaces the response passed to the next hook (chainable pipe).
         *
         * Corre después de ejecutar el tool. Recibe el agente (`ctx`), la instancia
         * `Tool`, los `params` usados y la `response` retornada. Su valor de retorno
         * reemplaza la response que recibe el siguiente hook (pipe encadenable).
         */
        PostFunc?: [
            Noop<[ctx: Agent, tool: Tool, params: any, response: any]>
        ]
    }
}

/**
 * Conversational AI agent backed by a reactive Context. Manages metadata, rules,
 * tools and messages with automatic inheritance, multi-provider failover, automatic
 * tool-call resolution, optional sequential `branches`, and `PreFunc`/`PostFunc` hooks.
 * Exposes two entry points: `call()` (non-streaming) and `stream()` (streaming).
 *
 * Agente conversacional de IA respaldado por un Context reactivo. Gestiona metadata,
 * rules, tools y messages con herencia automática, failover multi-provider, resolución
 * automática de tool calls, `branches` secuenciales opcionales y hooks `PreFunc`/`PostFunc`.
 * Expone dos entradas: `call()` (sin streaming) y `stream()` (streaming).
 *
 * @example
 * ```typescript
 * const agent = new Agent({
 *   providers: [new OpenAI({ api_key: "sk-...", model: "gpt-4o-mini" })],
 *   tools: [search_tool],
 *   rules: [new Rule("Be concise")],
 * });
 * const [messages, ok] = await agent.call("Hello");
 * ```
 */
export default class Agent {
    /**
     * Internal reactive Context backing metadata, rules, tools and messages.
     * Context reactivo interno que respalda metadata, rules, tools y messages.
     */
    private readonly context: Context

    /**
     * Sub-agents resolved from `options.branches`, run sequentially before each turn.
     * Sub-agentes resueltos desde `options.branches`, ejecutados en secuencia antes de cada turno.
     */
    private readonly branches: Agent[]

    /**
     * Creates an Agent. Resolves `contexts`, `metadata`, `tools`, `messages` and `rules`
     * into the internal Context, and normalizes `branches` into Agent instances.
     *
     * Crea un Agent. Resuelve `contexts`, `metadata`, `tools`, `messages` y `rules` en el
     * Context interno, y normaliza `branches` a instancias de Agent.
     *
     * @param options - Agent configuration / Configuración del agente
     */
    constructor(private readonly options: IAgent = {}) {
        this.context = new Context({
            tools: options.tools,
            context: options.contexts,
            metadata: options.metadata,
            messages: options.messages,
            rules: ([] as Rule[]).concat(options.rules ?? []).filter((r): r is Rule => r instanceof Rule),
        });
        this.branches = ([] as unknown[]).concat(options.branches ?? []).map((branch) => {
            if (branch instanceof Agent) return branch;
            if (typeof branch === "string") return new Agent({ rules: new Rule(branch) });
            if (branch && typeof branch === "object") return new Agent({ ...(branch as IAgent) });
            return null;
        }).filter(Boolean) as Agent[];
    }

    /**
     * Reactive metadata of the agent, with inheritance from parent contexts.
     * Metadata reactivo del agente, con herencia de contexts padre.
     */
    get metadata(): Metadata {
        return this.context.metadata;
    }

    /**
     * Behavior rules, combining inherited and local rules.
     * Reglas de comportamiento, combinando heredadas y locales.
     */
    get rules(): Rule[] {
        return this.context.rules;
    }

    /**
     * Sets the local rules (does not affect inherited ones).
     * Establece las rules locales (no afecta las heredadas).
     */
    set rules(rules: Rule[]) {
        this.context.rules = rules;
    }

    /**
     * Tools available to the agent, deduplicated by name, with inheritance.
     * Tools disponibles para el agente, deduplicadas por nombre, con herencia.
     */
    get tools(): Tool[] {
        return this.context.tools;
    }

    /**
     * Sets the local tools (does not affect inherited ones).
     * Establece las tools locales (no afecta las heredadas).
     */
    set tools(tools: Tool[]) {
        this.context.tools = tools;
    }

    /**
     * Conversation messages, combining inherited and local history.
     * Mensajes de la conversación, combinando historial heredado y local.
     */
    get messages(): Message[] {
        return this.context.messages;
    }

    /**
     * Sets the local messages (does not affect inherited ones).
     * Establece los messages locales (no afecta los heredados).
     */
    set messages(messages: Message[]) {
        this.context.messages = messages;
    }

    /**
     * AI provider functions configured for the agent.
     * Funciones de proveedor de IA configuradas para el agente.
     */
    get providers(): Provider[] {
        return ([] as Provider[]).concat(this.options.providers || []);
    }

    /**
     * Processes a prompt to completion (non-streaming). Runs branches first, appends
     * the user message, then iterates providers with random selection and failover.
     * Resolves tool calls automatically (running `PreFunc`/`PostFunc` hooks around each
     * tool), looping until the model returns a final answer or every provider fails.
     *
     * Procesa un prompt hasta completarse (sin streaming). Ejecuta los branches primero,
     * agrega el mensaje del usuario, luego itera proveedores con selección aleatoria y
     * failover. Resuelve los tool calls automáticamente (corriendo los hooks `PreFunc`/
     * `PostFunc` alrededor de cada tool), iterando hasta que el modelo entregue la
     * respuesta final o todos los proveedores fallen.
     *
     * @param prompt - User message to process / Mensaje del usuario a procesar
     * @param options - Optional abort signal / Señal de aborto opcional
     * @returns Tuple of current messages and a success flag / Tupla de mensajes actuales y un indicador de éxito
     *
     * @example
     * ```typescript
     * const [messages, ok] = await agent.call("Search TypeScript tutorials");
     * if (ok) console.log(messages.at(-1)?.content);
     * ```
     */
    async call(prompt: string, options?: { signal?: AbortSignal }): Promise<[messages: Message[], success: boolean]> {
        let thinking = ""
        for (const branch of this.branches) {
            branch.messages = this.messages.concat(
                thinking ? new Message({ role: "system", content: thinking }) : []
            );
            const [m, s] = await branch.call(prompt, options);
            if (s) {
                const last = m.filter((x) => x.role === "assistant" && x.content).at(-1)?.content;
                thinking = typeof last === "string" ? last : "";
            }
        }
        const count = this.messages.length;
        this.messages = this.messages.concat(
            ...(thinking ? [new Message({ role: "system", content: thinking })] : []),
            new Message({ role: "user", content: prompt })
        );
        try {
            const PROVIDERS: Provider[] = [...this.providers];
            const FALLBACK: Provider[] = [];
            while (PROVIDERS.length || FALLBACK.length) {
                if (options?.signal?.aborted) return [this.messages, false];
                let success = true;
                const provider =
                    PROVIDERS[Math.floor(Math.random() * PROVIDERS.length)] ??
                    FALLBACK[Math.floor(Math.random() * FALLBACK.length)];
                try {
                    const response = await provider!(this.context, options?.signal ? { signal: options.signal } : undefined);
                    for (const choice of response.choices) {
                        const reasoning = choice.message.reasoning_content;
                        const signature = choice.message.reasoning_signature ?? "";
                        if (choice.message.content && !choice.message.tool_calls?.length) {
                            this.messages = this.messages.concat(
                                new Message({ role: "assistant", content: choice.message.content, ...(reasoning && { thinking: reasoning, thinking_signature: signature }) })
                            );
                        }
                        const tool_calls = choice.message.tool_calls ?? [];
                        if (tool_calls.length) {
                            success = false;
                            this.messages = this.messages.concat(
                                new Message({ role: "assistant", content: choice.message.content ?? null, tool_calls, ...(reasoning && { thinking: reasoning, thinking_signature: signature }) })
                            );
                            const results = await Promise.all(
                                tool_calls.map(async c => {
                                    const tool = this.tools.find(t => t.name === c.function?.name);
                                    if (tool) {
                                        try {
                                            const params = c.function.arguments ? JSON.parse(c.function.arguments) : {};
                                            for (const hook of this.options.hooks?.PreFunc ?? []) {
                                                await hook(this, tool, params);
                                            }
                                            let result = await tool.func(this, params);
                                            for (const hook of this.options.hooks?.PostFunc ?? []) {
                                                result = await hook(this, tool, params, result);
                                            }
                                            return new Message({ role: "tool", tool_call_id: c.id, content: JSON.stringify(result) });
                                        } catch (e: any) {
                                            return new Message({ role: "tool", tool_call_id: c.id, content: e?.message ?? String(e) });
                                        }
                                    } else return new Message({ role: "tool", tool_call_id: c.id, content: `Function "${c.function?.name}" not found` });
                                })
                            );
                            this.messages = this.messages.concat(...results);
                        }
                    }
                    if (success) return [this.messages, true];
                } catch {
                    PROVIDERS.splice(PROVIDERS.indexOf(provider!), 1);
                    const idx = FALLBACK.indexOf(provider!);
                    if (idx !== -1) FALLBACK.splice(idx, 1);
                    else FALLBACK.push(provider!);
                }
            }
            return [this.messages, false];
        } finally {
            if (thinking) this.messages = this.messages.filter((_, i) => i !== count);
        }
    }


    /**
     * Streams a conversation turn, yielding `StreamChunk`s as they arrive while
     * simultaneously accumulating them to persist the final message. Handles the full
     * agentic loop internally: text/thinking streaming, tool execution (with `PreFunc`/
     * `PostFunc` hooks), and provider failover. Consumers simply iterate the chunks.
     *
     * Streamea un turno de conversación, emitiendo `StreamChunk`s conforme llegan mientras
     * los acumula en paralelo para persistir el mensaje final. Maneja el loop agéntico
     * completo internamente: streaming de texto/thinking, ejecución de tools (con hooks
     * `PreFunc`/`PostFunc`), y failover de proveedores. El consumidor solo itera los chunks.
     *
     * @param input - String, Message, or { role, content } object / String, Message, u objeto { role, content }
     * @param opts - Optional abort signal / Señal de aborto opcional
     * @yields StreamChunk objects (`assistant`, `thinking`, `tool_call`, `tool` roles)
     *
     * @example
     * ```typescript
     * for await (const chunk of agent.stream("Find the weather in Madrid")) {
     *   if (chunk.role === "assistant") process.stdout.write(chunk.content);
     *   if (chunk.role === "tool") console.log(`[${chunk.name}] ${chunk.content}`);
     * }
     * ```
     */
    async *stream(input: StreamInput, opts?: { signal?: AbortSignal }): AsyncGenerator<StreamChunk, void, unknown> {
        const raw_content = typeof input === "string" ? input : input.content;
        const prompt = typeof raw_content === "string" ? raw_content : "";
        let thinking = "";
        for (const branch of this.branches) {
            branch.messages = this.messages.concat(
                thinking ? new Message({ role: "system", content: thinking }) : []
            );
            const [m, s] = await branch.call(prompt, opts);
            if (s) {
                const last = m.filter((x) => x.role === "assistant" && x.content).at(-1)?.content;
                thinking = typeof last === "string" ? last : "";
            }
        }
        const count = this.messages.length;
        const message =
            input instanceof Message
                ? input
                : typeof input === "string"
                    ? new Message({ role: "user", content: input })
                    : new Message(input as any);
        this.messages = this.messages.concat(
            ...(thinking ? [new Message({ role: "system", content: thinking })] : []),
            message
        );
        try {
            const FALLBACK: Provider[] = [];
            const PROVIDERS: Provider[] = this.providers.concat()
            while ((PROVIDERS.length || FALLBACK.length)) {
                if (opts?.signal?.aborted) return;
                const provider =
                    PROVIDERS[Math.floor(Math.random() * PROVIDERS.length)] ??
                    FALLBACK[Math.floor(Math.random() * FALLBACK.length)];
                try {
                    let text_content = "";
                    let thinking_content = "";
                    let signature_content = "";
                    let has_tool_calls = false;
                    const chunks = provider!(this.context, { stream: true, signal: opts?.signal });
                    const tool_calls_acc: Map<number, { id: string; name: string; arguments: string }> = new Map();
                    for await (const chunk of chunks) {
                        if (chunk.type === "thinking_delta") {
                            thinking_content += chunk.content;
                            yield { role: "thinking", content: chunk.content };
                        }
                        if (chunk.type === "signature_delta") {
                            signature_content += chunk.content;
                        }
                        if (chunk.type === "text_delta") {
                            text_content += chunk.content;
                            yield { role: "assistant", content: chunk.content };
                        }
                        if (chunk.type === "tool_call_delta") {
                            has_tool_calls = true;
                            const existing = tool_calls_acc.get(chunk.index) ?? { id: "", name: "", arguments: "" };
                            if (chunk.id) existing.id = chunk.id;
                            if (chunk.name) existing.name = chunk.name;
                            if (chunk.arguments_delta) existing.arguments += chunk.arguments_delta;
                            tool_calls_acc.set(chunk.index, existing);
                        }
                    }
                    if (has_tool_calls) {
                        const tool_calls_arr = [...tool_calls_acc.values()].map((tc) => ({
                            id: tc.id,
                            type: "function" as const,
                            function: { name: tc.name, arguments: tc.arguments },
                        }));
                        this.messages = this.messages.concat(
                            new Message({ role: "assistant", content: text_content || null, tool_calls: tool_calls_arr, ...(thinking_content && { thinking: thinking_content, thinking_signature: signature_content }) })
                        );
                        for (const tc of tool_calls_arr) {
                            yield {
                                role: "tool_call",
                                name: tc.function.name,
                                tool_call_id: tc.id,
                                arguments: tc.function.arguments,
                            };
                        }
                        const results = await Promise.all(
                            tool_calls_arr.map(async (tc) => {
                                const tool = this.context.tools.find((t) => t.name === tc.function.name);
                                if (tool) {
                                    try {
                                        const params = tc.function.arguments ? JSON.parse(tc.function.arguments) : {};
                                        for (const hook of this.options.hooks?.PreFunc ?? []) {
                                            await hook(this, tool, params);
                                        }
                                        let result = await tool.func(this, params);
                                        for (const hook of this.options.hooks?.PostFunc ?? []) {
                                            result = await hook(this, tool, params, result);
                                        }
                                        return { id: tc.id, name: tc.function.name, content: JSON.stringify(result) };
                                    } catch (error: any) {
                                        return { id: tc.id, name: tc.function.name, content: error?.message ?? String(error) };
                                    }
                                } else return { id: tc.id, name: tc.function.name, content: `Function "${tc.function.name}" not found` };
                            })
                        );
                        for (const r of results) {
                            this.messages = this.messages.concat(
                                new Message({ role: "tool", tool_call_id: r.id, content: r.content })
                            );
                            yield { role: "tool", name: r.name, tool_call_id: r.id, content: r.content };
                        }
                        continue;
                    }
                    if (text_content) {
                        this.messages = this.messages.concat(
                            new Message({ role: "assistant", content: text_content, ...(thinking_content && { thinking: thinking_content, thinking_signature: signature_content }) })
                        );
                    }
                    return;
                } catch {
                    PROVIDERS.splice(PROVIDERS.indexOf(provider!), 1);
                    const idx = FALLBACK.indexOf(provider!);
                    if (idx !== -1) FALLBACK.splice(idx, 1);
                    else FALLBACK.push(provider!);
                }
            }
        } finally {
            if (thinking) this.messages = this.messages.filter((_, i) => i !== count);
        }
    }


}