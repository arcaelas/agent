import { z } from "zod";
import Agent from "~/lib/agent";
import Tool from "~/lib/tool";

export type ChoiceHandler = (question: string, choices: string[]) => string | Promise<string>;

/**
 * Tool that asks the user to pick ONE option from a list and returns the choice.
 * The LLM provides the question and the valid options; the consumer decides how
 * to present them and is responsible for validation/retry inside the handler.
 *
 * @example
 * new ChoiceTool(function pick(q, opts) {
 *   const v = prompt(`${q}\n${opts.join(", ")}`) ?? "";
 *   return opts.includes(v) ? v : pick(q, opts);
 * });
 */
export default class ChoiceTool extends Tool {
  constructor(handler: ChoiceHandler) {
    super("ask_user_choice", {
      description:
        "Ask the user to pick ONE option from a list. Use when the answer must be one of a known set of values.",
      parameters: z.object({
        question: z.string().describe("The question to ask the user."),
        choices: z.array(z.string()).describe("The list of valid options the user can pick from."),
      }),
      func: async (_agent: Agent, args: { question: string; choices: string[] }) =>
        await handler(args.question, args.choices),
    });
  }
}
