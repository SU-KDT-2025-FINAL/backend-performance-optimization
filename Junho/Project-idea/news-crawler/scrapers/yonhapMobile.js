const cheerio = require('cheerio');

function parse(html) {
  const $ = cheerio.load(html);
  const articles = [];

  $('ul.list-type01 > li').each((_, li) => {
    const a = $(li).find('a').first();
    const title = a.find('.tit').text().trim();
    const url   = a.attr('href');
    const summary = $(li).find('p.lead').text().trim();

    if (title && url) {
      articles.push({
        title,
        url: url.startsWith('http') ? url : `https://m.yna.co.kr${url}`,
        summary
      });
    }
  });

  return articles;
}

module.exports = { parse };
