import { Noop } from "@arcaelas/utils";
import OpenAI from "openai";

/**
 * @description
 * Opciones de proveedor.
 */
export interface ProviderOptions {
  /**
   * @description
   * URL base del proveedor.
   */
  baseURL: string;
  /**
   * @description
   * Modelo que será utilizado para el razonamiento.
   */
  model: string;
  /**
   * @description
   * Clave de API del proveedor.
   */
  apiKey?: string;
}

/**
 * @description
 * Opciones del agente.
 */
export interface AgentOptions {
  /**
   * @description
   * Nombre del agente, utilizado para identificar al agente durante toda la conversación.
   */
  name: string;

  /**
   * @description
   * Descripción del agente, será utilizado como system message durante toda la conversación para identificar la personalidad del agente.
   */
  description: string;

  /**
   * @description
   * Lista de limitaciones que se aplicarán a la conversación, antes de que el agente responda.
   */
  limits?: string[];

  /**
   * @description
   * Proveedores que serán utilizados para el razonamiento.
   */
  providers: ProviderOptions[];
}

/**
 * @description
 * Interfaz de tipado para las herramienta.
 */
export interface ToolOptions<T> {
  /**
   * @description
   * Descripción de la herramienta.
   */
  description: string;
  /**
   * @description
   * Parámetros de la herramienta.
   */
  parameters?: T;
  /**
   * @description
   * Función que se ejecutará cuando se use la herramienta.
   */
  func: Noop<[params: T extends object ? T : { input: string }], string>;
}

export default class Agent<T extends AgentOptions> {
  /**
   * @description
   * Nombre del agente
   */
  readonly name: string;
  /**
   * @description
   * Descripción del agente
   */
  readonly description: string;
  /**
   * @description
   * Lista de limitaciones que se aplicarán a la conversación, antes de que el agente responda.
   */
  readonly limits: string[];
  /**
   * @description
   * Proveedores que serán utilizados para el razonamiento.
   */
  private readonly providers: ProviderOptions[];
  constructor(options: T) {
    this.name = options.name;
    this.description = options.description;
    this.limits = options.limits || [];
    this.providers = options.providers;
  }

  /**
   * @description
   * Herramientas que serán utilizadas para el razonamiento.
   */
  private readonly tools = new Map<string, OpenAI.ChatCompletionTool>();

  /**
   * @description
   * Agrega una herramienta al agente.
   * @param name - Nombre de la herramienta.
   * @param options - Opciones de la herramienta.
   * @returns Retorna una función para eliminar la herramienta.
   */
  tool<T>(name: string, options: ToolOptions<T>): () => void;
  /**
   * @description
   * Agrega una herramienta al agente.
   * @param desc - Descripción de la herramienta.
   * @param func - Función que se ejecutará cuando se use la herramienta.
   * @returns Retorna una función para eliminar la herramienta.
   */
  tool(desc: string, func: Noop<[input: string], string>): () => void;
  tool(k: any, v: any) {
    if (this.tools.has(k)) throw new Error("Tool already exists");
    const tool: OpenAI.ChatCompletionTool = {
      type: "function",
      ["func" as any]: typeof v === "function" ? v : v.func,
      function: {
        name: typeof v === "function" ? Math.random().toString(36).slice(2) : k,
        description: typeof v === "function" ? k : v.description,
        parameters: {
          type: "object",
          properties: {},
        },
      },
    };
    for (const i in v.parameters ?? { input: "Entrada para la herramienta" }) {
      tool.function.parameters!.properties![i] = {
        type: "string",
        description: v.parameters?.[i],
      };
    }
    this.tools.set(k, tool);
    return () => {
      this.tools.delete(k);
    };
  }

