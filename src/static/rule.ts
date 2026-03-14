/**
 * @fileoverview
 * Behavior rules system for AI agents.
 * Sistema de reglas de comportamiento para agentes de IA.
 *
 * This module provides the Rule class that defines behaviors, constraints
 * and guidelines for agents. Rules are injected as system context in each request.
 *
 * Este modulo proporciona la clase Rule que define comportamientos, restricciones
 * y directrices para agentes. Las reglas se inyectan como contexto del sistema en cada peticion.
 *
 * @author Arcaelas Insiders
 * @version 3.0.0
 * @since 2.0.0
 *
 * @example
 * ```typescript
 * const politeness = new Rule("Manten siempre un tono profesional y cordial");
 * const privacy = new Rule("Nunca compartir informacion personal de usuarios");
 * ```
 */

/**
 * @description
 * Behavior rule defining agent constraints and guidelines.
 * Regla de comportamiento que define restricciones y directrices del agente.
 *
 * @example
 * ```typescript
 * const privacy = new Rule("Nunca compartir informacion personal de usuarios");
 * const security = new Rule("NUNCA proporciones tokens API o datos sensibles");
 *
 * agent.rules = [privacy, security];
 *
 * console.log(privacy.description);  // "Nunca compartir informacion personal de usuarios"
 * console.log(privacy.length);       // 52
 * ```
 */
export default class Rule {
  /**
   * @description
   * Textual description of the rule defining expected behavior.
   * Descripcion textual de la regla que define el comportamiento esperado.
   */
  readonly description: string;

  /**
   * @description
   * Creates a new Rule instance.
   * Crea una nueva instancia de Rule.
   *
   * @param description - Rule text defining the expected behavior
   *
   * @example
   * ```typescript
   * const politeness = new Rule("Manten un tono respetuoso en todas las interacciones");
   * const confidentiality = new Rule("No divulgar informacion confidencial de la empresa");
   * ```
   */
  constructor(description: string) {
    this.description = description;
    if (!this.description || this.description.trim().length === 0) {
      throw new Error("La descripcion de la regla es requerida y no puede estar vacia");
    }
  }

  /**
   * @description
   * Gets the length of the rule description.
   * Obtiene la longitud de la descripcion de la regla.
   *
   * @returns Number of characters in the description / Numero de caracteres en la descripcion
   *
   * @example
   * ```typescript
   * const rule = new Rule("Mantener tono profesional");
   * console.log(rule.length); // 25
   * ```
   */
  get length(): number {
    return this.description.length;
  }

  /**
   * @description
   * Converts the rule to JSON format for serialization.
   * Convierte la regla a formato JSON para serializacion.
   *
   * @returns JSON representation of the rule / Representacion JSON de la regla
   *
   * @example
   * ```typescript
   * const rule = new Rule("Ser educado");
   * console.log(JSON.stringify(rule)); // { "description": "Ser educado" }
   * ```
   */
  toJSON(): { description: string } {
    return { description: this.description };
  }

  /**
   * @description
   * Returns string representation of the rule for debugging.
   * Retorna representacion string de la regla para debugging.
   *
   * @returns Readable description of the rule / Descripcion legible de la regla
   *
   * @example
   * ```typescript
   * const rule = new Rule("Ser educado");
   * console.log(String(rule)); // "Rule: Ser educado"
   * ```
   */
  toString(): string {
    const preview =
      this.description.length > 50
        ? this.description.substring(0, 47) + "..."
        : this.description;
    return `Rule: ${preview}`;
  }
}
