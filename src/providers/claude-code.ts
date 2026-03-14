import type { ChatCompletionResponse, Provider, ProviderChunk } from "~/static/agent";
import type Context from "~/static/context";
import { query, tool as sdkTool, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { readFileSync } from "fs";
import { join } from "path";

const MODEL_ALIAS: Record<string, string> = {
  opus: "claude-opus-4-6",
  sonnet: "claude-sonnet-4-6",
  haiku: "claude-haiku-4-5-20251001",
};

type ThinkLevel = "none" | "low" | "medium" | "high";

const THINKING: Record<ThinkLevel, { type: string; budgetTokens?: number }> = {
  none: { type: "disabled" },
  low: { type: "enabled", budgetTokens: 4096 },
  medium: { type: "enabled", budgetTokens: 16384 },
  high: { type: "adaptive" },
};

export interface ClaudeCodeOptions {
  /** Model name or alias: "opus" | "sonnet" | "haiku" | full model id */
  model?: string;
  /** Thinking level: "none" | "low" | "medium" | "high" */
  think?: ThinkLevel;
  /** Path to the directory containing .credentials.json (OAuth) */
  dirname: string;
  /** Max agentic turns for tool execution (default: 20) */
  maxTurns?: number;
}

export default interface ClaudeCode extends Provider {}
export default class ClaudeCode extends Function {
  constructor(options: ClaudeCodeOptions) {
    super();

    const model = MODEL_ALIAS[options.model ?? "sonnet"] ?? options.model!;
    const thinking = THINKING[options.think ?? "none"];
    const maxTurns = options.maxTurns ?? 20;

    const credPath = join(options.dirname, ".credentials.json");
    const creds = JSON.parse(readFileSync(credPath, "utf-8"));
    const token: string = creds.claudeAiOauth?.accessToken;
    if (!token) throw new Error(`No OAuth token in ${credPath}`);

    const env: Record<string, string> = {};
    for (const [k, v] of Object.entries(process.env)) {
      if (k !== "CLAUDECODE" && k !== "CLAUDE_CODE_ENTRY_POINT" && v != null) env[k] = v;
    }
    env.CLAUDE_CODE_OAUTH_TOKEN = token;
    delete env.ANTHROPIC_API_KEY;

    const buildOpts = (ctx: Context, stream: boolean) => {
      const name = "agent-tools";
      const mcp = mcpFromTools(ctx.tools, name);
      const allowed = mcp ? ctx.tools.map((t) => `mcp__${name}__${t.name}`) : [];
      return {
        mcp,
        query: {
          model,
          thinking,
          systemPrompt: ctx.rules.map((r) => r.description).join("\n\n") || undefined,
          maxTurns,
          ...(mcp ? { mcpServers: { [name]: mcp } } : {}),
          ...(allowed.length ? { allowedTools: allowed } : {}),
          permissionMode: "bypassPermissions" as any,
          allowDangerouslySkipPermissions: true,
          settingSources: [] as string[],
          persistSession: false,
          cwd: process.cwd(),
          env,
          ...(stream && thinking.type === "disabled" ? { includePartialMessages: true } : {}),
        },
      };
    };

    return ((ctx: Context, streamOpts?: { stream: true }): any => {
      const text = lastUserMsg(ctx);
      const { mcp, query: qOpts } = buildOpts(ctx, !!streamOpts?.stream);
      const prompt = mcp ? userStream(text) : text;

      if (!streamOpts?.stream) return nonStreaming(prompt, qOpts);
      if (thinking.type !== "disabled") return thinkingFallback(prompt, qOpts);
      return streaming(prompt, qOpts);
    }) as any;
  }
}

// ─── Internals ───────────────────────────────────────────────────────────────

function lastUserMsg(ctx: Context): string {
  for (let i = ctx.messages.length - 1; i >= 0; i--) {
    const m = ctx.messages[i].toJSON();
    if (m.role === "user") return (m.content as string) ?? "";
  }
  return "";
}

function userStream(text: string) {
  return (async function* () {
    yield {
      type: "user" as const,
      message: { role: "user" as const, content: [{ type: "text" as const, text }] },
      parent_tool_use_id: null,
    };
  })();
}

function serialize(v: any): string {
  if (v === undefined) return "undefined";
  if (typeof v === "function") return "[Function]";
  if (typeof v === "bigint") return v.toString();
  try { return JSON.stringify(v); } catch { return String(v); }
}

function mcpFromTools(tools: Context["tools"], serverName: string) {
  if (!tools.length) return null;
  return createSdkMcpServer({
    name: serverName,
    version: "1.0.0",
    tools: tools.map((t) => {
      const j = t.toJSON();
      const isZod = t.parameters && typeof (t.parameters as any).parse === "function";
      const schema: Record<string, any> = isZod
        ? { ...(t.parameters as any).shape }
        : Object.fromEntries(
            Object.entries(j.function.parameters.properties ?? {}).map(([k, v]) => [
              k,
              z.string().describe((v as any).description || k),
            ])
          );
      return sdkTool(j.function.name, j.function.description || j.function.name, schema, async (args: any) => {
        try {
          const r = await t.func(null as any, args);
          return { content: [{ type: "text" as const, text: serialize(r) }] };
        } catch (e: any) {
          return { content: [{ type: "text" as const, text: `Error: ${e.message}` }] };
        }
      });
    }),
  });
}

function textFrom(content: any[]): string {
  return content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
}

function toCompletion(id: string, model: string, content: string, usage?: any): ChatCompletionResponse {
  return {
    id,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [{ index: 0, message: { role: "assistant", content }, finish_reason: "stop" }],
    usage: {
      prompt_tokens: usage?.input_tokens ?? 0,
      completion_tokens: usage?.output_tokens ?? 0,
      total_tokens: (usage?.input_tokens ?? 0) + (usage?.output_tokens ?? 0),
    },
  };
}

async function nonStreaming(prompt: any, opts: any): Promise<ChatCompletionResponse> {
  let last: any = null;
  let result: any = null;

  for await (const msg of query({ prompt, options: opts })) {
    if (msg.type === "assistant" && !(msg as any).parent_tool_use_id) {
      const c = (msg as any).message?.content ?? [];
      if (c.some((b: any) => b.type === "text" && b.text)) last = (msg as any).message;
    }
    if (msg.type === "result") result = msg;
  }

  if (last) return toCompletion(last.id ?? `sdk-${Date.now()}`, last.model ?? opts.model, textFrom(last.content), last.usage);
  if (result?.subtype === "success") return toCompletion(`sdk-${Date.now()}`, opts.model, result.result ?? "", result.usage);
  throw new Error(`ClaudeCode: ${result?.subtype ?? "no response"}`);
}

async function* streaming(prompt: any, opts: any): AsyncGenerator<ProviderChunk> {
  let done = false;
  for await (const msg of query({ prompt, options: opts })) {
    if (msg.type !== "stream_event") continue;
    const ev = (msg as any).event;
    if (ev.type === "content_block_delta" && ev.delta?.type === "text_delta" && ev.delta.text)
      yield { type: "text_delta", content: ev.delta.text };
    if (ev.type === "message_delta" && ev.delta?.stop_reason === "end_turn") {
      done = true;
      yield { type: "finish", finish_reason: "stop" };
    }
  }
  if (!done) yield { type: "finish", finish_reason: "stop" };
}

async function* thinkingFallback(prompt: any, opts: any): AsyncGenerator<ProviderChunk> {
  const r = await nonStreaming(prompt, opts);
  const t = r.choices[0]?.message?.content;
  if (t) yield { type: "text_delta", content: t };
  yield { type: "finish", finish_reason: "stop" };
}
