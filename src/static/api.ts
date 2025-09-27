/**
 * @fileoverview
 * Servidor HTTP local que simula la API de OpenAI Chat Completions usando Claude Code CLI.
 *
 * Este módulo proporciona un servidor HTTP que acepta payloads de OpenAI Chat Completions
 * y los procesa usando Claude Code CLI, devolviendo respuestas compatibles con OpenAI.
 *
 * @author Arcaelas Insiders
 * @version 2.0.0
 * @since 2.0.0
 */

import { execSync } from "child_process";
import * as http from "http";

/**
 * @description
 * Procesa un payload de OpenAI Chat Completions usando Claude Code CLI.
 *
 * @param payload - Payload de OpenAI Chat Completions a procesar
 * @returns Respuesta compatible con OpenAI Chat Completions
 */
const process_with_claude = (payload: any): any => {
  try {
    const result = execSync("claude -p --model sonnet --max-turns 1", {
      input: `TASK: Convert OpenAI payload to JSON response. Be direct, no explanation.

PAYLOAD: ${JSON.stringify(payload)}

OUTPUT FORMAT (choose one):
Simple: {"choices":[{"message":{"role":"assistant","content":"RESPONSE_TEXT"},"finish_reason":"stop"}]}
Tools: {"choices":[{"message":{"role":"assistant","content":null,"tool_calls":[{"id":"call_12345","type":"function","function":{"name":"TOOL_NAME","arguments":"{\\"param\\":\\"value\\"}"}}]},"finish_reason":"tool_calls"}]}

JSON ONLY:`,
      encoding: "utf8",
      timeout: 15000,
    }) as string;

    const response = JSON.parse(
      ((result.match(/```(?:json)?\n?([\s\S]*?)\n?```/)?.[1] ||
        result.match(/\{[\s\S]*\}/)?.[0] ||
        result)
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
        .trim())
    );

    if (!response.choices?.length) {
      throw new Error("Invalid response structure");
    }

    return response;
  } catch (error: any) {
    return {
      choices: [
        {
          message: {
            role: "assistant",
            content: `Error: ${error.message}`,
          },
          finish_reason: "stop",
        },
      ],
    };
  }
};

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  console.log(`📨 ${req.method} ${req.url}`);

  if (req.method === "POST" && req.url === "/chat/completions") {
    let body = "";
    req.on("data", (chunk) => (body += chunk.toString()));
    req.on("end", () => {
      try {
        const payload = JSON.parse(body);
        const response = process_with_claude(payload);

        res.writeHead(200);
        res.end(
          JSON.stringify({
            ...response,
            id: `local_${Date.now()}`,
            object: "chat.completion",
            created: Math.floor(Date.now() / 1000),
            model: payload.model || "claude-local",
            usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
          })
        );
      } catch (error: any) {
        res.writeHead(400);
        res.end(
          JSON.stringify({
            error: {
              message: `Invalid request: ${error.message}`,
              type: "invalid_request_error",
            },
          })
        );
      }
    });
    return;
  }

  if (req.method === "GET" && req.url === "/models") {
    res.writeHead(200);
    res.end(
      JSON.stringify({
        data: [
          {
            id: "claude-local",
            object: "model",
            created: Math.floor(Date.now() / 1000),
            owned_by: "claude-code",
          },
        ],
      })
    );
    return;
  }

  res.writeHead(404);
  res.end(
    JSON.stringify({
      error: { message: "Not found", type: "not_found_error" },
    })
  );
});

const PORT = 3000;

server.listen(PORT, () => {
  console.log(`🚀 Claude Code API Server: http://localhost:${PORT}`);
  console.log("📍 POST /chat/completions | GET /models");
  console.log("⏹️  Ctrl+C to stop");
});

process.on("SIGINT", () => {
  console.log("\n⏹️  Stopping server...");
  server.close(() => process.exit(0));
});
