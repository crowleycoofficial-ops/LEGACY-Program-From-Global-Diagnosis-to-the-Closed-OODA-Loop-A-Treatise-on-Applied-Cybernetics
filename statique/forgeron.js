// forgeron.js — Moteur d'indexation locale, scraping souverain et AGI symbolique
// Zéro dépendance, optimisé pour les processeurs basse consommation.

import { dbStore, localBus } from './bridge.js';

// --- INDEXATION SOUVERAINE DE FICHIERS ---
export async function runLocalDirectoryScan() {
  if (!('showDirectoryPicker' in window)) {
    throw new Error("L'API File System Access n'est pas supportée par ce navigateur.");
  }

  // Ouvre le sélecteur de système de fichiers local
  const dirHandle = await window.showDirectoryPicker({ mode: 'read' });
  const entries = [];

  async function walk(handle, currentPath) {
    for await (const entry of handle.values()) {
      const path = currentPath ? `${currentPath}/${entry.name}` : `${handle.name}/${entry.name}`;
      if (entry.kind === 'file') {
        const fileObj = { name: entry.name, path, kind: 'file', timestamp: Date.now() };
        entries.push(fileObj);
        await dbStore.put('index', fileObj);
      } else if (entry.kind === 'directory') {
        await walk(entry, path);
      }
    }
  }

  // Vide l'ancien index local
  await dbStore.clear('index');
  await walk(dirHandle, '');
  
  localBus.postMessage({ type: 'index_updated', count: entries.length });
  return entries;
}

// Ingestion manuelle de chemins absolus (Sovereign Fallback si permissions refusées)
export async function manualIngestPaths(textBlock) {
  const lines = textBlock.split('\n').map(l => l.trim()).filter(Boolean);
  const entries = [];
  for (const line of lines) {
    const name = line.split('/').pop() || line;
    const fileObj = { name, path: line, kind: 'file', timestamp: Date.now() };
    entries.push(fileObj);
    await dbStore.put('index', fileObj);
  }
  localBus.postMessage({ type: 'index_updated', count: entries.length });
  return entries;
}

// Recherche dans l'index local
export async function searchIndexedFiles(query) {
  const all = await dbStore.getAll('index');
  const term = query.toLowerCase().trim();
  if (!term) return [];
  return all.filter(f => f.name.toLowerCase().includes(term) || f.path.toLowerCase().includes(term));
}

// --- APPRENTISSAGE AGI SÉMANTIQUE ---
export async function learnSemanticAffinity(term, path, name) {
  const t = term.toLowerCase().trim();
  if (t.length < 2) return;
  
  const existing = await dbStore.get('memory', t);
  const count = existing ? existing.count + 1 : 1;
  
  const memoryObj = {
    term: t,
    path,
    name,
    count,
    last_updated: Date.now()
  };
  
  await dbStore.put('memory', memoryObj);
  localBus.postMessage({ type: 'agi_learned', term: t, file: name });
  return memoryObj;
}

export async function getSemanticMemory() {
  return await dbStore.getAll('memory');
}

// --- PARASITISME DE DONNÉES PUBLIQUES (SCAVENGING) ---
// Récupère les flux sismologiques et orages solaires sans aucune clé API
export async function scrapeTelemetryFeeds() {
  let conflictScore = 0.4; // Base de tension
  let magneticScore = 0.3; // Flux solaire de base
  let statusInfo = { usgs: 0, noaa: 0 };

  // 1. Ingestion USGS (Séismes réels des dernières 24h)
  try {
    const usgsUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson";
    // Évite CORS avec un traducteur alternatif si le direct échoue
    let data;
    try {
      const res = await fetch(usgsUrl);
      data = await res.json();
    } catch(e) {
      const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(usgsUrl)}`);
      data = await res.json();
    }

    if (data && data.features) {
      statusInfo.usgs = data.features.length;
      conflictScore = Math.min(1.0, data.features.length / 30);
      await dbStore.put('telemetry', { key: 'usgs', data: data.features, time: Date.now() });
    }
  } catch(err) {
    console.warn("Échec d'ingestion USGS, utilisation du cache hors-ligne", err);
  }

  // 2. Ingestion NOAA (Indice Kp actuel / Magnétosphère)
  try {
    const swpcUrl = "https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json";
    let data;
    try {
      const res = await fetch(swpcUrl);
      data = await res.json();
    } catch(e) {
      const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(swpcUrl)}`);
      data = await res.json();
    }

    if (data && Array.isArray(data)) {
      let kpSum = 0;
      let count = 0;
      data.slice(1, 10).forEach(row => {
        if (row && row[1]) {
          const val = parseFloat(row[1]);
          if (!isNaN(val)) { kpSum += val; count++; }
        }
      });
      const avg = count > 0 ? kpSum / count : 4.0;
      statusInfo.noaa = avg;
      magneticScore = Math.min(1.0, avg / 9.0);
      await dbStore.put('telemetry', { key: 'noaa', data: avg, time: Date.now() });
    }
  } catch(err) {
    console.warn("Échec d'ingestion NOAA, utilisation du cache hors-ligne", err);
  }

  // Envoi de l'impulsion physique au Bus local pour SENTINEL (globe)
  localBus.postMessage({
    type: 'tension',
    conflict: conflictScore,
    solar: magneticScore,
    status: statusInfo
  });

  return { conflictScore, magneticScore, statusInfo };
}
