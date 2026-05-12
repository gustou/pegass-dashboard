// Routeur hash minimal compatible GitHub Pages et fichier HTML offline.
// Route patterns supportés : "/", "/dashboard", "/benevole/:id", etc.

export interface RouteMatch {
  path: string;
  params: Record<string, string>;
}

function parseHash(): string {
  const raw = window.location.hash || '#/';
  let path = raw.startsWith('#') ? raw.slice(1) : raw;
  if (!path.startsWith('/')) path = '/' + path;
  return path;
}

function createRouter() {
  const state = $state<RouteMatch>({
    path: typeof window !== 'undefined' ? parseHash() : '/',
    params: {}
  });

  function update(): void {
    const p = parseHash();
    state.path = p;
    state.params = {};
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('hashchange', update);
    window.addEventListener('popstate', update);
  }

  function navigate(path: string): void {
    if (!path.startsWith('/')) path = '/' + path;
    window.location.hash = path;
  }

  /**
   * Match un pattern type "/benevole/:id" contre le path actuel.
   * Retourne null si pas de match, sinon les params extraits.
   */
  function match(pattern: string): Record<string, string> | null {
    const patternParts = pattern.split('/').filter(Boolean);
    const pathParts = state.path.split('/').filter(Boolean);

    if (pattern === '/' && state.path === '/') return {};
    if (patternParts.length !== pathParts.length) return null;

    const params: Record<string, string> = {};
    for (let i = 0; i < patternParts.length; i++) {
      const pp = patternParts[i]!;
      const ap = pathParts[i]!;
      if (pp.startsWith(':')) {
        params[pp.slice(1)] = decodeURIComponent(ap);
      } else if (pp !== ap) {
        return null;
      }
    }
    return params;
  }

  return {
    get path() {
      return state.path;
    },
    navigate,
    match
  };
}

export const router = createRouter();

/**
 * Helper pour construire un lien hash à partir d'un path interne.
 * Utilisable dans le markup : <a href={hashLink('/benevoles')}>...</a>
 */
export function hashLink(path: string): string {
  if (!path.startsWith('/')) path = '/' + path;
  return '#' + path;
}
