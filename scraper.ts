import { requestUrl } from 'obsidian'

function blank(text: string): boolean {
  return text === undefined || text === null || text === ''
}

function notBlank(text: string): boolean {
  return !blank(text)
}

async function scrape(url: string): Promise<string> {
  try {
    const response = await requestUrl(url)
    if (!response.headers['content-type'].includes('text/html')) return getUrlFinalSegment(url)
    const html = response.text

    const doc = new DOMParser().parseFromString(html, 'text/html')
    const title = doc.querySelector('title')

    if (blank(title?.innerText)) {
      // If site is javascript based and has a no-title attribute when unloaded, use it.
      var noTitle = title?.getAttr('no-title')
      if (notBlank(noTitle)) {
        return noTitle
      }

      // @ts-ignore
      const ogTitle = doc.querySelector("meta[property='og:title']")?.content
      if(notBlank(ogTitle)) {
        return ogTitle
      }

      // @ts-ignore
      const twitterTitle = doc.querySelector("meta[property='twitter:title']")?.content
      if(notBlank(twitterTitle)) {
        return twitterTitle
      }

      // Otherwise if the site has no title/requires javascript simply return Title Unknown
      return url
    }

    return title.innerText
  } catch (ex) {
    console.error(ex)
    return 'Site Unreachable'
  }
}

function getUrlFinalSegment(url: string): string {
  try {
    const segments = new URL(url).pathname.split('/')
    const last = segments.pop() || segments.pop() // Handle potential trailing slash
    return last
  } catch (_) {
    return 'File'
  }
}

export default async function getPageTitle(url: string) {
  if (!(url.startsWith('http') || url.startsWith('https'))) {
    url = 'https://' + url
  }

  return scrape(url)
}
