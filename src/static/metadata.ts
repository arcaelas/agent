/**
 * @fileoverview
 * Sistema de gestión de metadatos con herencia jerárquica mejorado.
 *
 * Este módulo proporciona la clase Metadata optimizada que actúa como un store
 * de datos planos con capacidad de herencia. Utiliza un patrón broker para
 * gestionar múltiples nodos padre de forma eficiente y elegante.
 *
 * Características principales:
 * - Store de datos planos con herencia
 * - Constructor flexible con spread operator
 * - Lecturas jerárquicas con fallback
 * - Escrituras locales únicamente
 * - Eliminación usando valores null
 * - API simple y eficiente
 *
 * @author Arcaelas Insiders
 * @version 2.3.0
 * @since 2.0.0
 *
 * @example
 * ```typescript
 * import Metadata from './metadata';
 *
 * // Metadata sin herencia
 * const global = new Metadata();
 * global.set("app", "MyApp");
 *
 * // Metadata con herencia
 * const user = new Metadata(global);
 * user.set("theme", "dark");
 *
 * // Metadata con herencia múltiple
 * const session = new Metadata(user, global);
 * session.set("session_id", "123");
 *
 * console.log(session.get("app"));    // "MyApp" (heredado)
 * console.log(session.get("theme"));  // "dark" (heredado)
 * console.log(session.get("session_id")); // "123" (local)
 * ```
 */

/**
 * @description
 * Clase Metadata optimizada con herencia jerárquica usando patrón broker.
 *
 * Permite crear jerarquías de configuración de forma flexible y eficiente.
 * Utiliza un broker interno para gestionar múltiples nodos padre y
 * proporciona lecturas jerárquicas con fallback integrado.
 *
 * @example
 * ```typescript
 * // Configuración base
 * const defaults = new Metadata();
 * defaults.set("timeout", "5000");
 * defaults.set("retries", "3");
 *
 * // Configuración de entorno
 * const env = new Metadata();
 * env.set("timeout", "10000"); // Override
 *
 * // Configuración final con herencia múltiple
 * const config = new Metadata(defaults, env);
 * config.set("api_key", "secret123");
 *
 * // Lecturas con precedencia automática
 * console.log(config.get("timeout", "0"));  // "10000" (de env)
 * console.log(config.get("retries", "0"));  // "3" (de defaults)
 * console.log(config.get("api_key", ""));   // "secret123" (local)
 * ```
 */
export default class Metadata {
  /**
   * @description
   * Almacén de datos local del nodo.
   */
  private readonly _data: Record<string, string | null> = {};

  /**
   * @description
   * Broker de nodos padre para herencia jerárquica.
   */
  private readonly _broker: Metadata[] = [];

  /**
   * @description
   * Crea una nueva instancia de Metadata con herencia flexible.
   *
   * @param children Nodos padre para herencia (individual, array o spread)
   *
   * @example
   * ```typescript
   * // Sin herencia
   * const meta1 = new Metadata();
   *
   * // Herencia individual
   * const meta2 = new Metadata(meta1);
   *
   * // Herencia múltiple
   * const meta3 = new Metadata(meta1, meta2);
   *
   * // Herencia con array
   * const meta4 = new Metadata([meta1, meta2]);
   *
   * // Herencia mixta
   * const meta5 = new Metadata(meta1, [meta2, meta3], meta4);
   * ```
   */
  constructor(...children: (Metadata | Metadata[])[]) {
    this.use(...children);
  }

  /**
   * @description
   * Obtiene el valor de una clave con fallback jerárquico.
   * Busca primero localmente, luego en nodos broker en orden.
   *
   * @param key Clave del valor a obtener
   * @param fallback Valor por defecto si no se encuentra
   * @returns El valor encontrado o el fallback
   *
   * @example
   * ```typescript
   * const parent = new Metadata();
   * parent.set("color", "blue");
   * parent.set("size", "large");
   *
   * const child = new Metadata(parent);
   * child.set("color", "red");      // Override local
   * child.set("shape", "circle");   // Valor local
   * child.set("size", null);        // Eliminar localmente
   *
   * // Lecturas con fallback
   * console.log(child.get("color", "default"));  // "red" (local)
   * console.log(child.get("shape", "default"));  // "circle" (local)
   * console.log(child.get("size", "default"));   // null (eliminado localmente)
   * console.log(child.get("missing", "default")); // "default" (fallback)
   *
   * // Fallback tipado
   * const timeout = child.get("timeout", "5000"); // string garantizado
   * const port = child.get<string>("port", "3000"); // Tipado explícito
   * ```
   */
  get(key: string, fallback: string | null = null): string | null {
    // Validamos si localmente tenemos esa propiedad
    if (key in this._data) {
      return this._data[key];
    }
    // Recorremos los nodos broker
    for (const node of this._broker) {
      // Reemplazamos el fallback con lo que vayamos encontrando para dar la ultima coincidencia
      fallback = node.get(key, fallback)!;
    }
    return fallback ?? null;
  }

  /**
   * @description
   * Verifica si una clave existe y no está marcada como eliminada.
   * Busca primero localmente, luego en nodos broker.
   *
   * @param key Clave a verificar
   * @returns true si la clave existe y no está eliminada
   *
   * @example
   * ```typescript
   * const config1 = new Metadata();
   * config1.set("feature_a", "enabled");
   * config1.set("feature_b", "disabled");
   *
   * const config2 = new Metadata(config1);
   * config2.set("feature_c", "enabled");
   * config2.set("feature_a", null); // Elimina localmente
   *
   * console.log(config2.has("feature_a")); // false (eliminado localmente)
   * console.log(config2.has("feature_b")); // true (heredado de config1)
   * console.log(config2.has("feature_c")); // true (local)
   * console.log(config2.has("feature_d")); // false (no existe)
   *
   * // Verificación condicional eficiente
   * if (config2.has("feature_b")) {
   *   console.log("Feature B está disponible");
   * }
   * ```
   */
  has(key: string): boolean {
    // prettier-ignore
    return this._data[key] === null ? false : (
      this._data[key] === undefined ?(
        this._broker.some((node) => node.has(key))
      ) : true
    )
  }

