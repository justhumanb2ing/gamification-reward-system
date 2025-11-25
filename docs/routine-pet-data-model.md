# Routine Pet 데이터 모델링

## 1) 목표 및 원칙
- 단순 성장 규칙(`total_exp` 기반 Stage 결정)을 안전하게 보존하면서 중복 지급을 방지한다.
- 읽기 경로(펫 상태, 오늘의 미션 목록)는 빠르고 일관되게 제공하고, 쓰기 경로(미션 완료)는 트랜잭션으로 보호한다.
- Stage 기준값·미션 보상 변경을 스키마 수정 없이 데이터로 제어한다.

## 2) 엔티티 & 관계 요약
- users 1—1 pets (`pets.user_id` FK)
- pets N—1 pet_stages (`pets.current_stage_id` FK)
- missions 1—N user_missions (`user_missions.mission_id` FK)
- users N—M missions via user_missions (`user_missions.user_id` FK)

## 3) Postgres 스키마 제안 (DDL)
```sql
-- ENUM 정의
CREATE TYPE mission_type AS ENUM ('check_in', 'core', 'event');
CREATE TYPE mission_period AS ENUM ('daily', 'once', 'event');

-- Stage 기준
CREATE TABLE pet_stages (
  id              smallint PRIMARY KEY,
  name            text NOT NULL,
  min_total_exp   integer NOT NULL UNIQUE,
  image_url       text,
  animation_key   text,
  effect_asset    text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- Pet 상태(누적 EXP 기반 성장)
CREATE TABLE pets (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL UNIQUE, -- 1인당 1펫
  total_exp         integer NOT NULL DEFAULT 0 CHECK (total_exp >= 0),
  current_stage_id  smallint NOT NULL REFERENCES pet_stages(id),
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now(),
  CONSTRAINT pets_user_fk FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 미션 마스터
CREATE TABLE missions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title            text NOT NULL,
  description      text,
  type             mission_type NOT NULL,
  reward_exp       integer NOT NULL CHECK (reward_exp > 0),
  period           mission_period NOT NULL,
  active_from      date NOT NULL,
  active_to        date NOT NULL,
  max_completions  integer CHECK (max_completions IS NULL OR max_completions > 0) DEFAULT 1,
  is_active        boolean NOT NULL DEFAULT true,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now(),
  CHECK (active_from <= active_to)
);

-- 미션 수행 로그 + 중복 방지 키
CREATE TABLE user_missions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL,
  mission_id       uuid NOT NULL,
  completed_at     timestamptz NOT NULL DEFAULT now(),
  reward_exp       integer NOT NULL,
  completion_ref   date NOT NULL DEFAULT current_date, -- daily/event 중복 제한용(일 단위 키)
  created_at       timestamptz DEFAULT now(),
  CONSTRAINT user_missions_user_fk FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT user_missions_mission_fk FOREIGN KEY (mission_id) REFERENCES missions(id)
);
```

## 4) 인덱스·제약
- `user_missions (user_id, mission_id, completion_ref)` UNIQUE: daily/once/event 기간 내 중복 지급 방지.
- `pet_stages (min_total_exp)` ASC 인덱스: Stage 계산 시 최적.
- `missions (is_active, active_from, active_to)` 인덱스: “오늘 활성 미션” 조회 최적화.
- `pets (user_id)` UNIQUE: 1인 1펫 강제.
- 모든 FK는 `ON DELETE RESTRICT` 기본 가정(이탈 처리 정책에 따라 SOFT DELETE 권장).

## 5) Stage 계산 로직
```sql
-- 현재 Stage 결정
SELECT id
FROM pet_stages
WHERE min_total_exp <= $1
ORDER BY min_total_exp DESC
LIMIT 1;

-- 다음 Stage 임계점 조회(UX에 남은 EXP 표시)
SELECT min_total_exp
FROM pet_stages
WHERE min_total_exp > $1
ORDER BY min_total_exp ASC
LIMIT 1;
```

## 6) 미션 완료 트랜잭션 흐름 (서버)
1) 입력 검증: 미션 존재, 활성 상태, 기간/횟수 충족 확인.  
2) 중복 체크: `user_missions`에서 `user_id`, `mission_id`, `completion_ref`(일 단위) 조회.  
3) 트랜잭션 시작.  
4) `pets.total_exp += missions.reward_exp` 업데이트 후 Stage 재계산.  
5) `pets.current_stage_id` 업데이트.  
6) `user_missions` 인서트(`reward_exp`, `completion_ref`).  
7) 커밋 후 `old_stage`, `new_stage`, `earned_exp`, `total_exp`, `next_stage_threshold` 반환.  
8) `old_stage != new_stage` → Stage 업 연출 트리거.

## 7) 조회/쓰기 패턴 샘플
```sql
-- 오늘 활성 미션 목록
SELECT *
FROM missions
WHERE is_active
  AND current_date BETWEEN active_from AND active_to;

-- 사용자 미션 완료 여부 + 남은 횟수(일 단위)
SELECT m.id,
       m.title,
       m.reward_exp,
       m.period,
       COALESCE(um.count, 0) AS completed_today
FROM missions m
LEFT JOIN (
  SELECT mission_id, COUNT(*) AS count
  FROM user_missions
  WHERE user_id = $1 AND completion_ref = current_date
  GROUP BY mission_id
) um ON m.id = um.mission_id
WHERE m.is_active
  AND current_date BETWEEN m.active_from AND m.active_to;
```

## 8) 시드/운영 가이드
- `pet_stages`는 마일스톤 변경 시 데이터로 관리(예: 0, 100, 300, 700). min_total_exp는 오름차순·유니크 유지.
- `missions`는 기간형(Event)과 상시형(Daily)을 모두 시드 가능. 보상·기간 변경은 새 레코드로 관리(과거 미션 무결성 유지).
- 리포팅: `user_missions`를 기반으로 Stage 도달 퍼널, 일별 미션 완료율, 연속 출석 계산.

## 9) 무결성·동시성 메모
- 미션 완료 API/서버액션은 반드시 트랜잭션으로 감싼다(중복 지급 방지).
- `SELECT ... FOR UPDATE`로 `pets` 행을 잠그고 EXP/Stage 업데이트 권장.
- 장기 보류를 피하기 위해 트랜잭션은 짧게 유지, 실패 시 사용자에게 재시도 가능한 오류 제공.
