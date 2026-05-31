// worker.js — Worker multithreadé natif pour indexation asynchrone
// Permet de calculer des signatures de fichiers sans bloquer le rendu du globe 3D.

self.onmessage = async (e) => {
  const { type, payload } = e.data;

  if (type === 'COMPUTE_HASH') {
    const { id, path, text } = payload;
    
    // Algorithme de hachage FNV-1a (32-bit) rapide et sans dépendance externe
    let hash = 2166136261;
    for (let i = 0; i < text.length; i++) {
      hash ^= text.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    const hexHash = (hash >>> 0).toString(16).toUpperCase();

    // Simule une petite latence d'indexation pour ne pas saturer le thread
    setTimeout(() => {
      self.postMessage({
        type: 'HASH_COMPLETED',
        payload: { id, path, hash: hexHash }
      });
    }, 50);
  }
};
