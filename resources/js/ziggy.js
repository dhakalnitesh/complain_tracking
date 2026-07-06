import { route as ziggyRoute } from 'ziggy-js';

export function route(name, params, absolute, config) {
    return ziggyRoute(name, params, absolute, config || (typeof window !== 'undefined' ? window.Ziggy : undefined));
}
