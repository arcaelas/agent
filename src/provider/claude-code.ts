import { createSdkMcpServer, query, tool as sdkTool } from "@anthropic-ai/claude-agent-sdk";
import { mkdtempSync, readFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { z } from "zod";
import type { ChatCompletionResponse, Provider, ProviderChunk } from "~/lib/agent";
import type Context from "~/lib/context";

const MODELS: Record<string, string> = { opus: "claude-opus-4-6", sonnet: "claude-sonnet-4-6", haiku: "claude-haiku-4-5-20251001" };

const THINKING: Record<string, { type: string; budgetTokens?: number }> = {
  none: { type: "disabled" },
  low: { type: "enabled", budgetTokens: 4096 },
  medium: { type: "enabled", budgetTokens: 16384 },
  high: { type: "adaptive" },
};

export interface ClaudeCodeOptions {
  /**
   * @description
   * Model name or alias: "opus" | "sonnet" | "haiku" | full model id.
   * Nombre o alias del modelo: "opus" | "sonnet" | "haiku" | id completo del modelo.
   */
  model?: string;
  /**
   * @description
   * Thinking level: "none" | "low" | "medium" | "high".
   * Nivel de pensamiento: "none" | "low" | "medium" | "high".
   */
  think?: string;
  /**
   * @description
   * Path to the directory containing .credentials.json (OAuth).
   * Ruta al directorio que contiene .credentials.json (OAuth).
   */
  dirname: string;
  /**
   * @description
   * Max agentic turns for tool execution (default: 20).
   * Turnos agenticos maximos para ejecucion de tools (default: 20).
   */
  maxTurns?: number;
}

export default interface ClaudeCode extends Provider { }
export default class ClaudeCode extends Function {
  constructor(options: ClaudeCodeOptions) {
    super();

    const model = MODELS[options.model ?? "sonnet"] ?? options.model!;
    const thinking = THINKING[options.think ?? "none"];
    const maxTurns = options.maxTurns ?? 20;

    const creds = JSON.parse(readFileSync(join(options.dirname, ".credentials.json"), "utf-8"));
    const token: string = creds.claudeAiOauth?.accessToken;
    if (!token) throw new Error(`No OAuth token in ${options.dirname}/.credentials.json`);

    const env: Record<string, string> = {};
    for (const [k, v] of Object.entries(process.env)) {
      if (k !== "CLAUDECODE" && k !== "CLAUDE_CODE_ENTRY_POINT" && v != null) env[k] = v;
    }
    env.CLAUDE_CODE_OAUTH_TOKEN = token;
    delete env.ANTHROPIC_API_KEY;

    return ((ctx: Context, opts?: { stream?: true; signal?: AbortSignal }): any => {
      const mcpName = "agent-tools";
      const mcp = mcpFromTools(ctx.tools, mcpName);
      const allowed = new Set(mcp ? ctx.tools.map((t) => `mcp__${mcpName}__${t.name}`) : []);

      const ac = opts?.signal ? new AbortController() : undefined;
      if (opts?.signal?.aborted) ac!.abort(opts.signal.reason);
      else opts?.signal?.addEventListener("abort", () => ac!.abort(opts!.signal!.reason), { once: true });

      const systemParts = ctx.rules.map((r) => r.description);
      for (const m of ctx.messages) {
        const j = m.toJSON();
        if (j.role === "system") systemParts.push(j.content as string);
      }

      const conv = ctx.messages.map((m) => m.toJSON()).filter((m) => m.role === "user" || m.role === "assistant");
      const prompt = conv.length
        ? (async function* () {
          for (let i = 0; i < conv.length; i++) {
            const m = conv[i];
            const content = [{ type: "text" as const, text: (m.content as string) ?? "" }];
            const isLast = i === conv.length - 1;
            if (m.role === "user") yield { type: "user" as const, message: { role: "user" as const, content }, parent_tool_use_id: null, ...(!isLast && { isSynthetic: true }) };
            else yield { type: "assistant" as const, message: { role: "assistant" as const, content }, parent_tool_use_id: null, isSynthetic: true } as any;
          }
        })()
        : "";

      const qOpts: any = {
        model, thinking, maxTurns,
        systemPrompt: systemParts.filter(Boolean).join("\n\n") || undefined,
        tools: [] as string[],
        ...(mcp ? { mcpServers: { [mcpName]: mcp } } : {}),
        ...([...allowed].length ? { allowedTools: [...allowed] } : {}),
        permissionMode: "bypassPermissions",
        allowDangerouslySkipPermissions: true,
        settingSources: [] as string[],
        persistSession: false,
        cwd: mkdtempSync(join(tmpdir(), "agent-")),
        env,
        hooks: { PreToolUse: [{ hooks: [async (input: any) => allowed.has(input.tool_name) ? { decision: "allow" } : { decision: "deny", reason: "Tool not found" }] }] },
        ...(ac ? { abortController: ac } : {}),
        ...(opts?.stream && thinking.type === "disabled" ? { includePartialMessages: true } : {}),
      };

      if (!opts?.stream) return run(prompt, qOpts);
      return stream(prompt, qOpts, thinking.type !== "disabled");
    }) as any;
  }
}

// ─── Internals ───────────────────────────────────────────────────────────────

function mcpFromTools(tools: Context["tools"], name: string) {
  if (!tools.length) return null;
  return createSdkMcpServer({
    name,
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
          const s = typeof r === "string" ? r : JSON.stringify(r) ?? String(r);
          return { content: [{ type: "text" as const, text: s }] };
        } catch (e: any) {
          return { content: [{ type: "text" as const, text: `Error: ${e.message}` }] };
        }
      });
    }),
  });
}

