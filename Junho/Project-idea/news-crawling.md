#Node.js 뉴스 크롤링 프로젝트: 동기 vs 비동기 구현
##프로젝트 개요 및 목표
이 프로젝트는 Node.js로 구현하는 뉴스 크롤러로, 동기식과 비동기식 두 가지 방식의 차이를 경험하고 성능을 비교하는 것을 목표로 합니다. 연합뉴스, 구글 뉴스, BBC와 같은 공개 뉴스 웹사이트의 기사 제목, URL, 요약 정보를 수집하며, 두 가지 구현 방식(동기 vs 비동기)의 구조적 차이를 보여주고 수집 시간과 처리량(throughput)을 측정합니다. 결과 데이터는 JSON 파일 또는 **로컬 DB(SQLite)**에 저장하며, 향후 키워드 필터링, 뉴스 분류, 웹 UI 제공 등 기능 확장을 고려한 설계를 제시합니다.
##주요 요구사항 정리
다중 뉴스 소스 크롤링: 예시로 연합뉴스, 구글 뉴스, BBC 등 여러 뉴스 사이트의 HTML을 파싱하여 기사 제목, 링크, 요약을 수집합니다.
동기식 크롤러 구현: 하나의 크롤러 모듈은 요청과 처리를 **순차적(동기)**으로 수행합니다. 각 뉴스 사이트를 하나씩 차례로 요청하고 데이터를 파싱합니다.
비동기식 크롤러 구현: 다른 크롤러 모듈은 Promise, async/await을 활용해 **병렬(병행)**로 여러 요청을 보냅니다. 여러 사이트에 동시에 요청을 보내고 응답을 병렬로 처리하여 속도를 향상시킵니다
scrapfly.io
.
성능 비교 측정: 두 방식의 총 수집 시간을 기록하고, 수집한 기사 개수로부터 **처리량(articles/sec)**을 계산합니다. Node의 console.time()/console.timeEnd() 등을 이용해 비동기 작업의 소요 시간을 측정할 수 있습니다.
데이터 저장: 크롤링한 데이터는 JSON 파일로 저장하거나 SQLite 등을 이용해 로컬 DB에 저장합니다.
프로젝트 구조 문서화: 프로젝트 디렉터리 구조와 각 파일의 역할, 실행 방법(npm scripts 등)을 명시합니다.
확장성 고려: 향후 기능 추가(예: 키워드로 기사 필터링, 뉴스 카테고리 분류, 웹 대시보드/UI 제공 등)에 대비한 모듈화와 설계 원칙을 적용합니다.
##프로젝트 디렉터리 구조
news-crawler/
├── package.json              # 프로젝트 메타정보 및 스크립트 정의
├── /crawlers                 # 서로 다른 크롤러 구현 모듈들
│   ├── syncCrawler.js        # 동기(순차) 크롤러 구현
│   └── asyncCrawler.js       # 비동기(병렬) 크롤러 구현
├── /scrapers                 # 사이트별 HTML 파싱 로직 모듈들
│   ├── yonhapScraper.js      # 연합뉴스 전용 파서 (제목,링크,요약 추출)
│   ├── googleNewsScraper.js  # 구글 뉴스 전용 파서 
│   └── bbcScraper.js         # BBC 뉴스 전용 파서 
├── /data                     # 데이터 저장 위치
│   ├── output.json           # 수집된 뉴스 JSON (JSON 저장 시)
│   └── news.db               # SQLite DB 파일 (DB 사용 시)
├── /utils                    # 유틸리티 모듈들
│   ├── fetch.js              # HTTP 요청 (axios 등) 및 에러 처리
│   └── storage.js            # 저장 관련 함수 (JSON 파일 저장/DB 저장)
└── README.md                 # 사용법, 구조, 확장 계획 등 기술 문서
crawlers/ 디렉터리에는 두 가지 크롤러 구현이 있습니다. syncCrawler.js는 순차적으로 사이트들을 크롤링하며, asyncCrawler.js는 동시에 크롤링합니다. 두 파일 모두 내부에서 scrapers/의 파싱 모듈들을 활용하고, utils/의 도구들로 데이터 요청 및 저장, 시간 측정을 수행합니다.
scrapers/ 디렉터리에는 각 뉴스 사이트마다 HTML 구조가 다르므로, 사이트별로 파싱 로직을 분리했습니다. 예를 들어 연합뉴스의 HTML에서 제목, 요약을 추출하는 로직은 yonhapScraper.js에 정의합니다. 이런 모듈들은 요청된 HTML 문자열을 입력으로 받아 해당 사이트의 기사 배열([{title, url, summary}, ...])을 반환하는 함수를 제공합니다.
**utils/fetch.js**는 HTTP 요청을 담당합니다. 여기서는 axios나 node-fetch와 같은 라이브러리를 래핑하여 요청 실패 처리나 User-Agent 설정 등을 일관되게 합니다. (필요 시 크롤링 매너를 지키기 위한 딜레이나 헤더 설정도 이 모듈에서 관리합니다.)
**utils/storage.js**는 데이터를 저장하는 유틸리티로, JSON 파일 저장 함수와 SQLite DB 저장 함수를 제공합니다. 예를 들어 saveToJSON(data, filename)과 saveToSQLite(data, dbPath) 등을 구현해 상황에 따라 호출할 수 있게 합니다.
data/ 디렉터리는 결과물이 저장되는 위치입니다. 기본적으로 output.json으로 저장하며, SQLite를 사용할 경우 news.db 파일을 생성합니다.
**package.json**에는 필요한 npm 라이브러리(axios, cheerio, sqlite3 등)와 함께 실행 스크립트를 정의합니다. 예를 들어:
"scripts": {
  "crawl:sync": "node crawlers/syncCrawler.js",
  "crawl:async": "node crawlers/asyncCrawler.js"
}
이렇게 정의하면, 동기 크롤러는 npm run crawl:sync으로, 비동기 크롤러는 npm run crawl:async으로 실행할 수 있습니다.
README.md (또는 프로젝트 설명서)에는 프로젝트의 목적, 설치 및 실행 방법, 디렉터리 구조, 그리고 동기/비동기 결과 비교 방법, 확장 방안 등을 상세히 기술합니다.
##구현 상세: 동기식 크롤러 (syncCrawler.js)
동기 크롤러는 각 사이트에 순차적으로 HTTP 요청을 보내고 응답을 처리합니다. Node.js는 기본적으로 비동기 I/O 모델이지만, 여기서는 논리적으로 한 번에 하나의 요청을 처리하는 구조를 취합니다. 즉, 첫 번째 사이트에서 데이터를 모두 가져와 파싱을 완료한 후에 다음 사이트를 요청합니다. 이렇게 하면 구조가 단순하여 이해하기 쉽지만, 동시에 여러 요청을 보내지 않으므로 대기 시간이 누적되어 전체 수집 시간이 길어질 수 있습니다. 동작 흐름:
크롤링을 시작하기 전에 console.time('sync')으로 타이머를 시작합니다.
미리 정의된 뉴스 소스 목록 (예: const sites = ['yonhap', 'googleNews', 'bbc'])을 순회하면서 각 사이트에 대해 다음을 수행합니다:
a. fetch.js 유틸로 해당 사이트의 HTML을 요청 (예: fetchPage(url)).
b. 응답 HTML을 해당 사이트 파서로 전달 (예: yonhapScraper.parse(html)), 기사 목록 데이터를 얻음.
c. 얻은 기사 데이터를 통합 배열에 추가.
모든 사이트를 순차 처리 완료 후 console.timeEnd('sync')로 총 소요 시간을 출력합니다. 수집한 총 기사 수와 처리량(기사/초)을 계산하여 로그에 표시합니다.
최종 데이터 배열을 storage.js의 함수로 저장합니다 (JSON 파일 저장 또는 DB 저장).
아래는 동기 크롤러의 간략한 코드 예시입니다:
// crawlers/syncCrawler.js
const { fetchPage } = require('../utils/fetch');
const { saveToJSON } = require('../utils/storage');
const yonhapScraper = require('../scrapers/yonhapScraper');
const googleNewsScraper = require('../scrapers/googleNewsScraper');
const bbcScraper = require('../scrapers/bbcScraper');

