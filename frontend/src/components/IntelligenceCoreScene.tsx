import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Html, Line, PerspectiveCamera, Stars } from "@react-three/drei";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";

const COLORS = {
  cyan: "#37e1ff",
  cyanSoft: "#a7f7ff",
  amber: "#f6b73c",
  emerald: "#2df2a1",
  rose: "#ff5f7a",
  steel: "#6f8f98"
};

function useIsMobileScene() {
  const viewport = useThree((state) => state.viewport);
  return viewport.width < 6;
}

function ReactorCore() {
  const core = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Mesh>(null);
  const shell = useRef<THREE.Mesh>(null);
  const isMobile = useIsMobileScene();
  const scale = isMobile ? 0.82 : 1;

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (core.current) {
      core.current.rotation.y = time * 0.18;
      core.current.rotation.x = Math.sin(time * 0.22) * 0.08;
    }
    if (inner.current) {
      inner.current.scale.setScalar(1 + Math.sin(time * 2.8) * 0.045);
      inner.current.rotation.z = -time * 0.36;
    }
    if (shell.current) {
      shell.current.rotation.y = -time * 0.12;
      shell.current.rotation.z = time * 0.07;
    }
  });

  return (
    <Float speed={1.2} rotationIntensity={0.1} floatIntensity={0.08}>
      <group ref={core} scale={scale}>
        <mesh ref={shell}>
          <icosahedronGeometry args={[1.05, 2]} />
          <meshPhysicalMaterial
            color="#9cebf4"
            emissive={COLORS.cyan}
            emissiveIntensity={0.22}
            metalness={0.28}
            roughness={0.12}
            transmission={0.45}
            thickness={0.42}
            transparent
            opacity={0.28}
          />
        </mesh>
        <mesh ref={inner}>
          <sphereGeometry args={[0.5, 64, 64]} />
          <meshStandardMaterial color="#eaffff" emissive={COLORS.cyanSoft} emissiveIntensity={2.25} roughness={0.1} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.82, 0.82, 0.045, 8, 1, true]} />
          <meshStandardMaterial color={COLORS.steel} emissive="#12333b" emissiveIntensity={0.65} metalness={0.9} roughness={0.22} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, Math.PI / 8]}>
          <cylinderGeometry args={[1.22, 1.22, 0.026, 12, 1, true]} />
          <meshStandardMaterial color="#294d56" emissive="#16414d" emissiveIntensity={0.7} metalness={0.86} roughness={0.18} />
        </mesh>
        <EngineVanes />
      </group>
    </Float>
  );
}

function EngineVanes() {
  const vanes = useMemo(() => Array.from({ length: 12 }, (_, index) => (index / 12) * Math.PI * 2), []);

  return (
    <group>
      {vanes.map((angle, index) => (
        <mesh
          key={angle}
          position={[Math.cos(angle) * 0.98, Math.sin(angle) * 0.98, 0]}
          rotation={[0, 0, angle + Math.PI / 2]}
        >
          <boxGeometry args={[0.05, index % 2 === 0 ? 0.52 : 0.38, 0.05]} />
          <meshStandardMaterial
            color={index % 2 === 0 ? COLORS.cyanSoft : COLORS.steel}
            emissive={index % 2 === 0 ? COLORS.cyan : "#1c3f48"}
            emissiveIntensity={index % 2 === 0 ? 1.7 : 0.7}
            metalness={0.72}
            roughness={0.2}
          />
        </mesh>
      ))}
    </group>
  );
}

type RingProps = {
  radius: number;
  color: string;
  speed: number;
  opacity: number;
  tilt: [number, number, number];
  segments?: number;
  tube?: number;
};

function PrecisionRing({ radius, color, speed, opacity, tilt, segments = 160, tube = 0.012 }: RingProps) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const time = state.clock.elapsedTime;
    ref.current.rotation.z = time * speed;
    ref.current.rotation.x = tilt[0] + Math.sin(time * 0.18) * 0.035;
    ref.current.rotation.y = tilt[1] + Math.cos(time * 0.14) * 0.035;
  });

  return (
    <mesh ref={ref} rotation={tilt}>
      <torusGeometry args={[radius, tube, 12, segments]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.3} transparent opacity={opacity} metalness={0.7} />
    </mesh>
  );
}

function HexFrame({ radius, color, speed, tilt }: { radius: number; color: string; speed: number; tilt: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);
  const points = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const angle = (index / 6) * Math.PI * 2 + Math.PI / 6;
      return new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
    });
  }, [radius]);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.z = state.clock.elapsedTime * speed;
  });

  return (
    <group ref={ref} rotation={tilt}>
      <Line points={points} color={color} transparent opacity={0.72} lineWidth={1.4} />
    </group>
  );
}

