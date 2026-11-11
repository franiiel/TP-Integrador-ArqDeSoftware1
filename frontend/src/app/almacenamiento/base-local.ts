// Base IndexedDB del celular (ADR-03). Guarda las actas con sus fotos y la última lista de inspecciones.

const NOMBRE_BASE = 'inspecciones-obra';
const VERSION = 1;

/** Actas emitidas en el celular, con clave `id` (UUID del acta). */
export const STORE_ACTAS = 'actas';
/** Datos del servidor guardados para usarlos sin señal, con clave explícita. */
export const STORE_CACHE = 'cache';

let conexion: Promise<IDBDatabase> | null = null;

function abrir(): Promise<IDBDatabase> {
  conexion ??= new Promise<IDBDatabase>((resolve, reject) => {
    const pedido = indexedDB.open(NOMBRE_BASE, VERSION);
    pedido.onupgradeneeded = () => {
      const db = pedido.result;
      if (!db.objectStoreNames.contains(STORE_ACTAS)) {
        db.createObjectStore(STORE_ACTAS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_CACHE)) {
        db.createObjectStore(STORE_CACHE);
      }
    };
    pedido.onsuccess = () => resolve(pedido.result);
    pedido.onerror = () => {
      conexion = null;
      reject(pedido.error);
    };
  });
  return conexion;
}

/** Ejecuta una operación y resuelve cuando la transacción quedó escrita en disco. */
async function enTransaccion<T>(
  store: string,
  modo: IDBTransactionMode,
  operacion: (objectStore: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await abrir();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(store, modo);
    const pedido = operacion(tx.objectStore(store));
    tx.oncomplete = () => resolve(pedido.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export function leer<T>(store: string, clave: string): Promise<T | undefined> {
  return enTransaccion(store, 'readonly', (s) => s.get(clave) as IDBRequest<T | undefined>);
}

export function leerTodos<T>(store: string): Promise<T[]> {
  return enTransaccion(store, 'readonly', (s) => s.getAll() as IDBRequest<T[]>);
}

/** Guarda o reemplaza. `clave` solo hace falta en stores sin `keyPath`. */
export async function guardar<T>(store: string, valor: T, clave?: string): Promise<void> {
  await enTransaccion(store, 'readwrite', (s) => s.put(valor, clave));
}

/** Pide que el navegador no borre los datos guardados cuando falta espacio (ADR-03). */
export async function pedirAlmacenamientoPersistente(): Promise<void> {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) {
      await navigator.storage.persist();
    }
  } catch {
    // Si el navegador no lo permite, la app sigue funcionando igual.
  }
}
