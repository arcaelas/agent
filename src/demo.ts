import { Agent, OpenAI } from "./index";

const openai = () =>
  new OpenAI({
    api_key: "sk-2451281db8fd2b254b2d800334f4b75d02b110943387cf5426899532be2da620",
    base_url: "https://api.arcaelas.com/v1",
    model: "grok-4",
    max_tokens: 512,
    temperature: 0.2,
  });

const b1 = new Agent({
  name: "tone",
  description: "Identificas el tono y registro adecuados para el usuario en una frase. No respondes la pregunta, solo reescribes la peticion con el tono adecuado.",
  providers: [openai()],
});
const b2 = new Agent({
  name: "structure",
  description: "Recibes una peticion y propones una estructura clara en 2-3 puntos. No respondes la pregunta, solo reescribes la peticion incluyendo la estructura propuesta.",
  providers: [openai()],
});
const b3 = new Agent({
  name: "polish",
  description: "Pules la peticion previa con terminos precisos manteniendo la intencion. No respondes, reescribes.",
  providers: [openai()],
});

const editor = new Agent({
  name: "editor",
  description: "Responde a la peticion final con claridad y una analogia sencilla en 3 frases.",
  providers: [openai()],
  branches: [b1, b2, b3],
});

const prompt = "oye cmo le explicarias a un ni;o q es la energia";

const last = (a: Agent) =>
  a.messages.filter((m) => m.role === "assistant" && m.content).at(-1)?.content ?? "(vacio)";

(async () => {
  console.log("─────────────────────────────────────────────────");
  console.log("PROMPT ORIGINAL:");
  console.log("  " + prompt);
  console.log("─────────────────────────────────────────────────\n");

  const [msgs] = await editor.call(prompt);

  console.log("BRANCH 1 (tone)");
  console.log(last(b1));
  console.log("\n─────────────────────────────────────────────────\n");

  console.log("BRANCH 2 (structure)");
  console.log(last(b2));
  console.log("\n─────────────────────────────────────────────────\n");

  console.log("BRANCH 3 (polish)");
  console.log(last(b3));
  console.log("\n─────────────────────────────────────────────────\n");

  const final = msgs.filter((m) => m.role === "assistant" && m.content).at(-1)?.content ?? "(vacio)";
  console.log("MAIN (editor) — respuesta final al usuario");
  console.log(final);
  console.log("\n─────────────────────────────────────────────────");
})();
