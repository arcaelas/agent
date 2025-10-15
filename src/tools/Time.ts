/**
 * @fileoverview
 * Herramienta de tiempo para agentes de IA que proporciona información temporal.
 *
 * Este módulo implementa TimeTool, una herramienta especializada que permite
 * a los agentes obtener la fecha y hora actual del sistema con soporte para
 * diferentes zonas horarias. Utiliza la API nativa de JavaScript para
 * formateo localizado y gestión de zonas horarias.
 *
 * @author Arcaelas Insiders
 * @version 2.0.0
 * @since 2.0.0
 *
 * @example
 * ```typescript
 * // Herramienta básica de tiempo (zona horaria del sistema)
 * const time_tool = new TimeTool({});
 *
 * // Herramienta con zona horaria personalizada
 * const madrid_time = new TimeTool({
 *   time_zone: "Europe/Madrid"
 * });
 *
 * // Uso en agente
 * agent.tools = [time_tool];
 * const [response] = await agent.call("¿Qué hora es?");
 * // Respuesta: "12/27/2024, 10:30:45 AM"
 * ```
 */
import Agent from "~/static/agent";
import Tool from "~/static/tool";

/**
 * @description
 * Herramienta especializada para obtener información temporal del sistema.
 *
 * TimeTool proporciona acceso a la fecha y hora actual con soporte completo
 * para diferentes zonas horarias. Utiliza la API nativa Intl.DateTimeFormat
 * de JavaScript para formateo localizado y preciso de fechas.
 *
 * La herramienta detecta automáticamente la zona horaria del sistema cuando
 * no se especifica una zona horaria personalizada, garantizando siempre
 * información temporal precisa y contextual.
 *
 * @example
 * ```typescript
 * // Configuración básica (sin zona horaria personalizada)
 * const basic_time = new TimeTool({});
 *
 * // Configuración con zona horaria personalizada
 * const global_time = new TimeTool({
 *   time_zone: "Asia/Tokyo"
 * });
 *
 * // Ejemplos de uso:
 * // Sin zona horaria: "12/27/2024, 3:45:30 PM" (zona del sistema en formato US)
 * // Con Europe/Madrid: "12/27/2024, 2:45:30 PM" (hora europea en formato US)
 * // Con Asia/Tokyo: "12/28/2024, 12:45:30 AM" (hora japonesa en formato US)
 * // NOTA: Siempre usa formato "en-US" independientemente de la zona horaria
 * ```
 */
export default class TimeTool extends Tool {
  /**
   * @description
   * Crea una nueva herramienta de tiempo con configuración personalizable.
   *
   * El constructor inicializa la herramienta con el nombre fijo "get_time"
   * y configura automáticamente una función que obtiene la fecha/hora actual
   * usando la zona horaria especificada o la del sistema por defecto.
   *
   * @param options Objeto que solo puede contener la propiedad time_zone opcional
   *
   * @example
   * ```typescript
   * // Herramienta básica (zona horaria del sistema)
   * const system_time = new TimeTool({});
   *
   * // Herramienta para zona horaria específica
   * const utc_time = new TimeTool({
   *   time_zone: "UTC"
   * });
   *
   * // Herramienta para zona horaria específica
   * const world_clock = new TimeTool({
   *   time_zone: "Asia/Tokyo"
   * });
   * ```
   */
  constructor(options: { time_zone?: string } = {}) {
    super("get_time", {
      ...options,
      description: "Obtener la fecha y hora actual del sistema",
      parameters: {
        time_zone:
          "Opcional - Zona horaria IANA para obtener la hora (ej: Europe/Madrid). Si no se proporciona, usa la zona horaria del sistema",
      },
      func: (ctx: Agent, args: { time_zone: string }) => {
        args.time_zone ||=
          options.time_zone || Intl.DateTimeFormat().resolvedOptions().timeZone;
        return new Date().toLocaleString("en-US", { timeZone: args.time_zone });
      },
    });
  }
}
