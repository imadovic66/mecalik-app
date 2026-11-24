/**
 * Convert any service name stored in the DB (may be a French label like
 * "Lavage Auto" from legacy data, or a canonical ID like "lavage") to the
 * canonical service ID used as a locale key under services.*.
 */
export function serviceIdFromName(name: string): string {
  if (!name) return name
  const n = name.toLowerCase()
  if (n === 'lavage'     || n.includes('lavage'))     return 'lavage'
  if (n === 'vidange'    || n.includes('vidange'))    return 'vidange'
  if (n === 'batterie'   || n.includes('batterie'))   return 'batterie'
  if (n === 'pneus'      || n.includes('pneu'))       return 'pneus'
  if (n === 'diagnostic' || n.includes('diagnostic')) return 'diagnostic'
  if (n === 'urgence'    || n.includes('urgence'))    return 'urgence'
  return name
}
