import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, Line, PerspectiveCamera, Stars } from "@react-three/drei";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, Check, Globe2, RadioTower, RotateCcw, Satellite, ScanLine, Sparkles } from "lucide-react";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, PointerEvent } from "react";
import * as THREE from "three";
import type { BriefingItem, SourceStatus, Topic, WorldSignal } from "../data/mock";
import { cn, confidenceColor } from "../lib/utils";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";

type WorldSweepConsoleProps = {
  briefingItems: BriefingItem[];
  signals: WorldSignal[];
  sources: SourceStatus[];
  topics: Topic[];
};

type SweepPhase = "idle" | "charging" | "scan" | "extract" | "reveal" | "complete";

const HOLD_DURATION_MS = 1450;

const stageDetails = {
  scan: {
    label: "World Sweep",
    detail: "Regional signals detected",
    src: "/cinematic/world-sweep-scan.mp4",
    icon: Satellite
  },
  extract: {
    label: "Signal Extraction",
    detail: "Sources clustered by trust",
    src: "/cinematic/news-extraction.mp4",
    icon: RadioTower
  },
  reveal: {
    label: "Briefing Reveal",
    detail: "Verdicts assembled",
    src: "/cinematic/briefing-reveal.mp4",
    icon: Sparkles
  }
} as const;

const toneHex = {
  cyan: "#37e1ff",
  amber: "#f6b73c",
  emerald: "#2df2a1",
  rose: "#ff5f7a"
};

