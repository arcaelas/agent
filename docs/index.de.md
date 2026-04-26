# Arcaelas Agent Dokumentation

Willkommen zu **@arcaelas/agent** - einer produktionsreifen TypeScript-Bibliothek zum Erstellen anspruchsvoller KI-Agenten mit Multi-Anbieter-Unterstützung, reaktiven Kontexten und intelligenter Werkzeug-Orchestrierung.

## Was ist Arcaelas Agent?

@arcaelas/agent ermöglicht es Ihnen, KI-Agenten zu erstellen, die von einfachen Chatbots bis zu komplexen Unternehmens-Workflows skalieren durch:

- **🔄 Multi-Anbieter-Unterstützung** - Automatische Ausfallsicherung zwischen OpenAI, Anthropic, Groq und benutzerdefinierten APIs
- **🏗️ Reaktive Architektur** - Hierarchische Kontextvererbung mit automatischer Zustandsverwaltung
- **🛠️ Werkzeug-Ökosystem** - Integrierte HTTP-Werkzeuge und nahtlose Integration benutzerdefinierter Funktionen
- **💎 Vollständiges TypeScript** - Vollständige Typsicherheit mit diskriminierten Unions und Generics

## Schnellstart

### Installation

```bash
npm install @arcaelas/agent
```

### Ihr erster Agent

```typescript
import { Agent } from '@arcaelas/agent';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const assistant = new Agent({
  name: "Persönlicher_Assistent",
  description: "Hilfreicher Assistent für tägliche Aufgaben",
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

const [messages, success] = await assistant.call("Wie ist das Wetter heute?");
```

**[Mit dem vollständigen Tutorial fortfahren →](guides/getting-started.md)**

## Hauptarchitektur

### Agent

Zentraler Orchestrator, der Identität, Verhalten, Werkzeuge und KI-Anbieter kombiniert.

```typescript
const agent = new Agent({
  name: "Support_Agent",
  description: "Kundensupport-Spezialist",
  tools: [search_tool, database_tool],
  rules: [professional_rule],
  providers: [openai_provider]
});
```

**[Mehr erfahren →](api/agent.md)**

### Kontext

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

**[Mehr erfahren →](api/context.md)**

### Werkzeuge

Erweiterbare Funktionen für externe Integrationen.

```typescript
const weather_tool = new Tool("get_weather", {
  description: "Aktuelles Wetter für jede Stadt abrufen",
  parameters: {
    city: "Stadtname",
    units: "Temperatureinheiten (celsius/fahrenheit)"
  },
  func: async (agent, { city, units }) => {
    return `Wetter in ${city}: Sonnig, 24°C`;
  }
});
```

**[Mehr erfahren →](api/tool.md)**

## Dokumentation

### 📚 Anleitungen

- **[Erste Schritte](guides/getting-started.md)** - Vollständiges Tutorial
- **[Kernkonzepte](guides/core-concepts.md)** - Architekturübersicht
- **[Anbieter](guides/providers.md)** - Multi-Anbieter-Konfiguration
- **[Best Practices](guides/best-practices.md)** - Produktionsmuster

### 🔧 API-Referenz

- **[Agent](api/agent.md)** - Hauptorchestrator
- **[Context](api/context.md)** - Zustandsverwaltung
- **[Metadata](api/metadata.md)** - Schlüssel-Wert-Speicher
- **[Tool](api/tool.md)** - Benutzerdefinierte Funktionen
- **[Rule](api/rule.md)** - Verhaltensrichtlinien
- **[Message](api/message.md)** - Konversationsnachrichten
- **[Providers](api/providers.md)** - Anbieter-Funktionen
- **[Built-in Tools](api/built-in-tools.md)** - TimeTool, RemoteTool, AgentTool, AskTool, ChoiceTool, SleepTool

### 💡 Beispiele

- **[Basic Agent](examples/basic-agent.md)** - Einfacher Chatbot
- **[Multi-Provider](examples/multi-provider.md)** - Widerstandsfähige Konfiguration
- **[Custom Tools](examples/custom-tools.md)** - Werkzeuge erstellen
- **[Context Inheritance](examples/context-inheritance.md)** - Unternehmensmuster
- **[Advanced Patterns](examples/advanced-patterns.md)** - Komplexe Szenarien

### 🎓 Erweitert

- **[Architecture](advanced/architecture.md)** - Internes Design
- **[Performance](advanced/performance.md)** - Optimierung
- **[Troubleshooting](advanced/troubleshooting.md)** - Häufige Probleme
- **[Migration Guide](advanced/migration.md)** - Versions-Upgrades

## Anforderungen

- Node.js ≥ 16.0.0
- TypeScript ≥ 4.5.0 (optional)

## Links

- [GitHub-Repository](https://github.com/arcaelas/agent)
- [NPM-Paket](https://www.npmjs.com/package/@arcaelas/agent)
- [Issue-Tracker](https://github.com/arcaelas/agent/issues)
- [Discord-Community](https://discord.gg/arcaelas)

---

**Bereit, intelligente KI-Agenten zu erstellen?** Beginnen Sie mit dem **[Erste-Schritte-Leitfaden](guides/getting-started.md)** →
