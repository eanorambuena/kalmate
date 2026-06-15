export const SITE_URL = 'https://kalmate.pages.dev'
export const SITE_NAME = 'Kalmate'

export function canonicalUrl(path: string = '/') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return new URL(normalizedPath, SITE_URL).toString()
}