function ScanningSweep() {
  const ref = useRef<THREE.Group>(null);
  const arc = useMemo(() => {
    const points: THREE.Vector3[] = [];
    for (let index = 0; index <= 56; index += 1) {
      const angle = -0.55 + (index / 56) * 1.1;
      points.push(new THREE.Vector3(Math.cos(angle) * 2.95, Math.sin(angle) * 2.95, 0));
    }
    return points;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.z = state.clock.elapsedTime * 0.7;
  });

  return (
    <group ref={ref} rotation={[1.22, 0.15, 0]}>
      <Line points={arc} color={COLORS.cyanSoft} transparent opacity={0.8} lineWidth={2.4} />
      <Line points={arc.slice(18, 40)} color="#ffffff" transparent opacity={0.52} lineWidth={1.1} />
    </group>
  );
}

function DataParticles() {
  const points = useRef<THREE.Points>(null);
  const particles = useMemo(() => {
    const count = 1400;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const cyan = new THREE.Color(COLORS.cyan);
    const amber = new THREE.Color(COLORS.amber);
    const white = new THREE.Color("#f0fdff");

    for (let index = 0; index < count; index += 1) {
      const offset = index * 3;
      const radius = 1.9 + Math.random() * 3.9;
      const theta = Math.random() * Math.PI * 2;
      const band = (Math.random() - 0.5) * 0.78;
      positions[offset] = Math.cos(theta) * radius;
      positions[offset + 1] = Math.sin(theta) * radius * 0.58 + band;
      positions[offset + 2] = (Math.random() - 0.5) * 1.2;

      const color = Math.random() > 0.86 ? amber : Math.random() > 0.58 ? cyan : white;
      colors[offset] = color.r;
      colors[offset + 1] = color.g;
      colors[offset + 2] = color.b;
    }
    return { positions, colors };
  }, []);

  useFrame((state) => {
    if (!points.current) return;
    points.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.12) * 0.04;
    points.current.rotation.y = state.clock.elapsedTime * 0.025;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particles.positions.length / 3} array={particles.positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={particles.colors.length / 3} array={particles.colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.018} vertexColors transparent opacity={0.72} depthWrite={false} />
    </points>
  );
}

function EnergyConduits() {
  const conduits = useMemo(() => {
    return Array.from({ length: 20 }, (_, index) => {
      const angle = (index / 20) * Math.PI * 2;
      const inner = 0.9 + (index % 3) * 0.1;
      const outer = 3.5 + (index % 4) * 0.18;
      return [
        new THREE.Vector3(Math.cos(angle) * inner, Math.sin(angle) * inner * 0.62, 0.02),
        new THREE.Vector3(Math.cos(angle) * outer, Math.sin(angle) * outer * 0.62, -0.18)
      ] as [THREE.Vector3, THREE.Vector3];
    });
  }, []);

  return (
    <group>
      {conduits.map((points, index) => (
        <Line
          key={index}
          points={points}
          color={index % 4 === 0 ? COLORS.amber : COLORS.cyan}
          transparent
          opacity={index % 4 === 0 ? 0.22 : 0.16}
          lineWidth={0.8}
        />
      ))}
    </group>
  );
}

function SourceNode({ angle, label, color, trust }: { angle: number; label: string; color: string; trust: string }) {
  const ref = useRef<THREE.Group>(null);
  const isMobile = useIsMobileScene();
  const radius = isMobile ? 1.08 : 2.18;
  const position: [number, number, number] = [Math.cos(angle) * radius, Math.sin(angle) * radius * (isMobile ? 0.52 : 0.58), 0.08];
  const displayLabel = isMobile ? label.split(" ")[0] : label;

  useFrame((state) => {
    if (!ref.current) return;
    const time = state.clock.elapsedTime;
    ref.current.position.z = 0.08 + Math.sin(time * 1.7 + angle) * 0.08;
    ref.current.scale.setScalar(1 + Math.sin(time * 2.2 + angle) * 0.035);
  });

  return (
    <group ref={ref} position={position}>
      <mesh>
        <sphereGeometry args={[0.09, 32, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.8} roughness={0.16} />
      </mesh>
      <mesh>
        <ringGeometry args={[0.13, 0.18, 36]} />
        <meshBasicMaterial color={color} transparent opacity={0.42} side={THREE.DoubleSide} />
      </mesh>
      {!isMobile && (
        <Html center distanceFactor={9} position={[0, 0.26, 0]}>
          <div className="min-w-[62px] rounded-md border border-cyan-200/15 bg-black/55 px-1.5 py-1 shadow-[0_0_22px_rgba(55,225,255,0.16)] backdrop-blur">
            <div className="text-[9px] font-semibold uppercase leading-none text-white/90">{displayLabel}</div>
            <div className="mt-1 text-[9px] font-medium leading-none text-cyan-100/55">{trust}</div>
          </div>
        </Html>
      )}
    </group>
  );
}

function SourceNetwork() {
  return (
    <group>
      <SourceNode angle={0.08} label="RSS Mesh" trust="official" color={COLORS.cyan} />
      <SourceNode angle={1.05} label="GDELT" trust="public" color={COLORS.emerald} />
      <SourceNode angle={2.08} label="HN Signal" trust="social" color={COLORS.amber} />
      <SourceNode angle={3.16} label="Gov Wire" trust="verified" color={COLORS.rose} />
      <SourceNode angle={4.18} label="Cinema" trust="reputed" color="#c084fc" />
      <SourceNode angle={5.2} label="Video" trust="optional" color="#eafcff" />
    </group>
  );
}

function CameraRig() {
  const { camera, pointer } = useThree();

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointer.x * 0.22, 0.04);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0.08 + pointer.y * 0.14 + Math.sin(time * 0.12) * 0.04, 0.04);
    camera.lookAt(0, 0, 0);
  });

  return null;
}

