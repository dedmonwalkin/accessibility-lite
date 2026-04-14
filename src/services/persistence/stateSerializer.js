import { store } from '../../data/store.js';

function mapToEntries(map) {
  return [...map.entries()];
}

function entriesToMap(entries) {
  return new Map(entries || []);
}

export function exportState() {
  return {
    jobs: mapToEntries(store.jobs),
    jobOutputs: mapToEntries(store.jobOutputs),
    auditLog: [...store.auditLog]
  };
}

export function importState(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') return;

  store.jobs = entriesToMap(snapshot.jobs);
  store.jobOutputs = entriesToMap(snapshot.jobOutputs);
  store.auditLog = [...(snapshot.auditLog || [])];
}
