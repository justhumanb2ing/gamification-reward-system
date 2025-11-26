"use client";

import { useEffect, useState, useTransition } from "react";

import { resetMissionsAction } from "@/app/actions/reset-missions";
import { HeroBanner } from "@/components/hero-banner";
import { MissionList } from "@/components/mission-list";
import { PetCard } from "@/components/pet-card";
import type { PetSnapshot, RoutineSnapshot } from "@/types/routine";

type Props = {
  demoUserId: string;
  initialSnapshot: RoutineSnapshot;
  resetPreviewPet: PetSnapshot | null;
};

export function RoutineDashboard({
  demoUserId,
  initialSnapshot,
  resetPreviewPet,
}: Props) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isResetting, startResetTransition] = useTransition();

  useEffect(() => {
    setSnapshot(initialSnapshot);
  }, [initialSnapshot]);

  const handleReset = () => {
    const previousSnapshot = snapshot;
    const optimisticPet = resetPreviewPet ?? snapshot.pet ?? null;
    const optimisticMissions = snapshot.missions.map((mission) => ({
      ...mission,
      completedToday: false,
    }));

    setSnapshot({ pet: optimisticPet, missions: optimisticMissions });
    setStatusMessage("미션 초기화 적용 중...");

    startResetTransition(async () => {
      const result = await resetMissionsAction();
      if (!result.ok) {
        setSnapshot(previousSnapshot);
        setStatusMessage(result.message);
        return;
      }

      setSnapshot(result.snapshot);
      setStatusMessage(result.message);
    });
  };

  const missionStateKey = snapshot.missions
    .map((mission) => `${mission.id}-${mission.completedToday}`)
    .join("|");

  return (
    <div className="flex w-full flex-col gap-6">
      <HeroBanner demoUserId={demoUserId} />

      {statusMessage ? (
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700 shadow-sm">
          {statusMessage}
        </div>
      ) : null}

      {snapshot.pet ? (
        <PetCard
          pet={snapshot.pet}
          onResetMissions={handleReset}
          isResetting={isResetting}
        />
      ) : (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
          펫 데이터가 없습니다. Supabase에 데모 유저/펫을 시드한 뒤 다시
          확인하세요.
        </section>
      )}

      <MissionList
        key={missionStateKey}
        missions={snapshot.missions}
        disabled={isResetting}
      />
    </div>
  );
}
