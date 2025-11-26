"use server";

import { revalidatePath } from "next/cache";

import { createServiceRoleClient } from "@/lib/supabase/admin";
import { DEMO_USER_ID } from "@/config/demo-user";

type CompleteMissionResult =
  | {
      ok: true;
      message: string;
      stageChanged: boolean;
      earnedExp: number;
      totalExp: number;
      oldStage: number | null;
      newStage: number | null;
      nextStageThreshold: number | null;
      completedCount: number;
      remainingCount: number;
    }
  | {
      ok: false;
      message: string;
    };

/**
 * Server Action: 주어진 미션을 데모 유저에게 완료 처리한다.
 * - 활성/기간 검증 → 중복 완료 차단 → user_missions 기록 → pets EXP/Stage 갱신 → 홈 경로 revalidate.
 * - Stage 업 여부를 반환해 UI에서 연출 분기 가능.
 * @param missionId 대상 미션 UUID
 * @param completionDate 사용자 로컬 날짜(YYYY-MM-DD). 일 단위 중복 체크에 사용.
 * @returns 처리 결과 및 Stage 변경 여부
 */
export async function completeMissionAction(
  missionId: string,
  completionDate: string,
): Promise<CompleteMissionResult> {
  const supabase = createServiceRoleClient();

  const isValidDate =
    /^\d{4}-\d{2}-\d{2}$/.test(completionDate) &&
    !Number.isNaN(new Date(completionDate).getTime());

  if (!isValidDate) {
    return { ok: false, message: "유효한 날짜가 아닙니다." };
  }

  const { data, error } = await supabase.rpc("complete_mission", {
    p_mission_id: missionId,
    // 서비스 롤 데모 환경용: 함수에서 auth.uid() 대신 p_user_id를 허용하도록 정의했을 때 사용
    p_user_id: DEMO_USER_ID,
    p_completion_date: completionDate,
  });

  console.log(error);

  if (error) {
    const message =
      error.message === "mission already completed today"
        ? "오늘 이미 완료한 미션입니다."
        : error.message === "mission not available"
        ? "현재 진행 가능한 미션이 아닙니다."
        : error.message === "pet not found"
        ? "펫 데이터를 찾을 수 없습니다. 시드 데이터를 추가하세요."
        : "미션 완료 처리 중 오류가 발생했습니다.";
    return {
      ok: false,
      message,
    };
  }

  const result = Array.isArray(data) ? data[0] : undefined;
  const stageChanged =
    (result?.new_stage ?? null) !== (result?.old_stage ?? result?.new_stage);
  const earnedExp = result?.earned_exp ?? 0;
  const totalExp = result?.total_exp ?? 0;

  revalidatePath("/");

  return {
    ok: true,
    message: "미션이 완료되었습니다.",
    stageChanged,
    earnedExp,
    totalExp,
    oldStage: result?.old_stage ?? null,
    newStage: result?.new_stage ?? null,
    nextStageThreshold: result?.next_stage_threshold ?? null,
    completedCount: result?.completed_count ?? 0,
    remainingCount: result?.remaining_count ?? 0,
  };
}
