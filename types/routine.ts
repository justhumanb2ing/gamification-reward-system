import type { Tables } from "@/types/database.types";

export type MissionWithStatus = {
  id: string;
  title: string;
  rewardExp: number;
  period: Tables<"missions">["period"];
  completedToday: boolean;
};

export type PetSnapshot = {
  totalExp: number;
  stageId: number;
  stageName: string;
  currentStageMin: number;
  nextStageMin: number | null;
};

export type RoutineSnapshot = {
  pet: PetSnapshot | null;
  missions: MissionWithStatus[];
};