  /**
   * @description
   * Establece un valor localmente en este nodo.
   * Si el valor es null o undefined, marca la clave como eliminada.
   *
   * @param key Clave donde almacenar el valor
   * @param value Valor a almacenar o null para eliminar
   * @returns La instancia actual para encadenamiento
   *
   * @example
   * ```typescript
   * const metadata = new Metadata();
   *
   * // Establecer valores
   * metadata.set("user_id", "12345");
   * metadata.set("session_token", "abc123");
   *
   * // Eliminar valores (marca como null)
   * metadata.set("temp_data", null);
   * metadata.set("cache_key", undefined);
   *
   * // Encadenamiento fluido
   * metadata
   *   .set("config1", "value1")
   *   .set("config2", "value2")
   *   .set("old_config", null); // Elimina
   * ```
   */
  set(key: string, value: string | null | undefined): this {
    this._data[key] = value ?? null!;
    return this;
  }

  /**
   * @description
   * Marca una clave como eliminada localmente.
   * Equivale a llamar set(key, null).
   *
   * @param key Clave a eliminar
   * @returns La instancia actual para encadenamiento
   *
   * @example
   * ```typescript
   * const base = new Metadata();
   * base.set("config", "value");
   *
   * const derived = new Metadata(base);
   * derived.delete("config"); // Elimina localmente
   *
   * console.log(derived.has("config")); // false (eliminado)
   * console.log(base.has("config"));    // true (no afectado)
   * ```
   */
  delete(key: string): this {
    return this.set(key, null);
  }

  /**
   * @description
   * Elimina todos los datos locales de este nodo.
   * No afecta a los nodos broker.
   *
   * @returns La instancia actual para encadenamiento
   *
   * @example
   * ```typescript
   * const parent = new Metadata();
   * parent.set("inherited", "value");
   *
   * const child = new Metadata(parent);
   * child.set("local1", "value1");
   * child.set("local2", "value2");
   *
   * // Limpiar datos locales únicamente
   * child.clear();
   *
   * console.log(child.get("local1", ""));    // "" (eliminado)
   * console.log(child.get("inherited", "")); // "value" (heredado)
   * ```
   */
  clear(): this {
    Object.keys(this._data).forEach((key) => delete this._data[key]);
    return this;
  }

  /**
   * @description
   * Agrega dinámicamente nuevos nodos al broker para herencia.
   * Soporta la misma sintaxis flexible que el constructor.
   *
   * @param nodes Nodos a agregar (individual, array o spread)
   * @returns La instancia actual para encadenamiento
   *
   * @example
   * ```typescript
   * const base = new Metadata();
   * base.set("app", "MyApp");
   *
   * const theme = new Metadata();
   * theme.set("color", "blue");
   *
   * const config = new Metadata();
   * config.set("local", "value");
   *
   * // Agregar nodos dinámicamente
   * config.use(base);                    // Nodo individual
   * config.use([theme]);                 // Array de nodos
   * config.use(base, theme);             // Múltiples nodos
   *
   * // Encadenamiento fluido
   * config
   *   .use(base)
   *   .use(theme)
   *   .set("final", "configured");
   *
   * console.log(config.get("app", ""));    // "MyApp" (de base)
   * console.log(config.get("color", ""));  // "blue" (de theme)
   * console.log(config.get("local", ""));  // "value" (local)
   * ```
   */
  use(...nodes: (Metadata | Metadata[])[]): this {
    this._broker.push(
      ...([] as Metadata[])
        .concat(...nodes)
        .filter((m) => m instanceof Metadata)
    );
    return this;
  }

  /**
   * @description
   * Obtiene todos los datos disponibles combinando herencia y datos locales.
   * Excluye valores null y undefined del resultado final.
   *
   * @returns Objeto con todos los valores disponibles
   *
   * @example
   * ```typescript
   * const defaults = new Metadata();
   * defaults.set("theme", "light");
   * defaults.set("debug", "false");
   *
   * const user = new Metadata(defaults);
   * user.set("theme", "dark");    // Override
   * user.set("lang", "es");       // Nuevo
   * user.set("debug", null);      // Eliminar
   *
   * const all_config = user.all();
   * console.log(all_config);
   * // {
   * //   theme: "dark",  // Override local
   * //   lang: "es"      // Valor local
   * //   // debug no aparece (eliminado con null)
   * // }
   * ```
   */
  all(): Record<string, string> {
    return this.toJSON();
  }

  /**
   * @description
   * Serialización JSON nativa que combina herencia y datos locales.
   * Se llama automáticamente en JSON.stringify().
   *
   * @returns Objeto serializable con todos los valores disponibles
   *
   * @example
   * ```typescript
   * const config = new Metadata();
   * config.set("app", "MyApp");
   *
   * // Llamada automática en JSON.stringify()
   * const json_string = JSON.stringify(config);
   *
   * // Llamada manual para spread
   * const combined = { ...config.toJSON(), extra: "value" };
   * ```
   */
  toJSON(): Record<string, string> {
    return Object.assign(
      {},
      ...this._broker.map((node) => node.toJSON()),
      Object.fromEntries(
        Object.entries(this._data).filter(
          ([_, value]) => value !== null && value !== undefined
        )
      )
    );
  }
}