async function run(prompt: any, opts: any): Promise<ChatCompletionResponse> {
  try {
    let last: any = null;
    let result: any = null;

    for await (const msg of query({ prompt, options: opts })) {
      if (msg.type === "assistant" && !(msg as any).parent_tool_use_id) {
        const c = (msg as any).message?.content ?? [];
        if (c.some((b: any) => b.type === "text" && b.text)) last = (msg as any).message;
      }
      if (msg.type === "result") result = msg;
    }

    const text = last
      ? last.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("")
      : result?.subtype === "success" ? (result.result ?? "") : null;
    const usage = last?.usage ?? result?.usage;

    if (text === null) throw new Error(`ClaudeCode: ${result?.subtype ?? "no response"}`);

    return {
      id: last?.id ?? `sdk-${Date.now()}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: last?.model ?? opts.model,
      choices: [{ index: 0, message: { role: "assistant", content: text }, finish_reason: "stop" }],
      usage: { prompt_tokens: usage?.input_tokens ?? 0, completion_tokens: usage?.output_tokens ?? 0, total_tokens: (usage?.input_tokens ?? 0) + (usage?.output_tokens ?? 0) },
    };
  } finally {
    try { rmSync(opts.cwd, { recursive: true, force: true }); } catch { }
  }
}

async function* stream(prompt: any, opts: any, fallback: boolean): AsyncGenerator<ProviderChunk> {
  const cwd = opts.cwd;
  try {
    if (fallback) {
      const r = await run(prompt, { ...opts, cwd: mkdtempSync(join(tmpdir(), "agent-")) });
      if (r.choices[0]?.message?.content) yield { type: "text_delta", content: r.choices[0].message.content };
      yield { type: "finish", finish_reason: "stop" };
      return;
    }

    let done = false;
    for await (const msg of query({ prompt, options: opts })) {
      if (msg.type !== "stream_event") continue;
      const ev = (msg as any).event;
      if (ev.type === "content_block_delta" && ev.delta?.type === "thinking_delta" && ev.delta.thinking)
        yield { type: "thinking_delta", content: ev.delta.thinking };
      if (ev.type === "content_block_delta" && ev.delta?.type === "text_delta" && ev.delta.text)
        yield { type: "text_delta", content: ev.delta.text };
      if (ev.type === "message_delta" && ev.delta?.stop_reason === "end_turn") {
        done = true;
        yield { type: "finish", finish_reason: "stop" };
      }
    }
    if (!done) yield { type: "finish", finish_reason: "stop" };
  } finally {
    try { rmSync(cwd, { recursive: true, force: true }); } catch { }
  }
}
