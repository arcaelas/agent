import { Noop } from "@arcaelas/utils";

interface ToolOptions<T> {
  name: string;
  description: string;
  parameters?: T;
  func: Noop<[params: Partial<T>], string>;
}
function tool<T, O extends ToolOptions<T>>(options: O): O["func"] {
  class Tool extends Function {
    constructor(protected readonly options: O) {
      super("");
    }
  }
  return new Tool(options) as any;
}

tool({
  name: "search_product",
  description: "Search for a product",
  parameters: {
    query: "The query to search for",
  },
  func: async (params) => {
    return "";
  },
});

// const agent = new Agent("Clever", "");
// const agent = new Agent({
//   system: "",
//   providers: [
//     {
//       base_url: "",
//       access_token: "",
//       model: "o3",
//     },
//   ],
// });

// agent.intercept("question", (messages) => {});
// agent.intercept("answer", (messages) => {});

// agent.tool("", async () => {});
// agent.tool({ name: "", description: "", parametes: {}, async func() {} });

// const tool = Agent.tool("", async () => {});
// const tool2 = Agent.tool({ name: "", description: "", parametes: {}, async func() {} });

// agent.tool(tool);
// agent.tool([tool, tool2]);