function ReactorAssembly() {
  const isMobile = useIsMobileScene();
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!group.current) return;
    group.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.08) * 0.025;
  });

  return (
    <group ref={group} scale={isMobile ? 0.82 : 1}>
      <DataParticles />
      <EnergyConduits />
      <HexFrame radius={1.62} color={COLORS.cyanSoft} speed={0.08} tilt={[1.18, 0.18, 0.1]} />
      <HexFrame radius={2.42} color={COLORS.amber} speed={-0.045} tilt={[0.62, 0.95, 0.42]} />
      <PrecisionRing radius={1.55} tube={0.016} color={COLORS.cyanSoft} speed={0.32} opacity={0.88} tilt={[1.18, 0.2, 0.1]} />
      <PrecisionRing radius={2.02} color={COLORS.emerald} speed={-0.18} opacity={0.62} tilt={[0.35, 1.06, 0.62]} />
      <PrecisionRing radius={2.48} color={COLORS.amber} speed={0.12} opacity={0.68} tilt={[1.78, 0.48, 0.9]} />
      <PrecisionRing radius={2.86} color={COLORS.cyan} speed={-0.08} opacity={0.26} tilt={[1.32, -0.72, -0.2]} tube={0.008} />
      <ScanningSweep />
      <ReactorCore />
      <SourceNetwork />
    </group>
  );
}

function ReactorLights() {
  return (
    <>
      <ambientLight intensity={0.26} />
      <pointLight position={[0, 0, 2.2]} color={COLORS.cyanSoft} intensity={4.8} distance={7} />
      <pointLight position={[2.6, 1.8, 3.8]} color={COLORS.cyan} intensity={5.6} distance={9} />
      <pointLight position={[-3.4, -2.4, 2.8]} color={COLORS.amber} intensity={2.4} distance={8} />
      <spotLight position={[0, 4.2, 5.6]} angle={0.38} penumbra={0.7} color="#f8feff" intensity={1.8} />
    </>
  );
}

function CorePostProcessing() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom intensity={0.96} luminanceThreshold={0.2} luminanceSmoothing={0.46} mipmapBlur />
      <Vignette eskil={false} offset={0.16} darkness={0.72} />
    </EffectComposer>
  );
}

export function IntelligenceCoreScene() {
  return (
    <div className="relative h-full min-h-[360px] w-full overflow-hidden rounded-none">
      <div className="core-grid absolute inset-0 opacity-90" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(55,225,255,0.15),transparent_36%),radial-gradient(circle_at_50%_78%,rgba(246,183,60,0.08),transparent_36%)]" />
      <Canvas
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        dpr={[1, 1.75]}
        shadows
        className="relative z-10"
        fallback={<CoreSceneFallback />}
      >
        <PerspectiveCamera makeDefault position={[0, 0.06, 7.4]} fov={42} />
        <color attach="background" args={["#03070a"]} />
        <fog attach="fog" args={["#03070a", 6.8, 12.5]} />
        <CameraRig />
        <ReactorLights />
        <Suspense fallback={null}>
          <Stars radius={18} depth={18} count={1500} factor={2.4} saturation={0} fade speed={0.26} />
          <ReactorAssembly />
          <CorePostProcessing />
        </Suspense>
      </Canvas>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-32 bg-gradient-to-t from-background via-background/55 to-transparent" />
    </div>
  );
}

function CoreSceneFallback() {
  return (
    <div className="relative z-10 grid h-full min-h-[440px] place-items-center bg-black">
      <div className="relative grid h-72 w-72 place-items-center">
        <div className="absolute inset-0 rotate-45 border border-cyan-core/50 shadow-neon" />
        <div className="absolute inset-7 rounded-full border border-emerald-core/50 shadow-neon" />
        <div className="absolute inset-14 rotate-12 border border-amber-core/60 shadow-neon" />
        <div className="absolute inset-24 rounded-full bg-cyan-core/30 blur-xl" />
        <div className="h-24 w-24 rounded-full border border-cyan-core/60 bg-cyan-core/20 shadow-neon-strong" />
      </div>
    </div>
  );
}
