# Documentación de Arcaelas Agent

Bienvenido a **@arcaelas/agent** - una librería TypeScript lista para producción para construir agentes de IA sofisticados con soporte multi-proveedor, contextos reactivos y orquestación inteligente de herramientas.

## ¿Qué es Arcaelas Agent?

@arcaelas/agent te permite crear agentes de IA que escalan desde chatbots simples hasta flujos de trabajo organizacionales complejos mediante:

- **🔄 Soporte Multi-Proveedor** - Conmutación automática entre OpenAI, Anthropic, Groq y APIs personalizadas
- **🏗️ Arquitectura Reactiva** - Herencia jerárquica de contexto con gestión automática de estado
- **🛠️ Ecosistema de Herramientas** - Herramientas HTTP integradas e integración fluida de funciones personalizadas
- **💎 TypeScript Completo** - Seguridad de tipos completa con uniones discriminadas y genéricos

## Inicio Rápido

### Instalación

```bash
npm install @arcaelas/agent
```

### Tu Primer Agente

```typescript
import { Agent } from '@arcaelas/agent';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const assistant = new Agent({
  name: "Asistente_Personal",
  description: "Asistente útil para tareas diarias",
  providers: [
    async (ctx) => {
      return await openai.chat.completions.create({
        model: "gpt-4",
        messages: ctx.messages.map(m => ({
          role: m.role,
          content: m.content
        }))
      });
    }
  ]
});

const [messages, success] = await assistant.call("¿Cómo está el clima hoy?");
```

**[Continuar con el tutorial completo →](guides/getting-started.md)**

## Arquitectura Principal

### Agente

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

**[Aprende más →](api/agent.md)**

### Contexto

Gestión jerárquica de estado con herencia automática.

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

**[Aprende más →](api/context.md)**

### Herramientas

Funciones extensibles para integraciones externas.

```typescript
const weather_tool = new Tool("get_weather", {
  description: "Obtener clima actual para cualquier ciudad",
  parameters: {
    city: "Nombre de la ciudad",
    units: "Unidades de temperatura (celsius/fahrenheit)"
  },
  func: async (agent, { city, units }) => {
    return `Clima en ${city}: Soleado, 24°C`;
  }
});
```

**[Aprende más →](api/tool.md)**

## Documentación

### 📚 Guías

- **[Comenzando](guides/getting-started.md)** - Tutorial completo
- **[Conceptos Básicos](guides/core-concepts.md)** - Visión general de la arquitectura
- **[Proveedores](guides/providers.md)** - Configuración multi-proveedor
- **[Mejores Prácticas](guides/best-practices.md)** - Patrones de producción

### 🔧 Referencia API

- **[Agent](api/agent.md)** - Orquestador principal
- **[Context](api/context.md)** - Gestión de estado
- **[Metadata](api/metadata.md)** - Almacén clave-valor
- **[Tool](api/tool.md)** - Funciones personalizadas
- **[Rule](api/rule.md)** - Directrices de comportamiento
- **[Message](api/message.md)** - Mensajes de conversación
- **[Providers](api/providers.md)** - Funciones de proveedor
- **[Built-in Tools](api/built-in-tools.md)** - TimeTool, RemoteTool, AgentTool, AskTool, ChoiceTool, SleepTool

### 💡 Ejemplos

- **[Basic Agent](examples/basic-agent.md)** - Chatbot simple
- **[Multi-Provider](examples/multi-provider.md)** - Configuración resiliente
- **[Custom Tools](examples/custom-tools.md)** - Creando herramientas
- **[Context Inheritance](examples/context-inheritance.md)** - Patrones empresariales
- **[Advanced Patterns](examples/advanced-patterns.md)** - Escenarios complejos

### 🎓 Avanzado

- **[Architecture](advanced/architecture.md)** - Diseño interno
- **[Performance](advanced/performance.md)** - Optimización
- **[Troubleshooting](advanced/troubleshooting.md)** - Problemas comunes
- **[Migration Guide](advanced/migration.md)** - Actualización de versiones

## Requisitos

- Node.js ≥ 16.0.0
- TypeScript ≥ 4.5.0 (opcional)

## Enlaces

- [Repositorio GitHub](https://github.com/arcaelas/agent)
- [Paquete NPM](https://www.npmjs.com/package/@arcaelas/agent)
- [Rastreador de Problemas](https://github.com/arcaelas/agent/issues)
- [Comunidad Discord](https://discord.gg/arcaelas)

---

**¿Listo para construir agentes de IA inteligentes?** Comienza con la **[Guía de Inicio](guides/getting-started.md)** →
