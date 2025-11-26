"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "motion/react";

import { completeMissionAction } from "@/app/actions/complete-mission";
import type { MissionWithStatus } from "@/types/routine";

type Props = {
  missions: MissionWithStatus[];
  disabled?: boolean;
};

export function MissionList({ missions, disabled = false }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [stageMessage, setStageMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const getLocalDate = () => {
    const now = new Date();
    const tzOffsetMs = now.getTimezoneOffset() * 60 * 1000;
    const local = new Date(now.getTime() - tzOffsetMs);
    return local.toISOString().slice(0, 10); // YYYY-MM-DD in local timezone
  };

  const handleComplete = (missionId: string) => {
    if (disabled) {
      return;
    }

    startTransition(async () => {
      const completionDate = getLocalDate();
      const result = await completeMissionAction(missionId, completionDate);
      if (!result.ok) {
        setMessage(result.message);
        setStageMessage(null);
        return;
      }

      const base = `+${result.earnedExp} EXP (총 ${result.totalExp})`;
      const stage =
        result.stageChanged && result.newStage !== null
          ? `Stage ${result.oldStage ?? "?"} → ${result.newStage}`
          : null;
      const remaining =
        result.remainingCount > 0
          ? `남은 가능 횟수 ${result.remainingCount}`
          : null;
      setMessage(base);
      setStageMessage(stage ?? remaining);
      if (result.ok) {
        router.refresh();
      }
    });
  };

  if (missions.length === 0) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
      >
        <p className="text-sm text-zinc-600">오늘 진행 가능한 미션이 없습니다.</p>
      </motion.section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur"
    >
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-indigo-600">오늘의 미션</p>
        <p className="text-lg font-semibold text-slate-900">
          버튼을 눌러 EXP를 적립하고 Stage를 올려보세요.
        </p>
        <AnimatePresence>
          {(message || stageMessage) && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex flex-wrap gap-2"
            >
              {message ? (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {message}
                </span>
              ) : null}
              {stageMessage ? (
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                  {stageMessage}
                </span>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-4 grid gap-3">
        {missions.map((mission) => {
          const buttonDisabled = disabled || mission.completedToday || isPending;
          return (
            <motion.div
              key={mission.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {mission.title}
                </p>
                <p className="text-xs text-slate-600">
                  {mission.period.toUpperCase()} · +{mission.rewardExp} EXP
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleComplete(mission.id)}
                disabled={buttonDisabled}
                className={`rounded-full px-4 py-2 text-sm font-semibold text-white transition ${
                  buttonDisabled
                    ? "bg-slate-300"
                    : "bg-indigo-600 shadow-md shadow-indigo-200 hover:bg-indigo-700"
                }`}
              >
                {mission.completedToday ? "완료됨" : "미션 완료"}
              </button>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