export function WorldSweepConsole({ briefingItems, signals, sources, topics }: WorldSweepConsoleProps) {
  const [phase, setPhase] = useState<SweepPhase>("idle");
  const [holdProgress, setHoldProgress] = useState(0);
  const frameRef = useRef<number>();
  const holdStartedAt = useRef(0);
  const sweepStarted = phase === "scan" || phase === "extract" || phase === "reveal";
  const onlineSources = sources.filter((source) => source.health === "online").length;
  const highConfidence = briefingItems.filter((item) => item.confidence === "High").length;
  const primarySignal = signals[0];

  const clearHold = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = undefined;
    holdStartedAt.current = 0;
  }, []);

  const startSweep = useCallback(() => {
    clearHold();
    setHoldProgress(1);
    setPhase("scan");
    window.navigator.vibrate?.(24);
  }, [clearHold]);

  const startHold = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (sweepStarted || phase === "complete") return;
      event.currentTarget.setPointerCapture(event.pointerId);
      clearHold();
      setPhase("charging");
      setHoldProgress(0);
      holdStartedAt.current = performance.now();

      const tick = (now: number) => {
        const progress = Math.min(1, (now - holdStartedAt.current) / HOLD_DURATION_MS);
        setHoldProgress(progress);
        if (progress >= 1) {
          startSweep();
          return;
        }
        frameRef.current = requestAnimationFrame(tick);
      };

      frameRef.current = requestAnimationFrame(tick);
    },
    [clearHold, phase, startSweep, sweepStarted]
  );

  const cancelHold = useCallback(() => {
    if (phase !== "charging") return;
    clearHold();
    setHoldProgress(0);
    setPhase("idle");
  }, [clearHold, phase]);

  useEffect(() => {
    if (phase !== "scan" && phase !== "extract" && phase !== "reveal") return undefined;
    const nextPhase: SweepPhase = phase === "scan" ? "extract" : phase === "extract" ? "reveal" : "complete";
    const duration = phase === "reveal" ? 1900 : 2300;
    const timer = window.setTimeout(() => setPhase(nextPhase), duration);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => clearHold, [clearHold]);

  const chargeStyle = {
    background: `conic-gradient(hsl(var(--cyan-core)) ${holdProgress * 360}deg, rgba(55, 225, 255, 0.12) 0deg)`
  } as CSSProperties;

  return (
    <section className="relative isolate min-h-[calc(100vh-128px)] overflow-hidden border-y border-cyan-core/20 bg-black shadow-neon-strong sm:min-h-[760px]">
      <video
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover opacity-[0.24]"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        src="/cinematic/world-core-idle.mp4"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(55,225,255,0.16),transparent_38%),linear-gradient(180deg,rgba(1,5,8,0.22),rgba(1,5,8,0.94))]" />
      <div className="core-grid absolute inset-0 opacity-60" />

      <WorldGlobeScene active={phase === "charging" || sweepStarted || phase === "complete"} signals={signals} />

      <div className="pointer-events-none absolute inset-x-3 top-3 z-20 grid gap-2 sm:inset-x-4 sm:top-4 2xl:grid-cols-[1fr_auto]">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <SignalStat label="Signals" value={signals.length.toString().padStart(2, "0")} detail="global" tone="cyan" />
          <SignalStat label="Sources" value={`${onlineSources}/${sources.length}`} detail="online" tone="emerald" />
          <SignalStat label="Trust" value="82" detail="stable" tone="emerald" />
          <SignalStat label="Verdicts" value={highConfidence.toString().padStart(2, "0")} detail="high" tone="amber" />
        </div>
        <div className="hidden min-w-[230px] rounded-lg border border-cyan-core/20 bg-background/50 p-3 backdrop-blur-xl 2xl:block">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
            <Activity className="h-4 w-4 text-cyan-core" />
            Active Signal
          </div>
          <p className="mt-2 text-sm font-semibold text-foreground">{primarySignal?.label ?? "Global monitor"}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{primarySignal?.summary ?? "Waiting for source sweep."}</p>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-3 bottom-3 z-20 grid gap-3 sm:inset-x-4 sm:bottom-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="self-end rounded-lg border border-cyan-core/20 bg-background/56 p-3 backdrop-blur-xl sm:p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={phase === "complete" ? "emerald" : phase === "idle" ? "cyan" : "amber"}>
              {phase === "complete" ? "Briefed" : phase === "idle" ? "Ready" : "Scanning"}
            </Badge>
            {topics.slice(0, 4).map((topic) => (
              <Badge key={topic.id} tone={topic.tone}>{topic.name}</Badge>
            ))}
          </div>
          <h2 className="mt-3 text-xl font-semibold text-foreground sm:text-2xl">Global Intelligence Core</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            World signals are clustered by region, source trust, confidence, and personal relevance before Jarvis assembles the briefing.
          </p>
        </div>

        <div className="pointer-events-auto self-end rounded-lg border border-cyan-core/20 bg-background/62 p-3 backdrop-blur-xl sm:p-4">
          {phase === "complete" ? (
            <BriefingVerdict items={briefingItems} onReset={() => {
              setHoldProgress(0);
              setPhase("idle");
            }} />
          ) : (
            <div className="grid gap-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Command</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">World Sweep</p>
                </div>
                <div className="grid h-12 w-12 place-items-center rounded-full p-1" style={chargeStyle}>
                  <div className="grid h-full w-full place-items-center rounded-full bg-background">
                    <Globe2 className="h-5 w-5 text-cyan-core" />
                  </div>
                </div>
              </div>
              <Button
                className="h-12 w-full touch-none select-none justify-center text-base"
                disabled={sweepStarted}
                onContextMenu={(event) => event.preventDefault()}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") startSweep();
                }}
                onPointerCancel={cancelHold}
                onPointerDown={startHold}
                onPointerLeave={cancelHold}
                onPointerUp={cancelHold}
                type="button"
                variant="primary"
              >
                <ScanLine className="h-5 w-5" />
                {phase === "charging" ? "Charging" : sweepStarted ? "Sweeping" : "World Sweep"}
              </Button>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <MiniMeter label="Cluster" value="6" />
                <MiniMeter label="Impact" value="74" />
                <MiniMeter label="Noise" value="Low" />
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {sweepStarted ? <SweepStageOverlay phase={phase as "scan" | "extract" | "reveal"} /> : null}
      </AnimatePresence>
    </section>
  );
}

function SignalStat({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: "cyan" | "amber" | "emerald" | "rose" }) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/52 p-3 backdrop-blur-xl">
      <p className="text-[10px] font-semibold uppercase text-muted-foreground sm:text-xs">{label}</p>
      <p className={cn("mt-1 text-xl font-semibold sm:text-2xl", tone === "cyan" && "text-cyan-core", tone === "amber" && "text-amber-core", tone === "emerald" && "text-emerald-core", tone === "rose" && "text-rose-core")}>{value}</p>
      <p className="mt-0.5 text-[10px] text-muted-foreground sm:text-xs">{detail}</p>
    </div>
  );
}

function MiniMeter({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/70 bg-muted/35 px-2 py-2">
      <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold text-foreground">{value}</p>
    </div>
  );
}

