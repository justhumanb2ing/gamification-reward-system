import { DEMO_USER_ID } from "@/config/demo-user";
import { RoutineDashboard } from "@/components/routine-dashboard";
import { loadRoutineSnapshot } from "@/service/routine-pet";

export default async function Home() {
  const routineData = await loadRoutineSnapshot();

  return (
    <div className="relative flex min-h-screen justify-center bg-gradient-to-b from-slate-50 via-sky-50 to-white px-4 py-10 font-sans">
      <main className="flex w-full max-w-5xl flex-col gap-6">
        <RoutineDashboard
          demoUserId={DEMO_USER_ID}
          initialSnapshot={routineData.snapshot}
          resetPreviewPet={routineData.resetPreviewPet}
        />
      </main>
    </div>
  );
}
