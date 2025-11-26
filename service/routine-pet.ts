import { createServiceRoleClient } from "@/lib/supabase/admin";
import { DEMO_USER_ID } from "@/config/demo-user";
import type { RoutineSnapshot, PetSnapshot, MissionWithStatus } from "@/types/routine";
import type { Tables } from "@/types/database.types";

type SupabaseClient = ReturnType<typeof createServiceRoleClient>;
type StageRow = Pick<Tables<"pet_stages">["Row"], "id" | "name" | "min_total_exp">;

const getToday = () => new Date().toISOString().slice(0, 10);

const resolveClient = (client?: SupabaseClient) =>
  client ?? createServiceRoleClient();

const buildResetPreview = (stages: StageRow[]): PetSnapshot | null => {
  if (stages.length === 0) {
    return null;
  }

  const baseStage = stages[0];
  const nextStage = stages.find(
    (stage) => stage.min_total_exp > baseStage.min_total_exp,
  );

  return {
    totalExp: baseStage.min_total_exp,
    stageId: baseStage.id,
    stageName: baseStage.name,
    currentStageMin: baseStage.min_total_exp,
    nextStageMin: nextStage?.min_total_exp ?? null,
  };
};

const buildPetSnapshot = (
  pet: Pick<Tables<"pets">["Row"], "current_stage_id" | "total_exp">,
  stages: StageRow[],
): PetSnapshot => {
  const currentStage =
    stages.find((stage) => stage.id === pet.current_stage_id) ??
    stages.find((stage) => stage.min_total_exp <= pet.total_exp);
  const nextStage = stages.find(
    (stage) => stage.min_total_exp > pet.total_exp,
  );

  return {
    totalExp: pet.total_exp,
    stageId: pet.current_stage_id,
    stageName: currentStage?.name ?? `Stage ${pet.current_stage_id}`,
    currentStageMin: currentStage?.min_total_exp ?? 0,
    nextStageMin: nextStage?.min_total_exp ?? null,
  };
};

/**
 * 데모 유저의 오늘 미션 목록과 펫 스냅샷을 로드한다.
 * Stage 기준표를 함께 조회해 초기화 프리뷰도 반환한다.
 */
export async function loadRoutineSnapshot(
  client?: SupabaseClient,
  options?: { today?: string },
): Promise<{ snapshot: RoutineSnapshot; resetPreviewPet: PetSnapshot | null }> {
  const supabase = resolveClient(client);
  const today = options?.today ?? getToday();

  const [{ data: missionsData }, { data: completedToday }, { data: petRow }, { data: stages }] =
    await Promise.all([
      supabase
        .from("missions")
        .select(
          "id, title, reward_exp, period, active_from, active_to, is_active",
        )
        .order("title", { ascending: true }),
      supabase
        .from("user_missions")
        .select("mission_id")
        .eq("user_id", DEMO_USER_ID)
        .eq("completion_ref", today),
      supabase
        .from("pets")
        .select("total_exp, current_stage_id")
        .eq("user_id", DEMO_USER_ID)
        .maybeSingle(),
      supabase
        .from("pet_stages")
        .select("id, name, min_total_exp")
        .order("min_total_exp", { ascending: true }),
    ]);

  const activeMissions =
    missionsData?.filter(
      (mission) =>
        mission.is_active &&
        mission.active_from <= today &&
        mission.active_to >= today,
    ) ?? [];

  const completionSet = new Set(
    completedToday?.map((entry) => entry.mission_id),
  );

  const missions: MissionWithStatus[] = activeMissions.map((mission) => ({
    id: mission.id,
    title: mission.title,
    rewardExp: mission.reward_exp,
    period: mission.period,
    completedToday: completionSet.has(mission.id),
  }));

  const resetPreviewPet = buildResetPreview(stages ?? []);
  const pet =
    petRow && stages && stages.length > 0
      ? buildPetSnapshot(petRow, stages)
      : petRow
      ? {
          totalExp: petRow.total_exp,
          stageId: petRow.current_stage_id,
          stageName: `Stage ${petRow.current_stage_id}`,
          currentStageMin: 0,
          nextStageMin: null,
        }
      : null;

  return {
    snapshot: { pet, missions },
    resetPreviewPet,
  };
}

/**
 * 데모 유저의 user_missions 로그와 펫 상태를 초기화한다.
 * - user_missions 삭제
 * - pets.total_exp와 current_stage_id를 Stage 표 최하단으로 재설정
 * @returns 초기화 이후 새 스냅샷
 */
export async function resetUserMissions(
  client?: SupabaseClient,
): Promise<RoutineSnapshot> {
  const supabase = resolveClient(client);

  const { data: stages } = await supabase
    .from("pet_stages")
    .select("id, name, min_total_exp")
    .order("min_total_exp", { ascending: true });

  const resetPreviewPet = buildResetPreview(stages ?? []);

  if (!resetPreviewPet) {
    throw new Error("Stage 기준 데이터를 찾을 수 없습니다.");
  }

  const { error: deleteError } = await supabase
    .from("user_missions")
    .delete()
    .eq("user_id", DEMO_USER_ID);

  if (deleteError) {
    throw new Error("미션 초기화 중 오류가 발생했습니다.");
  }

  const { data: petUpdated, error: petUpdateError } = await supabase
    .from("pets")
    .update({
      total_exp: resetPreviewPet.totalExp,
      current_stage_id: resetPreviewPet.stageId,
    })
    .eq("user_id", DEMO_USER_ID)
    .select("user_id")
    .maybeSingle();

  if (petUpdateError) {
    throw new Error("펫 데이터를 초기화하지 못했습니다.");
  }

  if (!petUpdated) {
    throw new Error("펫 데이터를 찾을 수 없습니다. 시드를 확인하세요.");
  }

  const { snapshot } = await loadRoutineSnapshot(supabase);

  return snapshot;
}
