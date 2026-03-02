/**
 * @fileoverview
 * SSE (Server-Sent Events) parser for streaming HTTP responses.
 *
 * Utilidad para parsear streams SSE desde respuestas HTTP.
 * Soporta el formato estándar `data: {...}\n` y el terminador `[DONE]`.
 * Incluye fallback para proveedores que retornan JSON plano en vez de SSE.
 *
 * @author Arcaelas Insiders
 * @version 1.0.0
 * @since 3.1.0
 */

/**
 * @description
 * Parses an SSE stream from a fetch Response into JSON objects.
 * Handles the standard SSE format (data: lines) and the [DONE] terminator.
 * Includes fallback for providers that return plain JSON instead of SSE.
 *
 * Parsea un stream SSE desde una Response de fetch en objetos JSON.
 * Maneja el formato SSE estándar (líneas data:) y el terminador [DONE].
 * Incluye fallback para proveedores que retornan JSON plano en vez de SSE.
 *
 * @param response - fetch Response with a readable body stream
 * @yields Parsed JSON objects from each SSE data line
 */
export async function* parse_sse(response: Response): AsyncGenerator<any, void, unknown> {
  if (!response.body) {
    throw new Error("No response body for streaming");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const first_read = await reader.read();
  if (first_read.done) return;

  buffer = decoder.decode(first_read.value, { stream: true });

  const trimmed_start = buffer.trimStart();
  if (trimmed_start.startsWith("{")) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
    }

    const data = JSON.parse(buffer);

    if (data.choices?.[0]?.message) {
      const message = data.choices[0].message;

      if (message.content) {
        yield {
          choices: [{
            index: 0,
            delta: { content: message.content },
            finish_reason: null,
          }],
        };
      }

      if (message.tool_calls?.length) {
        for (let i = 0; i < message.tool_calls.length; i++) {
          const tc = message.tool_calls[i];
          yield {
            choices: [{
              index: 0,
              delta: {
                tool_calls: [{
                  index: i,
                  id: tc.id,
                  type: "function",
                  function: { name: tc.function.name, arguments: tc.function.arguments },
                }],
              },
              finish_reason: null,
            }],
          };
        }
      }
    }

    return;
  }

  while (true) {
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data: ")) continue;

      const data = trimmed.slice(6);
      if (data === "[DONE]") return;

      try {
        yield JSON.parse(data);
      } catch { /* skip malformed chunk */ }
    }

    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
  }
}

/**
 * @description
 * Parses Anthropic's SSE stream format into normalized event objects.
 * Handles content_block_start, content_block_delta, and message_stop events.
 *
 * Parsea el formato SSE de Anthropic en objetos de evento normalizados.
 * Maneja eventos content_block_start, content_block_delta y message_stop.
 *
 * @param response - fetch Response with a readable body stream
 * @yields Objects with event type and parsed data
 */
export async function* parse_anthropic_sse(response: Response): AsyncGenerator<{ event: string; data: any }, void, unknown> {
  if (!response.body) {
    throw new Error("No response body for streaming");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let current_event = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith("event: ")) {
        current_event = trimmed.slice(7);
        continue;
      }

      if (trimmed.startsWith("data: ")) {
        try {
          const data = JSON.parse(trimmed.slice(6));
          yield { event: current_event, data };
        } catch { /* skip malformed chunk */ }
      }
    }
  }
}
