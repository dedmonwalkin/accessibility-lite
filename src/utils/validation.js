export function assertRequired(body, required) {
  for (const key of required) {
    if (body[key] === undefined || body[key] === null || body[key] === '') {
      throw new Error(`Missing required field: ${key}`);
    }
  }
}

export function normalizeConfidence(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return Number(value.toFixed(2));
}
