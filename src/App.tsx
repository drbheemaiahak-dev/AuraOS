/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Terminal,
  Database,
  Package,
  BookOpen,
  RotateCcw,
  GitBranch,
  Film,
  ShieldAlert,
} from "lucide-react";
import {
  INITIAL_AURAFS_FILES,
  INITIAL_AURAPKG_STORE,
  AuraFileEntity,
  AuraPackageManifest,
  ShellHistoryEntry,
} from "./data/auraData";
import { AuraLandingView } from "./components/AuraLandingView";
import { AuraShellView } from "./components/AuraShellView";
import { AuraFsView } from "./components/AuraFsView";
import { AuraPkgView } from "./components/AuraPkgView";
import { AuraArchitectureView } from "./components/AuraArchitectureView";
import { AuraZeroTrustView } from "./components/AuraZeroTrustView";
import { GitHubExportModal } from "./components/GitHubExportModal";

type ActiveTab = "overview" | "aurash" | "aurafs" | "aurapkg" | "docs" | "zerotrust";

const INITIAL_SHELL_HISTORY: ShellHistoryEntry[] = [
  {
    id: "boot-01",
    timestamp: "09:35:02",
    mode: "direct",
    raw_input: "aurafs query --where \"attributes.project == 'AuraOS' AND modified_at > '2026-01-01'\"",
    risk_score: "Low",
    confirmed: "auto",
    stdout: `f81d4fae-7dec-11d0-a765-00a0c91e6bf6 | /documents/work/project_proposal.pdf | project=AuraOS | status=draft     | 1048576 B
a49c210b-4412-4e8a-9b12-1190c91e6a01 | /src/aurafs/aurafs_fuse_daemon.rs    | project=AuraOS | status=verified  |   48120 B
b72e891c-901a-4c3f-8a55-22b0c91e6b14 | /etc/aurapkg/aura.json               | project=AuraOS | status=immutable |    4096 B
e55a901f-62c3-411b-9e08-88f0c91e6d99 | /var/log/aurash_audit.log            | project=AuraOS | status=verified  |   54016 B`,
    structured_json: {
      engine: "llama.cpp (wasm-simd / Q4_K_M)",
      intent_summary: "Query aurafs SQLite JSON1 index for AuraOS project files modified since 2026-01-01",
      target_command: "aurafs query --where \"attributes.project == 'AuraOS' AND modified_at > '2026-01-01'\"",
      risk_score: "Low",
      risk_reason: "Read-only SQLite JSON1 + FTS5 query with zero filesystem mutation.",
      requires_confirmation: false,
      safe_read_only: true,
      matched_lora_binding: "aurafs:structured_query",
    },
  },
  {
    id: "boot-02",
    timestamp: "09:35:18",
    mode: "intent",
    raw_input: "compress all logs modified last week into logs.tar.gz",
    translated_command:
      "aurafs query --where \"mime_type == 'text/plain' AND path LIKE '/var/log/%'\" --exec \"tar -czf logs.tar.gz\"",
    intent_summary:
      "Archive and compress all system log files modified in the last 7 days into logs.tar.gz.",
    risk_score: "Medium",
    risk_reason: "Creates a new archive file (logs.tar.gz) in the current working directory.",
    requires_confirmation: true,
    confirmed: "pending",
    matched_lora_binding: "zstd:archive_logs",
    stdout: "[aurash-sandbox] Command staged. Risk level: Medium. Confirm execution [Y/n] below.",
    structured_json: {
      engine: "llama.cpp (wasm-simd / Q4_K_M)",
      intent_summary:
        "Archive and compress all system log files modified in the last 7 days into logs.tar.gz.",
      target_command:
        "aurafs query --where \"mime_type == 'text/plain' AND path LIKE '/var/log/%'\" --exec \"tar -czf logs.tar.gz\"",
      risk_score: "Medium",
      risk_reason: "Creates a new archive file (logs.tar.gz) in the current working directory.",
      requires_confirmation: true,
      safe_read_only: false,
      matched_lora_binding: "zstd:archive_logs",
    },
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [showExportModal, setShowExportModal] = useState(false);

  const [files, setFiles] = useState<AuraFileEntity[]>(() => {
    try {
      const saved = localStorage.getItem("auraos_opfs_files_v1");
      return saved ? JSON.parse(saved) : INITIAL_AURAFS_FILES;
    } catch {
      return INITIAL_AURAFS_FILES;
    }
  });

  const [packages, setPackages] = useState<AuraPackageManifest[]>(() => {
    try {
      const saved = localStorage.getItem("auraos_cas_packages_v1");
      return saved ? JSON.parse(saved) : INITIAL_AURAPKG_STORE;
    } catch {
      return INITIAL_AURAPKG_STORE;
    }
  });

  const [shellHistory, setShellHistory] = useState<ShellHistoryEntry[]>(INITIAL_SHELL_HISTORY);

  useEffect(() => {
    try {
      localStorage.setItem("auraos_opfs_files_v1", JSON.stringify(files));
    } catch {
      // Ignore storage quota errors
    }
  }, [files]);

  useEffect(() => {
    try {
      localStorage.setItem("auraos_cas_packages_v1", JSON.stringify(packages));
    } catch {
      // Ignore storage quota errors
    }
  }, [packages]);

  const handleAddFile = (newFile: AuraFileEntity) => {
    setFiles((prev) => [newFile, ...prev.filter((f) => f.path !== newFile.path)]);
  };

  const handleDeleteFile = (uuid: string) => {
    setFiles((prev) => prev.filter((f) => f.uuid !== uuid));
  };

  const handleDeleteFileByPath = (statusOrPattern: string): number => {
    let removed = 0;
    setFiles((prev) =>
      prev.filter((f) => {
        if (f.attributes.status === "immutable") return true;
        if (f.attributes.status === statusOrPattern || f.path.includes(statusOrPattern)) {
          removed++;
          return false;
        }
        return true;
      })
    );
    return removed;
  };

  const handleTogglePackage = (pkgName: string) => {
    setPackages((prev) =>
      prev.map((p) => (p.package === pkgName ? { ...p, installed: !p.installed } : p))
    );
  };

  const handleAppendHistory = (entry: ShellHistoryEntry) => {
    if (entry.raw_input === "clear") {
      setShellHistory([]);
      return;
    }
    setShellHistory((prev) => [...prev, entry]);
  };

  const handleUpdateHistoryStatus = (
    id: string,
    status: "approved" | "aborted",
    extraStdout?: string
  ) => {
    setShellHistory((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              confirmed: status,
              stdout: extraStdout || item.stdout,
            }
          : item
      )
    );
  };

  const handleResetDemoState = () => {
    setFiles(INITIAL_AURAFS_FILES);
    setPackages(INITIAL_AURAPKG_STORE);
    setShellHistory(INITIAL_SHELL_HISTORY);
    localStorage.removeItem("auraos_opfs_files_v1");
    localStorage.removeItem("auraos_cas_packages_v1");
  };

  const handlePurgeLocalEdgeData = () => {
    setFiles([]);
    setPackages((prev) => prev.map((p) => ({ ...p, installed: false })));
    setShellHistory([]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F17] text-slate-100">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-slate-800 bg-[#0B0F17]/95 sticky top-0 z-30 backdrop-blur-xs">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab("overview");
          }}
          className="text-lg font-bold tracking-tight text-slate-100 whitespace-nowrap shrink-0"
        >
          AuraOS
        </a>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav className="flex items-center gap-6 text-sm font-medium text-slate-400 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeTab === "overview"
                ? "text-amber-400 border-amber-400"
                : "border-transparent hover:text-slate-100"
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("aurash")}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeTab === "aurash"
                ? "text-amber-400 border-amber-400"
                : "border-transparent hover:text-slate-100"
            }`}
          >
            AuraShell
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("aurafs")}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeTab === "aurafs"
                ? "text-amber-400 border-amber-400"
                : "border-transparent hover:text-slate-100"
            }`}
          >
            JSON File System
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("aurapkg")}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeTab === "aurapkg"
                ? "text-amber-400 border-amber-400"
                : "border-transparent hover:text-slate-100"
            }`}
          >
            Package Store
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("docs")}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeTab === "docs"
                ? "text-amber-400 border-amber-400"
                : "border-transparent hover:text-slate-100"
            }`}
          >
            Docs &amp; README
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setShowExportModal(true)}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-500 rounded-lg hover:bg-amber-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>Export to GitHub</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Container (240px Sidebar + Primary Viewport) */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-[1600px] w-full mx-auto">
        {/* Left System Navigation Sidebar */}
        <aside className="w-full lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-800 p-5 flex flex-col justify-between gap-6 bg-[#090D14]">
          <div className="space-y-6">
            <div>
              <div className="text-xs font-semibold text-slate-400 mb-3">
                Multimedia OS Workbench
              </div>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setActiveTab("overview")}
                  className={`w-full px-3 py-2.5 rounded-lg text-left text-xs font-medium transition-colors flex items-center justify-between ${
                    activeTab === "overview"
                      ? "bg-slate-800/90 text-amber-400"
                      : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                  }`}
                >
                  <span className="flex items-center gap-2.5 whitespace-nowrap">
                    <Film className="w-4 h-4 shrink-0" />
                    <span>0. Multimedia Linux Home</span>
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">HERO</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("aurash")}
                  className={`w-full px-3 py-2.5 rounded-lg text-left text-xs font-medium transition-colors flex items-center justify-between ${
                    activeTab === "aurash"
                      ? "bg-slate-800/90 text-amber-400"
                      : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                  }`}
                >
                  <span className="flex items-center gap-2.5 whitespace-nowrap">
                    <Terminal className="w-4 h-4 shrink-0" />
                    <span>1. AuraShell (aurash)</span>
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">LLM</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("aurafs")}
                  className={`w-full px-3 py-2.5 rounded-lg text-left text-xs font-medium transition-colors flex items-center justify-between ${
                    activeTab === "aurafs"
                      ? "bg-slate-800/90 text-amber-400"
                      : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                  }`}
                >
                  <span className="flex items-center gap-2.5 whitespace-nowrap">
                    <Database className="w-4 h-4 shrink-0" />
                    <span>2. JSON FS (aurafs)</span>
                  </span>
                  <span className="font-mono text-[11px] tabular-nums text-slate-500">
                    {files.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("aurapkg")}
                  className={`w-full px-3 py-2.5 rounded-lg text-left text-xs font-medium transition-colors flex items-center justify-between ${
                    activeTab === "aurapkg"
                      ? "bg-slate-800/90 text-amber-400"
                      : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                  }`}
                >
                  <span className="flex items-center gap-2.5 whitespace-nowrap">
                    <Package className="w-4 h-4 shrink-0" />
                    <span>3. Package Store</span>
                  </span>
                  <span className="font-mono text-[11px] tabular-nums text-slate-500">
                    {packages.filter((p) => p.installed).length}/{packages.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("docs")}
                  className={`w-full px-3 py-2.5 rounded-lg text-left text-xs font-medium transition-colors flex items-center justify-between ${
                    activeTab === "docs"
                      ? "bg-slate-800/90 text-amber-400"
                      : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                  }`}
                >
                  <span className="flex items-center gap-2.5 whitespace-nowrap">
                    <BookOpen className="w-4 h-4 shrink-0" />
                    <span>4. Docs &amp; README</span>
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">SPEC</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("zerotrust")}
                  className={`w-full px-3 py-2.5 rounded-lg text-left text-xs font-medium transition-colors flex items-center justify-between ${
                    activeTab === "zerotrust"
                      ? "bg-rose-950/60 text-rose-400 border border-rose-800/60"
                      : "text-rose-400/80 hover:bg-rose-950/30 hover:text-rose-300"
                  }`}
                >
                  <span className="flex items-center gap-2.5 whitespace-nowrap">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>5. Level-0 Self-Erase</span>
                  </span>
                  <span className="font-mono text-[11px] text-rose-500">ZERO</span>
                </button>
              </div>
            </div>

            {/* Architecture Summary Specs (Unboxed clean text) */}
            <div className="pt-5 border-t border-slate-800/80 space-y-3 text-xs">
              <div className="font-semibold text-slate-300">
                Active Studio Configuration
              </div>
              <div className="space-y-2 text-slate-400 font-mono text-[11px]">
                <div>
                  <span className="text-slate-500">Kernel:</span> Linux 6.11 (runit)
                </div>
                <div>
                  <span className="text-slate-500">Audio/Video:</span> PipeWire + DRM-KMS
                </div>
                <div>
                  <span className="text-slate-500">LLM Engine:</span> llama.cpp Q4_K_M
                </div>
                <div>
                  <span className="text-slate-500">FS Backend:</span> SQLite JSON1+FTS5
                </div>
                <div>
                  <span className="text-slate-500">WASM Target:</span> CheerpX + OPFS
                </div>
                <div className="pt-2 border-t border-slate-800/80 text-slate-300 font-sans">
                  <div>Dr. Anil K (Kumar) Bheemaiah</div>
                  <div className="text-amber-400/90">Synergy Robotics · MIT License</div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 space-y-2">
            <button
              type="button"
              onClick={handleResetDemoState}
              className="w-full px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset OPFS &amp; Store State</span>
            </button>
          </div>
        </aside>

        {/* Main Content Viewport */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {activeTab === "overview" && (
            <AuraLandingView
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenGitHubModal={() => setShowExportModal(true)}
            />
          )}

          {activeTab === "aurash" && (
            <AuraShellView
              files={files}
              onAddFile={handleAddFile}
              onDeleteFileByPath={handleDeleteFileByPath}
              packages={packages}
              history={shellHistory}
              onAppendHistory={handleAppendHistory}
              onUpdateHistoryStatus={handleUpdateHistoryStatus}
            />
          )}

          {activeTab === "aurafs" && (
            <AuraFsView
              files={files}
              onAddFile={handleAddFile}
              onDeleteFile={handleDeleteFile}
            />
          )}

          {activeTab === "aurapkg" && (
            <AuraPkgView
              packages={packages}
              onToggleInstall={handleTogglePackage}
            />
          )}

          {activeTab === "docs" && (
            <AuraArchitectureView files={files} packages={packages} />
          )}

          {activeTab === "zerotrust" && (
            <AuraZeroTrustView
              onPurgeLocalEdgeData={handlePurgeLocalEdgeData}
              onRestoreDemoData={handleResetDemoState}
              filesCount={files.length}
              installedPackagesCount={packages.filter((p) => p.installed).length}
            />
          )}
        </main>
      </div>

      {showExportModal && (
        <GitHubExportModal
          onClose={() => setShowExportModal(false)}
          files={files}
          packages={packages}
        />
      )}
    </div>
  );
}
