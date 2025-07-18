---
description: Analiza la librería de Agente con funciones, personalidad y nombre (OpenAI + Arcaelas Insiders) y genera documentación completa.
---

# Workflow: generate-universal-docs

Descripción: Analiza el proyecto actual, identifica su propósito, dependencias y convenciones, y genera documentación fundamental y archivos de gobierno del proyecto de forma totalmente automatizada.

---

## 🔥 OBJETIVO GENERAL

Crear (o sobrescribir, si ya existen) los siguientes artefactos en la raíz del repositorio:

- `README.md`
- `LICENSE`
- `CHANGELOG.md`
- `SECURITY.md`

El Workflow debe funcionar con **cualquier stack de tecnologías** (TypeScript, Python, Go, Rust, etc.) y con **cualquier modelo de negocio** (open source, privativo, freemium, etc.).  
Los contenidos se adaptarán automáticamente al contexto real detectado o —si fuera necesario— consultando interactivamente al usuario.

---

## 📋 PARÁMETROS INTERACTIVOS (si no se detectan automáticamente)

| Parámetro                | Pregunta al usuario                                                             | Uso posterior                      |
| ------------------------ | ------------------------------------------------------------------------------- | ---------------------------------- |
| `PROJECT_NAME`           | “¿Cómo se llama el proyecto?”                                                   | Título, encabezados y badges       |
| `SHORT_DESCRIPTION`      | “Describe brevemente en una frase qué hace el proyecto.”                        | Introducción del README            |
| `PRIMARY_LANGUAGE`       | “¿En qué lenguaje principal está escrito?”                                      | Ejemplos de instalación y snippets |
| `ORG_NAME`               | “¿Cuál es la organización o autor principal?”                                   | Licencia y Créditos                |
| `LICENSE_POLICY`         | “¿Qué licencia prefieres? (Ej: MIT, Apache‑2.0, GPL‑3.0, Custom‑NonCommercial)” | Generar `LICENSE`                  |
| `COMMERCIAL_USAGE_RULES` | “¿Hay restricciones o regalías para uso comercial? Si es así, descríbelas.”     | Sección de licencia y SECURITY     |
| `CONTACT_SECURITY`       | “Email o URL de contacto para reportar vulnerabilidades.”                       | `SECURITY.md`                      |
| `COMMITS_TO_ANALYZE`     | “¿Cuántos cambios recientes deseas reflejar en el CHANGELOG? (default 10)”      | `CHANGELOG.md`                     |

---

## 🗺️ PLAN DE ALTO NIVEL

1. **Preparación & Análisis**

   - Indexa todo el árbol del proyecto.
   - Detecta lenguajes, frameworks, test suites y gestor de paquetes.
   - Lee historial de Git para identificar últimos `COMMITS_TO_ANALYZE` cambios significativos.

2. **Confirmación de Parámetros**

   - Si faltan datos, lanza preguntas interactivas según la tabla anterior.
   - Muestra al usuario un **resumen** con los valores detectados y permitir editar.

3. **Generación de `README.md`**

   - Estructura mínima obligatoria:
     1. Título y badges (lenguaje, versión, licencia).
     2. Descripción breve (`SHORT_DESCRIPTION`).
     3. Tabla de contenidos automática.
     4. Instalación rápida (ej. `yarn add`, `pip install`, `cargo add`, etc.).
     5. Uso básico (snippet mínimo y comentado).
     6. Uso avanzado (ejemplo con configuración detallada, plugins o extensiones).
     7. Documentación de API pública (enumerar funciones/clases clave).
     8. Buenas prácticas y guías de contribución resumidas.
     9. Licencia (enlazar a `LICENSE`).

4. **Generación de `LICENSE`**

   - Si `LICENSE_POLICY` ≈ “Custom‑NonCommercial”:
     - Crear texto base similar a CC BY‑NC 4.0, **pero** con cláusula específica de regalías conforme a `ORG_NAME` y `COMMERCIAL_USAGE_RULES`.
   - Si es una licencia OSI: incrustar plantilla oficial con el `ORG_NAME` y año actual.
   - Añadir sección “Contact” con email/URL para licencias comerciales cuando aplique.

5. **Generación de `CHANGELOG.md`**

   - Formato **Keep a Changelog** + **SemVer**.
   - Para cada commit analizado:
     - Derivar la versión (inferir `major.minor.patch` o preguntar).
     - Usar fecha `YYYY‑MM‑DD`.
     - Describir cambios en: funciones nuevas, refactorizaciones, fixes, docs, CI, seguridad, etc.
     - Evitar texto literal de commit; redactar descripción clara y concisa.
   - Incluir sección **[Unreleased]** al inicio si hay trabajo pendiente.

6. **Generación de `SECURITY.md`**

   - Contenido mínimo:
     - **Introducción**: objetivo del proyecto y dependencia de componentes externos detectados.
     - **Áreas de Riesgo Comunes**: inyección, deserialización, uso de APIs de terceros, gestión de claves, etc.
     - **Buenas Prácticas**: sanitización de entrada/salida, controles RBAC, cifrado de secretos, CI con análisis SCA.
     - **Política de Divulgación Responsable**: paso a paso, plazos de respuesta (<72 h), canal de contacto `CONTACT_SECURITY`.
     - **Versión Soportada**: qué versiones reciben parches de seguridad.

7. **Revisión & Aprobación**

   - Mostrar _diff_ previo al usuario de todos los archivos a crear/modificar.
   - Permitir feedback o edición manual antes de confirmar.

8. **Escritura en Modo Plan**

   - Crear/actualizar los archivos aprobados.
   - Ejecutar pruebas y linter si existen; abortar en caso de fallo grave.

9. **Checkpoint**

   - Guardar checkpoint nombrado `docs-universal-<fecha>`.

10. **Resumen Final**
    - Imprimir lista de archivos creados con rutas relativas.
    - Sugerir próximos pasos (ej. publicar docs, revisar licencia, crear release tag).

---

## 🚦 DETALLES Y REGLAS ESPECÍFICAS PARA CASCADE

- **Lenguaje**: mantén el README y SECURITY en el mismo idioma predominante del código (auto‑detect).
- **Estilo Markdown**: usa encabezados `##` máximo para secciones internas; evita `#` dentro del README si el título ya lo emplea.
- **Longitud**: todos los archivos deben ser descriptivos pero razonables (< 12 000 caracteres cada uno para cumplir límite de Workflow).
- **Respeto a Código Existente**: no modificar archivos de código fuente a menos que el usuario lo solicite.
- **Fuentes de Verdad**: confía primero en archivos de configuración (package.json, pyproject.toml, Cargo.toml, etc.) y en comentarios JSDoc/docstrings.
- **Herramientas Auxiliares**: si detectas comandos de prueba (`npm test`, `pytest`, `go test`), considéralos para la sección de ejemplo avanzado.
- **Licencia de Dependencias**: si alguna dependencia es GPL, señala advertencia en SECURITY.

---

## 🏁 INVOCACIÓN

Guarda este archivo como:
