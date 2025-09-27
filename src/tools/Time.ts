import { Tool, ToolOptions } from "..";

export default class TimeTool extends Tool {
  constructor(options: Omit<ToolOptions, "func">) {
    super("get_time", {
      ...options,
      description: "Get the current time from the system",
      parameters: {
        timeZone:
          "Optional - Time zone to get the time from, if not provided, the time zone of the system will be used",
      },
      func: (args: { timeZone: string }) => {
        args.timeZone ||= new Date().toString().split(" ")[5];
        return new Date().toLocaleString("en-US", { timeZone: args.timeZone });
      },
    });
  }
}
