# app/AGENTS.md

## Server-first
- 데이터 fetch와 SSR을 가능한 동일한 Server Component 내에서 응집한다.
- 빈/에러/로딩 상태를 명시적으로 처리한다.

## 캐시·무효화
- revalidateTag, revalidatePath, Cache Tagging, 적절한 cache 정책.
- UX 향상을 위해 서버 액션과 fetch에서 태그 기반 재검증을 일관되게 적용한다.
- 태그는 변경과 유지보수가 용이해야 한다.

## 상태 관리
- 우선 useState/useReducer.
- 복잡한 상태만 명확한 이유로 Zustand 사용(기본은 서버 상태).
- React Query 등 클라이언트 상태관리 라이브러리 미사용.
