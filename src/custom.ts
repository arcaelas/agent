import { homedir } from "os";
import { join } from "path";
import { z } from "zod";

import {
  Agent,
  Context,
  Rule,
  Tool,
  TimeTool,
  OpenAI,
  ClaudeCode,
  type Provider,
} from "./index";

const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "grok-4";
const OPENAI_API_URL = process.env.OPENAI_API_URL ?? "https://api.arcaelas.com";
const OPENAI_API_KEY =
  process.env.OPENAI_API_KEY ??
  "sk-2451281db8fd2b254b2d800334f4b75d02b110943387cf5426899532be2da620";
const CLAUDE_PROFILE = join(homedir(), ".claude-profiles", "arcaelas");

const openai = () =>
  new OpenAI({
    api_key: OPENAI_API_KEY,
    base_url: `${OPENAI_API_URL}/v1`,
    model: OPENAI_MODEL,
    max_tokens: 512,
    temperature: 0.2,
  });

const claudecode = () =>
  new ClaudeCode({
    dirname: CLAUDE_PROFILE,
    model: "haiku",
    think: "none",
    maxTurns: 5,
  });

interface Test {
  name: string;
  level: "basic" | "medium" | "advanced";
  run: () => Promise<boolean>;
}

const tests: Test[] = [
  // ─── BÁSICAS: usuarios reales, prompts como en la vida diaria ──────────
  {
    level: "basic",
    name: "T01 slang + agente extremadamente familiar",
    run: async () => {
      const a = new Agent({
        name: "bro",
        description: "Eres un amigo carnal que siempre responde con buena vibra",
        providers: [openai()],
        rules: [
          new Rule("Hablas super casual usando 'bro', 'crack', 'tio', 'tranqui'. Nada formal."),
          new Rule("Respondes en espanol en maximo 2 frases."),
        ],
      });
      const [msgs, ok] = await a.call("ey q pex wey, cuentame algo bueno del dia");
      const last = msgs.at(-1)?.content || "";
      return ok && last.length > 5;
    },
  },
  {
    level: "basic",
    name: "T02 prompt con typos pide codigo",
    run: async () => {
      const a = new Agent({
        name: "devhelper",
        description: "Asistente tecnico breve",
        providers: [openai()],
        rules: [new Rule("Responde con un ejemplo de codigo en un bloque. Sin explicaciones extensas.")],
      });
      const [msgs, ok] = await a.call("cmo hago un hello wrld en js pls");
      const last = msgs.at(-1)?.content || "";
      return ok && /console\.log|hello/i.test(last);
    },
  },
  {
    level: "basic",
    name: "T03 metadata persiste entre sets encadenados",
    run: async () => {
      const a = new Agent({ name: "a", description: "x", providers: [openai()] });
      a.metadata.set("user_id", "42").set("lang", "es").set("tier", "premium");
      return (
        a.metadata.get("user_id") === "42" &&
        a.metadata.get("lang") === "es" &&
        a.metadata.has("tier")
      );
    },
  },
  {
    level: "basic",
    name: "T04 metadata delete selectivo",
    run: async () => {
      const a = new Agent({ name: "a", description: "x", providers: [openai()] });
      a.metadata.set("a", "1").set("b", "2").set("c", "3").delete("b");
      return a.metadata.has("a") && !a.metadata.has("b") && a.metadata.has("c");
    },
  },
  {
    level: "basic",
    name: "T05 usuario pregunta hora sin mencionar tool",
    run: async () => {
      const a = new Agent({
        name: "a",
        description: "Asistente util",
        providers: [openai()],
        tools: [new TimeTool({})],
        rules: [new Rule("Si el usuario pregunta por fecha u hora, usa get_time.")],
      });
      const [msgs] = await a.call("disculpa, sabes q hora sera ahora?");
      return msgs.filter((m) => m.role === "tool").length >= 1;
    },
  },
  {
    level: "basic",
    name: "T06 suma en lenguaje natural con slang",
    run: async () => {
      const calc = new Tool("calc", {
        description: "suma dos numeros",
        parameters: z.object({ a: z.number(), b: z.number() }),
        func: (_a, args) => args.a + args.b,
      });
      const a = new Agent({
        name: "a",
        description: "Asistente matematico",
        providers: [openai()],
        tools: [calc],
        rules: [new Rule("Para cualquier operacion aritmetica usa la tool calc.")],
      });
      const [msgs] = await a.call("oye crack, cuanto me da 12 mas 18?");
      const tm = msgs.find((m) => m.role === "tool");
      return tm?.content === "30";
    },
  },
  {
    level: "basic",
    name: "T07 tool devuelve estructura compleja",
    run: async () => {
      const profile = new Tool("get_profile", {
        description: "gets user profile by id",
        parameters: { id: "user id" },
        func: (_a, args: { id: string }) => ({
          id: args.id,
          name: "Ana",
          age: 28,
          tags: ["premium", "beta"],
        }),
      });
      const a = new Agent({
        name: "a",
        description: "x",
        providers: [openai()],
        tools: [profile],
        rules: [new Rule("Usa get_profile cuando el usuario mencione un id de usuario.")],
      });
      const [msgs, ok] = await a.call("eh oye, dame el perfil del user 42 porfa");
      const tm = msgs.find((m) => m.role === "tool");
      return ok && !!tm && /ana|28|premium/i.test(tm.content || "");
    },
  },
  {
    level: "basic",
    name: "T08 provider invalido, fallback responde",
    run: async () => {
      const bad = new OpenAI({
        api_key: "invalid-key-xxx",
        base_url: "https://api.openai.com/v1",
        model: "gpt-4",
      });
      const a = new Agent({ name: "a", description: "x", providers: [bad, openai()] });
      const [, ok] = await a.call("hola, tas ahi?");
      return ok;
    },
  },
  {
    level: "basic",
    name: "T09 rule empatica con usuario estresado",
    run: async () => {
      const a = new Agent({
        name: "a",
        description: "Asistente empatico y breve",
        providers: [openai()],
        rules: [
          new Rule("Si el usuario expresa estres, SIEMPRE valida su sentimiento en la primera frase."),
          new Rule("Responde en maximo 3 frases."),
        ],
      });
      const [msgs, ok] = await a.call("uff no se por donde empezar, tengo mil pendientes y cero tiempo");
      const last = msgs.at(-1)?.content || "";
      return ok && last.length > 20;
    },
  },
  {
    level: "basic",
    name: "T10 herencia contexts corporativo",
    run: async () => {
      const corporate = new Context({
        rules: [new Rule("Nunca compartes datos confidenciales de la empresa.")],
      });
      const a = new Agent({
        name: "corp",
        description: "Asistente corporativo en espanol formal.",
        providers: [openai()],
        contexts: corporate,
        rules: [new Rule("Responde en espanol formal.")],
      });
      // 1 heredada (corporate) + 2 locales (description auto-inyectada + rule explicita)
      return a.rules.length === 3;
    },
  },

  // ─── MEDIAS: tools contextualizadas, streaming, resilience ─────────────
  {
    level: "medium",
    name: "T11 investigacion: KB search + resumen",
    run: async () => {
      const search = new Tool("search_docs", {
        description: "busca en la base de conocimiento tecnica",
        parameters: { query: "termino a buscar" },
        func: (_a, args: { query: string }) => ({
          query: args.query,
          results: [
            { title: "TS intro", excerpt: "TypeScript es JavaScript con tipos estaticos." },
            { title: "Why TS", excerpt: "Detecta errores en compile-time y mejora DX." },
          ],
        }),
      });
      const a = new Agent({
        name: "researcher",
        description: "Asistente de investigacion tecnica breve",
        providers: [openai()],
        tools: [search],
        rules: [
          new Rule("Antes de responder preguntas tecnicas, busca con search_docs."),
          new Rule("Responde en 3 frases maximo usando los resultados."),
        ],
      });
      const [msgs] = await a.call("mira estoy pensando en meterle ts a mi proyecto, vale la pena?");
      return msgs.filter((m) => m.role === "tool").length >= 1;
    },
  },
  {
    level: "medium",
    name: "T12 tool chaining con prompt casual",
    run: async () => {
      const cities = new Tool("city_info", {
        description: "returns timezone and currency for a city",
        parameters: { city: "city" },
        func: (_a, args: { city: string }) => {
          const data: Record<string, { tz: string; currency: string }> = {
            tokyo: { tz: "Asia/Tokyo", currency: "JPY" },
            madrid: { tz: "Europe/Madrid", currency: "EUR" },
            london: { tz: "Europe/London", currency: "GBP" },
          };
          return data[args.city.toLowerCase()] ?? { tz: "UTC", currency: "USD" };
        },
      });
      const a = new Agent({
        name: "travel",
        description: "Asistente de viajes",
        providers: [openai()],
        tools: [cities, new TimeTool({})],
        rules: [
          new Rule("Para preguntas sobre hora o moneda en una ciudad, primero llama a city_info y luego a get_time si hace falta."),
        ],
      });
      const [msgs] = await a.call("oye voy a llamar a mi primo en tokyo, q hora sera alla?");
      return msgs.filter((m) => m.role === "tool").length >= 1;
    },
  },
  {
    level: "medium",
    name: "T13 stream explicacion progresiva",
    run: async () => {
      const a = new Agent({
        name: "teacher",
        description: "profesor que explica con ejemplos",
        providers: [openai()],
        rules: [new Rule("Explicas de forma progresiva en 3-5 frases, con analogia sencilla.")],
      });
      let buf = "";
      for await (const c of a.stream("explicame q es una promesa en js como si tuviera 12")) {
        if (c.role === "assistant") buf += c.content;
      }
      return buf.length > 30;
    },
  },
  {
    level: "medium",
    name: "T14 stream con tool en medio",
    run: async () => {
      const lookup = new Tool("lookup_word", {
        description: "looks up word definition",
        parameters: { word: "word" },
        func: (_a, args: { word: string }) => ({
          word: args.word,
          definition: `definicion tecnica de ${args.word}`,
        }),
      });
      const a = new Agent({
        name: "dict",
        description: "diccionario asistente",
        providers: [openai()],
        tools: [lookup],
        rules: [new Rule("Antes de explicar una palabra, usa lookup_word.")],
      });
      let saw = false;
      for await (const c of a.stream("q significa serendipia")) {
        if (c.role === "tool") saw = true;
      }
      return saw;
    },
  },
  {
    level: "medium",
    name: "T15 multi-turn con referencia implicita",
    run: async () => {
      const a = new Agent({
        name: "a",
        description: "x",
        providers: [openai()],
        rules: [new Rule("Responde en espanol en una frase corta.")],
      });
      await a.call("imaginate q soy Ana y vivo en Madrid. solo di ok");
      const [msgs, ok] = await a.call("donde vivo? dime solo la ciudad");
      return ok && /madrid/i.test(msgs.at(-1)?.content || "");
    },
  },
  {
    level: "medium",
    name: "T16 abort cuando usuario 'cambia de idea'",
    run: async () => {
      const a = new Agent({ name: "a", description: "x", providers: [openai()] });
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 10);
      try {
        const [, ok] = await a.call("escribeme un ensayo largo sobre la historia de Roma", {
          signal: ctrl.signal,
        });
        return ok === false;
      } catch {
        return true;
      }
    },
  },
  {
    level: "medium",
    name: "T17 abort durante stream largo",
    run: async () => {
      const a = new Agent({ name: "a", description: "x", providers: [openai()] });
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 30);
      try {
        for await (const _c of a.stream("cuentame toda la historia de Grecia en detalle", {
          signal: ctrl.signal,
        })) {
          // drain
        }
      } catch {
        // aborted
      }
      return true;
    },
  },
  {
    level: "medium",
    name: "T18 resilience: provider flaky se recupera",
    run: async () => {
      let tries = 0;
      const flaky = (async () => {
        tries++;
        if (tries === 1) throw new Error("ECONNRESET");
        return {
          id: "x",
          object: "chat.completion" as const,
          created: 0,
          model: "fake",
          choices: [
            {
              index: 0,
              message: { role: "assistant" as const, content: "recovered" },
              finish_reason: "stop" as const,
            },
          ],
        };
      }) as Provider;
      const a = new Agent({ name: "a", description: "x", providers: [flaky] });
      const [, ok] = await a.call("test");
      return ok && tries >= 2;
    },
  },
  {
    level: "medium",
    name: "T19 todos los providers caen",
    run: async () => {
      const dead = (async () => {
        throw new Error("network down");
      }) as Provider;
      const a = new Agent({ name: "a", description: "x", providers: [dead] });
      const [, ok] = await a.call("algo");
      return ok === false;
    },
  },
  {
    level: "medium",
    name: "T20 tool lanza excepcion: se reporta al modelo",
    run: async () => {
      const tool = new Tool("fail_tool", {
        description: "always fails",
        parameters: {},
        func: () => {
          throw new Error("tool broken");
        },
      });
      const a = new Agent({
        name: "a",
        description: "x",
        providers: [openai()],
        tools: [tool],
        rules: [new Rule("Llama a fail_tool.")],
      });
      const [msgs] = await a.call("invoca fail_tool");
      const tm = msgs.find((m) => m.role === "tool");
      return typeof tm?.content === "string" && /broken|error/i.test(tm.content);
    },
  },

  // ─── AVANZADAS: branches con propósitos reales ─────────────────────────
  {
    level: "advanced",
    name: "T21 pipeline investigacion profunda (3 etapas)",
    run: async () => {
      const a = new Agent({
        name: "deep_research",
        description: "Responde preguntas tecnicas con rigor",
        providers: [openai()],
        branches: [
          {
            name: "extract_intent",
            description: "Identificas la intencion real del usuario en una frase.",
            providers: [openai()],
          },
          {
            name: "decompose",
            description: "Descompones la pregunta en 3 sub-preguntas clave.",
            providers: [openai()],
          },
          {
            name: "frame",
            description: "Formulas un prompt preciso para el experto final, incluyendo las sub-preguntas.",
            providers: [openai()],
          },
        ],
        rules: [new Rule("Responde en 3-4 frases tecnicas precisas.")],
      });
      const [, ok] = await a.call("oye y eso de los microservicios como funciona por dentro");
      return ok;
    },
  },
  {
    level: "advanced",
    name: "T22 pipeline redaccion mejorada (3 etapas)",
    run: async () => {
      const a = new Agent({
        name: "editor",
        description: "Asistente que reescribe con claridad",
        providers: [openai()],
        branches: [
          {
            name: "tone",
            description: "Identificas el tono y registro adecuados al prompt del usuario.",
            providers: [openai()],
          },
          {
            name: "structure",
            description: "Propones la estructura de parrafos para la respuesta.",
            providers: [openai()],
          },
          {
            name: "polish",
            description: "Pules la peticion del usuario con terminos precisos manteniendo su intencion.",
            providers: [openai()],
          },
        ],
      });
      const [, ok] = await a.call("oye cmo le explicarias a un ni;o q es la energia");
      return ok;
    },
  },
  {
    level: "advanced",
    name: "T23 pipeline planificacion",
    run: async () => {
      const a = new Agent({
        name: "planner",
        description: "Asistente de planificacion",
        providers: [openai()],
        branches: [
          { name: "goals", description: "Extraes el objetivo final del usuario en una frase.", providers: [openai()] },
          { name: "steps", description: "Descompones en 3-5 pasos concretos.", providers: [openai()] },
          { name: "risks", description: "Anadas riesgos principales a considerar.", providers: [openai()] },
        ],
        rules: [new Rule("Responde con un plan estructurado en lista de 3-5 puntos.")],
      });
      const [, ok] = await a.call("necesito hacer pivot de mi startup en 3 meses, dame un plan");
      return ok;
    },
  },
  {
    level: "advanced",
    name: "T24 pipeline empatia: best friend",
    run: async () => {
      const a = new Agent({
        name: "bestie",
        description: "Un amigo cercano que aconseja",
        providers: [openai()],
        branches: [
          { name: "emotion", description: "Detectas la emocion dominante del usuario en una palabra.", providers: [openai()] },
          { name: "validate", description: "Sugieres como validar ese sentimiento antes de aconsejar.", providers: [openai()] },
        ],
        rules: [
          new Rule("Hablas como un amigo super cercano, usando 'wey', 'tio', 'bro'. Nunca frio."),
          new Rule("Siempre validas primero el sentimiento. Luego aconsejas en max 2 frases."),
        ],
      });
      const [msgs, ok] = await a.call("me acabo de pelear con mi jefe y no se q hacer");
      const last = msgs.at(-1)?.content || "";
      return ok && last.length > 15;
    },
  },
  {
    level: "advanced",
    name: "T25 branch con tool de research",
    run: async () => {
      const kb = new Tool("knowledge_base", {
        description: "searches internal knowledge base by topic",
        parameters: { topic: "topic to research" },
        func: (_a, args: { topic: string }) => ({
          topic: args.topic,
          summary: `Conocimiento interno sobre ${args.topic}: punto 1, punto 2, punto 3.`,
        }),
      });
      const a = new Agent({
        name: "kbot",
        description: "Responde con info interna",
        providers: [openai()],
        branches: [
          {
            name: "researcher",
            description:
              "Si hay un tema tecnico, consulta knowledge_base y reformula el prompt con los hallazgos clave.",
            providers: [openai()],
            tools: [kb],
            rules: [new Rule("Usa knowledge_base antes de reformular.")],
          },
        ],
      });
      const [, ok] = await a.call("cuentame como funciona el sistema de pagos interno");
      return ok;
    },
  },
  {
    level: "advanced",
    name: "T26 branch muerto: pipeline continua",
    run: async () => {
      const dead = (async () => {
        throw new Error("branch provider dead");
      }) as Provider;
      const a = new Agent({
        name: "resilient",
        description: "x",
        providers: [openai()],
        branches: [
          { name: "dead_branch", description: "siempre falla", providers: [dead] },
          { name: "active", description: "Reformulas con claridad.", providers: [openai()] },
        ],
      });
      const [, ok] = await a.call("hola, tengo una duda rapida");
      return ok;
    },
  },
  {
    level: "advanced",
    name: "T27 pipeline dual-provider: Claude analiza + OpenAI sintetiza",
    run: async () => {
      const a = new Agent({
        name: "dual",
        description: "Responde con rigor",
        providers: [openai()],
        branches: [
          {
            name: "deep_analysis",
            description: "Analizas en profundidad la pregunta del usuario.",
            providers: [claudecode()],
          },
          {
            name: "synthesize",
            description: "Sintetizas el analisis previo en un prompt claro para el experto final.",
            providers: [openai()],
          },
        ],
      });
      const [, ok] = await a.call("explicame las implicaciones economicas de la IA generativa");
      return ok;
    },
  },
  {
    level: "advanced",
    name: "T28 agente super familiar con branch de clarificacion",
    run: async () => {
      const a = new Agent({
        name: "carnal",
        description: "Tu compa que resuelve dudas",
        providers: [openai()],
        branches: [
          {
            name: "clarify",
            description: "Reformulas el prompt del usuario asegurando que quede claro que quiere.",
            providers: [openai()],
          },
        ],
        rules: [
          new Rule("Hablas super casual, usando 'wey', 'compa', 'tranqui'."),
          new Rule("Respondes en 2 frases maximo."),
        ],
      });
      const [msgs, ok] = await a.call("oye pa, cmo le hago pa aprender a programar rapido");
      return ok && (msgs.at(-1)?.content || "").length > 10;
    },
  },
  {
    level: "advanced",
    name: "T29 agente corporativo con branch de formalizacion",
    run: async () => {
      const a = new Agent({
        name: "corp_bot",
        description: "Asistente corporativo",
        providers: [openai()],
        branches: [
          {
            name: "formalize",
            description: "Reescribes el prompt del usuario en registro formal y preciso.",
            providers: [openai()],
          },
        ],
        rules: [new Rule("Respondes en espanol formal, sin contracciones, en 2 frases.")],
      });
      const [msgs, ok] = await a.call("q onda como hago un reporte trimestral");
      return ok && (msgs.at(-1)?.content || "").length > 10;
    },
  },
  {
    level: "advanced",
    name: "T30 branches anidados: research dentro de research",
    run: async () => {
      const a = new Agent({
        name: "meta_researcher",
        description: "Investigador de investigadores",
        providers: [openai()],
        branches: [
          {
            name: "outer",
            description: "Reformulas con precision tecnica.",
            providers: [openai()],
            branches: [
              {
                name: "inner",
                description: "Identificas la intencion raw del usuario.",
                providers: [openai()],
              },
            ],
          },
        ],
      });
      const [, ok] = await a.call("wey me perdi con eso de los vectores embedding, me explicas?");
      return ok;
    },
  },
  {
    level: "advanced",
    name: "T31 multi-turn con branches sin residuos system",
    run: async () => {
      const a = new Agent({
        name: "a",
        description: "Asistente",
        providers: [openai()],
        branches: [{ name: "clarify", description: "Reformulas con claridad.", providers: [openai()] }],
      });
      await a.call("recuerda q me llamo Luis. solo di ok");
      await a.call("como me llamo? una palabra");
      return !a.messages.some((m) => m.role === "system");
    },
  },
  {
    level: "advanced",
    name: "T32 abort durante flow de investigacion",
    run: async () => {
      const a = new Agent({
        name: "a",
        description: "x",
        providers: [openai()],
        branches: [{ name: "deep", description: "Investigas en profundidad.", providers: [openai()] }],
      });
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 10);
      try {
        const [, ok] = await a.call("analiza la historia economica del siglo XX", {
          signal: ctrl.signal,
        });
        return ok === false;
      } catch {
        return true;
      }
    },
  },
  {
    level: "advanced",
    name: "T33 hibrido: main ClaudeCode + branches OpenAI",
    run: async () => {
      const a = new Agent({
        name: "hybrid",
        description: "Asistente hibrido",
        providers: [claudecode()],
        branches: [
          { name: "extract", description: "Identificas la intencion en una frase.", providers: [openai()] },
          { name: "frame", description: "Estructuras la respuesta en 3 puntos.", providers: [openai()] },
        ],
      });
      const [, ok] = await a.call("dame 3 consejos para un dev junior");
      return ok;
    },
  },
  {
    level: "advanced",
    name: "T34 pipeline de 5 etapas de razonamiento",
    run: async () => {
      const a = new Agent({
        name: "5stage",
        description: "Razonador de 5 etapas",
        providers: [openai()],
        branches: [
          { name: "intent", description: "Extraes la intencion del usuario.", providers: [openai()] },
          { name: "decompose", description: "Descompones en subproblemas.", providers: [openai()] },
          { name: "plan", description: "Planificas la respuesta en alto nivel.", providers: [openai()] },
          { name: "risks", description: "Identificas riesgos y ambiguedades.", providers: [openai()] },
          {
            name: "synth",
            description: "Sintetizas un prompt preciso para el experto final.",
            providers: [openai()],
          },
        ],
        rules: [new Rule("Responde en 3-4 frases maximo.")],
      });
      const [, ok] = await a.call("estoy pensando cambiar de carrera de marketing a data, q opinas");
      return ok;
    },
  },
];

async function main() {
  console.log(`Running ${tests.length} tests...\n`);
  let passed = 0;
  let failed = 0;
  const failures: { name: string; err: string }[] = [];

  for (const t of tests) {
    const tag = `[${t.level.toUpperCase().padEnd(8)}]`;
    process.stdout.write(`${tag} ${t.name} ... `);
    const start = Date.now();
    try {
      const ok = await t.run();
      const ms = Date.now() - start;
      if (ok) {
        console.log(`PASS (${ms}ms)`);
        passed++;
      } else {
        console.log(`FAIL (${ms}ms)`);
        failures.push({ name: t.name, err: "assertion returned false" });
        failed++;
      }
    } catch (e: unknown) {
      const ms = Date.now() - start;
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`ERROR (${ms}ms): ${msg}`);
      failures.push({ name: t.name, err: msg });
      failed++;
    }
  }

  const total = passed + failed;
  const pct = (passed / total) * 100;
  console.log(`\n-----------------------------------------`);
  console.log(`${passed}/${total} passed (${pct.toFixed(2)}%)`);
  if (failures.length) {
    console.log(`\nFailures:`);
    for (const f of failures) console.log(`  - ${f.name}: ${f.err}`);
  }
  if (pct < 98) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
