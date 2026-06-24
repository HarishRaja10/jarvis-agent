import { motion } from "framer-motion";
import { AlertRail } from "../components/AlertRail";
import { BriefingPanel } from "../components/BriefingPanel";
import { CoreOverlay } from "../components/CoreOverlay";
import { IntelligenceCoreScene } from "../components/IntelligenceCoreScene";
import { MetricStrip } from "../components/MetricStrip";
import { SourceMatrix } from "../components/SourceMatrix";
import { ScrollCinematicVideo } from "../components/ScrollCinematicVideo";
import { TopicOrbitPanel } from "../components/TopicOrbitPanel";
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
          <motion.section
            className="relative min-h-[calc(100vh-128px)] overflow-hidden border-y border-cyan-core/20 bg-black shadow-neon-strong sm:min-h-[760px]"
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <ScrollCinematicVideo
              className="absolute inset-0"
              desktopSrc="/cinematic/dashboard-core-pour.mp4"
              mobileSrc="/cinematic/mobile-core-pour.mp4"
              overlay="core"
            />
            <div className="absolute inset-0 opacity-45 mix-blend-screen">
              <IntelligenceCoreScene />
            </div>
            <CoreOverlay />
          </motion.section>
          <ScrollCinematicVideo
            className="min-h-[520px] border-y border-emerald-core/20 shadow-neon sm:min-h-[700px]"
            desktopSrc="/cinematic/dashboard-panels-fill.mp4"
            overlay="panels"
          />
          <AlertRail />
        </section>

        <aside className="order-3">
          <BriefingPanel items={data.briefingItems} />
        </aside>
      </main>
    </div>
  );
}