function BriefingVerdict({ items, onReset }: { items: BriefingItem[]; onReset: () => void }) {
  const topItems = items.slice(0, 3);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">Jarvis Verdict</p>
          <h3 className="mt-1 text-base font-semibold text-foreground">Briefing assembled</h3>
        </div>
        <Button aria-label="Run again" onClick={onReset} size="icon">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid gap-2">
        {topItems.map((item, index) => (
          <article key={item.id} className="rounded-md border border-border/70 bg-background/38 p-3">
            <div className="flex items-start gap-3">
              <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-cyan-core/30 bg-cyan-core/10 text-xs font-semibold text-cyan-core">
                {index + 1}
              </div>
              <div className="min-w-0">
                <h4 className="line-clamp-2 text-sm font-semibold leading-5 text-foreground">{item.title}</h4>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className={cn("rounded-md border px-2 py-1 text-[10px] font-semibold", confidenceColor(item.confidence))}>{item.confidence}</span>
                  <Badge tone={item.trustScore >= 90 ? "emerald" : "amber"} className="h-6">Trust {item.trustScore}</Badge>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function SweepStageOverlay({ phase }: { phase: "scan" | "extract" | "reveal" }) {
  const stage = stageDetails[phase];
  const Icon = stage.icon;

  return (
    <motion.div
      className="absolute inset-0 z-40 grid place-items-center overflow-hidden bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.24 }}
    >
      <video
        key={stage.src}
        aria-hidden="true"
        autoPlay
        className="absolute inset-0 h-full w-full object-cover opacity-[0.92]"
        muted
        playsInline
        preload="auto"
        src={stage.src}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,transparent,rgba(0,0,0,0.16)_42%,rgba(0,0,0,0.82)_100%)]" />
      <div className="core-grid absolute inset-0 opacity-30" />
      <motion.div
        className="relative z-10 w-[min(640px,calc(100vw-32px))] rounded-lg border border-cyan-core/30 bg-background/70 p-4 shadow-neon-strong backdrop-blur-xl sm:p-5"
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.98 }}
      >
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-md border border-cyan-core/35 bg-cyan-core/12">
            <Icon className="h-5 w-5 text-cyan-core" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">{stage.label}</p>
            <h2 className="text-lg font-semibold text-foreground sm:text-xl">{stage.detail}</h2>
          </div>
        </div>
        <div className="mt-5 grid gap-2">
          {(["scan", "extract", "reveal"] as const).map((item) => {
            const currentIndex = Object.keys(stageDetails).indexOf(phase);
            const itemIndex = Object.keys(stageDetails).indexOf(item);
            return (
              <div key={item} className="flex items-center gap-3 rounded-md border border-border/70 bg-muted/30 px-3 py-2">
                <div
                  className={cn(
                    "grid h-7 w-7 place-items-center rounded-md border",
                    itemIndex <= currentIndex ? "border-emerald-core/40 bg-emerald-core/12 text-emerald-core" : "border-border text-muted-foreground"
                  )}
                >
                  {itemIndex < currentIndex ? <Check className="h-4 w-4" /> : <span className="text-xs">{itemIndex + 1}</span>}
                </div>
                <span className={cn("text-sm capitalize", itemIndex <= currentIndex ? "text-foreground" : "text-muted-foreground")}>
                  {item === "scan" ? "World scan" : item === "extract" ? "News extraction" : "Briefing reveal"}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

function WorldGlobeScene({ active, signals }: { active: boolean; signals: WorldSignal[] }) {
  return (
    <div className="absolute inset-0 z-10">
      <Canvas
        className="h-full w-full"
        dpr={[1, 1.75]}
        fallback={<WorldGlobeFallback />}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <PerspectiveCamera makeDefault fov={42} position={[0, 0.2, 7.4]} />
        <color attach="background" args={["#02060a"]} />
        <fog attach="fog" args={["#02060a", 7, 12]} />
        <SceneCamera active={active} />
        <GlobeLights />
        <Suspense fallback={null}>
          <Stars radius={22} depth={18} count={active ? 1900 : 1250} factor={2.2} saturation={0} fade speed={0.24} />
          <SignalGlobe active={active} signals={signals} />
          <EffectComposer multisampling={0}>
            <Bloom intensity={active ? 1.1 : 0.74} luminanceThreshold={0.18} luminanceSmoothing={0.48} mipmapBlur />
            <Vignette eskil={false} offset={0.18} darkness={0.72} />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
}

function SignalGlobe({ active, signals }: { active: boolean; signals: WorldSignal[] }) {
  const group = useRef<THREE.Group>(null);
  const isMobile = useIsMobileScene();

  useFrame((state) => {
    if (!group.current) return;
    const time = state.clock.elapsedTime;
    group.current.rotation.y = time * (active ? 0.18 : 0.08);
    group.current.rotation.x = Math.sin(time * 0.18) * 0.06;
  });

  return (
    <group ref={group} scale={isMobile ? 0.86 : 1}>
      <mesh>
        <sphereGeometry args={[1.8, 96, 96]} />
        <meshPhysicalMaterial
          color="#092532"
          emissive="#0c5d70"
          emissiveIntensity={active ? 0.7 : 0.38}
          metalness={0.08}
          opacity={0.78}
          roughness={0.34}
          transparent
        />
      </mesh>
      <mesh scale={1.035}>
        <sphereGeometry args={[1.8, 96, 96]} />
        <meshBasicMaterial color="#37e1ff" opacity={active ? 0.08 : 0.045} transparent wireframe />
      </mesh>
      <GlobeGrid />
      <Atmosphere active={active} />
      <SignalArcs signals={signals} />
      {signals.map((signal) => (
        <SignalNode key={signal.id} signal={signal} />
      ))}
      <OrbitalSweep active={active} />
      <DataField active={active} />
    </group>
  );
}

function GlobeGrid() {
  const latitudes = useMemo(() => [-60, -35, -15, 0, 18, 38, 60], []);
  const longitudes = useMemo(() => Array.from({ length: 12 }, (_, index) => index * 30), []);

  return (
    <group>
      {latitudes.map((lat) => (
        <Line key={`lat-${lat}`} points={latitudePoints(lat)} color="#37e1ff" transparent opacity={lat === 0 ? 0.36 : 0.18} lineWidth={lat === 0 ? 1.2 : 0.8} />
      ))}
      {longitudes.map((lon) => (
        <Line key={`lon-${lon}`} points={longitudePoints(lon)} color="#2df2a1" transparent opacity={0.12} lineWidth={0.65} />
      ))}
    </group>
  );
}

function SignalNode({ signal }: { signal: WorldSignal }) {
  const ref = useRef<THREE.Group>(null);
  const position = useMemo(() => latLngToVector(signal.lat, signal.lng, 1.88), [signal.lat, signal.lng]);
  const color = toneHex[signal.tone];
  const isMobile = useIsMobileScene();

  useFrame((state) => {
    if (!ref.current) return;
    const time = state.clock.elapsedTime;
    const pulse = 1 + Math.sin(time * 2.6 + signal.lat) * 0.08;
    ref.current.scale.setScalar(pulse);
  });

  return (
    <group ref={ref} position={position}>
      <mesh>
        <sphereGeometry args={[0.055, 24, 24]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3.3} roughness={0.18} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.13, 24, 24]} />
        <meshBasicMaterial color={color} opacity={0.18} transparent />
      </mesh>
      {!isMobile ? (
        <Html center distanceFactor={8.5} position={[0, 0.24, 0]}>
          <div className="min-w-[96px] rounded-md border border-cyan-100/15 bg-black/55 px-2 py-1 shadow-[0_0_22px_rgba(55,225,255,0.16)] backdrop-blur">
            <div className="text-[9px] font-semibold uppercase leading-none text-white/90">{signal.region}</div>
            <div className="mt-1 truncate text-[9px] font-medium leading-none text-cyan-100/60">{signal.status}</div>
          </div>
        </Html>
      ) : null}
    </group>
  );
}

function SignalArcs({ signals }: { signals: WorldSignal[] }) {
  return (
    <group>
      {signals.map((signal, index) => {
        const start = latLngToVector(signal.lat, signal.lng, 1.9);
        const end = latLngToVector(12.9, 80.2, 1.9);
        const midpoint = start.clone().add(end).multiplyScalar(0.5).normalize().multiplyScalar(2.55 + (index % 3) * 0.14);
        const curve = new THREE.CatmullRomCurve3([start, midpoint, end]);
        return (
          <Line
            key={`arc-${signal.id}`}
            points={curve.getPoints(52)}
            color={toneHex[signal.tone]}
            transparent
            opacity={0.2 + (index % 2) * 0.12}
            lineWidth={1}
          />
        );
      })}
    </group>
  );
}

function OrbitalSweep({ active }: { active: boolean }) {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!group.current) return;
    const time = state.clock.elapsedTime;
    group.current.rotation.z = time * (active ? 0.54 : 0.24);
    group.current.rotation.y = time * 0.08;
  });

  return (
    <group ref={group}>
      <mesh rotation={[Math.PI / 2.6, 0, 0.2]}>
        <torusGeometry args={[2.25, 0.008, 8, 180]} />
        <meshBasicMaterial color="#37e1ff" opacity={active ? 0.62 : 0.34} transparent />
      </mesh>
      <mesh rotation={[Math.PI / 2.15, 0.6, 1.1]}>
        <torusGeometry args={[2.62, 0.006, 8, 180]} />
        <meshBasicMaterial color="#f6b73c" opacity={active ? 0.42 : 0.22} transparent />
      </mesh>
    </group>
  );
}

function DataField({ active }: { active: boolean }) {
  const points = useRef<THREE.Points>(null);
  const particles = useMemo(() => {
    const count = 900;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = [new THREE.Color("#37e1ff"), new THREE.Color("#2df2a1"), new THREE.Color("#f6b73c"), new THREE.Color("#eafcff")];

    for (let index = 0; index < count; index += 1) {
      const offset = index * 3;
      const radius = 2.1 + Math.random() * 2.4;
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 3.1;
      positions[offset] = Math.cos(theta) * radius;
      positions[offset + 1] = y;
      positions[offset + 2] = Math.sin(theta) * radius * 0.52;

      const color = palette[index % palette.length];
      colors[offset] = color.r;
      colors[offset + 1] = color.g;
      colors[offset + 2] = color.b;
    }

    return { colors, positions };
  }, []);

  useFrame((state) => {
    if (!points.current) return;
    points.current.rotation.y = state.clock.elapsedTime * (active ? 0.035 : 0.018);
    points.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.1) * 0.025;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particles.positions.length / 3} array={particles.positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={particles.colors.length / 3} array={particles.colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={active ? 0.018 : 0.014} vertexColors transparent opacity={active ? 0.64 : 0.42} depthWrite={false} />
    </points>
  );
}

function Atmosphere({ active }: { active: boolean }) {
  return (
    <mesh scale={1.13}>
      <sphereGeometry args={[1.8, 96, 96]} />
      <meshBasicMaterial color="#37e1ff" opacity={active ? 0.105 : 0.065} side={THREE.BackSide} transparent />
    </mesh>
  );
}

function SceneCamera({ active }: { active: boolean }) {
  const { camera, pointer } = useThree();

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const targetZ = active ? 5.9 : 7.2;
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointer.x * 0.42, 0.035);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0.18 + pointer.y * 0.22 + Math.sin(time * 0.13) * 0.04, 0.035);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.03);
    camera.lookAt(0, 0, 0);
  });

  return null;
}

