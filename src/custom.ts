import { Agent, Tool, Rule, TimeTool, OpenAI } from "./index";

const API_KEY = process.env.OPENAI_API_KEY || "";

if (!API_KEY) {
  console.error("Set OPENAI_API_KEY env var before running.");
  process.exit(1);
}

const provider = new OpenAI({
  api_key: API_KEY,
  base_url: "https://api.arcaelas.com/v1",
  model: "kimi-k2-instruct",
  temperature: 0.7,
  max_tokens: 1024,
});

const detect_timezone_tool = new Tool("detect_timezone", {
  description: "Detects the IANA timezone for a given city or country name. Must be called FIRST before get_time when the user asks for the time in a specific location.",
  parameters: {
    location: "City or country name to detect the timezone for",
  },
  func: (_agent, args: { location: string }) => {
    const map = new Map([
      ["tokyo", "Asia/Tokyo"],
      ["japan", "Asia/Tokyo"],
      ["madrid", "Europe/Madrid"],
      ["spain", "Europe/Madrid"],
      ["new york", "America/New_York"],
      ["london", "Europe/London"],
      ["paris", "Europe/Paris"],
      ["berlin", "Europe/Berlin"],
      ["sydney", "Australia/Sydney"],
      ["mexico", "America/Mexico_City"],
      ["bogota", "America/Bogota"],
      ["colombia", "America/Bogota"],
      ["lima", "America/Lima"],
      ["peru", "America/Lima"],
      ["buenos aires", "America/Argentina/Buenos_Aires"],
      ["argentina", "America/Argentina/Buenos_Aires"],
    ]);
    const loc = args.location?.toLowerCase() || "";
    let tz: string | undefined;
    for (const [k, v] of map) {
      if (loc.includes(k)) { tz = v; break; }
    }
    if (!tz) return { error: true, message: `Unknown location: ${args.location}` };
    return { timezone: tz, location: args.location };
  },
});

const agent = new Agent({
  name: "Test_Agent",
  description: "A test agent for evaluating streaming and tool calling",
  providers: [provider],
  tools: [new TimeTool({}), detect_timezone_tool],
  rules: [
    new Rule("Always respond in Spanish"),
    new Rule("IMPORTANT: When the user asks for the time in a specific city or country, you MUST first call detect_timezone to get the IANA timezone, then call get_time with that timezone. Never guess timezones, always use detect_timezone first."),
  ],
});

async function test_legacy_call() {
  console.log("=== LEGACY TEST 1: Simple call (no tools) ===\n");
  const agent_simple = new Agent({
    name: "Simple_Agent",
    description: "A simple test agent",
    providers: [provider],
    rules: [new Rule("Respond in Spanish. Keep answers under 30 words.")],
  });

  const [msgs1, ok1] = await agent_simple.call("Que es TypeScript en una frase?");
  console.log(`Success: ${ok1}`);
  console.log(`Messages: ${msgs1.length}`);
  console.log(`Last: ${msgs1[msgs1.length - 1]?.content}\n`);

  console.log("=== LEGACY TEST 2: call with tool execution ===\n");
  const [msgs2, ok2] = await agent.call("Que hora es?");
  console.log(`Success: ${ok2}`);
  console.log(`Messages: ${msgs2.length}`);
  for (const m of msgs2) {
    console.log(`  [${m.role}] ${m.content?.slice(0, 80) ?? "(null)"}${m.tool_call_id ? ` (tool_call_id: ${m.tool_call_id})` : ""}`);
  }
  console.log("");

  console.log("=== LEGACY TEST 3: call with chained tools ===\n");
  const agent2 = new Agent({
    name: "Chain_Agent",
    description: "Agent for testing chained tool calls",
    providers: [provider],
    tools: [new TimeTool({}), detect_timezone_tool],
    rules: [
      new Rule("Always respond in Spanish"),
      new Rule("IMPORTANT: When the user asks for the time in a specific city, you MUST first call detect_timezone, then call get_time with the returned timezone."),
    ],
  });

  const [msgs3, ok3] = await agent2.call("Que hora es en Madrid?");
  console.log(`Success: ${ok3}`);
  console.log(`Messages: ${msgs3.length}`);
  for (const m of msgs3) {
    console.log(`  [${m.role}] ${m.content?.slice(0, 80) ?? "(null)"}${m.tool_call_id ? ` (tool_call_id: ${m.tool_call_id})` : ""}`);
  }
  console.log("");

  console.log("=== LEGACY DONE ===");
}

test_legacy_call().catch(console.error);
