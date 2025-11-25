-- Adjust missions constraints/defaults and replace complete_mission with period-aware limits

-- 1) missions: enforce max_completions default/non-null and period-based constraint
UPDATE public.missions
SET max_completions = 1
WHERE max_completions IS NULL;

ALTER TABLE public.missions
  ALTER COLUMN max_completions SET DEFAULT 1,
  ALTER COLUMN max_completions SET NOT NULL;

ALTER TABLE public.missions
  ADD CONSTRAINT missions_period_max_completions_chk
  CHECK (
    (period = 'once' AND max_completions = 1)
    OR (period = 'daily' AND max_completions = 1)
    OR (period = 'event' AND max_completions > 0)
  );

-- 2) replace function complete_mission with period-aware limits and return counts
CREATE OR REPLACE FUNCTION public.complete_mission(
  p_mission_id uuid,
  p_user_id uuid DEFAULT auth.uid(),
  p_completion_date date DEFAULT current_date
) RETURNS TABLE (
  earned_exp integer,
  total_exp integer,
  old_stage smallint,
  new_stage smallint,
  next_stage_threshold integer,
  completed_count integer,
  remaining_count integer
) AS $$
DECLARE
  v_user uuid;
  v_completion date := COALESCE(p_completion_date, current_date);
  v_reward integer;
  v_period mission_period;
  v_active_from date;
  v_active_to date;
  v_max_completions integer;
  v_total_exp integer;
  v_old_stage smallint;
  v_new_stage smallint;
  v_next_stage integer;
  v_limit integer;
  v_completed_before integer;
BEGIN
  IF p_user_id IS NOT NULL AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'user override not allowed';
  END IF;
  v_user := COALESCE(p_user_id, auth.uid());
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;

  -- 미션 유효성 & 보상 조회
  SELECT reward_exp, period, active_from, active_to, max_completions
  INTO v_reward, v_period, v_active_from, v_active_to, v_max_completions
  FROM missions
  WHERE id = p_mission_id
    AND is_active
    AND v_completion BETWEEN active_from AND active_to;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'mission not available';
  END IF;

  -- 기간별 허용 횟수 설정
  v_limit := COALESCE(v_max_completions, 1);
  IF v_period = 'once' THEN
    v_limit := 1;
  ELSIF v_period = 'daily' THEN
    v_limit := 1;
  END IF;

  -- 중복 방지/횟수 제한
  IF v_period = 'daily' THEN
    PERFORM 1 FROM user_missions
    WHERE user_id = v_user AND mission_id = p_mission_id AND completion_ref = v_completion;
    IF FOUND THEN
      RAISE EXCEPTION 'mission already completed today';
    END IF;
    v_completed_before := 0;
  ELSIF v_period = 'once' THEN
    SELECT COUNT(*) INTO v_completed_before
    FROM user_missions
    WHERE user_id = v_user AND mission_id = p_mission_id;
    IF v_completed_before >= v_limit THEN
      RAISE EXCEPTION 'mission already completed';
    END IF;
  ELSE -- event
    SELECT COUNT(*) INTO v_completed_before
    FROM user_missions
    WHERE user_id = v_user
      AND mission_id = p_mission_id
      AND completion_ref BETWEEN v_active_from AND v_active_to;
    IF v_completed_before >= v_limit THEN
      RAISE EXCEPTION 'mission max completions reached';
    END IF;
  END IF;

  -- 트랜잭션 락(유저별 해시)
  PERFORM pg_advisory_xact_lock(hashtext(v_user::text));

  -- 펫 행 잠금 + EXP 증가
  UPDATE pets AS p
  SET total_exp = p.total_exp + v_reward
  WHERE p.user_id = v_user
  RETURNING p.total_exp, p.current_stage_id INTO v_total_exp, v_old_stage;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'pet not found';
  END IF;

  -- Stage 재계산
  SELECT id INTO v_new_stage
  FROM pet_stages
  WHERE min_total_exp <= v_total_exp
  ORDER BY min_total_exp DESC
  LIMIT 1;

  UPDATE pets
  SET current_stage_id = v_new_stage
  WHERE user_id = v_user;

  -- 로그 적재
  INSERT INTO user_missions (user_id, mission_id, reward_exp, completion_ref)
  VALUES (v_user, p_mission_id, v_reward, v_completion);

  -- 완료 횟수 계산 (이번 완료 포함)
  IF v_period = 'daily' THEN
    completed_count := 1;
    remaining_count := 0;
  ELSIF v_period = 'once' THEN
    completed_count := v_completed_before + 1;
    remaining_count := GREATEST(v_limit - completed_count, 0);
  ELSE
    completed_count := v_completed_before + 1;
    remaining_count := GREATEST(v_limit - completed_count, 0);
  END IF;

  -- 다음 Stage 임계값(없으면 NULL)
  SELECT min_total_exp INTO v_next_stage
  FROM pet_stages
  WHERE min_total_exp > v_total_exp
  ORDER BY min_total_exp ASC
  LIMIT 1;

  RETURN QUERY
  SELECT
    v_reward,
    v_total_exp,
    v_old_stage,
    v_new_stage,
    v_next_stage,
    completed_count,
    remaining_count;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;
