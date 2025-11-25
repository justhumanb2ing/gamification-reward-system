# Routine Pet 설계

## 1. 서비스 개요
- “미션 → EXP 보상 → Pet 성장(Stage)” 단일 루프로 일일 재방문을 유도하는 초경량 게이미피케이션 모듈.
- 복잡한 상태 없이 `total_exp` 누적으로만 성장하며 Stage별 시각/청각 연출로 만족감을 극대화.
- SSR 우선 렌더링과 최소 JS 번들로 성능·명확성 확보.

## 2. 핵심 경험 / 가설
- 가설: (a) 미션 완료 즉시 EXP/연출 제공 시 다음 방문 의도가 상승한다. (b) Stage 마일스톤이 코어 액션 수행률을 끌어올린다. (c) 7일 연속 체크인 보상이 주간 리텐션을 높인다.
- 핵심 경험: 진입 시 Pet 성장 상태 확인 → 오늘의 미션 노출 → 완료 즉시 EXP 지급 → Stage 업 시 풀스크린 연출.

## 3. 사용자 시나리오 (Onboarding / Daily Loop)
- 온보딩: 가입/로그인 → 기본 Pet 생성(Stage 1, EXP 0) → 튜토리얼 미션(예: 첫 코어 액션) 완료 → EXP 지급/Stage 체험 → 오늘의 미션 안내.
- 데일리 루프: 앱 접속 → Pet 카드(현재 Stage, 누적 EXP, 다음 Stage까지 남은 EXP) → 오늘의 미션 수행 → 완료 기록 → EXP 지급 → Stage 재계산 → Stage 업 모달 또는 축하 토스트 → 연속 출석/주간 리포트 확인.

## 4. UX 플로우 다이어그램
- 신규: 로그인 → 기본 Pet 생성 → 튜토리얼 미션 표시 → 완료 → EXP 지급 → Stage 계산/업 → 연출 → 오늘의 미션 리스트.
- 기존: 앱 열기 → Pet 카드 확인 → 미션 리스트 → 미션 수행 → 완료 전송 → EXP 지급 → Stage 재계산 → (업 시) 모션/사운드/토스트 → 리포트/다음 목표.

## 5. 기능 명세 상세
- Pet 성장 시스템: `pets.total_exp` 누적만 사용. Stage는 `pet_stages.min_total_exp`로 결정. Stage 업 시 모션/이미지 교체, 사운드, haptic(모바일), 콘페티/토스트.
- 미션 시스템:
  - 타입: Daily Check-in(10~20 EXP), Daily Core Action(20~40), Special Event(30~50).
  - 스키마: `id, title, description, type, reward_exp, period(daily/once/event), active_from/to, max_completions, is_active`.
  - 노출: 오늘 수행 가능한 미션만 리스트, 완료/남은 횟수 표시.
- EXP 지급 규칙:
  - 미션 완료 요청 시 `missions.reward_exp` 즉시 지급, 중복 방지 로직 적용.
  - period=daily는 하루 1회, once는 1회, event는 기간 내 설정 횟수만 허용.
- Stage 변화/연출:
  - 조건: `total_exp`가 상위 Stage의 `min_total_exp` 이상일 때 상승.
  - 연출: 풀스크린 Stage 업 모달 + Pet 모션 교체 + 사운드/진동 + 게이지 애니메이션 + 토스트(획득 EXP/다음 목표).

## 6. 시스템 아키텍처
- 클라이언트: Next.js App Router, SSR 우선. Pet 카드, 미션 리스트, 완료 버튼, Stage 업 모달 컴포넌트.
- 서버: Server Actions 혹은 API Route에서 미션 완료 처리(중복 체크 → EXP 업데이트 → Stage 계산). Supabase/Postgres를 기본 저장소로 사용.
- 인증: Supabase Auth 또는 기존 세션 연동; `user_id`로 모든 엔티티 연결.
- Observability: Sentry로 오류/성능 추적, 미션 완료·Stage 업에 span 기록.
- 캐싱: 오늘의 미션 목록 SSR 시 캐시, 완료 후 무효화. Stage 계산은 최신 `total_exp` 기준 실시간 처리.
- 배치/확장: 큐/크론으로 연속 출석 계산, 요약 리포트, 푸시 알림 발송.

## 7. 데이터 모델링 (ERD & 테이블 스키마)
- pets  
  - `id uuid PK`, `user_id uuid FK users.id`, `total_exp int default 0`, `current_stage_id smallint FK pet_stages.id`, `created_at timestamptz`, `updated_at timestamptz`.
- pet_stages  
  - `id smallint PK`, `name text`, `min_total_exp int unique`, `image_url text`, `animation_key text`, `effect_asset text`.
- missions  
  - `id uuid PK`, `title text`, `description text`, `type enum(check_in, core, event)`, `reward_exp int`, `period enum(daily, once, event)`, `active_from date`, `active_to date`, `max_completions int default 1`, `is_active bool`.
- user_missions  
  - `id uuid PK`, `user_id uuid FK`, `mission_id uuid FK`, `completed_at timestamptz`, `reward_exp int`, `completion_ref date`(daily/period 중복 방지 키), `created_at timestamptz`.
- 인덱스/제약  
  - `unique(user_id, mission_id, completion_ref)`로 일일/단일 중복 방지.  
  - `pet_stages(min_total_exp)` ASC 인덱스.  
  - `missions(is_active, active_from, active_to)`로 오늘 미션 조회 최적화.

## 8. Stage 및 EXP 계산 규칙
- Stage 선택 쿼리: `SELECT id FROM pet_stages WHERE min_total_exp <= :total_exp ORDER BY min_total_exp DESC LIMIT 1;`
- EXP 지급 플로우:
  1) 완료 요청 수신 후 period/중복 체크(`user_missions` 조회).  
  2) 트랜잭션 시작.  
  3) `pets.total_exp += missions.reward_exp`.  
  4) Stage 재계산 후 `pets.current_stage_id` 업데이트.  
  5) `user_missions` 인서트(증빙/감사 로그).  
  6) 커밋 후 클라이언트로 `earned_exp`, `total_exp`, `old_stage`, `new_stage`, `next_stage_threshold` 반환.  
  7) `old_stage != new_stage`이면 Stage 업 연출 트리거, 아니면 축하 토스트만.
- Stage 예시 테이블  
  - Stage 1: `min_total_exp = 0`  
  - Stage 2: `min_total_exp = 100`  
  - Stage 3: `min_total_exp = 300`  
  - Stage 4: `min_total_exp = 700`

## 9. KPI 및 개선 방향
- KPI: DAU 대비 미션 완료율, 7일/30일 리텐션, 평균 일일 완료 미션 수, Stage 업 퍼널(Stage별 도달률), 연속 출석 유지율, 코어 액션 미션 완료율.
- 개선 루프: Stage 업 빈도/시간 분포 분석 → 보상·임계값 조정; 미완료율 높은 미션 보상 상향/난이도 하향; 연속 출석 끊김 구간에 리마인드 푸시/이메일 실험; Stage 연출 A/B 테스트(연출 강도·사운드 유무).

## 10. 확장 아이디어
- 컬렉션/스킨: Stage 달성 시 테마/스킨 해금, 꾸미기 슬롯 제공.
- 소셜: 친구와 Stage 비교, 응원/버프, 리더보드.
- 배지/퀘스트: 주간/월간 퀘스트로 장기 목표 제공, 메달 컬렉션.
- 이벤트: 기간 한정 Special Mission, 2배 EXP 부스트 데이, 시즌 패스형 누적 보상.
- 알림/리마인더: Stage 업/연속 출석 임계 시점에 푸시·이메일.
