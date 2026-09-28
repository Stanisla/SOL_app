// A handler file just to import map across module, avoiding circular dependencies
export let map;
export function setMap(m) { map = m; }