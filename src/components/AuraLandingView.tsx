import React, { useState } from "react";
import {
  Terminal,
  Database,
  Package,
  Cpu,
  Play,
  BookOpen,
  Film,
  Music,
  ShieldCheck,
  HardDrive,
  ArrowRight,
  CheckCircle2,
  GitBranch,
} from "lucide-react";

interface AuraLandingViewProps {
  onNavigateTab: (tab: "aurash" | "aurafs" | "aurapkg" | "docs") => void;
  onOpenGitHubModal: () => void;
}

export const AuraLandingView: React.FC<AuraLandingViewProps> = ({
  onNavigateTab,
  onOpenGitHubModal,
}) => {
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [pipelineImgFailed, setPipelineImgFailed] = useState(false);
  const [wasmImgFailed, setWasmImgFailed] = useState(false);

  return (
    <div className="space-y-16 pb-12">
      {/* 1. Cinematic Hero Section (Split 12-Col Layout + Full-Width Telemetry Strip Below) */}
      <section className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left 6 cols: Editorial Proposition */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-6 py-2">
            <div className="space-y-5">
              {/* Quiet Unboxed Kicker (Zero-Pill Discipline) */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-amber-400 font-mono">
                <span>AURAOS 6.11 LTS</span>
                <span aria-hidden="true">·</span>
                <span>LOCAL-FIRST MULTIMEDIA LINUX</span>
                <span aria-hidden="true">·</span>
                <span>WASM &amp; NATIVE DRM-KMS</span>
              </div>

              <h1
                className="font-bold tracking-tight text-slate-100 leading-[1.08]"
                style={{ fontSize: "clamp(2.25rem, 3.8vw, 3.5rem)", textWrap: "balance" }}
              >
                The Cinematic Linux Distribution for Local-First Media &amp; AI Pipelines.
              </h1>

              <p className="text-base text-slate-300 leading-relaxed max-w-[65ch]">
                Engineered for mastering studios, color grading suites, and air-gapped creative
                workstations. AuraOS unites a sub-millisecond <code className="font-mono text-amber-300">runit</code>{" "}
                Linux kernel with an offline <code className="font-mono text-amber-300">llama.cpp</code> natural
                language shell, a queryable SQLite JSON media file system, and a zero-server
                WebAssembly browser runtime.
              </p>
            </div>

            {/* Single Primary CTA + Quiet Secondary Links */}
            <div className="space-y-5 pt-2">
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => onNavigateTab("aurash")}
                  className="px-6 py-3.5 text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>Launch Interactive AuraShell</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateTab("docs")}
                  className="px-5 py-3.5 text-sm font-medium text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
                >
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <span>Read Architecture &amp; README</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span>Authored by Dr. Anil K (Kumar) Bheemaiah · Synergy Robotics</span>
                <span aria-hidden="true">·</span>
                <span>MIT License</span>
                <span aria-hidden="true">·</span>
                <span>100% Offline OPFS Persistence</span>
              </div>
            </div>
          </div>

          {/* Right 6 cols: Cinematic 16:9 Studio Hero Visual */}
          <div className="lg:col-span-6 flex">
            <div className="relative w-full rounded-xl overflow-hidden border border-slate-800 bg-[#080B11] flex flex-col justify-end min-h-[340px]">
              {!heroImgFailed ? (
                <img
                  src="/src/assets/images/hero_multimedia_linux_1791783370040.jpg"
                  alt="AuraOS Cinematic Multimedia Linux Mastering Console and Acoustic Spectrogram Suite"
                  referrerPolicy="no-referrer"
                  onError={() => setHeroImgFailed(true)}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/30 flex items-center justify-center">
                  <Film className="w-16 h-16 text-amber-400/40" />
                </div>
              )}

              {/* Measured Contrast Scrim */}
              <div className="relative z-10 bg-gradient-to-t from-black/90 via-black/55 to-transparent p-6 pt-20 space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-amber-300">
                  <span>DRM-KMS 10-BIT HDR PIPELINE</span>
                  <span aria-hidden="true">·</span>
                  <span>PIPEWIRE LOW-LATENCY DSP</span>
                </div>
                <p className="text-sm text-slate-200 font-medium">
                  Direct hardware framebuffer and WebGPU compute shaders for real-time 8K color
                  scopes, multi-track spectral mastering, and local LLM media automation.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width 4-Column Quantitative Proof & Benchmark Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-800/80">
          <div className="p-4 bg-[#111827] border border-slate-800 rounded-xl space-y-1">
            <div className="text-xs text-slate-400">Cold Boot to DRM-KMS Framebuffer</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-100">
              442 ms
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              runit stage-1/2 · Zero systemd overhead
            </div>
          </div>

          <div className="p-4 bg-[#111827] border border-slate-800 rounded-xl space-y-1">
            <div className="text-xs text-slate-400">Audio/Video DSP Scheduling Jitter</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400">
              &lt; 0.18 ms
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Linux 6.11 PREEMPT_DYNAMIC · 96kHz/24-bit
            </div>
          </div>

          <div className="p-4 bg-[#111827] border border-slate-800 rounded-xl space-y-1">
            <div className="text-xs text-slate-400">Offline LLM Footprint (Q4_K_M)</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-amber-400">
              4.48 GiB
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Qwen-2.5-7B / Llama-3-8B · GBNF JSON Mode
            </div>
          </div>

          <div className="p-4 bg-[#111827] border border-slate-800 rounded-xl space-y-1">
            <div className="text-xs text-slate-400">SQLite JSON1 + FTS5 Asset Lookup</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-100">
              1.2 ms
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              384-d cosine vector + FUSE POSIX bridge
            </div>
          </div>
        </div>
      </section>

      {/* 2. Asymmetric Bento-Grid: Core Multimedia OS Architecture */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="text-xs text-slate-400 mb-1">
              Four-Pillar Operating System Architecture
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-100">
              Built From the Kernel Up for Autonomous Media Engineering
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-md">
            Click any subsystem below to open its live interactive simulator in the AuraOS
            workbench.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Card 01 (Span 7): AuraShell Multimedia Intent Engine */}
          <div className="lg:col-span-7 bg-[#111827] border border-slate-800 rounded-xl p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono text-amber-400">01. Offline LLM Hybrid Shell (aurash)</span>
                <span className="font-mono">llama.cpp · Vulkan · WebGPU</span>
              </div>
              <h3 className="text-xl font-bold text-slate-100">
                Natural Language FFmpeg &amp; Studio Pipeline Automation with Deterministic Safety
                Interlocks
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Replace brittle bash scripts with plain-English studio intents. Tell{" "}
                <code className="font-mono text-amber-300">aurash</code> to{" "}
                <em>&quot;extract 48kHz stereo stems from demo_session.mp4&quot;</em> or{" "}
                <em>&quot;archive last week&apos;s render logs into logs.tar.gz&quot;</em>. The local LLM
                receives your current directory schema and installed LoRA prompt adapters, outputs
                grammar-constrained JSON, and pauses for <code className="font-mono text-emerald-300">[Y/n]</code>{" "}
                confirmation before any state-altering write.
              </p>

              <div className="p-3.5 bg-[#080B11] border border-slate-800 rounded-lg font-mono text-xs space-y-1.5">
                <div className="text-slate-400">
                  aurash[intent]&gt; extract mp3 audio from demo_session.mp4 using ffmpeg
                </div>
                <div className="text-emerald-300">
                  → ffmpeg -i /media/demo_session.mp4 -vn -acodec libmp3lame /media/demo_audio.mp3
                </div>
                <div className="text-[11px] text-amber-400">
                  Risk Score: Medium · LoRA Adapter: ffmpeg:extract_audio · Requires Confirmation [Y/n]
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
              <span className="text-xs text-slate-400">
                Zero cloud API dependencies in native/WASM mode
              </span>
              <button
                type="button"
                onClick={() => onNavigateTab("aurash")}
                className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 whitespace-nowrap"
              >
                <span>Open AuraShell Terminal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 02 (Span 5): Broadcast Hardware & LoRA Package Store */}
          <div className="lg:col-span-5 bg-[#111827] border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between">
            <div className="relative h-48 bg-[#080B11] border-b border-slate-800">
              {!pipelineImgFailed ? (
                <img
                  src="/src/assets/images/multimedia_pipeline_studio_1791783382927.jpg"
                  alt="High-precision broadcast audio-visual DSP processor unit"
                  referrerPolicy="no-referrer"
                  onError={() => setPipelineImgFailed(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-900">
                  <Music className="w-10 h-10 text-amber-400/40" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-transparent" />
            </div>

            <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="text-xs font-mono text-amber-400">
                  02. Content-Addressable Media Packages (aurapkg)
                </div>
                <h3 className="text-lg font-bold text-slate-100">
                  Immutable Studio Toolchains with Bundled LoRA Adapters
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Every <code className="font-mono text-slate-200">.apkx</code> package mounts into{" "}
                  <code className="font-mono text-slate-200">/aurastore/pkg/&lt;sha256&gt;</code>{" "}
                  verified by <code className="font-mono text-slate-200">ed25519</code> signatures,
                  syncing across air-gapped studio rooms via mDNS + Wi-Fi Direct.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">ffmpeg-6.1.1.apkx</span>
                <button
                  type="button"
                  onClick={() => onNavigateTab("aurapkg")}
                  className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 whitespace-nowrap"
                >
                  <span>Inspect Package Store</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Card 03 (Span 5): WebAssembly Browser Workstation */}
          <div className="lg:col-span-5 bg-[#111827] border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between">
            <div className="relative h-48 bg-[#080B11] border-b border-slate-800">
              {!wasmImgFailed ? (
                <img
                  src="/src/assets/images/wasm_browser_workstation_1791783395246.jpg"
                  alt="Aura-Web workstation running multi-track audio waveforms and node graphs inside a browser"
                  referrerPolicy="no-referrer"
                  onError={() => setWasmImgFailed(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-900">
                  <Cpu className="w-10 h-10 text-amber-400/40" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-transparent" />
            </div>

            <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="text-xs font-mono text-amber-400">
                  03. Browser-Native Offline OS (Aura-Web)
                </div>
                <h3 className="text-lg font-bold text-slate-100">
                  CheerpX x86-to-WASM JIT + WebGPU Compute
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Boot the full AuraOS userland inside Chrome, Firefox, or Safari with zero server
                  infrastructure. Dedicated WebWorkers isolate LLM inference from synchronous OPFS
                  SQLite disk I/O.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">OPFS + Service Worker PWA</span>
                <button
                  type="button"
                  onClick={() => onNavigateTab("docs")}
                  className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 whitespace-nowrap"
                >
                  <span>Explore Aura-Web Spec</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Card 04 (Span 7): Structured JSON File System (aurafs) */}
          <div className="lg:col-span-7 bg-[#111827] border border-slate-800 rounded-xl p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono text-amber-400">
                  04. Structured JSON File System (aurafs)
                </span>
                <span className="font-mono">SQLite JSON1 · FTS5 · Rust FUSE</span>
              </div>
              <h3 className="text-xl font-bold text-slate-100">
                Every Media Take, Project Stem, and Document is a Queryable JSON Entity
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Instead of losing assets across deep POSIX folders,{" "}
                <code className="font-mono text-amber-300">aurafs</code> stores every file in an
                embedded SQLite database with custom attributes, AI-generated content summaries, and
                vector embeddings—while a Rust FUSE daemon exposes standard{" "}
                <code className="font-mono text-slate-200">open/read/write</code> syscalls so
                existing Linux binaries work without modification.
              </p>

              <div className="p-3.5 bg-[#080B11] border border-slate-800 rounded-lg font-mono text-xs space-y-1.5">
                <div className="text-slate-400">
                  # Query across millions of studio assets in 1.2ms:
                </div>
                <div className="text-amber-300">
                  aurafs query --where &quot;attributes.project == &apos;AuraOS&apos; AND modified_at &gt; &apos;2026-01-01&apos;&quot;
                </div>
                <div className="text-emerald-300">
                  f81d4fae-7dec-11d0-a765-00a0c91e6bf6 | /documents/work/project_proposal.pdf | 1,048,576 B
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
              <span className="text-xs text-slate-400">
                Dual POSIX syscall + SQLite JSON1 relational interface
              </span>
              <button
                type="button"
                onClick={() => onNavigateTab("aurafs")}
                className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 whitespace-nowrap"
              >
                <span>Query JSON File System</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Studio Production Workflows & Proof of Impact */}
      <section className="bg-[#111827] border border-slate-800 rounded-xl p-6 lg:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="text-xs text-slate-400 mb-1">
              Verified Production Benchmarks
            </div>
            <h2 className="text-xl font-bold text-slate-100">
              Multimedia Studio Workflows Powered by AuraOS
            </h2>
          </div>
          <button
            type="button"
            onClick={onOpenGitHubModal}
            className="px-4 py-2.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors flex items-center gap-2 self-start lg:self-auto whitespace-nowrap"
          >
            <GitBranch className="w-4 h-4" />
            <span>Push AuraOS Source to GitHub</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className="p-4 bg-[#080B11] border border-slate-800 rounded-lg space-y-2">
            <div className="font-mono text-amber-400">WORKFLOW 01 · BATCH TRANSCODING</div>
            <h3 className="text-sm font-bold text-slate-100">
              Automated FFmpeg LoRA Stem Extraction
            </h3>
            <p className="text-slate-400 leading-relaxed">
              Reduces multi-track broadcast proxy and MP3 stem generation setup from 15 minutes of
              manual shell scripting to a 1.4-second natural language intent query with sandbox
              verification.
            </p>
          </div>

          <div className="p-4 bg-[#080B11] border border-slate-800 rounded-lg space-y-2">
            <div className="font-mono text-emerald-400">WORKFLOW 02 · SEMANTIC ASSET INDEXING</div>
            <h3 className="text-sm font-bold text-slate-100">
              Instant Take &amp; Script Discovery via SQLite FTS5
            </h3>
            <p className="text-slate-400 leading-relaxed">
              Every ingested PDF script, Rust DSP plugin, and MP4 recording is automatically
              assigned a UUID, structured JSON attributes, and a 384-d embedding vector on disk
              write.
            </p>
          </div>

          <div className="p-4 bg-[#080B11] border border-slate-800 rounded-lg space-y-2">
            <div className="font-mono text-sky-400">WORKFLOW 03 · AIR-GAPPED STUDIO SYNC</div>
            <h3 className="text-sm font-bold text-slate-100">
              Zero-WAN Peer-to-Peer Package Replication
            </h3>
            <p className="text-slate-400 leading-relaxed">
              Sound stages and color grading rooms synchronize immutable <code className="font-mono">.apkx</code>{" "}
              codec bundles over local mDNS + Wi-Fi Direct with strict cryptographic{" "}
              <code className="font-mono">ed25519</code> signature checks.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Quiet Authorship & MIT License Footer */}
      <footer className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-200">AuraOS Multimedia Linux</span>
          <span aria-hidden="true">·</span>
          <span>Authored by Dr. Anil K (Kumar) Bheemaiah, Synergy Robotics</span>
          <span aria-hidden="true">·</span>
          <span>Released under the MIT License</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => onNavigateTab("docs")}
            className="hover:text-slate-200 transition-colors"
          >
            View MIT License &amp; README
          </button>
        </div>
      </footer>
    </div>
  );
};
