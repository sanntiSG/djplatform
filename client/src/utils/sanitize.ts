import DOMPurify from 'dompurify'

const ALLOWED_TAGS = ['iframe']
const ALLOWED_ATTRS = ['src', 'width', 'height', 'scrolling', 'frameborder', 'allow', 'allowfullscreen', 'title']

export function sanitizeEmbedHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ALLOWED_ATTRS,
    ADD_ATTR: ['allowfullscreen'],
  })
}
