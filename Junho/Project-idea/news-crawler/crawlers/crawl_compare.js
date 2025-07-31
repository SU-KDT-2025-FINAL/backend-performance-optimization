/*
 * crawl_compare.js
 *
 * This script demonstrates the difference between sequential (often called
 * "synchronous" in casual conversation) and concurrent (asynchronous) web
 * crawling in Node.js without relying on third‑party HTTP or XML parsing
 * libraries.  Many tutorials reach for packages like axios, xml2js or
 * cheerio, but those are not available in this environment.  Instead we use
 * Node's built‑in `https` module to retrieve remote resources and a few
 * simple regular expressions to parse RSS feeds and extract article titles.
 *
 * The Yonhap sports RSS feed is used as the data source.  We fetch the
 * feed, extract the first few items and then download each article page to
 * pull out its `<title>` tag.  The sequential crawler waits for each
 * article to be fetched before starting the next one, whereas the
 * concurrent crawler fires off all of the article requests at once and
 * waits for them all to complete.  The difference in total runtime is
 * reported via `console.time()`.
 */

const https = require('https');
const { URL } = require('url');

/**
 * Fetch the contents of a URL using Node's https module.  A custom
 * user‑agent header is included because some servers reject requests
 * without one.  Returns a Promise that resolves to a string containing
 * the full response body.
 *
 * @param {string} url - The URL to fetch.
 * @param {Object} headers - Optional headers to send with the request.
 */
function fetchUrl(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/90.0 Safari/537.36',
        ...headers
      }
    };
    const req = https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve(data);
      });
    });
    req.on('error', (err) => reject(err));
  });
}

/**
 * Parse a simple RSS feed into an array of article objects.  This parser
 * looks for `<item>` elements and extracts the content of the `<title>`,
 * `<link>` and `<description>` tags inside each one.  CDATA sections are
 * handled transparently.  If a tag is missing the corresponding field
 * will be an empty string.
 *
 * @param {string} xml - The raw RSS feed as a string.
 * @returns {Array<{title: string, url: string, summary: string}>}
 */
function parseRSS(xml) {
  const items = [];
  // Match each <item>...</item> block, including newlines.
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let itemMatch;
  while ((itemMatch = itemRegex.exec(xml)) !== null) {
    const itemContent = itemMatch[1];
    // Extract title. Handle CDATA and plain text cases.
    const titleMatch =
      itemContent.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i) ||
      itemContent.match(/<title>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';
    // Extract link.
    const linkMatch = itemContent.match(/<link>([\s\S]*?)<\/link>/i);
    const url = linkMatch ? linkMatch[1].trim() : '';
    // Extract description.
    const descMatch =
      itemContent.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i) ||
      itemContent.match(/<description>([\s\S]*?)<\/description>/i);
    const summary = descMatch ? descMatch[1].trim() : '';
    items.push({ title, url, summary });
  }
  return items;
}

/**
 * Fetch an article page and attempt to extract its `<title>` tag.  If
 * fetching or parsing fails an empty string is returned.  A custom
 * user‑agent is included to avoid 403 responses from some servers.
 *
 * @param {string} url - The article's URL.
 */
async function fetchArticleTitle(url) {
  try {
    const html = await fetchUrl(url, {
      Accept: 'text/html'
    });
    const match = html.match(/<title>([\s\S]*?)<\/title>/i);
    return match ? match[1].trim() : '';
  } catch (err) {
    // In case of network errors return an empty title rather than
    // propagating the error.  Logging could be added here if desired.
    return '';
  }
}

/**
 * Sequentially crawl a feed by fetching each article one at a time.  This
 * function first downloads the RSS feed, parses it and then iterates
 * through the specified number of items in series.  Because each fetch
 * awaits the previous one to finish, the overall runtime grows roughly
 * linearly with the number of articles.
 *
 * @param {string} feedUrl - URL to an RSS feed.
 * @param {number} limit - Maximum number of articles to crawl.
 */
async function crawlSequential(feedUrl, limit = 5) {
  console.time('sequential');
  const feedXml = await fetchUrl(feedUrl, { Accept: 'application/rss+xml' });
  const items = parseRSS(feedXml).slice(0, limit);
  for (const item of items) {
    item.articleTitle = await fetchArticleTitle(item.url);
  }
  console.timeEnd('sequential');
  return items;
}

/**
 * Concurrently crawl a feed by fetching all articles in parallel.  After
 * downloading and parsing the RSS feed this function starts all of the
 * article requests at once and waits for them to finish.  On typical
 * networks this approach dramatically reduces total runtime when the
 * latency to each article host outweighs the server's throughput.
 *
 * @param {string} feedUrl - URL to an RSS feed.
 * @param {number} limit - Maximum number of articles to crawl.
 */
async function crawlConcurrent(feedUrl, limit = 5) {
  console.time('concurrent');
  const feedXml = await fetchUrl(feedUrl, { Accept: 'application/rss+xml' });
  const items = parseRSS(feedXml).slice(0, limit);
  await Promise.all(
    items.map(async (item) => {
      item.articleTitle = await fetchArticleTitle(item.url);
    })
  );
  console.timeEnd('concurrent');
  return items;
}

/**
 * Main entry point.  When run directly (`node crawl_compare.js`) this
 * function will fetch the Yonhap sports RSS feed and display the first
 * few articles using both the sequential and concurrent strategies.
 */
async function main() {
  // Yonhap sports RSS feed.  If you wish to crawl a different section
  // replace the URL below with any other valid RSS endpoint.
  const feedUrl = 'https://www.yna.co.kr/rss/sports.xml';
  const limit = 5;
  console.log(`Fetching ${limit} articles sequentially...`);
  const seqResults = await crawlSequential(feedUrl, limit);
  console.log(seqResults);
  console.log(`\nFetching ${limit} articles concurrently...`);
  const conResults = await crawlConcurrent(feedUrl, limit);
  console.log(conResults);
  console.log("결과:", seqResults.map(a => a.articleTitle));

}

// If this module is being run directly from the command line run main().
if (require.main === module) {
  main().catch((err) => {
    console.error(err);
  });
}

module.exports = {
  crawlSequential,
  crawlConcurrent,
  parseRSS,
  fetchArticleTitle
};