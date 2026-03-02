# Arcaelas Agent Dokumentation

Willkommen zu **@arcaelas/agent** - einer produktionsreifen TypeScript-Bibliothek zum Erstellen anspruchsvoller KI-Agenten mit Multi-Anbieter-Unterstuetzung, reaktiven Kontexten, Streaming und intelligenter Werkzeug-Orchestrierung.

## Was ist Arcaelas Agent?

@arcaelas/agent ermoeglicht es Ihnen, KI-Agenten zu erstellen, die von einfachen Chatbots bis zu komplexen Unternehmens-Workflows skalieren durch:

- **Multi-Anbieter-Unterstuetzung** - Automatische Ausfallsicherung zwischen OpenAI, Anthropic, Groq und benutzerdefinierten APIs
- **Reaktive Architektur** - Hierarchische Kontextvererbung mit automatischer Zustandsverwaltung
- **Werkzeug-Oekosystem** - Integrierte HTTP-Werkzeuge und nahtlose Integration benutzerdefinierter Funktionen
- **Streaming** - Echtzeit-Antwort-Streaming ueber `Agent.stream()` mit vollstaendiger Tool-Call-Loop-Unterstuetzung
- **Vollstaendiges TypeScript** - Vollstaendige Typsicherheit mit diskriminierten Unions und Generics

## Schnellstart

### Installation

```bash
yarn add @arcaelas/agent
```

### Ihr erster Agent

```typescript
import { Agent, Context } from '@arcaelas/agent';
import type { Provider } from '@arcaelas/agent';

const my_provider: Provider = async (ctx: Context) => {
  // ctx enthaelt messages, tools, metadata, rules
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
  name: "Persoenlicher_Assistent",
  description: "Hilfreicher Assistent fuer taegliche Aufgaben",
  providers: [my_provider]
});

// Ohne Streaming
const [messages, success] = await assistant.call("Wie ist das Wetter heute?");

// Mit Streaming
for await (const chunk of assistant.stream("Erzaehl mir einen Witz")) {
  if (chunk.role === "assistant") process.stdout.write(chunk.content);
}
```

**[Mit dem vollstaendigen Tutorial fortfahren ->](guides/getting-started.md)**

## Hauptarchitektur

### Agent

Zentraler Orchestrator, der Identitaet, Verhalten, Werkzeuge und KI-Anbieter kombiniert.

```typescript
const agent = new Agent({
  name: "Support_Agent",
  description: "Kundensupport-Spezialist",
  tools: [search_tool, database_tool],
  rules: [professional_rule],
  providers: [openai_provider]
});
```

**[Mehr erfahren ->](api/agent.md)**

### Context

Hierarchische Zustandsverwaltung mit automatischer Vererbung.

```typescript
const parent_context = new Context({
  metadata: new Metadata().set("company", "Acme Corp"),
  rules: [new Rule("Einen professionellen Ton beibehalten")]
});

const child_context = new Context({
  context: parent_context,  // Erbt vom Eltern
  metadata: new Metadata().set("department", "Vertrieb")
});
```

**[Mehr erfahren ->](api/context.md)**

### Werkzeuge

Erweiterbare Funktionen fuer externe Integrationen.

```typescript
const weather_tool = new Tool("get_weather", {
  description: "Aktuelles Wetter fuer jede Stadt abrufen",
  parameters: {
    city: "Stadtname",
    units: "Temperatureinheiten (celsius/fahrenheit)"
  },
  func: async (agent, { city, units }) => {
    return `Wetter in ${city}: Sonnig, 24C`;
  }
});
```

**[Mehr erfahren ->](api/tool.md)**

## Dokumentation

### Anleitungen

- **[Erste Schritte](guides/getting-started.md)** - Vollstaendiges Tutorial
- **[Kernkonzepte](guides/core-concepts.md)** - Architekturuebersicht
- **[Anbieter](guides/providers.md)** - Multi-Anbieter-Konfiguration
- **[Best Practices](guides/best-practices.md)** - Produktionsmuster

### API-Referenz

- **[Agent](api/agent.md)** - Hauptorchestrator
- **[Context](api/context.md)** - Zustandsverwaltung
- **[Metadata](api/metadata.md)** - Schluessel-Wert-Speicher
- **[Tool](api/tool.md)** - Benutzerdefinierte Funktionen
- **[Rule](api/rule.md)** - Verhaltensrichtlinien
- **[Message](api/message.md)** - Konversationsnachrichten
- **[Providers](api/providers.md)** - Anbieter-Funktionen
- **[Built-in Tools](api/built-in-tools.md)** - RemoteTool & TimeTool

### Beispiele { #examples }

- **[Basic Agent](examples/basic-agent.md)** - Einfacher Chatbot
- **[Multi-Provider](examples/multi-provider.md)** - Widerstandsfaehige Konfiguration
- **[Custom Tools](examples/custom-tools.md)** - Werkzeuge erstellen
- **[Context Inheritance](examples/context-inheritance.md)** - Unternehmensmuster
- **[Advanced Patterns](examples/advanced-patterns.md)** - Komplexe Szenarien

### Erweitert { #advanced }

- **[Architecture](advanced/architecture.md)** - Internes Design
- **[Performance](advanced/performance.md)** - Optimierung
- **[Troubleshooting](advanced/troubleshooting.md)** - Haeufige Probleme
- **[Migration Guide](advanced/migration.md)** - Versions-Upgrades

## Anforderungen

- Node.js >= 16.0.0
- TypeScript >= 4.5.0 (optional)

## Links

- [GitHub-Repository](https://github.com/arcaelas/agent)
- [NPM-Paket](https://www.npmjs.com/package/@arcaelas/agent)
- [Issue-Tracker](https://github.com/arcaelas/agent/issues)
- [Discord-Community](https://discord.gg/arcaelas)

---

**Bereit, intelligente KI-Agenten zu erstellen?** Beginnen Sie mit dem **[Erste-Schritte-Leitfaden](guides/getting-started.md)** ->
