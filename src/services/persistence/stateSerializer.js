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
    published: mapToEntries(store.published),
    auditLog: [...store.auditLog]
  };
}

export function importState(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') return;

  store.jobs = entriesToMap(snapshot.jobs);
  store.jobOutputs = entriesToMap(snapshot.jobOutputs);
  // Absent in snapshots written before embeds existed.
  store.published = entriesToMap(snapshot.published);
  store.auditLog = [...(snapshot.auditLog || [])];
}
