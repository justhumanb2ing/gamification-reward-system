# Observability & Analytics

## Sentry
- SDK: `@sentry/nextjs` (server, edge, client 모두 활성화).
- Config files: `sentry.server.config.ts`, `sentry.edge.config.ts`, `sentry.client.config.ts`.
- Instrumentation: `instrumentation.ts`에서 런타임별로 Sentry 설정을 import.
- 환경 변수: `SENTRY_DSN`/`NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_TRACES_SAMPLE_RATE`, `SENTRY_REPLAYS_SESSION_SAMPLE_RATE`, `SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE`.
- 빌드 설정: `next.config.ts`는 `withSentryConfig`로 래핑되어 sourcemap 노출을 차단(`hideSourceMaps`).

## GA4
- 환경 변수: `NEXT_PUBLIC_GA_MEASUREMENT_ID`.
- 통합 방식: `@next/third-parties/google`의 `GoogleAnalytics` 컴포넌트를 `app/layout.tsx`에서 조건부 렌더링하여 자동 페이지뷰 추적.
- 유틸: `lib/analytics.ts`에서 측정 ID와 활성화 여부(`hasGaMeasurementId`)를 관리.