function GlobeLights() {
  return (
    <>
      <ambientLight intensity={0.32} />
      <pointLight color="#37e1ff" distance={9} intensity={4.8} position={[2.8, 1.9, 4.2]} />
      <pointLight color="#2df2a1" distance={8} intensity={2.1} position={[-3.4, -2.2, 3.2]} />
      <pointLight color="#f6b73c" distance={8} intensity={1.8} position={[0.4, -3.2, 3.8]} />
      <spotLight angle={0.42} color="#f8feff" intensity={1.35} penumbra={0.7} position={[0, 4.8, 5.8]} />
    </>
  );
}

function useIsMobileScene() {
  const viewport = useThree((state) => state.viewport);
  return viewport.width < 6;
}

function latitudePoints(latitude: number) {
  const radius = Math.cos(THREE.MathUtils.degToRad(latitude)) * 1.82;
  const y = Math.sin(THREE.MathUtils.degToRad(latitude)) * 1.82;
  return Array.from({ length: 145 }, (_, index) => {
    const angle = (index / 144) * Math.PI * 2;
    return new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
  });
}

function longitudePoints(longitude: number) {
  const lon = THREE.MathUtils.degToRad(longitude);
  return Array.from({ length: 145 }, (_, index) => {
    const lat = -Math.PI / 2 + (index / 144) * Math.PI;
    const radius = Math.cos(lat) * 1.825;
    const x = radius * Math.cos(lon);
    const z = radius * Math.sin(lon);
    const y = Math.sin(lat) * 1.825;
    return new THREE.Vector3(x, y, z);
  });
}

function latLngToVector(latitude: number, longitude: number, radius: number) {
  const phi = THREE.MathUtils.degToRad(90 - latitude);
  const theta = THREE.MathUtils.degToRad(longitude + 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function WorldGlobeFallback() {
  return (
    <div className="grid h-full min-h-[520px] place-items-center bg-black">
      <video
        aria-hidden="true"
        autoPlay
        className="h-full w-full object-cover opacity-80"
        loop
        muted
        playsInline
        preload="metadata"
        src="/cinematic/world-earth-interface.mp4"
      />
    </div>
  );
}
