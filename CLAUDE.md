# Estilo de Programación - Arcaelas Insiders

## 📋 Resumen General

Este documento define los patrones de programación, estilo de código y preferencias técnicas observadas en el proyecto `@arcaelas/agent`. Estos estándares garantizan **consistencia**, **legibilidad** y **mantenibilidad** del código base.

---

## 🎯 Principios Fundamentales

### 1. **Prioridad a Estándares Nativos**
- **JavaScript/TypeScript nativo** antes que librerías externas
- **Métodos nativos** antes que helpers personalizados
- **APIs estándar** antes que abstracciones propias
- Aprovechar las **capacidades del lenguaje** para código limpio y robusto

### 2. **Brevedad y Expresividad**
- Código **conciso pero legible**
- **Hardcodear valores** antes que variables de un solo uso
- **Lambda functions** preferidas sobre declaraciones independientes
- Evitar código extenso y verboso

### 3. **Robustez a través de Simplicidad**
- Menos líneas de código = menos bugs
- Utilizar características nativas del lenguaje
- Código autodocumentado a través de nombres descriptivos

---

## 🔧 Formateo y Estilo

### Indentación y Espaciado
```typescript
// ✅ Correcto: 2 espacios, líneas en blanco estratégicas
export interface ProviderOptions {
  baseURL: string;
  model: string;
  apiKey?: string;
}

// ❌ Incorrecto: 4 espacios o tabs
export interface ProviderOptions {
    baseURL: string;
    model: string;
}
```

### Puntuación y Operadores
```typescript
// ✅ Correcto: espacios alrededor de operadores
const idx = Math.floor(Math.random() * providers.length);
const { func, ...schema } = tool;

// ❌ Incorrecto: sin espacios
const idx=Math.floor(Math.random()*providers.length);
```

---

## 📝 Convenciones de Nomenclatura

### Variables y Funciones
```typescript
// ✅ camelCase descriptivo
const baseURL = "https://api.openai.com";
const toolOptions = { name: "search", description: "..." };

// ✅ Abreviaciones claras cuando son obvias
const idx = 0;
const args = JSON.parse(argText);
const desc = "Tool description";
```

### Clases e Interfaces
```typescript
// ✅ PascalCase con sufijos descriptivos
interface ProviderOptions { }
interface AgentOptions { }
class Agent<T extends AgentOptions> { }
```

---

## 🔀 Control de Flujo

### Condicionales: if-else vs Ternarios

**Usa ternarios para:**
- Asignaciones simples
- Valores condicionales en línea
- Expresiones cortas

```typescript
// ✅ Ternarios para asignaciones
const tool = typeof v === "function" ? v : v.func;
const name = typeof v === "function" ? Math.random().toString(36).slice(2) : k;

// ✅ Ternarios en parámetros
["func" as any]: typeof v === "function" ? v : v.func,
```

**Usa if-else para:**
- Lógica de múltiples líneas
- Validaciones con side effects
- Control de flujo complejo

```typescript
// ✅ if-else para validaciones
if (this.tools.has(k)) throw new Error("Tool already exists");

if (!choices.length) {
  providers.splice(idx, 1);
  continue;
}

// ✅ if-else para bloques de código
if (argText.trim()) {
  try {
    args = JSON.parse(argText);
  } catch {
    messages.push({
      role: "tool",
      tool_call_id: call.id,
      content: "Error: JSON.parse failed on tool arguments",
    });
    continue;
  }
}
```

### Switch Statements
**No utilizar `switch`** - preferir:
- **if-else** para lógica condicional
- **Object maps** para mapeo de valores
- **Ternarios** para casos simples

---

## ⚡ Declaración de Funciones

### Prioridad: Lambdas > Funciones Independientes

**✅ Preferido: Arrow functions inline**
```typescript
// Callbacks y transformaciones
const tools = [...this.tools.values()].map(
  ({ func, ...schema }: any) => schema
);

const providers = this.providers.map(({ baseURL, apiKey, model }) => {
  const client = new OpenAI({ baseURL, apiKey });
  return (p: Omit<OpenAI.Chat.ChatCompletionCreateParams, 'model'>) =>
    client.chat.completions.create({ ...p, model });
});

// Funciones de retorno
return () => {
  this.tools.delete(k);
};
```

**⚠️ Usar funciones independientes solo cuando:**
- La lógica es compleja y reutilizable
- Se necesita hoisting
- La función es parte de la API pública

```typescript
// ✅ Función independiente para API pública
async answer(messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]) {
  // ... lógica compleja
}
```

