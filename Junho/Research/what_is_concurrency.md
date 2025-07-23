# 🌐 동시성 (Concurrency) 한눈에 보기
| 구분 | 내용 |
| :--- | :--- |
| **정의** | 여러 작업을 **시간 분할**로 번갈아 실행하여 **겉보기엔 동시에** 수행되는 것처럼 만드는 기술·개념 |
| **목표** | • 자원 활용 극대화<br>• 시스템 응답성 향상 |
| **대표 구현** | 스레드 · 코루틴 · 이벤트 루프 · 액터 모델 |
| **주요 과제** | • **Race Condition** (데이터 경쟁)<br>• **Deadlock** (교착 상태)<br>• 스케줄링 & 동기화 |
| **동시성 vs 병렬성** | **동시성:** 논리적 동시 진행 ↔ **병렬성:** 멀티코어에서 물리적 동시 실행 |
| **활용 사례** | 웹 서버, GUI 이벤트 처리, 비동기 I/O, 마이크로서비스 메시지 처리 등 |

---

# 🟢 Node.js 관점에서 본 동시성

| 구분 | Node.js 구현 · 특징 | 비고 |
| :--- | :--- | :--- |
| **기본 아키텍처** | **이벤트 루프**(Event Loop) 단일 스레드에서 I/O 완료 이벤트를 순차 처리 | V8 + libuv |
| **비동기 I/O** | 파일·네트워크·DNS 호출을 **Non‑Blocking** 방식으로 요청 → 완료 시 콜백/프라미스가 이벤트 큐에 등록 | CPU 유휴 시간 최소화 |
| **Thread Pool** | `libuv` 내부 **4개 워커 스레드(기본)** : 파일 시스템·압축·암호화 등 **블로킹 작업** 오프로드 | `UV_THREADPOOL_SIZE`로 확장 가능 |
| **병렬 처리 수단** | ① **Thread Pool** (I/O·CPU 바운드 off‑load)<br>② **Worker Threads** API (별도 JS 스레드)<br>③ **Cluster** 모듈 (멀티 프로세스) | Node 자체는 싱글 스레드지만 멀티코어 활용 |
| **동기화 방식** | 메인 스레드는 레이스 없음. 워커·클러스터 간 **메시지 패싱**(`postMessage`) 또는 **공유 메모리**(`SharedArrayBuffer`, `Atomics`) 사용 | 다중 프로세스 간 Race Condition 주의 |
| **에러 처리** | • 콜백 → 첫 인자 `err` 확인<br>• `Promise.catch` / `try { await } catch` 필수 | 미처리 예외 시 프로세스 종료 위험 |
| **주요 API** | `fs.readFile()` → 콜백<br>`fs.promises.readFile()` → Promise<br>`util.promisify()`<br>Async/Await | 최신 코드 = **Promise/Async Await** |
| **성능 팁** | • I/O는 비동기로 작성<br>• CPU 바운드 작업 → **Worker Thread** 분리<br>• Thread Pool 크기 조정<br>• Cluster 사용 시 세션·캐시 공유 전략 마련 | 거대한 싱글 루프에 과부하 금지 |

> ✅ **정리**  
> Node.js는 “**싱글 스레드 + 이벤트 루프**” 구조로 동시성을 달성합니다.  
> 자바스크립트 실행은 단일 스레드이지만, **Thread Pool**, **Worker Threads**, **Cluster**를 활용해 I/O·CPU 작업을 병렬 처리할 수 있습니다. 올바른 **메시지 패싱**과 **에러 처리**, 적절한 **스레드/프로세스 관리**가 안정적인 동시성의 핵심입니다.
