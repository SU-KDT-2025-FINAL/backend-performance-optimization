const { fetchHtml } = require('../utils/fetchHtml');
const { fetchXml }  = require('../utils/fetchXml');
const mobileParser  = require('../scrapers/yonhapMobile');
const rssParser     = require('../scrapers/yonhapRSS');

const USE_RSS = true;           // ← true = RSS, false = 모바일 HTML

const target = USE_RSS
  ? {
      name: 'Yonhap RSS',
      url:  'https://www.yna.co.kr/rss/sports.xml',
      fetch: fetchXml,
      parser: rssParser.parse
    }
  : {
      name: 'Yonhap Mobile',
      url:  'https://m.yna.co.kr/sports/all',
      fetch: fetchHtml,
      parser: mobileParser.parse
    };

(async () => {
  console.time('crawl');
  try {
    const raw   = await target.fetch(target.url);
    const items = target.parser(raw);
    console.log(`${target.name} 기사 ${items.length}건 수집`);
    console.log(items.slice(0, 5)); // 앞 5개 미리보기
  } catch (err) {
    console.error('[ERROR]', err.message);
  }
  console.timeEnd('crawl');
})();
