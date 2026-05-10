export function slugifyName(name: string): string {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/'|\u2019/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96);
}
