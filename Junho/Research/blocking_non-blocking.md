블로킹과 논블로킹에 대해 설명해줘- gpt o4-mini

# 블로킹(Blocking) vs 논블로킹(Non-blocking)

## 블로킹(Blocking)

블로킹 방식은 호출한 함수나 작업이 **완전히 끝날 때까지** 그 지점에서 **다음 코드 실행을 멈추고 기다리는** 실행 모델입니다.

- **특징**
  - 함수 호출 시 해당 작업이 종료될 때까지 호출 지점이 대기
  - CPU나 스레드가 해당 작업에 묶이므로 다른 작업 수행 불가
  - 구현이 간단하고 직관적

- **예시 (JavaScript)**

```javascript
function readFileSync(path) {
  // 파일을 모두 읽어올 때까지 블로킹
  const data = fs.readFileSync(path, 'utf8');
  return data;
}

console.log('시작');
const content = readFileSync('./data.txt');  // 여기서 완료될 때까지 대기
console.log(content);
console.log('끝');
// 출력 순서: 시작 → 파일 내용 → 끝
```

---

## 논블로킹(Non-blocking)

논블로킹 방식은 호출한 즉시 결과를 기다리지 않고 다음 코드를 바로 실행하며, 결과는 콜백(callback), 이벤트(event), 프로미스(promise) 등을 통해 나중에 처리하는 모델입니다.

- **특징**
  - 호출 지점이 즉시 반환되어 다른 작업을 계속 수행
  - I/O나 네트워크 요청처럼 지연이 큰 작업을 효율적으로 병렬 처리
  - 비동기 흐름 관리(콜백 헬, 에러 전파 등)에 주의

- **예시 (JavaScript Callback)**

```javascript
function readFileAsync(path, callback) {
  fs.readFile(path, 'utf8', (err, data) => {
    if (err) return callback(err);
    callback(null, data);
  });
}

console.log('시작');
readFileAsync('./data.txt', (err, content) => {
  if (err) console.error(err);
  else console.log(content);
});
console.log('끝');
// 출력 순서: 시작 → 끝 → (나중에 파일 내용)
```

- **예시 (JavaScript Promise)**

```javascript
function readFilePromise(path) {
  return fs.promises.readFile(path, 'utf8');
}

console.log('시작');
readFilePromise('./data.txt')
  .then(content => console.log(content))
  .catch(err => console.error(err));
console.log('끝');
// 출력 순서: 시작 → 끝 → (나중에 파일 내용)
```

---

## 블로킹 vs 논블로킹 비교

| 구분       | 블로킹                | 논블로킹                                 |
| ---------- | --------------------- | ---------------------------------------- |
| 실행 방식  | 호출 지점에서 대기    | 즉시 반환 후 나중에 결과 처리            |
| 리소스 사용| 작업 중 스레드/CPU 점유| I/O 대기 시 다른 작업 수행 가능           |
| 복잡도     | 낮음                  | 높음 (비동기 흐름 관리 필요)             |
| 활용 사례  | 짧고 단순한 동기 작업 | 네트워크, 파일 I/O, DB 쿼리 등 지연 작업 |
