"use client";

import { motion } from "motion/react";
import { Star, Trophy } from "lucide-react";

type PetSnapshot = {
  totalExp: number;
  stageId: number;
  stageName: string;
  currentStageMin: number;
  nextStageMin: number | null;
};

export function PetCard({ pet }: { pet: PetSnapshot }) {
  const progressMax = (pet.nextStageMin ?? pet.totalExp) - pet.currentStageMin;
  const progressValue = Math.max(
    0,
    Math.min(progressMax, pet.totalExp - pet.currentStageMin),
  );
  const percent =
    progressMax === 0 ? 100 : Math.round((progressValue / progressMax) * 100);

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full rounded-[32px] bg-gradient-to-b from-[#d7d3ff] via-[#f4f3ff] to-white p-6 shadow-lg"
    >
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#b59cff] via-[#9bb4ff] to-[#6ee7ff] p-6 text-center shadow-lg">
        <p className="text-sm font-semibold text-white/90">Hi there!</p>
        <motion.div
          initial={{ scale: 0.94, y: 8 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mx-auto mt-4 flex h-48 w-48 items-center justify-center rounded-full bg-white/20 shadow-inner"
        >
          <span className="text-6xl">🐶</span>
        </motion.div>
        <div className="absolute bottom-[-18px] left-1/2 h-9 w-9 -translate-x-1/2 rounded-full border-4 border-white bg-[#e5dfff] shadow-lg" />
      </div>

      <div className="mt-8 rounded-3xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              mascot name
            </p>
            <p className="text-2xl font-semibold text-slate-900">
              {pet.stageName}
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            <Star className="h-4 w-4" />
            Stage {pet.stageId}
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-indigo-50/70 p-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>Progress</span>
            <span>{percent}%</span>
          </div>
          <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-white/70">
            <motion.div
              key={percent}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, percent)}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-[#7c5cff] via-[#9bb4ff] to-[#6ee7ff]"
            />
          </div>
          {pet.nextStageMin ? (
            <p className="mt-2 text-[11px] text-slate-500">
              다음 Stage까지 남은 EXP: {pet.nextStageMin - pet.totalExp}
            </p>
          ) : (
            <p className="mt-2 text-[11px] text-slate-500">
              최고 Stage에 도달했습니다.
            </p>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-3 text-center text-sm text-slate-700">
          <div className="flex flex-col gap-1 rounded-xl bg-white p-3 shadow-sm">
            <p className="text-xs text-slate-500">누적 EXP</p>
            <p className="text-lg font-semibold text-slate-900">
              {pet.totalExp}
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-xl bg-white p-3 shadow-sm">
            <p className="text-xs text-slate-500">다음 Stage</p>
            <p className="text-lg font-semibold text-slate-900">
              {pet.nextStageMin ? `EXP ${pet.nextStageMin}` : "Max"}
            </p>
          </div>
          <div className="col-span-2 flex items-center justify-between rounded-xl bg-white p-3 shadow-sm">
            <div className="flex items-center gap-2 text-slate-700">
              <Trophy className="h-5 w-5 text-indigo-500" />
              <div>
                <p className="text-xs text-slate-500">현재 Stage</p>
                <p className="text-sm font-semibold">Stage {pet.stageId}</p>
              </div>
            </div>
            <button
              type="button"
              className="rounded-full bg-gradient-to-r from-[#7c5cff] via-[#9bb4ff] to-[#6ee7ff] px-4 py-2 text-xs font-semibold text-white shadow-md"
            >
              Power up
            </button>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
