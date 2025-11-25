# Routine Pet End-to-End 플로우

## 1) 개요
- 목표: “미션 완료 → EXP 적립 → Stage 재계산 → UI 피드백”을 Supabase RPC로 일관 처리하고, 프론트는 RPC 호출/화면 갱신만 담당.
- 구성: Supabase 함수 `complete_mission`(DB 트랜잭션) + Next.js App Router(Server Action) + 클라이언트 버튼 UI.

## 2) 사전 준비
- 환경 변수: `.env.local`에 `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DEMO_USER_ID` 설정.
- 스키마/함수 적용: `supabase db push` 또는 `sh push.sh`로 `complete_mission` 포함 마이그레이션 반영.
- 시드(데모): `auth.users`에 `DEMO_USER_ID` 유저, `pets`에 Stage 1 펫, `pet_stages`/`missions` 활성 미션 데이터.

## 3) 서버 로직 (DB)
- 함수: `complete_mission(p_mission_id uuid, p_user_id uuid default auth.uid(), p_completion_date date default current_date)`
- 동작:
  1. 사용자 식별(`auth.uid()` 또는 `p_user_id` 주입).
  2. 미션 유효성/기간/활성 확인 + period/max_completions 로드.
  3. 기간별 중복/횟수 제한:
     - daily: `completion_ref = p_completion_date` 유니크
     - once: 유저의 해당 미션 전체 완료 횟수 1회 제한
     - event: 기간 내 완료 횟수가 `max_completions` 이하인지 확인
  4. 트랜잭션 락(유저별 해시) + `pets.total_exp` 증가, Stage 재계산(`pet_stages.min_total_exp` 기준).
  5. `user_missions` 로그 적재(`completion_ref = p_completion_date`).
  6. 다음 Stage 임계값 및 완료 횟수 반환(`earned_exp`, `total_exp`, `old_stage`, `new_stage`, `next_stage_threshold`, `completed_count`, `remaining_count`).

## 4) 서버 액션 (Next.js)
- 파일: `app/actions/complete-mission.ts`
- 역할: RPC 호출 결과를 받아 에러/성공 메시지 및 Stage 변화 여부를 반환하고, `revalidatePath("/")`로 홈을 재검증.
- 호출 방식: `supabase.rpc("complete_mission", { p_mission_id, p_user_id: DEMO_USER_ID })`

## 5) 클라이언트 UI
- 파일: `components/mission-list.tsx`
- 버튼 클릭 → 서버 액션 호출 → 반환된 EXP/총 EXP/Stage 변경 배지 표시 → `router.refresh()`로 최신 상태 반영.
- 완료된 미션은 버튼 비활성/“완료됨” 표시.

## 6) 페이지 렌더링 (SSR)
- 파일: `app/page.tsx`
- SSR로 데모 유저의 Pet 스냅샷(Stage/EXP/다음 임계값)과 오늘의 미션 목록을 로드.
- PetCard에서 Stage 진행도 바, 남은 EXP 안내. 미션 목록은 MissionList에 전달.

## 7) 테스트 플로우 (수동)
1. Supabase 로컬 실행 및 스키마/시드 반영.
2. `bun run dev` 후 브라우저에서 `/` 접속.
3. 미션 완료 버튼 클릭 → EXP/Stage 배지 변경 및 진행도 바 갱신 확인.
4. 동일 미션 재클릭 시 “오늘 이미 완료” 메시지 확인(중복 방지).

## 8) 오류/에지 처리
- 미션 비활성/기간 외: “현재 진행 가능한 미션이 아닙니다.”
- 펫 없음: “펫 데이터를 찾을 수 없습니다. 시드 데이터를 추가하세요.”
- 중복 완료: UNIQUE 에러 매핑 → “오늘 이미 완료한 미션입니다.”
- 기타 RPC 에러: 일반 실패 메시지 반환.

## 9) 프로덕션 전환 시 메모
- service role 사용 제거: 실제 로그인 세션 기반(anon 키) + RLS로 전환.
- `p_user_id` 인자는 제거하거나 내부적으로 `auth.uid()`만 사용하도록 조정.
- RPC 타입을 `supabase gen types`로 재생성해 `types/database.types.ts`에 반영.
- 연출 강화: Stage 업 시 모달/사운드/haptic 추가, `next_stage_threshold`를 사용해 남은 EXP 안내.
