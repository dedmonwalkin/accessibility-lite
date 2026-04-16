import { store } from '../../data/store.js';

function mapToEntries(map) {
  return [...map.entries()];
}

function entriesToMap(entries) {
  return new Map(entries || []);
}

// Snapshot a point-in-time copy of all state. structuredClone decouples the
// snapshot from live mutation: without it, the pipeline can keep writing to
// job.outputs while JSON.stringify / pg await, producing a half-written snapshot.
export function exportState() {
  const raw = {
    jobs: mapToEntries(store.jobs),
    jobOutputs: mapToEntries(store.jobOutputs),
    auditLog: [...store.auditLog]
  };
  return structuredClone(raw);
}

export function importState(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') return;

  store.jobs = entriesToMap(snapshot.jobs);
  store.jobOutputs = entriesToMap(snapshot.jobOutputs);
  store.auditLog = [...(snapshot.auditLog || [])];
}
