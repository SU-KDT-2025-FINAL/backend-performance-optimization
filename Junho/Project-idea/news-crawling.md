# Node.js 뉴스 크롤링 프로젝트: 동기 vs 비동기 구현

## 프로젝트 개요 및 목표

Node.js로 구현하는 뉴스 크롤러입니다. 두 가지 방식(동기 vs 비동기)의 구조적 차이와 성능을 비교합니다.  
- 대상: 연합뉴스, 구글 뉴스, BBC 등  
- 수집 정보: 기사 제목, URL, 요약  
- 결과 저장: JSON 또는 SQLite  
- 향후 확장 고려: 키워드 필터링, 뉴스 분류, 웹 UI

---

## 주요 요구사항 정리

- **다중 뉴스 소스 크롤링**
- **동기식 크롤러**: 순차 요청/처리  
- **비동기식 크롤러**: `Promise`, `async/await` 활용 병렬 처리  
- **성능 측정**: `console.time()` 사용  
- **데이터 저장**: JSON 또는 SQLite DB  
- **프로젝트 구조 문서화**
- **확장성 고려한 설계**

---

## 프로젝트 디렉터리 구조

```
news-crawler/
├── package.json
├── /crawlers
│   ├── syncCrawler.js
│   └── asyncCrawler.js
├── /scrapers
│   ├── yonhapScraper.js
│   ├── googleNewsScraper.js
│   └── bbcScraper.js
├── /data
│   ├── output.json
│   └── news.db
├── /utils
│   ├── fetch.js
│   └── storage.js
└── README.md
```

---

## 동기식 크롤러 (syncCrawler.js)

```js
const { fetchPage } = require('../utils/fetch');
const { saveToJSON } = require('../utils/storage');
const yonhapScraper = require('../scrapers/yonhapScraper');
const googleNewsScraper = require('../scrapers/googleNewsScraper');
const bbcScraper = require('../scrapers/bbcScraper');

const sites = [
  { name: 'Yonhap', url: 'https://www.yna.co.kr/sports/all', parser: yonhapScraper },
  { name: 'Google News', url: 'https://news.google.com/topstories', parser: googleNewsScraper },
  { name: 'BBC', url: 'https://www.bbc.com/news', parser: bbcScraper }
];

(async () => {
  console.time('syncCrawler');
  const allArticles = [];

  for (const site of sites) {
    const html = await fetchPage(site.url);
    const articles = site.parser.parse(html);
    allArticles.push(...articles);
    console.log(`${site.name} 기사 ${articles.length}건 수집 완료`);
  }

  console.timeEnd('syncCrawler');
  saveToJSON(allArticles, 'data/output.json');
})();
```

---

## 비동기식 크롤러 (asyncCrawler.js)

```js
const { fetchPage } = require('../utils/fetch');
const { saveToSQLite } = require('../utils/storage');
const yonhapScraper = require('../scrapers/yonhapScraper');
const googleNewsScraper = require('../scrapers/googleNewsScraper');
const bbcScraper = require('../scrapers/bbcScraper');

const sites = [
  { name: 'Yonhap', url: 'https://www.yna.co.kr/sports/all', parser: yonhapScraper },
  { name: 'Google News', url: 'https://news.google.com/topstories', parser: googleNewsScraper },
  { name: 'BBC', url: 'https://www.bbc.com/news', parser: bbcScraper }
];

(async () => {
  console.time('asyncCrawler');

  const tasks = sites.map(async (site) => {
    const html = await fetchPage(site.url);
    const articles = site.parser.parse(html);
    console.log(`${site.name} 기사 ${articles.length}건 수집`);
    return articles;
  });

  const results = await Promise.all(tasks);
  const allArticles = results.flat();

  console.timeEnd('asyncCrawler');
  saveToSQLite(allArticles, 'data/news.db');
})();
```

---

## HTML 파싱 예시 (yonhapScraper.js)

```js
const cheerio = require('cheerio');

function parseYonhap(html) {
  const $ = cheerio.load(html);
  const articles = [];

  $('div.headline-list ul li.section02').each((idx, elem) => {
    const title = $(elem).find('strong.news-tl a').text().trim();
    const url = $(elem).find('strong.news-tl a').attr('href');
    const summary = $(elem).find('p.lead').text().trim();
    articles.push({ title, url, summary });
  });

  return articles;
}

module.exports = { parse: parseYonhap };
```

---

## 데이터 저장 함수 예시 (storage.js)

### JSON 저장
```js
const fs = require('fs');

function saveToJSON(data, filepath) {
  fs.writeFile(filepath, JSON.stringify(data, null, 2), err => {
    if (err) console.error('저장 실패', err);
    else console.log(`저장 완료: ${filepath}`);
  });
}
```

### SQLite 저장
```js
const sqlite3 = require('sqlite3').verbose();

function saveToSQLite(data, dbPath) {
  const db = new sqlite3.Database(dbPath);
  db.run(`CREATE TABLE IF NOT EXISTS articles (title TEXT, url TEXT, summary TEXT)`);
  const stmt = db.prepare(`INSERT INTO articles (title, url, summary) VALUES (?, ?, ?)`);
  for (const item of data) {
    stmt.run(item.title, item.url, item.summary);
  }
  stmt.finalize();
  db.close();
}
```

---

## 크롤링 성능 측정

- `console.time()` / `console.timeEnd()` 사용  
- 처리량 = `총 기사 수 / 걸린 시간(초)`  
- 예시:
  - 동기: 60건 / 6초 → 10건/초
  - 비동기: 60건 / 3초 → 20건/초

---

## 실행 방법

```bash
npm install

# 동기 크롤러 실행
npm run crawl:sync

# 비동기 크롤러 실행
npm run crawl:async
```

`.env` 예시:
```env
STORAGE_MODE=sqlite
```

---

## 확장 아이디어

- `filterArticles()`로 키워드 필터링
- `classify.js`로 자동 뉴스 분류
- Express.js API 서버 연동
- 대상 사이트 추가 → scrapers + sites 수정
- 요청 동시성 제한 → 큐 구조로 리팩터링
- 로깅 → winston, 모니터링 추가

---

## 결론

- Node.js의 비동기 구조가 성능 측면에서 효율적임을 입증  
- 구조적 차이 및 처리량 비교를 통해 학습 목적에 충실  
- 모듈화된 구조로 유지보수성과 확장성 확보

---

## 참고 링크

- [Cheerio + Axios 크롤링 튜토리얼]  
- [Concurrency vs Parallelism](https://scrapfly.io/blog/posts/concurrency-vs-parallelism)
