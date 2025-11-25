# Routine Pet Supabase 변경 요약 (2025-11-24 업데이트)

## 변경 내용
- ENUM: `mission_type (check_in, core, event)`, `mission_period (daily, once, event)`.
- 테이블:
  - `pet_stages`: Stage 기준값/자산 관리, `min_total_exp` 유니크, 정렬 인덱스 추가.
  - `pets`: 1인 1펫, `total_exp` 누적, `current_stage_id` FK.
  - `missions`: 미션 마스터, 활성 기간/보상/횟수 관리, 활성 조회 인덱스 추가.
  - `user_missions`: 미션 완료 로그, `completion_ref`로 중복 방지, 유니크 인덱스.
- RLS:
  - `pet_stages`, `missions`: 인증 사용자는 조회 가능, 수정은 `service_role` 전용.
  - `pets`, `user_missions`: 소유자 기준 select/insert/update 허용, FORCED RLS.
- 함수:
  - `complete_mission(p_mission_id uuid, p_user_id uuid default auth.uid(), p_completion_date date default current_date)`
  - 로컬 날짜 기반 중복 체크(`completion_ref = p_completion_date`), period별 횟수 제한(daily 1회, once 1회, event는 `max_completions`), 유저별 해시 락으로 병목 최소화, EXP/Stage 재계산 후 다음 Stage 임계값·완료횟수 반환.

## 주요 쿼리/패턴
- Stage 결정: `SELECT id FROM pet_stages WHERE min_total_exp <= :total_exp ORDER BY min_total_exp DESC LIMIT 1;`
- 다음 Stage 임계: `SELECT min_total_exp FROM pet_stages WHERE min_total_exp > :total_exp ORDER BY min_total_exp ASC LIMIT 1;`
- 오늘 활성 미션: `WHERE is_active AND CURRENT_DATE BETWEEN active_from AND active_to`
- 중복 방지: `user_missions (user_id, mission_id, completion_ref)` 유니크
- 로컬 날짜 전달: RPC 호출 시 `p_completion_date`에 사용자 로컬 기준 `YYYY-MM-DD` 전달.
- period별 제한: daily/once는 1회, event는 `max_completions`(기본 1회)으로 함수에서 검증.

## 운영 메모
- `completion_ref`는 기본 `current_date`, period=daily/once/event 모두 일 단위 중복을 차단.
- 로컬 기준 일자 적용이 필요하면 `p_completion_date`를 지정해 호출하고, 서버/DB 타임존과 무관하게 일 단위 중복을 제어.
- `pet_stages` 업데이트 시 `min_total_exp` 오름차순 유지, 새 Stage 추가 시 기존 기준값 불변 권장.
- `push.sh` 실행으로 `supabase db push` 및 타입 생성(`types/database.types.ts`).
