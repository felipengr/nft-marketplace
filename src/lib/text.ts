const DIACRITICS = /[\u0300-\u036f]/g

export function normalizeText(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(DIACRITICS, '')
}

export function slugify(value: string): string {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