  /**
   * Ejecuta la conversación resolviendo todas las herramientas que el modelo solicite.
   * Si todos los proveedores fallan o se supera MAX_LOOPS, devuelve un mensaje
   * de disculpa del asistente.
   *
   * @param messages Historial mutable de la conversación.
   * @returns Historial completo con todos los mensajes añadidos.
   */
  async answer(
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]
  ): Promise<OpenAI.Chat.Completions.ChatCompletionMessageParam[]> {
    /* 1 · Schemas de herramientas (omitimos `func` con `as any`) */
    const tools = [...this.tools.values()].map(
      ({ func, ...schema }: any) => schema
    ) as OpenAI.Chat.Completions.ChatCompletionTool[];

    /* 2 · Creamos un wrapper por proveedor con el modelo inyectado */
    const providers = this.providers.map(({ baseURL, apiKey, model }) => {
      const client = new OpenAI({ baseURL, apiKey });
      // prettier-ignore
      return (p: Omit<OpenAI.Chat.ChatCompletionCreateParams, 'model'>) =>
                client.chat.completions.create({ ...p, model }) as Promise<OpenAI.Chat.Completions.ChatCompletion>
    });

    /* 3 · Bucle principal (máx. 6) */
    for (let loop = 0; loop < 6; loop++) {
      /* 3a · Mientras queden proveedores válidos intentamos con uno */
      while (providers.length) {
        const idx = Math.floor(Math.random() * providers.length);
        const ask = providers[idx];

        let response: OpenAI.Chat.Completions.ChatCompletion;
        try {
          response = await ask({
            messages: [
              {
                role: "system",
                content: `Your name is "${this.name}"\n${
                  this.description || ""
                }`,
              },
              ...messages,
              ...(this.limits?.length
                ? [
                    {
                      role: "system",
                      content: `Rules for reply to user:\n${this.limits.join(
                        "\n"
                      )}`,
                    } as any,
                  ]
                : []),
            ],
            tools,
            tool_choice: "auto",
          });
        } catch {
          /* proveedor falló → lo descartamos y probamos otro */
          providers.splice(idx, 1);
          continue;
        }

        const { choices } = response;
        if (!choices.length) {
          /* Respuesta mal formada → descartamos proveedor y seguimos */
          providers.splice(idx, 1);
          continue;
        }

        /* 3b · Procesamos TODOS los choices en orden */
        for (const choice of choices) {
          /* ----- Caso 1 : no hay tool_calls → respuesta final ----- */
          if (choice.finish_reason !== "tool_calls") {
            messages.push({
              role: "assistant",
              content: choice.message.content ?? "",
            });
            return messages;
          }

          /* ----- Caso 2 : hay tool_calls → registrar + resolver ----- */
          messages.push({
            role: "assistant",
            content: choice.message.content ?? null,
            tool_calls: choice.message.tool_calls,
          });

          for (const call of choice.message.tool_calls ?? []) {
            const tool = this.tools.get(call.function.name);
            if (!tool) {
              messages.push({
                role: "tool",
                tool_call_id: call.id,
                content: `Tool "${call.function.name}" not found`,
              });
              continue;
            }

            /* argumentos vacíos o string vacío → {} */
            const argText = call.function.arguments ?? "";
            let args: Record<string, unknown> = {};

            if (argText.trim()) {
              try {
                args = JSON.parse(argText);
              } catch {
                messages.push({
                  role: "tool",
                  tool_call_id: call.id,
                  content: "Error: JSON.parse failed on tool arguments",
                });
                continue;
              }
            }

            try {
              const out = await (tool as any).func(args);
              messages.push({
                role: "tool",
                tool_call_id: call.id,
                content: out,
              });
            } catch (err: any) {
              messages.push({
                role: "tool",
                tool_call_id: call.id,
                content: err?.message ?? "Internal tool error",
              });
            }
          }
        }

        /* choices procesados correctamente → continuar outer loop */
        break;
      }

      /* 3c · Si ya no quedan proveedores, respondemos disculpa */
      if (!providers.length) {
        messages.push({
          role: "assistant",
          content: "No puedo ayudarte en este momento",
        });
        return messages;
      }
      /* → vuelve al loop (reenviará los nuevos mensajes) */
    }

    /* 4 · Superado MAX_LOOPS sin respuesta final */
    messages.push({
      role: "assistant",
      content: "No puedo responder ahora",
    });
    return messages;
  }
}
