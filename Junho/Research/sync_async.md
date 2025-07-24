# 동기(Synchronous) vs 비동기(Asynchronous)

## 동기(Synchronous)

동기 방식은 작업들이 순차적으로, 앞선 작업이 완료된 후에야 다음 작업을 시작하는 실행 모델입니다.

- **특징**
  - 순서 보장: 호출된 순서대로 실행됨
  - 블로킹(Blocking): 작업이 완료될 때까지 호출 지점이 대기
  - 구현이 단순하고 직관적

- **예시 (JavaScript)**

```javascript
function fetchDataSync() {
  // 네트워크 요청 (블로킹)
  const data = httpRequest('https://api.example.com/data');
  console.log(data);
}

console.log('시작');
fetchDataSync();   // 완료될 때까지 기다림
console.log('끝');
// 출력 순서: 시작 → (데이터) → 끝
```

---

## 비동기(Asynchronous)

비동기 방식은 작업을 호출한 후 즉시 다음 작업을 진행할 수 있는 실행 모델입니다. 완료 시점에 콜백, 프로미스, 이벤트 등으로 결과를 전달합니다.

- **특징**
  - 논블로킹(Non‑blocking): 호출 즉시 반환되고, 결과는 나중에 처리
  - 동시 처리 효과: I/O 작업과 CPU 작업이 병렬적으로 이루어질 수 있음
  - 복잡도 증가: 콜백 헬, 에러 핸들링, 동기화 주의

- **예시 (JavaScript Promise)**

```javascript
function fetchDataAsync() {
  return fetch('https://api.example.com/data')
    .then(response => response.json());
}

console.log('시작');
fetchDataAsync()
  .then(data => console.log(data))
  .catch(err => console.error(err));
console.log('끝');
// 출력 순서: 시작 → 끝 → (나중에 데이터)
```

---

## 주요 차이점 비교

| 구분       | 동기                | 비동기                                 |
| ---------- | ------------------- | -------------------------------------- |
| 실행 순서  | 순차 실행           | 호출 즉시 반환, 완료 시 처리           |
| 블로킹     | 블로킹              | 논블로킹                               |
| 에러 처리  | try…catch           | 콜백 에러 핸들링 또는 .catch()         |
| 복잡도     | 낮음                | 높음                                   |
| 활용 사례  | 단순 계산, 짧은 I/O | 네트워크 요청, 파일 I/O, UI 응답 유지  |

---

## 언제 사용해야 할까?

### 동기
- 실행 순서가 중요하고, 중간에 다른 작업을 끼워넣지 않아야 할 때
- 코드가 간단하고 직관적이길 원할 때

### 비동기
- 네트워크나 파일 I/O 같이 지연(latency)이 큰 작업을 효율적으로 처리할 때
- UI 응답성을 유지해야 할 때 (예: 웹 브라우저)
- 여러 작업을 병렬로 실행하여 전체 처리 시간을 단축하고 싶을 때