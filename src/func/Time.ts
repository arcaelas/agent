import Agent from "~/lib/agent";
import Tool from "~/lib/tool";

/**
 * Tool that returns the current date and time.
 * Resolves to the configured IANA timezone or the system one as fallback.
 *
 * @example
 * agent.tools = [new TimeTool({ time_zone: "Europe/Madrid" })];
 */
export default class TimeTool extends Tool {
  constructor(options: { time_zone?: string } = {}) {
    super("get_time", {
      description:
        "Returns the current date and time. MUST be called whenever the user asks for the current time, the date, or what time it is in a specific city or timezone.",
      parameters: {
        time_zone:
          "Optional IANA timezone identifier (e.g. 'Europe/Madrid', 'Asia/Tokyo'). Omit to use the system timezone.",
      },
      func: (_agent: Agent, args: { time_zone: string }) => {
        const tz = args.time_zone || options.time_zone || Intl.DateTimeFormat().resolvedOptions().timeZone;
        return new Date().toLocaleString("en-US", { timeZone: tz });
      },
    });
  }
}
