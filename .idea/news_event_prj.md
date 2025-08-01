# Node.js 기반 실시간 이벤트 & 뉴스 분석 시스템

이 프로젝트는 **동기식과 비동기식 구조의 차이를 학습**하기 위한 실습용 프로젝트입니다. 공개 뉴스 웹사이트에서 여러 소스의 기사를 크롤링하고, 사용자 행동 이벤트나 시스템 로그와 같은 이벤트도 수집하는 마이크로서비스를 설계하여 동기‧비동기 방식의 처리 차이를 체험합니다. 프로젝트는 Node.js로 구현하며, 모듈별로 구성된 구조를 통해 확장성을 염두에 둡니다.

## 핵심 서비스 아이디어

 :agentCitation{citationIndex='0' label='마이크로서비스 개념도'}


프로젝트는 다음과 같은 핵심 기능을 제공하는 **마이크로서비스 기반 시스템**으로 설계됩니다.

- **사용자 행동 이벤트 수집 서비스** – 클릭, 조회, 구매 등의 이벤트를 API 게이트웨이를 통해 수집하여 메시지 큐(Kafka)에 발행합니다.
- **시스템 로그 실시간 수집 서비스** – 애플리케이션 로그를 스트리밍하여 저장하고 분석합니다.
- **대용량 데이터 실시간 분석 및 조회 서비스** – 수집된 이벤트와 뉴스 데이터를 실시간으로 처리·저장하고 검색/조회 기능을 제공합니다.

## MSA 서비스 구성

각 기능은 독립적인 서비스를 통해 구현되며, 서비스 간 통신은 메시지 큐를 사용한 이벤트 기반 패턴을 따릅니다.

| 서비스 | 설명 |
|---|---|
| **API Gateway** | 요청 라우팅, 인증/인가 처리, 내부 마이크로서비스와의 통신을 담당합니다. |
| **Event Collection Service** | 사용자 이벤트 및 뉴스 기사 데이터를 수집하고 Kafka에 이벤트를 프로듀싱합니다. |
| **Event Processing Service** | Kafka에서 이벤트를 컨슘하여 데이터를 파싱하고 저장(예: JSON/SQLite)합니다. |
| **Query Service** | 웹 API(WebFlux 기반)를 통해 실시간 조회 기능을 제공합니다. |
| **Search Service** | Elasticsearch를 사용하여 저장된 데이터에 대한 검색 기능을 제공할 수 있습니다. |
| **Monitoring Service** | Prometheus로 메트릭을 수집하고 Grafana 대시보드에서 시각화합니다. |

## MSA 시스템 유형

- **Event‑Driven Architecture** – Kafka 기반 비동기 이벤트 처리로 서비스 간 결합을 최소화합니다.
- **CQRS 패턴** – 쓰기/읽기 모델을 분리하여 성능을 최적화합니다.
- **Microservices with API Gateway** – API 게이트웨이를 통해 서비스 간 통신과 라우팅을 관리합니다.

## News Crawler 모듈 (동기 vs 비동기)

MSA의 이벤트 수집 서비스를 구현하는 예제로 **뉴스 크롤러**를 개발합니다. 여러 뉴스 사이트(연합뉴스, Google News, BBC 등)에서 기사 제목, URL, 요약 정보를 수집하고, **동기식**과 **비동기식** 두 가지 방식으로 구현해 성능을 비교합니다.

- **동기식 크롤러** – `syncCrawler.js`에서는 사이트 목록을 순회하면서 각 사이트에 대한 HTTP 요청을 순차적으로 수행합니다. 요청과 파싱을 `await`로 직렬화하기 때문에 이전 요청이 끝날 때까지 다음 요청을 보내지 않아 총 대기 시간이 누적됩니다. 예를 들어 3개 사이트의 응답 시간이 2 초, 1 초, 3 초라면 전체 약 6 초가 걸립니다.
- **비동기식 크롤러** – `asyncCrawler.js`는 `Promise.all()`을 사용하여 각 사이트에 대한 요청을 동시에 시작하고, 모든 응답을 병렬로 기다립니다. 이렇게 하면 가장 오래 걸리는 요청 시간만큼만 대기하게 되어 전체 시간이 크게 단축됩니다. 위 사례에서는 약 3 초 내외에 완료됩니다.
- 두 크롤러 모두 `console.time()`/`console.timeEnd()`를 사용해 전체 소요 시간을 측정하고, 수집한 기사 수를 이용해 **처리량(articles/sec)**을 계산합니다.
- 일반적으로 **비동기 구현**은 동기 구현보다 처리량이 두 배 이상 높으며, Node.js의 단일 이벤트 루프 환경에서 동기 처리의 성능 저하를 체감할 수 있습니다.

