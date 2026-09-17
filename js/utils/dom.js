export function escapeHtml(value) {
  const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
  return String(value).replace(/[&<>"]/g, (character) => entities[character]);
}

export function maskUrl(src) {
  const source = String(src);
  const resolved = source.startsWith('data:') || source.startsWith('blob:')
    ? source
    : new URL(source, document.baseURI).href;
  return `url("${resolved.replaceAll('"', '%22')}")`;
}
