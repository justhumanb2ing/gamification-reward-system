# Routine Pet DB 테이블 한눈에 보기
백엔드 경험이 적어도 바로 이해할 수 있도록, 핵심 컬럼과 용도를 짧게 정리했습니다.

## pets (사용자별 펫 상태)
- `id`: 펫 식별자.
- `user_id`: 어떤 유저의 펫인지(1인 1펫).
- `total_exp`: 누적 경험치. 미션 완료 시 증가.
- `current_stage_id`: 현재 Stage(아래 pet_stages 참조).
- `created_at/updated_at`: 생성·수정 시간.

## pet_stages (Stage 기준표)
- `id`: Stage 번호(예: 1, 2, 3…).
- `name`: Stage 이름(예: Stage 1).
- `min_total_exp`: 이 값 이상이면 해당 Stage. 누적 EXP로만 결정.
- `image_url/animation_key/effect_asset`: Stage별 연출 자산(선택).
- `created_at/updated_at`: 생성·수정 시간.

## missions (미션 마스터)
- `id`: 미션 식별자.
- `title/description`: 미션 제목·설명.
- `type`: `check_in`/`core`/`event` 구분.
- `reward_exp`: 완료 시 지급 EXP.
- `period`: 반복 규칙(`daily`, `once`, `event`).
- `active_from/active_to`: 미션이 활성인 기간.
- `max_completions`: event 기간 중 최대 완료 가능 횟수(once/daily는 1로 고정).
- `is_active`: 비활성 처리 플래그.
- `created_at/updated_at`: 생성·수정 시간.

## user_missions (미션 완료 로그)
- `id`: 완료 기록 식별자.
- `user_id`: 누가 완료했는지.
- `mission_id`: 어떤 미션을 완료했는지.
- `completed_at`: 완료된 시각(타임스탬프).
- `reward_exp`: 지급된 EXP(당시 보상 기록).
- `completion_ref`: “어느 날짜”에 대한 완료인지(일 단위 중복 체크 키).
- `created_at`: 로그 생성 시각.

## complete_mission 함수 (RPC)
- 입력: `p_mission_id`, `p_completion_date`(로컬 날짜), `p_user_id`(데모/서비스 롤용, 일반적으로 auth.uid()).
- 동작: 미션 유효성 확인 → period별 중복·횟수 제한 → EXP 증가 및 Stage 재계산 → 완료 로그 적재 → 다음 Stage 임계값과 완료 횟수 반환.
- 반환: `earned_exp`, `total_exp`, `old_stage`, `new_stage`, `next_stage_threshold`, `completed_count`, `remaining_count`.

## 사용 흐름 요약
1) 클라이언트가 오늘 날짜(로컬)와 미션 ID로 `complete_mission` RPC 호출.
2) DB에서 중복/횟수 제한을 검사하고, 펫 EXP/Stage를 갱신 후 로그를 남김.
3) 반환된 값으로 UI에서 EXP/Stage 변화, 남은 횟수 등을 바로 보여줌.