## 기술 스택 및 모듈 구조

프로젝트 디렉터리는 모듈별로 구성되어 있으며, `package.json`에 실행 스크립트와 의존성이 정의됩니다.

| 모듈/디렉터리 | 역할 |
|---|---|
| **crawlers/syncCrawler.js** | 동기식(순차) 크롤러 구현 – 사이트별로 HTTP 요청과 파싱을 순차적으로 수행합니다. |
| **crawlers/asyncCrawler.js** | 비동기식 크롤러 구현 – `Promise.all()`로 여러 사이트를 병렬로 요청하고 병합합니다. |
| **scrapers/** | 각 뉴스 사이트별 HTML 파서 모듈; Cheerio 라이브러리를 사용해 기사 제목, URL, 요약을 추출합니다. |
| **utils/fetch.js** | axios 또는 node‑fetch를 래핑하여 HTTP 요청과 에러 처리를 일관되게 수행합니다. |
| **utils/storage.js** | 크롤링 데이터를 JSON 파일로 저장하거나 SQLite DB에 저장하는 함수들을 제공합니다. |
| **data/** | 수집된 데이터를 저장하는 디렉터리 (`output.json`/`news.db`). |

## 확장 아이디어

- **키워드 필터링 및 뉴스 분류** – 수집한 기사 중 특정 키워드가 포함된 뉴스만 선별하거나, 정치/경제/스포츠 등으로 분류하는 기능을 추가할 수 있습니다. 필터·분류 모듈을 유틸리티로 분리하여 저장 전에 적용하도록 설계합니다.
- **웹 UI 제공** – Express 기반 API나 웹 페이지를 제공하여 크롤링된 데이터를 사용자에게 보여주는 Query Service를 구현할 수 있습니다.
- **추가 이벤트 수집** – 뉴스 외에도 사용자 클릭/구매 이벤트나 시스템 로그를 같은 파이프라인으로 수집하여 실시간 분석을 해보는 등 마이크로서비스 개념을 확장할 수 있습니다.

## 학습 포인트

- **Node.js 비동기 모델 이해** – 단일 스레드 이벤트 루프에서 동기식으로 대기하는 것이 어떻게 전체 성능을 저해하는지 살펴보고, `async/await`과 `Promise.all()`로 비동기를 구현해 처리량을 높이는 법을 익힙니다.
- **마이크로서비스 아키텍처 설계** – 이벤트 기반 아키텍처, CQRS, API 게이트웨이 등 현대적인 MSA 패턴을 학습하고 간단한 프로젝트에 적용해봅니다.
- **데이터 저장 방식 비교** – JSON 파일 저장과 SQLite DB 저장의 장단점을 이해하고, 적절한 상황에서 선택하는 방법을 실습합니다.

## 결론

이 프로젝트는 Node.js를 활용하여 동기 및 비동기 패턴을 비교하고, 마이크로서비스 아키텍처의 기본 요소를 체험할 수 있도록 설계되었습니다. 동기식 구현의 직관성과 비동기식 구현의 높은 효율을 직접 비교함으로써 Node.js의 이벤트 기반 모델과 동시성(concurrency)의 중요성을 이해할 수 있습니다. 모듈화된 구조와 확장 아이디어를 통해 추후 로그 분석, 이벤트 스트림 처리, 웹 UI 구축 등 다양한 기능으로 발전시킬 수 있습니다.
