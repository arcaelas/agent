/**
 * @fileoverview
 * Sistema de reglas dinámicas para agentes de IA.
 *
 * Este módulo proporciona la clase Rule que define comportamientos, restricciones
 * y personalidad de forma dinámica y condicional. Las reglas se evalúan en tiempo
 * de ejecución basándose en el estado del contexto y pueden aplicarse o no según
 * condiciones específicas.
 *
 * @author Arcaelas Insiders
 * @version 2.0.0
 * @since 2.0.0
 *
 * @example
 * ```typescript
 * // Regla simple
 * const politeness = new Rule("Mantén siempre un tono profesional y cordial");
 *
 * // Regla condicional programática
 * const business_hours = new Rule("Informar sobre horario de atención telefónica", {
 *   when: (agent) => {
 *     const now = new Date();
 *     const hour = now.getHours();
 *     return hour < 9 || hour > 17;
 *   }
 * });
 *
 * // Regla condicional programática
 * const premium_support = new Rule("Ofrecer soporte prioritario y beneficios premium", {
 *   when: (agent) => {
 *     const tier = agent.metadata("customer_tier");
 *     return tier === "gold" || tier === "platinum";
 *   }
 * });
 * ```
 */

import type Agent from "./agent";

/**
 * @description
 * Opciones para configuración de reglas condicionales.
 */
export interface RuleOptions {
  /**
   * @description
   * Función que determina cuándo se aplica la regla.
   * Recibe el agente y retorna un booleano.
   * Puede ser async o síncrona.
   */
  when: (ctx: Agent) => boolean | Promise<boolean>;
}

/**
 * @description
 * Clase Rule que define comportamientos dinámicos y restricciones para agentes.
 *
 * Las reglas pueden ser estáticas (siempre activas) o condicionales (evaluadas
 * dinámicamente). Las reglas condicionales pueden usar descripciones textuales
 * para que el modelo de IA interprete cuándo aplicarlas, o funciones programáticas
 * que evalúan el contexto actual.
 *
 * @example
 * ```typescript
 * // Regla estática siempre activa
 * const privacy = new Rule("Nunca compartir información personal de usuarios");
 *
 * // Regla con condición específica
 * const escalation = new Rule("Escalar a supervisor humano", {
 *   when: (agent) => {
 *     const messages = agent.message();
 *     const recent_msg = messages[messages.length - 1]?.content || "";
 *     return recent_msg.includes("supervisor") || recent_msg.includes("frustrado");
 *   }
 * });
 *
 * // Regla con condición programática
 * const region_specific = new Rule("Aplicar regulaciones GDPR", {
 *   when: (agent) => {
 *     const region = agent.metadata("user_region");
 *     return region === "EU" || region === "UK";
 *   }
 * });
 *
 * // Regla con lógica compleja
 * const working_hours = new Rule("Ofrecer callback durante horario laboral", {
 *   when: (agent) => {
 *     const now = new Date();
 *     const hour = now.getHours();
 *     const is_weekend = now.getDay() === 0 || now.getDay() === 6;
 *     return (hour < 9 || hour > 17 || is_weekend);
 *   }
 * });
 *
 * // Uso de las reglas
 * console.log(privacy.description);    // "Nunca compartir información..."
 * console.log(privacy.length);         // 45 (caracteres)
 * console.log(typeof privacy.when);    // "function"
 * ```
 */
export default class Rule {
  /**
   * @description
   * Descripción textual de la regla que define el comportamiento esperado.
   */
  readonly description: string;

  /**
   * @description
   * Función que determina cuándo aplicar la regla.
   * Siempre es una función que recibe el agente.
   * Por defecto retorna true (regla siempre activa).
   */
  readonly when: (ctx: Agent) => boolean | Promise<boolean>;

  /**
   * @description
   * Crea una regla simple que siempre está activa.
   *
   * @param description Descripción del comportamiento que define la regla
   *
   * @example
   * ```typescript
   * const politeness = new Rule("Mantén un tono respetuoso en todas las interacciones");
   * const confidentiality = new Rule("No divulgar información confidencial de la empresa");
   * const helpfulness = new Rule("Proporcionar respuestas útiles y completas");
   * ```
   */
  constructor(description: string);

  /**
   * @description
   * Crea una regla condicional que se aplica según condiciones específicas.
   *
   * @param description Descripción del comportamiento que define la regla
   * @param options Opciones de configuración incluyendo la condición
   *
   * @example
   * ```typescript
   * // Condición programática con acceso al contexto del agente
   * const upsell = new Rule("Sugerir productos premium complementarios", {
   *   when: (agent) => {
   *     const tier = agent.metadata("customer_tier");
   *     return tier === "premium" || tier === "gold";
   *   }
   * });
   *
   * // Condición asíncrona con evaluación compleja
   * const loyalty_discount = new Rule("Aplicar descuento por lealtad del 15%", {
   *   when: async (agent) => {
   *     const purchases = agent.metadata("total_purchases") || 0;
   *     const member_since = agent.metadata("member_since");
   *     const years_since = member_since ?
   *       (Date.now() - new Date(member_since).getTime()) / (1000 * 60 * 60 * 24 * 365) : 0;
   *     return purchases > 10 && years_since > 2;
   *   }
   * });
   * ```
   */
  constructor(description: string, options: RuleOptions);

  constructor(description: string, options?: RuleOptions) {
    this.description = description;
    this.when = options?.when || (() => true); // Valor predeterminado: siempre activa

    // Validación básica
    if (!this.description || this.description.trim().length === 0) {
      throw new Error("Rule description is required and cannot be empty");
    }
  }

  /**
   * @description
   * Obtiene la longitud de la descripción de la regla.
   *
   * @returns Número de caracteres en la descripción
   *
   * @example
   * ```typescript
   * const rule = new Rule("Mantener tono profesional");
   * console.log(rule.length); // 24
   * ```
   */
  get length(): number {
    return this.description.length;
  }

  /**
   * @description
   * Convierte la regla a formato JSON para serialización.
   * Implementa el método nativo toJSON() de Node.js para compatibilidad
   * con JSON.stringify() y otras operaciones de serialización.
   *
   * @returns Representación JSON de la regla
   *
   * @example
   * ```typescript
   * const rule = new Rule("Ser educado", {
   *   when: (agent) => agent.metadata("user_type") === "customer"
   * });
   *
   * const rule_data = rule.toJSON();
   * console.log(JSON.stringify(rule)); // Usa automáticamente toJSON()
   * // Resultado: { "description": "Ser educado", "when": "[Function]" }
   * ```
   */
  toJSON(): {
    description: string;
    when: string; // Siempre indicamos que es función
  } {
    return {
      description: this.description,
      when: "[Function]", // when siempre es función
    };
  }

  /**
   * @description
   * Retorna representación string de la regla para debugging.
   *
   * @returns Descripción legible de la regla
   *
   * @example
   * ```typescript
   * const static_rule = new Rule("Ser educado");
   * const conditional_rule = new Rule("Ofrecer ayuda", {
   *   when: (agent) => agent.message().length > 0
   * });
   *
   * console.log(static_rule.toString());     // "Rule: Ser educado [Function]"
   * console.log(conditional_rule.toString()); // "Rule: Ofrecer ayuda [Function]"
   * console.log(String(static_rule));        // Usa automáticamente toString()
   * ```
   */
  toString(): string {
    const preview =
      this.description.length > 50
        ? this.description.substring(0, 47) + "..."
        : this.description;

    // Ahora when siempre es función
    return `Rule: ${preview} [Function]`;
  }
}
