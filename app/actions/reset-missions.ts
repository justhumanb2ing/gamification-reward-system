"use server";

import { revalidatePath } from "next/cache";

import { resetUserMissions } from "@/service/routine-pet";
import type { RoutineSnapshot } from "@/types/routine";

type ResetResult =
  | { ok: true; snapshot: RoutineSnapshot; message: string }
  | { ok: false; message: string };

/**
 * Server Action: 데모 유저의 미션/펫 상태를 초기화한다.
 * - user_missions 삭제 후 Stage/EXP를 최하단 Stage로 되돌린다.
 * - 완료 후 홈 경로를 재검증한다.
 */
export async function resetMissionsAction(): Promise<ResetResult> {
  try {
    const snapshot = await resetUserMissions();
    revalidatePath("/");

    return {
      ok: true,
      snapshot,
      message: "미션이 초기화되었습니다.",
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "미션 초기화 중 오류가 발생했습니다.";

    console.error(error);

    return {
      ok: false,
      message,
    };
  }
}