(async () => {
  console.time('syncCrawler');  // 타이머 시작
  const allArticles = [];
  
  // 사이트별 순차적 크롤링
  // 예: sites 배열에 [ { name: 'Yonhap', url: '...', parser: yonhapScraper }, ... ]
  for (const site of sites) {
    const html = await fetchPage(site.url);        // 1) HTML 요청 (대기)
    const articles = site.parser.parse(html);      // 2) HTML 파싱하여 기사 배열 얻기
    allArticles.push(...articles);                 // 3) 결과 통합
    console.log(`${site.name} 기사 ${articles.length}건 수집 완료`);
  }
  
  console.timeEnd('syncCrawler');  // 타이머 종료 및 시간 출력
  console.log(`총 수집 기사: ${allArticles.length}건`);
  
  // 처리량(articles/sec) 계산
  // (console.timeEnd 출력값을 직접 파싱하거나, Date로 측정했으면 여기서 계산)
  // 예시를 위해 간단히 console.time 출력으로 가정
  
  saveToJSON(allArticles, 'data/output.json');     // JSON 파일로 저장
})();
위 코드에서 주목할 점:
for 루프 내에서 await fetchPage를 함으로써 이전 요청이 완료될 때까지 다음 사이트 요청을 보내지 않습니다. 이러한 순차 처리로 인해 동시성 없이 동작하므로, 각 사이트의 응답 시간이 누적됩니다. 예를 들어 3개 사이트가 각각 2초, 1초, 3초 걸리면 총 약 6초가 소요됩니다 (각각 순차 대기). 이는 동기식 접근의 직관적인 구조지만 성능 상 비효율적입니다.
Node.js에서 동기식 처리(특히 블로킹 I/O)는 이벤트 루프를 막아 다른 작업 수행을 지연시키므로 권장되지 않습니다. 본 예에서는 await로 순차화했지만, 내부적으로는 여전히 논리적으로 직렬 실행일 뿐 Node의 이벤트 루프 자체는 블로킹되지 않습니다(axios의 HTTP 요청은 비동기로 동작). 그러나 동시에 여러 요청을 보내지 않는 순차 로직 때문에 전체 대기 시간의 합이 그대로 누적되는 단점이 있습니다.
##구현 상세: 비동기식 크롤러 (asyncCrawler.js)
비동기 크롤러는 여러 사이트를 병렬로 동시에 크롤링하여 대기 시간을 단축합니다. Node.js의 이벤트 루프와 비동기 I/O 모델을 활용하여, 각 사이트에 대한 HTTP 요청을 겹쳐서 처리합니다. 이를 통해 모든 사이트의 응답을 동시에 기다릴 수 있으므로, 가장 응답이 느린 사이트의 시간만큼만 대기하면 됩니다. 동작 흐름:
console.time('async')으로 타이머 시작.
크롤링 대상 사이트들에 대한 Promise 배열을 생성합니다. 각 사이트마다 fetchPage(url) 호출 (Promise 반환)과 그 결과를 파싱하는 처리를 하나의 Promise로 구성합니다. 예를 들어:
const tasks = sites.map(site => (
  fetchPage(site.url).then(html => site.parser.parse(html))
));
이렇게 하면 각 fetchPage 호출이 즉시 시작되고, 병렬적으로 모든 요청이 진행됩니다.
Promise.all(tasks)를 사용해 모든 요청이 완료될 때까지 기다립니다. Promise.all은 병렬 실행된 모든 작업의 결과(각 사이트의 기사 배열)를 한 번에 반환해줍니다
scrapfly.io
.
모든 사이트의 결과를 합쳐 하나의 전체 기사 리스트로 만들고, console.timeEnd('async')으로 소요 시간을 측정합니다. 기사 수와 처리량을 계산하여 출력합니다.
결과 데이터를 JSON 또는 DB에 저장합니다 (storage.js 이용).
비동기 크롤러의 코드 예시는 다음과 같습니다:
// crawlers/asyncCrawler.js
const { fetchPage } = require('../utils/fetch');
const { saveToSQLite } = require('../utils/storage');
const yonhapScraper = require('../scrapers/yonhapScraper');
const googleNewsScraper = require('../scrapers/googleNewsScraper');
const bbcScraper = require('../scrapers/bbcScraper');

