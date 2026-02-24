type DirectusPost = {
  id: string | number
  title: string
  slug: string
  excerpt?: string | null
  content?: string | null
  category?: string | null
  version?: string | null
  published_at?: string | null
  language?: string | null
}

const DIRECTUS_URL = import.meta.env.DIRECTUS_URL as string | undefined
const DIRECTUS_TOKEN = import.meta.env.DIRECTUS_TOKEN as string | undefined
const DIRECTUS_LANG_FIELD = (import.meta.env.DIRECTUS_LANG_FIELD as string | undefined) || 'language'

function buildHeaders() {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (DIRECTUS_TOKEN) headers.Authorization = `Bearer ${DIRECTUS_TOKEN}`
  return headers
}

function formatDate(dateStr?: string | null, locale = 'de-DE'): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' })
}

export async function fetchPosts(options?: { lang?: 'de' | 'en'; locale?: string }): Promise<(DirectusPost & { formatted_date: string })[]> {
  if (!DIRECTUS_URL) return []
  try {
    const url = new URL(`${DIRECTUS_URL}/items/posts`)
    url.searchParams.set('filter[status][_eq]', 'published')
    if (options?.lang) {
      url.searchParams.set(`filter[${DIRECTUS_LANG_FIELD}][_eq]`, options.lang)
    }
    url.searchParams.set('sort', '-published_at')
    url.searchParams.set('limit', '200')
    url.searchParams.set('fields', `id,title,slug,excerpt,content,category,version,published_at,${DIRECTUS_LANG_FIELD}`)

    const res = await fetch(url.toString(), { headers: buildHeaders() })
    if (!res.ok) return []
    const data = await res.json()
    const posts: DirectusPost[] = data?.data || []
    return posts.map((p) => ({ ...p, formatted_date: formatDate(p.published_at, options?.locale || 'de-DE') }))
  } catch {
    return []
  }
}

export async function fetchPostBySlug(slug: string, options?: { lang?: 'de' | 'en'; locale?: string }): Promise<(DirectusPost & { formatted_date: string }) | null> {
  if (!DIRECTUS_URL) return null
  try {
    const url = new URL(`${DIRECTUS_URL}/items/posts`)
    url.searchParams.set('filter[status][_eq]', 'published')
    url.searchParams.set('filter[slug][_eq]', slug)
    if (options?.lang) {
      url.searchParams.set(`filter[${DIRECTUS_LANG_FIELD}][_eq]`, options.lang)
    }
    url.searchParams.set('limit', '1')
    url.searchParams.set('fields', `id,title,slug,excerpt,content,category,version,published_at,${DIRECTUS_LANG_FIELD}`)

    const res = await fetch(url.toString(), { headers: buildHeaders() })
    if (!res.ok) return null
    const data = await res.json()
    const post: DirectusPost | undefined = data?.data?.[0]
    if (!post) return null
    return { ...post, formatted_date: formatDate(post.published_at, options?.locale || 'de-DE') }
  } catch {
    return null
  }
}
