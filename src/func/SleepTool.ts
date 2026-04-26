import { z } from "zod";
import Agent from "~/lib/agent";
import Tool from "~/lib/tool";

/**
 * Tool that pauses the agent loop for a number of seconds.
 * Useful to avoid rate limits or to space out consecutive operations.
 *
 * @example
 * agent.tools = [new SleepTool()];        // default cap 60s
 * agent.tools = [new SleepTool(120)];     // custom cap 120s
 */
export default class SleepTool extends Tool {
  constructor(maxSeconds: number = 60) {
    super("sleep", {
      description: `Pause execution for a number of seconds before continuing. Use this to wait between rate-limited calls or to space out operations. Maximum ${maxSeconds} seconds per call.`,
      parameters: z.object({
        seconds: z
          .number()
          .min(0)
          .max(maxSeconds)
          .describe(`Number of seconds to wait (0 to ${maxSeconds}).`),
      }),
      func: async (_agent: Agent, args: { seconds: number }) => {
        const s = Math.max(0, Math.min(maxSeconds, args.seconds));
        await new Promise((r) => setTimeout(r, s * 1000));
        return `Waited ${s} seconds.`;
      },
    });
  }
}
