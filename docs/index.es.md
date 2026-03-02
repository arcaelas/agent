# Documentacion de Arcaelas Agent

Bienvenido a **@arcaelas/agent** - una libreria TypeScript lista para produccion para construir agentes de IA sofisticados con soporte multi-proveedor, contextos reactivos, streaming y orquestacion inteligente de herramientas.

## Que es Arcaelas Agent?

@arcaelas/agent te permite crear agentes de IA que escalan desde chatbots simples hasta flujos de trabajo organizacionales complejos mediante:

- **Soporte Multi-Proveedor** - Conmutacion automatica entre OpenAI, Anthropic, Groq y APIs personalizadas
- **Arquitectura Reactiva** - Herencia jerarquica de contexto con gestion automatica de estado
- **Ecosistema de Herramientas** - Herramientas HTTP integradas e integracion fluida de funciones personalizadas
- **Streaming** - Respuestas en tiempo real via `Agent.stream()` con soporte completo de tool-call loop
- **TypeScript Completo** - Seguridad de tipos completa con uniones discriminadas y genericos

## Inicio Rapido

### Instalacion

```bash
yarn add @arcaelas/agent
```

### Tu Primer Agent

```typescript
import { Agent, Context } from '@arcaelas/agent';
import type { Provider } from '@arcaelas/agent';

const my_provider: Provider = async (ctx: Context) => {
  // ctx contiene messages, tools, metadata, rules
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: ctx.messages.map(m => ({ role: m.role, content: m.content }))
    })
  });
  return await response.json();
};

const assistant = new Agent({
  name: "Asistente_Personal",
  description: "Asistente util para tareas diarias",
  providers: [my_provider]
});

// Sin streaming
const [messages, success] = await assistant.call("Como esta el clima hoy?");

// Con streaming
for await (const chunk of assistant.stream("Cuentame un chiste")) {
  if (chunk.role === "assistant") process.stdout.write(chunk.content);
}
```

**[Continuar con el tutorial completo ->](guides/getting-started.md)**

## Arquitectura Principal

### Agent

Orquestador central que combina identidad, comportamiento, herramientas y proveedores de IA.

```typescript
const agent = new Agent({
  name: "Agente_Soporte",
  description: "Especialista en soporte al cliente",
  tools: [search_tool, database_tool],
  rules: [professional_rule],
  providers: [openai_provider]
});
```

**[Aprende mas ->](api/agent.md)**

### Context

Gestion jerarquica de estado con herencia automatica.

```typescript
const parent_context = new Context({
  metadata: new Metadata().set("company", "Acme Corp"),
  rules: [new Rule("Mantener un tono profesional")]
});

const child_context = new Context({
  context: parent_context,  // Hereda del padre
  metadata: new Metadata().set("department", "Ventas")
});
```

**[Aprende mas ->](api/context.md)**

### Tools

Funciones extensibles para integraciones externas.

```typescript
const weather_tool = new Tool("get_weather", {
  description: "Obtener clima actual para cualquier ciudad",
  parameters: {
    city: "Nombre de la ciudad",
    units: "Unidades de temperatura (celsius/fahrenheit)"
  },
  func: async (agent, { city, units }) => {
    return `Clima en ${city}: Soleado, 24C`;
  }
});
```

**[Aprende mas ->](api/tool.md)**

## Documentacion

### Guias

- **[Comenzando](guides/getting-started.md)** - Tutorial completo
- **[Conceptos Basicos](guides/core-concepts.md)** - Vision general de la arquitectura
- **[Proveedores](guides/providers.md)** - Configuracion multi-proveedor
- **[Mejores Practicas](guides/best-practices.md)** - Patrones de produccion

### Referencia API

- **[Agent](api/agent.md)** - Orquestador principal
- **[Context](api/context.md)** - Gestion de estado
- **[Metadata](api/metadata.md)** - Almacen clave-valor
- **[Tool](api/tool.md)** - Funciones personalizadas
- **[Rule](api/rule.md)** - Directrices de comportamiento
- **[Message](api/message.md)** - Mensajes de conversacion
- **[Providers](api/providers.md)** - Funciones de proveedor
- **[Built-in Tools](api/built-in-tools.md)** - RemoteTool y TimeTool

### Ejemplos

- **[Basic Agent](examples/basic-agent.md)** - Chatbot simple
- **[Multi-Provider](examples/multi-provider.md)** - Configuracion resiliente
- **[Custom Tools](examples/custom-tools.md)** - Creando herramientas
- **[Context Inheritance](examples/context-inheritance.md)** - Patrones empresariales
- **[Advanced Patterns](examples/advanced-patterns.md)** - Escenarios complejos

### Avanzado

- **[Architecture](advanced/architecture.md)** - Diseno interno
- **[Performance](advanced/performance.md)** - Optimizacion
- **[Troubleshooting](advanced/troubleshooting.md)** - Problemas comunes
- **[Migration Guide](advanced/migration.md)** - Actualizacion de versiones

## Requisitos

- Node.js >= 16.0.0
- TypeScript >= 4.5.0 (opcional)

## Enlaces

- [Repositorio GitHub](https://github.com/arcaelas/agent)
- [Paquete NPM](https://www.npmjs.com/package/@arcaelas/agent)
- [Rastreador de Problemas](https://github.com/arcaelas/agent/issues)
- [Comunidad Discord](https://discord.gg/arcaelas)

---

**Listo para construir agentes de IA inteligentes?** Comienza con la **[Guia de Inicio](guides/getting-started.md)** ->
