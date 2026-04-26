import { z } from "zod";
import Agent from "~/lib/agent";
import Tool from "~/lib/tool";

export type AskHandler = (question: string) => string | Promise<string>;

/**
 * Tool that asks the user a free-form question and returns their reply.
 * The LLM provides the question; the consumer decides how to present it
 * (CLI prompt, browser modal, async queue, etc.) via the handler.
 *
 * @example
 * new AskTool(q => prompt(q) ?? "");
 */
export default class AskTool extends Tool {
  constructor(handler: AskHandler) {
    super("ask_user", {
      description:
        "Ask the user a free-form question and wait for their text reply. Use when you need information only the user can provide.",
      parameters: z.object({
        question: z.string().describe("The question to ask the user, in their own language."),
      }),
      func: async (_agent: Agent, args: { question: string }) => await handler(args.question),
    });
  }
}
