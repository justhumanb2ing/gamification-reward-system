"use client";

import { motion } from "motion/react";
import { CalendarClock, ClipboardCheck, Gift, NotebookPen, Sparkles } from "lucide-react";

type Props = {
  demoUserId: string;
};

export function HeroBanner({ demoUserId }: Props) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 via-sky-400 to-emerald-400 p-6 text-white shadow-lg"
    >
      <div className="absolute right-6 top-6 h-24 w-24 rounded-full bg-white/15 blur-2xl" />
      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ scale: 0.9, rotate: -2 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white/20 text-5xl shadow-inner"
          >
            🐾
          </motion.div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-white/80">
              내 펫
            </p>
            <p className="text-3xl font-bold">쿠키</p>
            <p className="text-sm text-white/80">
              미션을 완료해 EXP를 모으고 Stage를 올려보세요.
            </p>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1, ease: "easeOut" }}
          className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold"
        >
          <Sparkles className="h-4 w-4" />
          성장 중 · 데모 {demoUserId}
        </motion.div>
      </div>
      <motion.nav
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08 }}
        className="mt-4 flex flex-wrap gap-2"
      >
        {[
          { icon: <NotebookPen className="h-4 w-4" />, label: "데일리 미션" },
          { icon: <ClipboardCheck className="h-4 w-4" />, label: "핵심 액션" },
          { icon: <CalendarClock className="h-4 w-4" />, label: "이벤트" },
          { icon: <Gift className="h-4 w-4" />, label: "보상함" },
        ].map((item) => (
          <span
            key={item.label}
            className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white shadow-sm shadow-white/10"
          >
            {item.icon}
            {item.label}
          </span>
        ))}
      </motion.nav>
    </motion.section>
  );
}
