import Agent, { Provider } from "~/lib/agent";
import Rule from "~/lib/rule";
import Tool from "~/lib/tool";

export interface AgentToolOptions {
  name: string;
  description: string;
  providers: Provider[];
  rules?: Rule | Rule[];
}

/**
 * Tool whose execution is delegated to an internal sub-agent.
 * The parent LLM invokes it like any other tool; the sub-agent processes
 * the prompt with its own loop (providers + rules) and returns the final
 * assistant text as the tool result.
 *
 * @example
 * new AgentTool({
 *   name: "summarize",
 *   description: "Summarize a long text into a single concise sentence.",
 *   providers: [openai()],
 *   rules: [new Rule("Reply with ONE concise sentence, no preamble.")],
 * });
 */
export default class AgentTool extends Tool {
  constructor(options: AgentToolOptions) {
    const subAgent = new Agent({
      name: options.name,
      description: options.description,
      providers: options.providers,
      rules: options.rules,
    });

    super(options.name, {
      description: options.description,
      parameters: {
        prompt: "The exact instruction or question to send to the sub-agent. MUST be a complete, self-contained string.",
      },
      func: async (_parent: Agent, args: { prompt: string }) => {
        subAgent.messages = [];
        const [msgs, ok] = await subAgent.call(args.prompt ?? "");
        if (!ok) return "AgentTool: sub-agent execution failed";
        return msgs.filter((m) => m.role === "assistant" && m.content).at(-1)?.content ?? "";
      },
    });
  }
}
