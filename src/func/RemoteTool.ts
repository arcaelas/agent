import Agent from "~/lib/agent";
import Tool, { ToolOptions } from "~/lib/tool";

interface RemoteToolOptions extends Omit<ToolOptions, "func"> {
  /** HTTP request configuration: method, headers and URL. */
  http: {
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    headers: Record<string, string>;
    url: string;
  };
}

/**
 * Tool that performs an HTTP request when invoked.
 * GET serializes args as query string. Other methods serialize as JSON body.
 * Returns the response body as text, or a JSON error payload on failure.
 *
 * @example
 * new RemoteTool("send_notification", {
 *   description: "Send a push notification to a user.",
 *   parameters: { user_id: "Recipient user id", message: "Notification body" },
 *   http: {
 *     method: "POST",
 *     headers: { Authorization: "Bearer ...", "Content-Type": "application/json" },
 *     url: "https://push.example.com/v1/send",
 *   },
 * });
 */
export default class RemoteTool extends Tool {
  constructor(name: string, options: RemoteToolOptions) {
    super(name, {
      ...options,
      func: async (_agent: Agent, args: Record<string, any>) => {
        try {
          let url = options.http.url;
          const config: RequestInit = {
            method: options.http.method,
            headers: options.http.headers,
          };

          if (options.http.method === "GET" && Object.keys(args).length > 0) {
            const params = new URLSearchParams(args);
            url = `${url}?${params}`;
          } else if (options.http.method !== "GET") {
            config.body = JSON.stringify(args);
          }

          const response = await fetch(url, config);
          if (!response.ok) {
            return JSON.stringify({ error: true, status: response.status, message: response.statusText });
          }
          return await response.text();
        } catch (error) {
          return JSON.stringify({
            error: true,
            message: error instanceof Error ? error.message : "Unknown error",
          });
        }
      },
    });
  }
}
