---
description: Analiza la librería de Agente con funciones, personalidad y nombre (OpenAI + Arcaelas Insiders) y genera documentación completa.
---

Realiza un análisis profundo del proyecto actual, que es una librería en TypeScript con documentación exhaustiva mediante JSDoc y tipado estricto. La librería tiene como objetivo permitir la creación de un "Agente" utilizando las APIs de OpenAI, otorgándole funcionalidades (tools), personalidad y un nombre propio.

**Instrucciones**:

Utiliza tu capacidad de análisis avanzado para revisar el proyecto completo, entendiendo claramente la lógica interna, funcionalidades, dependencias (exclusivamente Arcaelas Insiders y OpenAI), estructuras tipadas y documentación existente.

A partir de este análisis, genera los siguientes archivos estrictamente siguiendo estas pautas:

---

## 📖 Archivo: `README.md`

Este archivo debe contener la documentación completa y profesional del proyecto, organizada con estos apartados:

- **Título y descripción breve:** Indica claramente qué hace la librería en términos simples.
- **Introducción extendida:** Explica detalladamente los conceptos clave como "Agente", "tools" (funcionalidades), personalidad del agente y su integración con OpenAI.
- **Instalación rápida:** Comandos exactos para instalar la librería usando `yarn` o `npx`.
- **Uso básico:** Ejemplo mínimo, simple y funcional en TypeScript con comentarios breves que expliquen claramente cada paso.
- **Uso avanzado:** Ejemplo mostrando cómo personalizar un Agente con múltiples herramientas, personalidad y nombre propios, ilustrando casos reales y prácticos.
- **API detallada:** Resume de manera estructurada las funciones públicas más importantes con breve descripción.
- **Recomendaciones y buenas prácticas:** Incluye sugerencias sobre cómo aprovechar mejor la librería.
- **Licencia:** Breve nota indicando claramente que el proyecto es open source pero con restricciones comerciales.

---

## 📜 Archivo: `LICENSE`

Genera una licencia personalizada que cumpla estrictamente con estas condiciones:

- Especifica claramente que el código es **Open Source**.
- El código puede utilizarse libremente para fines personales, educativos o sin ánimo de lucro.
- **Prohíbe explícitamente el uso comercial o lucrativo** sin obtener previamente una licencia comercial autorizada por **"Arcaelas Insiders"**, detallando que cualquier uso comercial generará la obligación del pago de regalías.
- Indica contacto con Arcaelas Insiders para obtener licencias comerciales.

---

## 📒 Archivo: `CHANGELOG`

Genera un historial detallado de cambios recientes, basándote estrictamente en los últimos **10 cambios** realizados en el proyecto, pero **no uses el texto literal de los commits**. En lugar de eso:

- Revisa profundamente cada commit y describe de forma clara y objetiva las modificaciones realizadas en la lógica, estructura, tipado, documentación, rendimiento o manejo de errores.
- Usa un formato organizado: versión (semver), fecha, y lista ordenada de cambios significativos con breve explicación del impacto del cambio.

Ejemplo del formato:

```
## [1.3.1] - 2025-07-17
- Mejorado rendimiento en el manejo de respuestas del API de OpenAI.
- Corregido error crítico en el método `.answer()` que generaba loops infinitos.
- Añadido soporte para herramientas (tools) condicionales según el contexto.

## [1.3.0] - 2025-07-15
- Añadida funcionalidad avanzada para definir personalidad detallada del agente.
- Refactorización completa del tipado en las interfaces principales.
```

---

## 🔒 Archivo: `SECURITY.md`

Genera un documento de seguridad detallado, serio y profesional que incluya:

- **Introducción:** Explicando que la herramienta depende completamente de APIs de terceros (OpenAI) y utilidades exclusivas de Arcaelas Insiders, siendo por naturaleza susceptible a vulnerabilidades externas.
- **Potenciales vulnerabilidades:**

  - Riesgos inherentes al uso de APIs externas (OpenAI), incluyendo posibles fugas de información o respuestas maliciosas provenientes del modelo.
  - Gestión y protección de credenciales y claves API utilizadas por el agente.
  - Vulnerabilidades potenciales relacionadas con la manipulación maliciosa de las funcionalidades o herramientas integradas ("tools").
  - Riesgos específicos relacionados con la ejecución automatizada de código o acciones basadas en respuestas no verificadas de modelos LLM.

- **Recomendaciones para mitigar riesgos:**

  - Valida y sanitiza siempre todas las entradas y salidas del agente.
  - Implementa auditorías y logs detallados sobre las interacciones del agente.
  - Protege estrictamente tus credenciales de acceso a OpenAI y Arcaelas Insiders.

- **Política de reporte de vulnerabilidades:**

  - Indica claramente cómo y dónde reportar cualquier vulnerabilidad encontrada (contacto, email, plataforma de seguimiento, etc.).
  - Tiempo estimado para respuesta inicial y corrección crítica.

Finaliza enfatizando la responsabilidad de los usuarios para implementar prácticas seguras y prudentes en sus implementaciones usando esta librería.

---

## ⚠️ Reglas de ejecución del prompt:

- Revisa cuidadosamente toda la estructura del proyecto antes de iniciar cualquier escritura.
- Cada archivo generado debe ser profesional, claro, objetivo y coherente con el contexto real del proyecto.
- Respeta siempre la propiedad intelectual, comercial y técnica descrita.
- No inventes funcionalidades inexistentes ni asumas comportamientos que no estén documentados o tipados en el proyecto.
- Usa un estilo markdown limpio y fácil de leer, ideal para documentación técnica profesional.
