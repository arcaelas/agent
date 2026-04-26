import Message, { MessageOptions } from "./message";
import Metadata from "./metadata";
import Rule from "./rule";
import Tool from "./tool";

/**
 * Container that mixes metadata, rules, tools, messages and parent contexts.
 * Reading combines inherited (parents) + local; writing only affects locals.
 *
 * @example
 * new Context({
 *   context: parent,
 *   metadata: { app: "MyApp" },
 *   rules: ["Be concise"],
 *   tools: [search],
 *   messages: [{ role: "user", content: "hi" }],
 * });
 */
export interface ContextOptions {
  context?: Context | Context[];
  metadata?: Metadata | Metadata[] | Record<string, string>;
  rules?: Rule | Rule[] | string | string[];
  tools?: Tool | Tool[];
  messages?: Message | Message[] | MessageOptions | MessageOptions[];
}

export default class Context {
  readonly metadata: Metadata;
  private readonly _contexts: Context[];
  private readonly _rules: Rule[];
  private readonly _tools: Tool[];
  private readonly _messages: Message[];

  constructor(options: ContextOptions = {}) {
    this._contexts = ([] as Context[])
      .concat(options.context ?? [])
      .filter((c): c is Context => c instanceof Context);

    this._rules = ([] as (Rule | string)[])
      .concat(options.rules ?? [])
      .flatMap((r) =>
        r instanceof Rule ? [r] : typeof r === "string" && r.trim() ? [new Rule(r)] : []
      );

    this._tools = ([] as Tool[])
      .concat(options.tools ?? [])
      .filter((t): t is Tool => t instanceof Tool);

    this._messages = ([] as (Message | MessageOptions)[])
      .concat(options.messages ?? [])
      .flatMap((m) =>
        m instanceof Message
          ? [m]
          : m && typeof m === "object" && "role" in m
            ? [new Message(m as MessageOptions)]
            : []
      );

    const metaInputs = ([] as (Metadata | Record<string, string>)[]).concat(options.metadata ?? []);
    const metaInstances = metaInputs.flatMap((m) => {
      if (m instanceof Metadata) return [m];
      if (m && typeof m === "object") {
        const md = new Metadata();
        for (const [k, v] of Object.entries(m)) md.set(k, v as string);
        return [md];
      }
      return [];
    });

    this.metadata = new Metadata(...this._contexts.map((c) => c.metadata), ...metaInstances);
  }

  get rules(): Rule[] {
    return this._contexts.flatMap((c) => c.rules).concat(this._rules);
  }

  set rules(next: Rule[]) {
    const inherited = this._contexts.flatMap((c) => c.rules);
    this._rules.length = 0;
    this._rules.push(...next.filter((r) => r instanceof Rule && !inherited.includes(r)));
  }

  get tools(): Tool[] {
    const all = [...this._contexts.flatMap((c) => c.tools), ...this._tools];
    return Object.values(
      all.reduce((acc, t) => ({ ...acc, [t.name]: t }), {} as Record<string, Tool>)
    );
  }

  set tools(next: Tool[]) {
    const inherited = this._contexts.flatMap((c) => c.tools);
    this._tools.length = 0;
    this._tools.push(...next.filter((t) => t instanceof Tool && !inherited.includes(t)));
  }

  get messages(): Message[] {
    return this._contexts.flatMap((c) => c.messages).concat(this._messages);
  }

  set messages(next: Message[]) {
    const inherited = this._contexts.flatMap((c) => c.messages);
    this._messages.length = 0;
    this._messages.push(...next.filter((m) => m instanceof Message && !inherited.includes(m)));
  }
}
