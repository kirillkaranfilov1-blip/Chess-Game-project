import { searchPosition, analyzeGame } from './engine';

self.onmessage = (e) => {
  const { id, type, payload } = e.data || {};
  try {
    if (type === 'search') {
      const result = searchPosition(payload.fen, payload.options);
      self.postMessage({ id, type: 'result', result });
    } else if (type === 'analyze') {
      const result = analyzeGame(payload.moves, {
        ...payload.options,
        onProgress: (done, total) => self.postMessage({ id, type: 'progress', done, total }),
      });
      self.postMessage({ id, type: 'result', result });
    } else {
      self.postMessage({ id, type: 'error', error: `Unknown message type: ${type}` });
    }
  } catch (err) {
    self.postMessage({ id, type: 'error', error: err?.message || String(err) });
  }
};
