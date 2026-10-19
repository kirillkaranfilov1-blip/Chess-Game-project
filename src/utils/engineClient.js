// Promise-based client for the engine Web Worker.

let worker = null;
let seq = 0;
const pending = new Map();

function getWorker() {
  if (worker) return worker;
  worker = new Worker(new URL('./engine.worker.js', import.meta.url), { type: 'module' });
  worker.onmessage = (e) => {
    const { id, type, result, error, done, total } = e.data || {};
    const entry = pending.get(id);
    if (!entry) return;
    if (type === 'progress') {
      entry.onProgress?.(done, total);
      return;
    }
    pending.delete(id);
    if (type === 'error') entry.reject(new Error(error));
    else entry.resolve(result);
  };
  worker.onerror = (err) => {
    const error = new Error(err?.message || 'Engine worker crashed');
    for (const entry of pending.values()) entry.reject(error);
    pending.clear();
    worker?.terminate();
    worker = null;
  };
  return worker;
}

function request(type, payload, onProgress, signal) {
  return new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, { resolve, reject, onProgress });
    getWorker().postMessage({ id, type, payload });

    if (signal) {
      const onAbort = () => {
        if (pending.has(id)) {
          pending.delete(id);
          reject(new DOMException('Engine request aborted', 'AbortError'));
        }
      };
      if (signal.aborted) onAbort();
      else signal.addEventListener('abort', onAbort, { once: true });
    }
  });
}

/** Search a FEN in the worker. */
export function engineSearch(fen, options = {}, { signal } = {}) {
  return request('search', { fen, options }, null, signal);
}

/** Analyze a list of SAN moves in the worker. */
export function engineAnalyze(moves, options = {}, { onProgress, signal } = {}) {
  return request('analyze', { moves, options }, onProgress, signal);
}

/** Hard reset: kill the worker and reject in-flight requests. */
export function resetEngine() {
  const error = new DOMException('Engine reset', 'AbortError');
  for (const entry of pending.values()) entry.reject(error);
  pending.clear();
  worker?.terminate();
  worker = null;
}