(async () => {
  console.time('asyncCrawler');
  
  const tasks = sites.map(async (site) => {
    const html = await fetchPage(site.url);         // 각 사이트 요청 시작 (비동기)
    const articles = site.parser.parse(html);
    console.log(`${site.name} 기사 ${articles.length}건 수집`);
    return articles;
  });
  
  const results = await Promise.all(tasks);         // 모든 사이트 응답 대기:contentReference[oaicite:8]{index=8}
  const allArticles = results.flat();               // 2차원 배열 -> 1차원 통합
  
  console.timeEnd('asyncCrawler');
  console.log(`총 수집 기사: ${allArticles.length}건`);
  
  // 처리량(articles/sec) 계산 (동일 방식)
  
  saveToSQLite(allArticles, 'data/news.db');        // SQLite DB에 저장
})();
코드 설명:
sites.map(async site => { ... }) 내부에서 각 사이트 크롤링을 병렬로 실행합니다. fetchPage 호출들이 거의 동시에 이루어지며, Node.js는 이벤트 루프를 통해 비동기 네트워크 요청을 병렬 처리합니다.
Promise.all(tasks)는 모든 비동기 요청이 완료될 때까지 기다리되, 동시에 진행시키므로 가장 오래 걸리는 요청이 완료될 때 전체 완료됩니다. 예를 들어 앞의 3개 사이트 (2초, 1초, 3초 소요 예시)라면, 병렬 요청 시 전체 완료 시간은 약 3초 내외로 단축됩니다 (가장 느린 3초짜리 요청 시간에 수렴).
이렇게 **동시성(Concurrency)**을 활용하면 I/O 지연을 겹쳐 처리하여 효율을 높일 수 있습니다. 여러 HTTP 요청을 동시에 보내고 기다리는 것은 Node.js의 이벤트 기반 모델에서 자연스럽게 지원되며, async/await과 Promise.all() 같은 도구로 쉽게 구현할 수 있습니다
scrapfly.io
.
반면, 이러한 비동기 구현은 구조가 다소 복잡해질 수 있고, 에러 처리나 동시 요청 제한 등에 대한 고려가 필요합니다. 예를 들어 동시에 너무 많은 요청을 보내면 대상 서버에 부하를 줄 수 있으므로, 향후 요청 병렬 개수 제한(예: Promise.all에 넣기 전에 tasks를 일정 크기로 잘라서 실행)이나 지연 삽입 등의 개선을 고려할 수 있습니다.
에러 처리: 동기/비동기 모두 중요한 부분입니다. 네트워크 오류나 파싱 오류가 발생해도 다른 사이트 크롤링 흐름에 치명적인 영향을 주지 않도록 try/catch나 Promise.catch로 각 사이트 처리별로 예외를 다룹니다. 예를 들어, fetchPage 내부에서 오류 시 재시도하거나, Promise.all 대신 Promise.allSettled를 사용하여 모든 요청의 성공/실패 결과를 받아 분석할 수도 있습니다.
##HTML 파싱 및 데이터 추출 (scrapers/ 모듈)
각 뉴스 사이트마다 HTML 구조가 다르기 때문에, 사이트별 파싱 모듈을 작성하여 코드 유지보수를 쉽게 했습니다. 이러한 모듈들은 Cheerio 라이브러리를 사용하여 HTML 문자열에서 원하는 요소를 선택하고 텍스트를 추출합니다. Cheerio는 Node 환경에서 jQuery와 유사한 선택자 문법을 제공하여 DOM 탐색/조작을 편리하게 해줍니다. 예를 들어, 연합뉴스의 스포츠 뉴스 목록 페이지(예: https://www.yna.co.kr/sports/all)의 HTML 구조를 살펴보면, <div class="headline-list"> 아래 <ul> 내에 여러 <li class="section02"> 항목으로 뉴스 기사가 나열되어 있습니다. 각 항목에서 우리는 <strong class="news-tl"><a>...</a></strong> 링크 텍스트를 제목으로, 해당 href 속성을 URL로, <p class="lead"> 내용을 요약으로 추출할 수 있습니다. 연합뉴스 파서 구현 (yonhapScraper.js)의 예시는 다음과 같습니다:
// scrapers/yonhapScraper.js
const cheerio = require('cheerio');

function parseYonhap(html) {
  const $ = cheerio.load(html);
  const articles = [];
  // 연합뉴스 스포츠 전체 뉴스 목록에서 기사 항목 선택
  const $newsList = $('div.headline-list ul li.section02');
  
  $newsList.each((idx, elem) => {
    const title = $(elem).find('strong.news-tl a').text().trim();
    const url = $(elem).find('strong.news-tl a').attr('href');
    const summary = $(elem).find('p.lead').text().trim();
    // trim()으로 앞뒤 공백 제거, 필요하면 요약 끝의 '...' 제거
    articles.push({ title, url, summary });
  });
  return articles;
}

module.exports = { parse: parseYonhap };
위 코드에서 사용한 선택자와 함수들은 다음과 같이 동작합니다:
cheerio.load(html)로 HTML 문자열을 로드하여 jQuery처럼 $ 객체로 다룰 수 있습니다.
$('div.headline-list ul li.section02')는 연합뉴스 페이지에서 뉴스 리스트 항목들을 모두 선택합니다.
.each((idx, elem) => { ... })를 통해 선택된 각 <li> 요소에 접근하여 내부를 파싱합니다.
$(elem).find('strong.news-tl a').text()는 해당 기사 항목에서 제목 텍스트를 추출합니다. 동일한 요소의 .attr('href')는 기사 URL을 얻습니다.
$(elem).find('p.lead').text()는 기사 요약문을 얻습니다. 필요에 따라 .slice()나 정규식으로 불필요한 부분(예: 너무 긴 내용이나 특수문자)을 제거할 수 있습니다.
추출된 title, url, summary를 객체로 묶어 articles 배열에 담습니다. (연합뉴스의 경우 이미지, 날짜 등 추가 정보도 추출 가능하지만 본 프로젝트에선 요구된 필드만 다룹니다.)
다른 사이트들도 이와 비슷한 방식으로 구현합니다. Google 뉴스의 HTML 구조(예: 검색 결과 페이지나 주제별 뉴스 페이지)나 BBC 뉴스 메인 페이지의 구조를 분석해 각각 적절한 selector로 제목, 링크, 요약을 뽑아냅니다. 각 scraper 모듈은 인터페이스를 맞춰서 (parse(html) -> articles[]) 작성하면, 크롤러 코드에서 사이트별로 일관된 방식으로 호출할 수 있어집니다.
##데이터 저장: JSON 파일 및 SQLite DB
크롤링된 뉴스 데이터를 저장하는 방법으로 JSON 파일 저장과 SQLite DB 저장 두 가지를 모두 고려했습니다. 저장 방식은 설정에 따라 선택할 수 있도록 utils/storage.js에서 함수로 분리합니다.
JSON 파일 저장: 가장 간단한 방법으로, 수집한 기사 객체 배열을 JSON으로 문자열화하여 파일에 씁니다. Node.js의 fs.writeFile을 사용하여 비동기적으로 파일을 쓸 수 있습니다. 예시:
const fs = require('fs');
function saveToJSON(data, filepath) {
  fs.writeFile(filepath, JSON.stringify(data, null, 2), err => {
    if (err) {
      console.error('JSON 파일 저장 오류:', err);
    } else {
      console.log(`데이터가 ${filepath} 파일에 저장되었습니다.`);
    }
  });
}
위 코드에서 JSON.stringify(data, null, 2)는 들여쓰기를 적용해 가독성 있는 포맷으로 객체 배열을 문자열로 변환합니다. fs.writeFile은 비동기로 동작하며, 완료 콜백에서 성공 여부를 로그합니다. JSON 파일은 사람이 열어보기 쉽고 구조를 한눈에 파악할 수 있는 장점이 있지만, 데이터량이 커지면 비효율적일 수 있고, 질의(search/filter)를 수행하려면 코드를 통해서만 처리해야 한다는 단점이 있습니다.
SQLite DB 저장: 데이터가 누적되거나 질의가 필요할 경우에는 경량 DB인 SQLite를 사용하는 편이 좋습니다. Node.js에서는 전통적으로 sqlite3 패키지를 사용하거나, 최신 버전(Node 22+권)에서는 내장 node:sqlite 모듈을 사용할 수도 있습니다. 본 프로젝트에서는 sqlite3 NPM 모듈을 사용한다고 가정합니다. storage.js에 아래와 같은 함수를 마련할 수 있습니다:
const sqlite3 = require('sqlite3').verbose();
function saveToSQLite(data, dbPath) {
  const db = new sqlite3.Database(dbPath);
  // 테이블 생성 (없는 경우만)
  db.run(`CREATE TABLE IF NOT EXISTS articles (
    title TEXT, url TEXT, summary TEXT
  )`);
  const stmt = db.prepare(`INSERT INTO articles (title, url, summary) VALUES (?, ?, ?)`);
  for (const item of data) {
    stmt.run(item.title, item.url, item.summary);
  }
  stmt.finalize();
  db.close();
  console.log(`데이터가 SQLite DB(${dbPath})에 저장되었습니다.`);
}
위 코드는 단순화를 위해 동기적인 흐름으로 작성했지만(db.run 등의 콜백 처리 생략), 실제 구현에서는 각 run의 완료를 기다리거나 트랜잭션을 고려해야 할 수 있습니다. SQLite에 저장하면 추후 SQL 질의로 특정 키워드가 들어간 기사만 조회하거나, 날짜별 기사 통계를 내는 등 유연한 데이터 활용이 가능합니다.
참고: JSON vs SQLite 선택은 트레이드오프가 있습니다. 간단한 프로젝트나 적은 데이터량에서는 JSON 파일이 편리하지만, 데이터가 커지거나 업데이트/질의가 필요하면 DB가 적합합니다. 본 프로젝트는 구조적으로 두 방식을 모두 지원하도록 구현해두면 요구에 따라 쉽게 전환할 수 있습니다.
##크롤링 성능 측정 방법
성능 측정은 두 크롤러의 실행 시간과 처리량을 비교하는 핵심입니다. 구현 상 다음과 같은 방식을 사용합니다:
Node.js의 console.time(label)과 console.timeEnd(label)를 활용하여 크롤러 실행의 시작과 끝에 걸린 시간을 측정합니다. 이는 간단하면서도 비동기 동작 전체를 포함한 시간을 잴 수 있는 방법입니다. 예를 들어, console.time('syncCrawler')로 시작하고 마지막에 console.timeEnd('syncCrawler')를 호출하면 콘솔에 "syncCrawler: X ms" 형태로 결과가 출력됩니다.
또는 const start = Date.now(); ... const end = Date.now(); 방법이나 process.hrtime()를 사용해 밀리초 수준으로 시간을 잴 수도 있습니다. 중요한 것은 동일한 기준으로 동기/비동기 실행 시간을 쟤야 정확한 비교가 가능하다는 점입니다.
**처리량(throughput)**은 일반적으로 단위 시간당 처리한 작업 수를 의미합니다. 여기서는 "기사/초"로 정의하겠습니다. 예를 들어 동기 크롤러가 6초에 60개 기사를 수집했다면 처리량 = 10개/초, 비동기 크롤러가 3초에 같은 60개를 수집하면 처리량 = 20개/초로 표현할 수 있습니다.
코드 상에서는 처리 완료 후 totalArticles와 소요시간(duration)을 계산하여 throughput = (totalArticles / durationInSeconds).toFixed(2) 형태로 산출하고 로그에 남깁니다. 이러한 값을 프로젝트 README나 결과 보고서에 정리하여 두 방식의 성능 차이를 비교합니다.
예상 성능 결과: 일반적으로 비동기 병렬 크롤러가 동기 순차 크롤러보다 훨씬 빠른 수집 시간을 보일 것입니다. 앞서 예시한 것처럼, 동기식으로 3개의 사이트(각 1~3초 소요)를 크롤링하면 약 1+2+3=6초가 걸릴 수 있지만, 비동기식으로 동시에 처리하면 약 3초 남짓으로 완료됩니다. 이는 동시성을 통해 I/O 대기 시간을 상호 겹쳐서 처리한 덕분입니다. 결과적으로 같은 양의 기사를 수집해도 비동기 크롤러의 처리량이 동기 크롤러 대비 거의 2배에 달하는 것을 관찰할 수 있습니다 (구체적인 수치는 네트워크 상태와 대상 사이트 응답 시간에 따라 달라집니다). 또한 이러한 비교 실험을 통해 구조적 차이점도 체감할 수 있습니다:
동기 크롤러는 코드 흐름이 순차적이라 이해하기 쉽지만, Node.js의 철학과는 맞지 않으며 비효율적입니다. Node.js는 단일 이벤트 루프로 동작하므로 한 번에 하나의 작업만 처리하며, 동기식으로 긴 작업을 하면 다른 작업이 모두 대기하게 됩니다. 따라서 **“동기식 처리 = 곧 성능 저하”**로 이어질 수 있음을 유념해야 합니다.
비동기 크롤러는 복잡도가 다소 높지만, Node.js의 강점을 살려 높은 처리량과 반응성을 보여줍니다. 특히 IO-bound 작업(네트워크 통신 등)에서는 동시 처리가 유리하며, 5개의 URL을 동시에 가져오는 상황에서 총 소요 시간이 가장 느린 하나의 요청 시간 정도로 끝날 수 있다는 사례도 보고됩니다.
##실행 방법 및 사용 예시
프로젝트를 클론하거나 다운로드 받은 후, 필요한 패키지를 설치하고 크롤러를 실행하는 절차는 아래와 같습니다:
의존성 설치:
npm install
package.json에 명시된 axios, cheerio, sqlite3 등의 모듈이 설치됩니다.
크롤러 실행:
동기식 크롤러 실행:
npm run crawl:sync
터미널에 각 사이트별 수집 완료 로그와 총 소요 시간, 처리량 등이 출력됩니다. 완료 후 data/output.json 파일에 결과가 저장됩니다 (기본 설정이 JSON 저장인 경우).
비동기식 크롤러 실행:
npm run crawl:async
유사하게 로그와 시간이 출력되며, data/news.db SQLite 데이터베이스 파일이 생성되고 데이터가 입력됩니다.
실행 전후에 config.js나 .env 등을 통해 대상 사이트 목록이나 저장 방식(JSON/DB) 등을 설정할 수 있습니다. 예를 들어 .env 파일에서 STORAGE_MODE=json 혹은 STORAGE_MODE=sqlite로 지정해 storage.js가 동작 모드를 선택하도록 구현할 수 있습니다.
결과 확인:
JSON 파일로 저장한 경우, 해당 파일을 열어서 배열 형태로 수집된 기사를 확인합니다. (필요하다면 jq 같은 툴로 보기 좋게 출력 가능)
SQLite로 저장한 경우, SQLite CLI나 DB 브라우저로 news.db를 열어 SELECT * FROM articles; 질의로 내용물을 확인할 수 있습니다.
콘솔 로그에 표시된 시간과 처리량을 통해 동기 vs 비동기 구현의 성능 차이를 확인합니다. 예를 들어:
syncCrawler: 6021.584ms
총 수집 기사: 60건, 처리량: 9.96건/초
asyncCrawler: 3025.123ms
총 수집 기사: 60건, 처리량: 19.84건/초
와 같은 결과를 얻었다면, 비동기 구현이 약 두 배 가까이 효율적인 것을 알 수 있습니다.
##향후 확장을 고려한 설계
이 프로젝트는 기본적인 크롤링 기능 외에 향후 다양한 기능 추가를 염두에 두고 구조를 설계했습니다. 몇 가지 확장 아이디어와 그에 대한 현재 설계 상의 대비사항은 다음과 같습니다:
키워드 필터링: 특정 키워드가 포함된 뉴스만 선별하거나 중요도를 매겨 필터링하는 기능을 추가할 수 있습니다. 이를 위해 크롤링 결과를 저장하기 전에 필터 모듈을 거치도록 설계할 수 있습니다. 예를 들어 utils/filter.js에 filterArticles(articles, keywords) 함수를 만들어 키워드 리스트에 따라 articles 배열을 필터링하고, 크롤러 코드에서 저장 전에 이 함수를 통과시키도록 하면 됩니다. 현재 구조에서는 allArticles를 얻은 뒤 한 곳에서만 저장하므로, 그 직전에 필터링 로직을 삽입하기 용이합니다.
뉴스 분류(카테고리): 수집된 뉴스를 미리 정의된 카테고리(정치, 경제, 스포츠 등)로 자동 분류하거나 태깅하는 기능을 고려할 수 있습니다. 이를 위해 각 기사에 분류 필드를 추가하고, 분류를 수행하는 별도 모듈(예: utils/classify.js)을 둘 수 있습니다. 간단하게는 키워드 매핑이나 뉴스 제공 사이트의 섹션 정보로 분류할 수 있고, 나아가서는 머신러닝 모델을 활용한 텍스트 분류를 적용할 수도 있습니다. 현재 데이터 구조가 { title, url, summary }로 단순하지만, 추후 { ..., category } 필드를 추가해도 큰 영향 없이 저장 로직만 보강하면 되도록 유연하게 만들어두었습니다.
웹 UI 제공: 수집된 뉴스를 사용자에게 보여주는 웹 인터페이스를 구축할 수 있습니다. 예를 들어 Express.js 기반의 간단한 웹 서버를 만들어, /news 경로로 JSON 데이터를 제공하는 API를 만들거나, 템플릿 엔진 또는 프론트엔드 프레임워크를 사용해 뉴스 목록을 출력하는 페이지를 구성할 수 있습니다. 이미 프로젝트 구조에 utils/storage.js로 데이터 접근 로직이 모듈화되어 있으므로, Express 라우터에서 JSON 파일이나 DB를 읽어오는 코드를 쉽게 재사용할 수 있습니다. 프로젝트 규모가 커지면 폴더를 분리하여 server.js (또는 /server 디렉터리) 안에 웹 관련 코드를 두고, 크롤러 모듈은 백엔드의 한 기능으로서 동작하게 할 수 있습니다. CI/CD나 스케줄러와 연계하여 주기적 크롤링 및 데이터 갱신을 하고, 사용자는 항상 최신 뉴스 데이터를 웹으로 볼 수 있게 하는 것도 가능합니다.
추가 크롤링 대상 및 스케일 업: 새로운 뉴스 사이트를 추가하려면 scrapers/에 모듈을 하나 더 만들고 sites 목록에 추가하면 됩니다. 구조가 모듈화되어 있어 코드를 크게 수정하지 않고도 대상 추가가 가능합니다. 다만 사이트마다 HTML 구조 변화가 잦을 수 있으므로 유지보수를 위해 파싱 로직을 한 곳에서 관리하거나, 사이트별 설정 파일로 (selector 등을) 분리하는 것도 고려해볼 만합니다. 크롤링 대상 수가 매우 많아지거나 (예: 수십 개 사이트) 한 사이트에서 여러 페이지를 순회해야 할 경우, 비동기 크롤러의 동시성 한도를 조절하거나 **큐(queue)**를 도입하는 등 아키텍처 개선이 필요할 수 있습니다. 예를 들어 Promise.all로 100개의 요청을 한꺼번에 보내기보다는, 10개씩 묶어 순차 실행하거나, 인기순으로 우선순위를 두어 처리하는 등 현실적인 제약을 다룰 수 있습니다.
로그 및 모니터링: 운영 단계에서 크롤링 성공/실패율, 걸린 시간 추이 등을 모니터링하고 싶다면 로그 시스템을 개선하거나, 성능 데이터를 수집하여 시각화하는 방안도 있습니다. Node.js에서는 winston 같은 로깅 라이브러리를 활용하여 파일이나 외부 로깅 서비스에 로그를 남길 수 있고, 성능 측정 결과를 누적하여 차트로 볼 수 있게 하는 것도 향후 확장의 한 방향입니다.
##결론
이상으로 Node.js를 사용한 뉴스 크롤러 프로젝트의 기본 구조와 동기/비동기 방식 구현, 그리고 성능 비교 방법을 설계했습니다. 동기식 구현은 단순하지만 Node.js 환경에서는 비동기식 구현이 월등한 성능을 보여준다는 점을 직접 측정할 수 있습니다. 실제 테스트 결과를 통해 동시에 여러 요청을 처리하는 것의 이점을 확인하게 될 것입니다. 또한 모듈화된 설계를 채택하여 향후 기능 추가나 대상 확대 시에 코드 변경을 최소화하고 유연하게 대처할 수 있도록 하였습니다. 이 프로젝트를 바탕으로 필요한 데이터를 효율적으로 수집하고, 더 나아가 다양한 데이터 처리 및 서비스 기능으로 확장해나갈 수 있을 것입니다. 참고 자료:
Node.js에서의 웹 크롤링 예제 (Axios로 HTML 가져오고 Cheerio로 파싱)
Cheerio를 이용한 웹 데이터 추출 및 JSON 파일 저장 튜토리얼
Node.js 비동기 프로그래밍과 동시성의 이점 (Promise.all 활용)
scrapfly.io
동기식 처리의 성능 문제점과 Node.js 단일 스레드 모델 설명
Express 기반 웹 스크래핑 앱 구조와 JSON 데이터 활용 예시
인용

Concurrency vs Parallelism

https://scrapfly.io/blog/posts/concurrency-vs-parallelism
모든 출처

scrapfly