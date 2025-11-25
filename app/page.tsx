import { Suspense } from "react";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { HeroBanner } from "@/components/hero-banner";
import { MissionList } from "@/components/mission-list";
import { PetCard } from "@/components/pet-card";
import type { Tables } from "@/types/database.types";

type MissionWithStatus = {
  id: string;
  title: string;
  rewardExp: number;
  period: Tables<"missions">["period"];
  completedToday: boolean;
};

type PetSnapshot = {
  totalExp: number;
  stageId: number;
  stageName: string;
  currentStageMin: number;
  nextStageMin: number | null;
};

const DEMO_USER_ID =
  process.env.DEMO_USER_ID ?? "00000000-0000-0000-0000-000000000001";

async function loadRoutinePetSnapshot(): Promise<{
  pet: PetSnapshot | null;
  missions: MissionWithStatus[];
}> {
  const supabase = createServiceRoleClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: missionsData } = await supabase
    .from("missions")
    .select(
      "id, title, reward_exp, period, active_from, active_to, is_active",
    )
    .order("title", { ascending: true });

  const activeMissions =
    missionsData?.filter(
      (mission) =>
        mission.is_active &&
        mission.active_from <= today &&
        mission.active_to >= today,
    ) ?? [];

  const { data: completedToday } = await supabase
    .from("user_missions")
    .select("mission_id")
    .eq("user_id", DEMO_USER_ID)
    .eq("completion_ref", today);

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

  const { data: petRow } = await supabase
    .from("pets")
    .select("total_exp, current_stage_id")
    .eq("user_id", DEMO_USER_ID)
    .maybeSingle();

  if (!petRow) {
    return { pet: null, missions };
  }

  const { data: currentStage } = await supabase
    .from("pet_stages")
    .select("id, name, min_total_exp")
    .eq("id", petRow.current_stage_id)
    .maybeSingle();

  const { data: nextStage } = await supabase
    .from("pet_stages")
    .select("id, min_total_exp")
    .gt("min_total_exp", petRow.total_exp)
    .order("min_total_exp", { ascending: true })
    .limit(1)
    .maybeSingle();

  return {
    pet: {
      totalExp: petRow.total_exp,
      stageId: petRow.current_stage_id,
      stageName: currentStage?.name ?? `Stage ${petRow.current_stage_id}`,
      currentStageMin: currentStage?.min_total_exp ?? 0,
      nextStageMin: nextStage?.min_total_exp ?? null,
    },
    missions,
  };
}

export default async function Home() {
  const snapshot = await loadRoutinePetSnapshot();

  return (
    <div className="relative flex min-h-screen justify-center bg-gradient-to-b from-slate-50 via-sky-50 to-white px-4 py-10 font-sans">
      <main className="flex w-full max-w-5xl flex-col gap-6">
        <HeroBanner demoUserId={DEMO_USER_ID} />

        {snapshot.pet ? (
          <PetCard pet={snapshot.pet} />
        ) : (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
            펫 데이터가 없습니다. Supabase에 데모 유저/펫을 시드한 뒤 다시
            확인하세요.
          </section>
        )}

        <Suspense
          fallback={
            <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-zinc-600">미션을 불러오는 중...</p>
            </section>
          }
        >
          <MissionList missions={snapshot.missions} />
        </Suspense>
      </main>
    </div>
  );
}
