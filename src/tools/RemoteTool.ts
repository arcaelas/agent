/**
 * @fileoverview
 * Implementación de una herramienta remota para agentes de IA.
 *
 * @author Arcaelas Insiders
 * @version 2.0.0
 * @since 2.0.0
 *
 * @example
 * ```typescript
 * const remoteTool = new RemoteTool({
 *   name: "remote_tool",
 *   description: "Herramienta remota para obtener información",
 *   http: {
 *     method: "GET",
 *     headers: {
 *       "Content-Type": "application/json",
 *     },
 *     url: "https://api.example.com/data",
 *   },
 *   parameters: {
 *     id: "ID de la herramienta",
 *   },
 * });
 * ```
 */
import Tool, { ToolOptions } from "~/static/tool";

interface RemoteToolOptions extends Omit<ToolOptions, "func"> {
  /**
   * HTTP options for the remote tool
   */
  http: {
    /**
     * HTTP method
     */
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    /**
     * HTTP headers
     */
    headers: Record<string, string>;
    /**
     * HTTP URL
     */
    url: string;
  };
}

export default class RemoteTool extends Tool {
  constructor(name: string, options: RemoteToolOptions) {
    super(name, {
      ...options,
      func: async (args: Record<string, string>) => {
        return await fetch(options.http.url, {
          method: options.http.method,
          headers: options.http.headers,
          body: JSON.stringify(args),
        }).then((res) => res.text());
      },
    });
  }
}
