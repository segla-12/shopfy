export function getStorePublicUrl(slug: string) {
  return `https://shopfy.site/store/${encodeURIComponent(slug)}`;
}

export function getStoreQrUrl(slug: string) {
  return `https://shopfy.site/q/${encodeURIComponent(slug)}`;
}
