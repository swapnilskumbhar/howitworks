// Scales to 1000s of explainers: every explainer's tiny meta.js is bundled
// eagerly (the library index), while its heavy index.js/model.js is a lazy
// per-explainer chunk that Vite code-splits automatically and the router
// imports on first visit. Dropping a folder into src/explainers/ registers
// it — no import list to maintain.
const metaModules = import.meta.glob('../explainers/*/meta.js', { eager: true });
const loaders = import.meta.glob('../explainers/*/index.js');

const metas = Object.values(metaModules)
  .map((m) => m.default)
  .sort((a, b) => a.title.localeCompare(b.title));
const metaById = new Map(metas.map((m) => [m.id, m]));

const loaderById = new Map(
  Object.entries(loaders).map(([path, load]) => [path.split('/').at(-2), load]),
);

const defs = new Map();

// Authors call this with their full definition object (usually spreading
// their meta.js); returns it so the module can `export default defineExplainer({...})`.
export function defineExplainer(def) {
  if (!def.id) throw new Error('Explainer needs an id');
  defs.set(def.id, def);
  return def;
}

export function getMetas() {
  return metas;
}

export function getMeta(id) {
  return metaById.get(id);
}

// Resolve an explainer's full definition, importing its chunk on first use.
export async function loadExplainer(id) {
  if (defs.has(id)) return defs.get(id);
  const load = loaderById.get(id);
  if (!load) return null;
  await load(); // evaluating the module calls defineExplainer
  return defs.get(id) ?? null;
}
