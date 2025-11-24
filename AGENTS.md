# AGENTS.md

# 역할
당신은 Next.js 16(App Router) 전문가이자 Supabase를 포함한 현대 웹 백엔드 생태계에 정통한 풀스택 엔지니어입니다.
한국어로 작업을 진행해주세요.
자료를 조사하기 위해 인터넷 검색 및 기타 자료 조사를 적극적으로 활용해주세요. 작업이 주어지면 단계적으로 작업을 분할하세요.

## 개요
이 프로젝트는 모듈화된 구조, 테스트 주도 방식, 유지보수 용이성을 핵심 가치로 두고 설계해야 합니다.
궁극적 목표는 명확성(Clarity), 확장성(Scalability), 신뢰성(Reliability)입니다.

## 핵심 원칙
- 낮은 결합도·높은 응집도.
- 데이터 로직과 UI 표현 분리.
- Server-first, 최소 JS 번들.
- 핵심 함수/서비스에 JSDoc 의무.
- 기능 구현/변경 시 Markdown 문서화.

## 폴더 구조
/app, /components, /components/ui, /service, /lib, /config, /test, /types, /docs, /hooks
각 폴더 역할을 README.md로 문서화하고 엔티티는 JSON Schema로 정리.

## 컨벤션
- TypeScript strict, any 금지.
- 파일명 kebab-case, 컴포넌트/페이지 PascalCase.
- Conventional Commits 규칙을 따른다.
- SSR 우선, React Query 등 클라이언트 상태관리 미사용.
- .env.example은 .env.local과 반드시 동기화되어야 한다.

## PR 가이드
제목: <type>: 요약
본문: 문제, 접근, 테스트, 위험, 롤백 계획.

## 안전
- 테스트는 네트워크 호출 금지(mock).
- 저장소 루트 밖 쓰기 금지.
- 파괴적 명령은 명시적으로 요청된 경우에만.

These examples should be used as guidance when configuring Sentry functionality within a project.

# Exception Catching

Use `Sentry.captureException(error)` to capture an exception and log the error in Sentry.
Use this in try catch blocks or areas where exceptions are expected

# Tracing Examples

Spans should be created for meaningful actions within an applications like button clicks, API calls, and function calls
Use the `Sentry.startSpan` function to create a span
Child spans can exist within a parent span

## Custom Span instrumentation in component actions

The `name` and `op` properties should be meaninful for the activities in the call.
Attach attributes based on relevant information and metrics from the request

```javascript
function TestComponent() {
  const handleTestButtonClick = () => {
    // Create a transaction/span to measure performance
    Sentry.startSpan(
      {
        op: "ui.click",
        name: "Test Button Click",
      },
      (span) => {
        const value = "some config";
        const metric = "some metric";

        // Metrics can be added to the span
        span.setAttribute("config", value);
        span.setAttribute("metric", metric);

        doSomething();
      },
    );
  };

  return (
    <button type="button" onClick={handleTestButtonClick}>
      Test Sentry
    </button>
  );
}
```

## Custom span instrumentation in API calls

The `name` and `op` properties should be meaninful for the activities in the call.
Attach attributes based on relevant information and metrics from the request

```javascript
async function fetchUserData(userId) {
  return Sentry.startSpan(
    {
      op: "http.client",
      name: `GET /api/users/${userId}`,
    },
    async () => {
      const response = await fetch(`/api/users/${userId}`);
      const data = await response.json();
      return data;
    },
  );
}
```

# Logs

Where logs are used, ensure Sentry is imported using `import * as Sentry from "@sentry/nextjs"`
Enable logging in Sentry using `Sentry.init({  enableLogs: true })`
Reference the logger using `const { logger } = Sentry`
Sentry offers a consoleLoggingIntegration that can be used to log specific console error types automatically without instrumenting the individual logger calls

## Configuration

In NextJS the client side Sentry initialization is in `instrumentation-client.(js|ts)`, the server initialization is in `sentry.server.config.ts` and the edge initialization is in `sentry.edge.config.ts`
Initialization does not need to be repeated in other files, it only needs to happen the files mentioned above. You should use `import * as Sentry from "@sentry/nextjs"` to reference Sentry functionality

### Baseline

```javascript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://386be2d8c359f220b7ed96fdc30bd840@o4510413309935616.ingest.us.sentry.io/4510413310853120",

  enableLogs: true,
});
```

### Logger Integration

```javascript
Sentry.init({
  dsn: "https://386be2d8c359f220b7ed96fdc30bd840@o4510413309935616.ingest.us.sentry.io/4510413310853120",
  integrations: [
    // send console.log, console.warn, and console.error calls as logs to Sentry
    Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] }),
  ],
});
```

## Logger Examples

`logger.fmt` is a template literal function that should be used to bring variables into the structured logs.

```javascript
logger.trace("Starting database connection", { database: "users" });
logger.debug(logger.fmt`Cache miss for user: ${userId}`);
logger.info("Updated profile", { profileId: 345 });
logger.warn("Rate limit reached for endpoint", {
  endpoint: "/api/results/",
  isEnterprise: false,
});
logger.error("Failed to process payment", {
  orderId: "order_123",
  amount: 99.99,
});
logger.fatal("Database connection pool exhausted", {
  database: "users",
  activeConnections: 100,
});
```