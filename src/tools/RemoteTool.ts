/**
 * @fileoverview
 * Implementación de herramientas remotas HTTP para agentes de IA.
 *
 * Este módulo proporciona la clase RemoteTool que permite a los agentes
 * ejecutar llamadas HTTP remotas de forma encapsulada. Soporta todos los
 * métodos HTTP estándar (GET, POST, PUT, DELETE, PATCH) y permite
 * configuración completa de headers y parámetros.
 *
 * @author Arcaelas Insiders
 * @version 2.0.0
 * @since 2.0.0
 *
 * @example
 * ```typescript
 * // Herramienta GET para obtener datos
 * const api_data = new RemoteTool("get_user_data", {
 *   description: "Obtener información de usuario desde API externa",
 *   http: {
 *     method: "GET",
 *     headers: {
 *       "Authorization": "Bearer token123",
 *       "Content-Type": "application/json"
 *     },
 *     url: "https://api.example.com/users"
 *   },
 *   parameters: {
 *     user_id: "ID único del usuario a consultar",
 *     include_profile: "Incluir información de perfil (true/false)"
 *   }
 * });
 *
 * // Herramienta POST para enviar datos
 * const create_task = new RemoteTool("create_task", {
 *   description: "Crear nueva tarea en sistema remoto",
 *   http: {
 *     method: "POST",
 *     headers: {
 *       "Authorization": "Bearer token456",
 *       "Content-Type": "application/json"
 *     },
 *     url: "https://api.tasks.com/tasks"
 *   },
 *   parameters: {
 *     title: "Título de la tarea",
 *     description: "Descripción detallada",
 *     priority: "Prioridad (low, medium, high)"
 *   }
 * });
 * ```
 */
import Agent from "~/static/agent";
import Tool, { ToolOptions } from "~/static/tool";

/**
 * @description
 * Opciones de configuración para herramientas remotas HTTP.
 *
 * Extiende las opciones base de Tool excluyendo la función func,
 * ya que RemoteTool implementa automáticamente la lógica HTTP.
 *
 * @example
 * ```typescript
 * const options: RemoteToolOptions = {
 *   description: "Consultar información meteorológica",
 *   parameters: {
 *     city: "Ciudad para consultar el clima",
 *     units: "Unidades de temperatura (celsius/fahrenheit)"
 *   },
 *   http: {
 *     method: "GET",
 *     headers: {
 *       "X-API-Key": "weather_api_key_123",
 *       "Accept": "application/json"
 *     },
 *     url: "https://api.weather.com/v1/current"
 *   }
 * };
 * ```
 */
interface RemoteToolOptions extends Omit<ToolOptions, "func"> {
  /**
   * @description
   * Configuración HTTP para la llamada remota.
   * Define el método, headers y URL para la petición HTTP que
   * se ejecutará cuando la herramienta sea invocada.
   */
  http: {
    /**
     * @description
     * Método HTTP a utilizar para la petición.
     * Soporta todos los métodos estándar: GET, POST, PUT, DELETE, PATCH.
     */
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

    /**
     * @description
     * Headers HTTP para incluir en la petición.
     * Comúnmente incluye Authorization, Content-Type, Accept, etc.
     *
     * @example
     * ```typescript
     * headers: {
     *   "Authorization": "Bearer your-token",
     *   "Content-Type": "application/json",
     *   "User-Agent": "Agent/2.0"
     * }
     * ```
     */
    headers: Record<string, string>;

    /**
     * @description
     * URL completa del endpoint remoto a llamar.
     * Debe ser una URL válida incluyendo protocolo (https://).
     *
     * @example
     * ```typescript
     * url: "https://api.example.com/v1/data"
     * ```
     */
    url: string;
  };
}

/**
 * @description
 * Herramienta remota que ejecuta llamadas HTTP para agentes de IA.
 *
 * RemoteTool encapsula la funcionalidad de realizar peticiones HTTP
 * remotas de forma transparente para los agentes. Maneja automáticamente
 * la serialización de parámetros, configuración de headers y procesamiento
 * de respuestas.
 *
 * La herramienta serializa automáticamente los argumentos recibidos como
 * JSON en el body de la petición (para TODOS los métodos HTTP incluido GET)
 * y retorna la respuesta como texto plano.
 *
 * IMPORTANTE: El código envía body incluso para métodos GET,
 * lo cual puede no ser compatible con todas las APIs.
 *
 * @example
 * ```typescript
 * // Crear herramienta para API de traducción
 * const translator = new RemoteTool("translate_text", {
 *   description: "Traducir texto usando servicio remoto",
 *   parameters: {
 *     text: "Texto a traducir",
 *     from_lang: "Idioma origen (es, en, fr, etc.)",
 *     to_lang: "Idioma destino (es, en, fr, etc.)"
 *   },
 *   http: {
 *     method: "POST",
 *     headers: {
 *       "Authorization": "Bearer translate-key",
 *       "Content-Type": "application/json"
 *     },
 *     url: "https://api.translate.com/v2/translate"
 *   }
 * });
 *
 * // Crear herramienta para consulta GET
 * const status_checker = new RemoteTool("check_service_status", {
 *   description: "Verificar estado de servicios remotos",
 *   parameters: {
 *     service_id: "ID del servicio a verificar"
 *   },
 *   http: {
 *     method: "GET",
 *     headers: {
 *       "X-Monitor-Key": "monitor-key-123"
 *     },
 *     url: "https://status.example.com/api/check"
 *   }
 * });
 * ```
 */
export default class RemoteTool extends Tool {
  /**
   * @description
   * Crea una nueva herramienta remota HTTP.
   *
   * El constructor configura automáticamente una función que realiza
   * peticiones HTTP usando fetch(), serializa los argumentos como JSON
   * en el body (para todos los métodos) y retorna la respuesta como texto.
   *
   * @param name Nombre único de la herramienta remota
   * @param options Configuración de la herramienta incluyendo parámetros HTTP
   *
   *
   * NOTA: El constructor no valida la configuración HTTP.
   * Los errores de configuración se detectarán en tiempo de ejecución
   * cuando se intente hacer la petición fetch().
   *
   * @example
   * ```typescript
   * // Herramienta para enviar notificaciones
   * const notifier = new RemoteTool("send_notification", {
   *   description: "Enviar notificación push a usuarios",
   *   parameters: {
   *     user_id: "ID del usuario destinatario",
   *     message: "Mensaje de la notificación",
   *     priority: "Prioridad (low, normal, high)"
   *   },
   *   http: {
   *     method: "POST",
   *     headers: {
   *       "Authorization": "Bearer push-service-token",
   *       "Content-Type": "application/json"
   *     },
   *     url: "https://push.example.com/v1/send"
   *   }
   * });
   * ```
   */
  constructor(name: string, options: RemoteToolOptions) {
    super(name, {
      ...options,
      func: async (ctx: Agent, args: Record<string, any>) => {
        return await fetch(options.http.url, {
          method: options.http.method,
          headers: options.http.headers,
          body: JSON.stringify(args),
        }).then((res) => res.text());
      },
    });
  }
}
