export const PRODUCT_NAME = 'Saddle'
export const DSH_TITLE_SUFFIX = 'DeepSeek Harness'

export function rewriteWindowTitle(title: string): string {
  if (title === DSH_TITLE_SUFFIX) return PRODUCT_NAME
  const suffix = ` — ${DSH_TITLE_SUFFIX}`
  if (title.endsWith(suffix)) return `${title.slice(0, -suffix.length)} — ${PRODUCT_NAME}`
  return title
}