---

## 🏗️ Gestión de Variables y Constantes

### Regla: Hardcodear antes que Variables Únicas

**✅ Hardcodear valores de un solo uso**
```typescript
// ✅ Correcto: valor hardcodeado
for (let loop = 0; loop < 6; loop++) {
  // ...
}

// ✅ Correcto: string literal
throw new Error("Tool already exists");
```

**❌ Evitar variables innecesarias**
```typescript
// ❌ Incorrecto: variable para un solo uso
const MAX_LOOPS = 6;
for (let loop = 0; loop < MAX_LOOPS; loop++) {
  // ...
}

// ❌ Incorrecto: constante para string único
const TOOL_EXISTS_ERROR = "Tool already exists";
throw new Error(TOOL_EXISTS_ERROR);
```

**✅ Usar variables/constantes cuando:**
- El valor se reutiliza múltiples veces
- Representa configuración modificable
- Mejora significativamente la legibilidad

```typescript
// ✅ Correcto: reutilización
const client = new OpenAI({ baseURL, apiKey });
return (p: Omit<...>) => client.chat.completions.create({ ...p, model });
```

---

## 📚 Uso de Métodos Nativos

### Priorizar APIs Nativas del Lenguaje

**✅ Array methods nativos**
```typescript
// Transformaciones
const tools = [...this.tools.values()].map(transform);

// Búsquedas
const tool = this.tools.get(call.function.name);

// Validaciones
if (!choices.length) return;
```

**✅ Destructuring y Spread**
```typescript
// Destructuring con rest
const { func, ...schema } = tool;

// Spread para arrays
const tools = [...this.tools.values()];

// Spread para objetos
return { ...p, model };
```

**✅ Optional chaining y nullish coalescing**
```typescript
// Optional chaining
const argText = call.function.arguments ?? "";

// Nullish coalescing con default
for (const i in v.parameters ?? { input: "Entrada para la herramienta" }) {
  // ...
}
```

---

## 🎨 TypeScript Específico

### Tipado y Generics
```typescript
// ✅ Generics condicionales para flexibilidad
type Params<T> = T extends object ? T : { input: string };

// ✅ Type assertions cuando es necesario
["func" as any]: typeof v === "function" ? v : v.func,

// ✅ Tipos de unión y opcionales
limits?: string[];
apiKey?: string;
```

### Modificadores de Acceso
```typescript
// ✅ readonly para inmutabilidad
readonly name: string;
private readonly providers: ProviderOptions[];

// ✅ private para estado interno
private readonly tools = new Map<string, OpenAI.ChatCompletionTool>();
```

---

## 📖 Documentación

### JSDoc en Español para APIs Públicas
```typescript
/**
 * @description
 * Opciones del agente.
 */
export interface AgentOptions {
  /**
   * @description
   * Nombre del agente, utilizado para identificar al agente durante toda la conversación.
   */
  name: string;
}
```

### Comentarios de Sección
```typescript
/* 1 · Schemas de herramientas (omitimos `func` con `as any`) */
const tools = [...this.tools.values()].map(
  ({ func, ...schema }: any) => schema
);

/* 2 · Creamos un wrapper por proveedor con el modelo inyectado */
const providers = this.providers.map(({ baseURL, apiKey, model }) => {
  // ...
});
```

---

## ⚙️ Herramientas y Build

### Configuración de Desarrollo
- **ESBuild** para build rápido sin bundle
- **TypeScript** con decorators y paths absolutos
- **Jest** con configuración TypeScript nativa
- **Prettier** con ignore selectivo para casos especiales

### Scripts de Automatización
```json
{
  "build": "tsc && node esbuild.js",
  "prepublishOnly": "yarn build && npm version patch",
  "postpublish": "rm -rf build"
}
```

---

## 🎯 Resumen de Principios Clave

1. **JavaScript/TypeScript nativo** > librerías externas
2. **Métodos nativos** > helpers personalizados
3. **Lambdas** > funciones independientes
4. **Hardcodear** > variables de un solo uso
5. **Brevedad expresiva** > código verboso
6. **if-else** para lógica, **ternarios** para asignaciones
7. **No usar switch** - preferir if-else u object maps
8. **Código autodocumentado** a través de nombres descriptivos
9. **2 espacios** de indentación siempre
10. **Robustez** a través de simplicidad y estándares

Este estilo garantiza código **limpio**, **mantenible** y **performante** siguiendo las mejores prácticas de JavaScript moderno y TypeScript.