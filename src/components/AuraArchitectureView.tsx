import React, { useState } from "react";
import {
  Cpu,
  CheckSquare,
  Square,
  RefreshCw,
  BookOpen,
  Copy,
  Check,
  FileText,
  Terminal,
} from "lucide-react";
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

const README_MARKDOWN = `# AuraOS — The Cinematic Multimedia Linux & WebAssembly OS

Author: Dr. Anil K (Kumar) Bheemaiah — Synergy Robotics
License: MIT License

AuraOS is a lightweight, local-first multimedia Linux distribution and zero-server WebAssembly workstation engineered for film colorists, broadcast audio engineers, media pipeline architects, and air-gapped creative studios.

## 1. System Architecture Overview

+-----------------------------------------------------------------------+
|                             USER LAYER                                |
|  +--------------------+  +-------------------+  +-------------------+ |
|  | Natural Language   |  | Web Browser UI    |  | WebAssembly /     | |
|  | Shell (AuraShell)  |  | (Offline Client)  |  | CheerpX Engine    | |
|  +---------+----------+  +---------+---------+  +---------+---------+ |
+------------|-----------------------|--------------------|-------------+
             |                       |                    |
+------------v-----------------------v--------------------v-------------+
|                             OS CORE SERVICES                          |
|  +--------------------+  +-------------------+  +-------------------+ |
|  | Local LLM Core     |  | JSON File System  |  | Package Manager   | |
|  | (llama.cpp / WASM) |  | (SQLite DB Store) |  | (AuraPkg / Content| |
|  |                    |  |                   |  | Addressable)      | |
|  +--------------------+  +-------------------+  +-------------------+ |
+-----------------------------------------------------------------------+
|                         BASE LINUX OS KERNEL                          |
|  Custom Linux Kernel / systemd-less init (runit or s6) / DRM-KMS      |
+-----------------------------------------------------------------------+

## 2. Multimedia Studio Capabilities

- Sub-Millisecond Low-Jitter Kernel: Custom Linux 6.11 kernel with PREEMPT_DYNAMIC, runit stage-1/2 init (<450ms cold boot), and direct DRM-KMS 10-bit HDR framebuffer rendering.
- Natural Language Media Pipelines (aurash): Express complex multi-stream ffmpeg, sox, and zstd transcoding jobs in plain English.
- Semantic Media Asset Management (aurafs): Every video clip, audio stem, and project file is indexed in an embedded SQLite (JSON1 + FTS5) database with 384-d vector embeddings while remaining 100% POSIX-compatible via a Rust FUSE daemon.
- Reproducible Studio Toolchains (aurapkg): Content-addressable .apkx bundles lock exact SHA-256 binary trees (ffmpeg-6.1.1, libavcodec, pipewire-dsp) and ship with quantized LoRA micro-tool prompt bindings.
- Zero-Server Browser Workstation (Aura-Web): Boot the entire multimedia Linux environment inside any modern browser tab via CheerpX x86-to-WASM JIT, WebGPU compute shaders, and Origin Private File System (OPFS) block storage.

## 3. MIT License

Copyright (c) 2026 Dr. Anil K (Kumar) Bheemaiah, Synergy Robotics

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;

export const AuraArchitectureView: React.FC<AuraArchitectureViewProps> = ({
  files,
  packages,
}) => {
  const [docSection, setDocSection] = useState<"architecture" | "readme" | "cli">("architecture");
  const [roadmap, setRoadmap] = useState(IMPLEMENTATION_ROADMAP);
  const [selectedLayer, setSelectedLayer] = useState<"user" | "core" | "kernel" | "wasm">("wasm");
  const [swCacheReady, setSwCacheReady] = useState(true);
  const [copiedReadme, setCopiedReadme] = useState(false);
  const [bootSequenceLog, setBootSequenceLog] = useState<string[]>([
    "[0.000s] PWA Service Worker: Verified offline cache (WASM kernel + 4.48GB Q4_K_M GGUF shard)",
    "[0.112s] CheerpX x86-to-WASM JIT Engine: Initialized virtual MMU & DRM-KMS WebGL surface",
    "[0.245s] WebWorker 2 (aurafs): Mounted SQLite 3.46 WASM over Origin Private File System (OPFS)",
    "[0.418s] WebWorker 1 (aurash): Bound WebGPU compute pipeline for llama.cpp SIMD inference",
    "[0.449s] runit stage-2: Aura-Web Multimedia Workstation ready (Zero server dependencies)",
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

  const handleCopyReadme = () => {
    navigator.clipboard.writeText(README_MARKDOWN);
    setCopiedReadme(true);
    setTimeout(() => setCopiedReadme(false), 1800);
  };

  const totalTasks = roadmap.reduce((acc, p) => acc + p.tasks.length, 0);
  const completedTasks = roadmap.reduce(
    (acc, p) => acc + p.tasks.filter((t) => t.completed).length,
    0
  );

  return (
    <div className="space-y-8">
      {/* Header & Documentation Sub-Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="text-xs text-slate-400 flex items-center gap-2 mb-1">
            <span>Documentation &amp; System Blueprint</span>
            <span aria-hidden="true">·</span>
            <span>CheerpX JIT + WebGPU + OPFS + Multimedia DSP</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            AuraOS Architecture, Documentation &amp; README
          </h1>
        </div>

        {/* Interactive Sub-Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => setDocSection("architecture")}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                docSection === "architecture"
                  ? "bg-amber-500 text-slate-950 font-semibold"
                  : "text-slate-400 hover:text-slate-100"
              }`}
            >
              System Blueprint &amp; Roadmap
            </button>
            <button
              type="button"
              onClick={() => setDocSection("readme")}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                docSection === "readme"
                  ? "bg-amber-500 text-slate-950 font-semibold"
                  : "text-slate-400 hover:text-slate-100"
              }`}
            >
              README.md
            </button>
            <button
              type="button"
              onClick={() => setDocSection("cli")}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                docSection === "cli"
                  ? "bg-amber-500 text-slate-950 font-semibold"
                  : "text-slate-400 hover:text-slate-100"
              }`}
            >
              Multimedia CLI Manual
            </button>
          </div>
        </div>
      </div>

      {docSection === "readme" && (
        <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900/80 border-b border-slate-800">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-200">
              <FileText className="w-4 h-4 text-amber-400" />
              <span>/README.md — Repository Documentation</span>
            </div>
            <button
              type="button"
              onClick={handleCopyReadme}
              className="px-3 py-1.5 text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md flex items-center gap-1.5 transition-colors"
            >
              {copiedReadme ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied README.md</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Markdown</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-6 bg-[#080B11] text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed overflow-x-auto">
            {README_MARKDOWN}
          </pre>
        </div>
      )}

      {docSection === "cli" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
              <Terminal className="w-4 h-4" />
              <span>MANUAL 01 · AURASH MULTIMEDIA INTENT SHELL</span>
            </div>
            <h2 className="text-base font-bold text-slate-100">
              Hybrid Natural Language &amp; POSIX Command Syntax
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              <code className="font-mono text-amber-300">aurash</code> operates in two modes: Direct
              Command Mode for zero-latency POSIX pipelines and Intent Execution Mode backed by
              local <code className="font-mono">llama.cpp</code> with grammar-constrained JSON output.
            </p>
            <pre className="p-4 bg-[#080B11] border border-slate-800 rounded-lg text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
{`# 1. Extract 48kHz broadcast audio stem via FFmpeg LoRA binding
aurash[intent]> extract mp3 audio from demo_session.mp4 using ffmpeg
→ ffmpeg -i /media/demo_session.mp4 -vn -acodec libmp3lame /media/demo_audio.mp3

# 2. Compress studio production logs modified last week
aurash[intent]> compress all logs modified last week into logs.tar.gz
→ aurafs query --where "mime_type == 'text/plain'" --exec "tar -czf logs.tar.gz"`}
            </pre>
          </div>

          <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <BookOpen className="w-4 h-4" />
              <span>MANUAL 02 · AURAFS &amp; AURAPKG REFERENCE</span>
            </div>
            <h2 className="text-base font-bold text-slate-100">
              Structured SQLite JSON1 Queries &amp; Content-Addressable Bundles
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Query studio takes, scripts, and audio stems by custom metadata attributes or verify
              cryptographically signed <code className="font-mono">.apkx</code> package trees.
            </p>
            <pre className="p-4 bg-[#080B11] border border-slate-800 rounded-lg text-xs font-mono text-amber-300 overflow-x-auto leading-relaxed">
{`# Query JSON attributes in SQLite + FUSE filesystem
aurafs query --where "attributes.project == 'AuraOS' AND modified_at > '2026-01-01'"

# Full-Text Search (FTS5) across document summaries & transcripts
aurafs query --fts "DRM-KMS framebuffer"

# Verify ed25519 signature & SHA-256 Merkle hash of ffmpeg bundle
aurapkg verify ffmpeg`}
            </pre>
          </div>
        </div>
      )}

      {docSection === "architecture" && (
        <>
          {/* Runtime Simulation Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#111827] border border-slate-800 rounded-xl">
            <div className="text-xs text-slate-300">
              <strong>Aura-Web Browser Virtualization Engine:</strong> CheerpX x86-to-WASM JIT +
              WebWorker Thread Isolation
            </div>
            <div className="flex items-center gap-3">
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
                    1. System Architecture &amp; Browser Tab (PWA) Stack
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
                    <span className="text-[11px] text-amber-400">Interactive Shell &amp; WebGL UI</span>
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
                    <span className="text-[11px] text-emerald-400">WebWorkers &amp; Daemons</span>
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
                    <span>BASE LINUX KERNEL &amp; BROWSER PWA THREADS</span>
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
                    <th className="py-3 px-4">Core Technologies &amp; Runtime</th>
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
        </>
      )}
    </div>
  );
};
