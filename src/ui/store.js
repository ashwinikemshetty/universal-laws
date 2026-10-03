/*
 * Per-visitor memory: kept reflections (the constellation), visited chapters, sound preference.
 * Lives only in this browser; every access is guarded so private modes and blocked storage still work.
 */
const KEY = 'cosmic-codex:v1';

const defaults = () => ({ kept: [], visited: [], sound: true });

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...defaults(), ...JSON.parse(raw) } : defaults();
  } catch {
    return defaults();
  }
}

export const store = {
  state: load(),
  listeners: new Set(),
  save() {
    try { localStorage.setItem(KEY, JSON.stringify(this.state)); } catch { /* storage unavailable */ }
    this.listeners.forEach((f) => f(this.state));
  },
  subscribe(f) { this.listeners.add(f); return () => this.listeners.delete(f); },
  isKept(chapterId, dim) { return this.state.kept.some((k) => k.chapterId === chapterId && k.dim === dim); },
  toggleKept(chapterId, dim) {
    const i = this.state.kept.findIndex((k) => k.chapterId === chapterId && k.dim === dim);
    if (i >= 0) this.state.kept.splice(i, 1);
    else this.state.kept.push({ chapterId, dim, at: Date.now() });
    this.save();
    return i < 0;
  },
  clearKept() { this.state.kept = []; this.save(); },
  visit(id) {
    if (!this.state.visited.includes(id)) { this.state.visited.push(id); this.save(); }
  },
  setSound(on) { this.state.sound = on; this.save(); },
};
