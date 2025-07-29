# 핵심 서비스 아이디어
- 사용자 행동 이벤트 수집 서비스 (클릭, 조회, 구매 등)
- 시스템 로그 실시간 수집 및 저장 서비스
- 대용량 데이터 실시간 분석 및 조회 서비스

## MSA 서비스 구성
- API Gateway: 요청 라우팅 및 인증/인가 처리
- Event Collection Service: 이벤트 수집 및 Kafka 프로듀싱
- Event Processing Service: Kafka 컨슈머 및 데이터 저장 처리
- Query Service: 실시간 조회 API 제공 (WebFlux 기반)
- Search Service: Elasticsearch 기반 검색 기능
- Monitoring Service: Prometheus 메트릭 수집 및 Grafana 대시보드

### MSA 시스템 유형
- Event-Driven Architecture: Kafka 기반 비동기 이벤트 처리
- CQRS Pattern: 쓰기/읽기 분리를 통한 성능 최적화
- Microservices with API Gateway: 서비스 간 통신 및 라우팅 관리