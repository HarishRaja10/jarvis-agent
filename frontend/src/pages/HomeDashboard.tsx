import { motion } from "framer-motion";
import { AlertRail } from "../components/AlertRail";
import { BriefingPanel } from "../components/BriefingPanel";
import { MetricStrip } from "../components/MetricStrip";
import { SourceMatrix } from "../components/SourceMatrix";
import { TopicOrbitPanel } from "../components/TopicOrbitPanel";
import { WorldSweepConsole } from "../components/WorldSweepConsole";
import { useDashboardData } from "../hooks/useDashboardData";

export function HomeDashboard() {
  const { data } = useDashboardData();

  if (!data) {
    return <div className="grid min-h-screen place-items-center bg-background text-foreground">Jarvis booting</div>;
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <main className="mx-auto grid w-full max-w-[1800px] gap-4 px-4 py-4 sm:px-6 xl:grid-cols-[330px_minmax(0,1fr)_420px]">
        <aside className="order-2 grid content-start gap-4 xl:order-1">
          <TopicOrbitPanel topics={data.topics} />
          <SourceMatrix sources={data.sourceStatuses} />
        </aside>

        <section className="order-1 grid min-h-[calc(100vh-112px)] content-start gap-4 xl:order-2">
          <MetricStrip />
          <motion.div
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <WorldSweepConsole
              briefingItems={data.briefingItems}
              signals={data.worldSignals}
              sources={data.sourceStatuses}
              topics={data.topics}
            />
          </motion.div>
          <AlertRail />
        </section>

        <aside className="order-3">
          <BriefingPanel items={data.briefingItems} />
        </aside>
      </main>
    </div>
  );
}
