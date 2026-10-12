import React, { useState } from "react";
import { Cpu, Layers, CheckSquare, Square, RefreshCw, HardDrive, Zap } from "lucide-react";
import {
  TECH_STACK_MATRIX,
  IMPLEMENTATION_ROADMAP,
  AuraFileEntity,
  AuraPackageManifest,
} from "../data/auraData";

interface AuraArchitectureViewProps {
  files: AuraFileEntity[];
  packages: AuraPackageManifest[];
}

export const AuraArchitectureView: React.FC<AuraArchitectureViewProps> = ({
  files,
  packages,
}) => {
  const [roadmap, setRoadmap] = useState(IMPLEMENTATION_ROADMAP);
  const [selectedLayer, setSelectedLayer] = useState<"user" | "core" | "kernel" | "wasm">("wasm");
  const [swCacheReady, setSwCacheReady] = useState(true);
  const [bootSequenceLog, setBootSequenceLog] = useState<string[]>([
    "[0.000s] PWA Service Worker: Verified offline cache (WASM kernel + 4.48GB Q4_K_M GGUF shard)",
    "[0.112s] CheerpX x86-to-WASM JIT Engine: Initialized virtual MMU & DRM-KMS WebGL surface",
    "[0.245s] WebWorker 2 (aurafs): Mounted SQLite 3.46 WASM over Origin Private File System (OPFS)",
    "[0.418s] WebWorker 1 (aurash): Bound WebGPU compute pipeline for llama.cpp SIMD inference",
    "[0.449s] runit stage-2: Aura-Web ready (Zero server dependencies active)",
  ]);

  const toggleRoadmapTask = (phaseIdx: number, taskId: string) => {
    setRoadmap((prev) =>
      prev.map((phase, idx) => {
        if (idx !== phaseIdx) return phase;
        return {
          ...phase,
          tasks: phase.tasks.map((t) =>
            t.id === taskId ? { ...t, completed: !t.completed } : t
          ),
        };
      })
    );
  };

  const triggerWasmColdBoot = () => {
    setBootSequenceLog([
      `[0.000s] Cold Boot Initiated at ${new Date().toISOString().slice(11, 19)} UTC...`,
      `[0.094s] CheerpX JIT: Compiling x86 ELF page tables to WebAssembly SIMD opcodes`,
      `[0.210s] WebWorker 2 (aurafs): Restored ${files.length} JSON1 documents from browser OPFS + IndexedDB`,
      `[0.330s] /aurastore/pkg: Verified ${packages.filter((p) => p.installed).length} mounted .apkx CAS bundles`,
      `[0.442s] WebWorker 1 (aurash): Qwen-2.5-7B-Q4_K_M ready on WebGPU thread. System nominal.`,
    ]);
  };

  const totalTasks = roadmap.reduce((acc, p) => acc + p.tasks.length, 0);
  const completedTasks = roadmap.reduce(
    (acc, p) => acc + p.tasks.filter((t) => t.completed).length,
    0
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="text-xs text-slate-400 flex items-center gap-2 mb-1">
            <span>Component 4 & System Blueprint</span>
            <span aria-hidden="true">·</span>
            <span>CheerpX JIT + WebGPU + OPFS + Service Worker PWA</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            Aura-Web Runtime & System Architecture Blueprint
          </h1>
        </div>

        <div className="flex items-center gap-3 self-start lg:self-auto">
          <button
            type="button"
            onClick={() => setSwCacheReady(!swCacheReady)}
            className="px-3.5 py-2 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            PWA Offline Cache: {swCacheReady ? "Pinned (4.54 GB)" : "Re-validating"}
          </button>
          <button
            type="button"
            onClick={triggerWasmColdBoot}
            className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Simulate CheerpX WASM Boot</span>
          </button>
        </div>
      </div>

      {/* Section 1: Interactive 3-Tier Architecture + Browser Tab (PWA) Runtime Inspector */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* Left 7 cols: Interactive System Architecture Stack */}
        <div className="xl:col-span-7 bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                1. System Architecture & Browser Tab (PWA) Stack
              </h2>
              <p className="text-xs text-slate-400">
                Select any architectural layer below to inspect its runtime bindings
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {(["wasm", "user", "core", "kernel"] as const).map((layer) => (
                <button
                  key={layer}
                  type="button"
                  onClick={() => setSelectedLayer(layer)}
                  className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                    selectedLayer === layer
                      ? "bg-amber-500 text-slate-950 font-semibold"
                      : "bg-slate-900 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {layer.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Architectural Layers Diagram */}
          <div className="space-y-3 font-mono text-xs">
            {/* Layer A: USER LAYER */}
            <div
              onClick={() => setSelectedLayer("user")}
              className={`p-3.5 rounded-lg border cursor-pointer transition-colors ${
                selectedLayer === "user"
                  ? "bg-amber-500/10 border-amber-500/60"
                  : "bg-[#080B11] border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between text-slate-300 font-semibold mb-2">
                <span>USER LAYER</span>
                <span className="text-[11px] text-amber-400">Interactive Shell & WebGL UI</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                <div className="p-2 bg-slate-900/90 rounded border border-slate-800 text-slate-200">
                  Natural Language Shell (AuraShell / aurash)
                </div>
                <div className="p-2 bg-slate-900/90 rounded border border-slate-800 text-slate-200">
                  Web Browser UI (Offline PWA Client)
                </div>
                <div className="p-2 bg-slate-900/90 rounded border border-slate-800 text-slate-200">
                  WebAssembly / CheerpX JIT Engine
                </div>
              </div>
            </div>

            {/* Layer B: OS CORE SERVICES */}
            <div
              onClick={() => setSelectedLayer("core")}
              className={`p-3.5 rounded-lg border cursor-pointer transition-colors ${
                selectedLayer === "core"
                  ? "bg-amber-500/10 border-amber-500/60"
                  : "bg-[#080B11] border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between text-slate-300 font-semibold mb-2">
                <span>OS CORE SERVICES</span>
                <span className="text-[11px] text-emerald-400">WebWorkers & Daemons</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                <div className="p-2 bg-slate-900/90 rounded border border-slate-800 text-slate-200">
                  Local LLM Core (llama.cpp / WASM SIMD)
                </div>
                <div className="p-2 bg-slate-900/90 rounded border border-slate-800 text-slate-200">
                  JSON File System (SQLite DB + FUSE)
                </div>
                <div className="p-2 bg-slate-900/90 rounded border border-slate-800 text-slate-200">
                  Package Manager (AuraPkg / CAS)
                </div>
              </div>
            </div>

            {/* Layer C: BASE LINUX OS KERNEL & BROWSER VIRTUALIZATION */}
            <div
              onClick={() => setSelectedLayer("wasm")}
              className={`p-3.5 rounded-lg border cursor-pointer transition-colors ${
                selectedLayer === "wasm" || selectedLayer === "kernel"
                  ? "bg-amber-500/10 border-amber-500/60"
                  : "bg-[#080B11] border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between text-slate-300 font-semibold mb-2">
                <span>BASE LINUX KERNEL & BROWSER PWA THREADS</span>
                <span className="text-[11px] text-sky-400">runit init · DRM-KMS · OPFS</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 bg-slate-900/90 rounded border border-slate-800 text-slate-200">
                  WebWorker 1: aurash (WebGPU / WASM SIMD GGUF)
                </div>
                <div className="p-2 bg-slate-900/90 rounded border border-slate-800 text-slate-200">
                  WebWorker 2: aurafs DB Engine (SQLite WASM + OPFS)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 5 cols: Aura-Web Live Worker & OPFS Telemetry */}
        <div className="xl:col-span-5 bg-[#111827] border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="border-b border-slate-800 pb-3">
              <div className="text-xs text-slate-400 font-mono">
                Component 4 · Zero-Server Browser Execution
              </div>
              <h2 className="text-base font-bold text-slate-100 mt-0.5">
                {selectedLayer === "user" && "User Layer: xterm.js & Hybrid Shell"}
                {selectedLayer === "core" && "Core Services: LLM, SQLite JSON1 & CAS"}
                {selectedLayer === "kernel" && "Base Kernel: Custom Linux + runit Init"}
                {selectedLayer === "wasm" && "Aura-Web: CheerpX JIT & WebWorker Bridge"}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 bg-[#080B11] border border-slate-800 rounded-lg">
                <div className="text-slate-400 text-[11px]">WebWorker 1 (aurash)</div>
                <div className="text-sm font-bold text-amber-400 mt-0.5 tabular-nums">
                  WebGPU + SIMD128
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Qwen-2.5-7B Q4_K_M</div>
              </div>
              <div className="p-3 bg-[#080B11] border border-slate-800 rounded-lg">
                <div className="text-slate-400 text-[11px]">WebWorker 2 (aurafs)</div>
                <div className="text-sm font-bold text-emerald-400 mt-0.5 tabular-nums">
                  SQLite WASM + OPFS
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {files.length} Active JSON Nodes
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-slate-300">
                CheerpX / runit Boot Sequence Log
              </div>
              <pre className="p-3.5 bg-[#080B11] border border-slate-800 rounded-lg text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed space-y-1">
                {bootSequenceLog.join("\n")}
              </pre>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Origin Private File System (OPFS)</span>
            <span className="font-mono text-emerald-400">SYNCHRONOUS VFS LOCKED</span>
          </div>
        </div>
      </div>

      {/* Section 2: Technology Stack Matrix */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-100">
              3. Technology Stack Matrix
            </h2>
            <p className="text-xs text-slate-400">
              Complete subsystem specification across native Linux DRM-KMS and browser WebAssembly targets
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">5 Core Subsystems</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-medium text-slate-400 bg-slate-900/60">
                <th className="py-3 px-4">Subsystem</th>
                <th className="py-3 px-4">Core Technologies & Runtime</th>
                <th className="py-3 px-4">Language</th>
                <th className="py-3 px-4">Data Format / Storage</th>
                <th className="py-3 px-4">Architectural Implementation Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-xs">
              {TECH_STACK_MATRIX.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-100 whitespace-nowrap">
                    {row.subsystem}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-amber-300">
                    {row.technologies}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-300 whitespace-nowrap">
                    {row.language}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-emerald-300">
                    {row.storageFormat}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">
                    {row.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Interactive 4-Phase Implementation Roadmap */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-100">
              4. Interactive Implementation Roadmap
            </h2>
            <p className="text-xs text-slate-400">
              Toggle engineering milestones across Phases 1–4 to track AuraOS build completion
            </p>
          </div>
          <div className="text-xs font-mono text-slate-300 tabular-nums">
            Milestones Completed: <strong className="text-amber-400">{completedTasks}</strong> /{" "}
            {totalTasks} ({Math.round((completedTasks / totalTasks) * 100)}%)
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roadmap.map((phase, phaseIdx) => (
            <div
              key={phase.phase}
              className="bg-[#111827] border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-slate-100">{phase.phase}</h3>
                  <span className="text-xs font-mono text-slate-400">{phase.targetWindow}</span>
                </div>

                <div className="space-y-2.5">
                  {phase.tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => toggleRoadmapTask(phaseIdx, task.id)}
                      className="p-3 bg-[#080B11] hover:bg-slate-900 border border-slate-800 rounded-lg cursor-pointer transition-colors flex items-start gap-3"
                    >
                      {task.completed ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                      )}
                      <div className="space-y-1">
                        <div
                          className={`text-xs font-medium ${
                            task.completed ? "text-slate-100" : "text-slate-300"
                          }`}
                        >
                          {task.title}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500">
                          Deliverable: {task.deliverable}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono tabular-nums">
                <span>
                  Phase Status:{" "}
                  {phase.tasks.every((t) => t.completed) ? (
                    <strong className="text-emerald-400">COMPLETE</strong>
                  ) : (
                    <strong className="text-amber-400">IN PROGRESS</strong>
                  )}
                </span>
                <span>
                  {phase.tasks.filter((t) => t.completed).length}/{phase.tasks.length} tasks
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
