import React, { useState, useRef, useEffect } from "react";
import { Terminal, ShieldAlert, Check, X, Play, Sparkles, ArrowRight } from "lucide-react";
import { AuraFileEntity, AuraPackageManifest, ShellHistoryEntry } from "../data/auraData";

interface AuraShellViewProps {
  files: AuraFileEntity[];
  onAddFile: (newFile: AuraFileEntity) => void;
  onDeleteFileByPath: (pathPattern: string) => number;
  packages: AuraPackageManifest[];
  history: ShellHistoryEntry[];
  onAppendHistory: (entry: ShellHistoryEntry) => void;
  onUpdateHistoryStatus: (id: string, status: "approved" | "aborted", extraStdout?: string) => void;
}

const SAMPLE_PROMPTS = [
  {
    mode: "intent" as const,
    label: "Find AuraOS files modified in 2026",
    input: "show all files in project AuraOS modified after January 2026",
  },
  {
    mode: "intent" as const,
    label: "Compress logs into logs.tar.gz",
    input: "compress all logs modified last week into logs.tar.gz",
  },
  {
    mode: "intent" as const,
    label: "Extract MP3 audio with ffmpeg",
    input: "extract mp3 audio from demo_session.mp4 using ffmpeg",
  },
  {
    mode: "intent" as const,
    label: "Remove temporary drafts (Critical)",
    input: "remove all temporary draft files in /documents/work/temp_drafts/*",
  },
  {
    mode: "direct" as const,
    label: "cat /documents/work/project_proposal.pdf",
    input: "cat /documents/work/project_proposal.pdf",
  },
  {
    mode: "direct" as const,
    label: "aurafs query --where \"attributes.project == 'AuraOS'\"",
    input: "aurafs query --where \"attributes.project == 'AuraOS' AND modified_at > '2026-01-01'\"",
  },
];

export const AuraShellView: React.FC<AuraShellViewProps> = ({
  files,
  onAddFile,
  onDeleteFileByPath,
  packages,
  history,
  onAppendHistory,
  onUpdateHistoryStatus,
}) => {
  const [shellMode, setShellMode] = useState<"intent" | "direct">("intent");
  const [inputValue, setInputValue] = useState("");
  const [cwd, setCwd] = useState("/documents/work");
  const [isTranslating, setIsTranslating] = useState(false);
  const [showJsonInspector, setShowJsonInspector] = useState(true);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, isTranslating]);

  const executeDirectCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    const id = `cmd-${Date.now()}`;
    const timestamp = new Date().toISOString().slice(11, 19);

    if (trimmed === "help") {
      onAppendHistory({
        id,
        timestamp,
        mode: "direct",
        raw_input: trimmed,
        risk_score: "Low",
        confirmed: "auto",
        stdout: `AuraShell (aurash) Hybrid Shell Commands:
  ls [path]                           List SQLite FUSE virtual directory nodes
  cat <path>                          Read POSIX file stream from aurafs
  aurafs query --where "<predicate>"  Structured SQLite JSON1 + FTS5 query
  aurapkg list                        List content-addressable store packages
  aurapkg verify <pkg>                Verify ed25519 signature & SHA-256 tree
  clear                               Clear terminal buffer`,
      });
      return;
    }

    if (trimmed.startsWith("ls")) {
      const listing = files
        .map(
          (f) =>
            `${f.attributes.status === "immutable" ? "-r--r--r--" : "-rw-r--r--"}  1 ${f.attributes.author.padEnd(7, " ")} aura  ${f.size_bytes
              .toString()
              .padStart(9, " ")}  ${f.modified_at.slice(0, 10)}  ${f.path}`
        )
        .join("\n");
      onAppendHistory({
        id,
        timestamp,
        mode: "direct",
        raw_input: trimmed,
        risk_score: "Low",
        confirmed: "auto",
        stdout: listing,
      });
      return;
    }

    if (trimmed.startsWith("cat ")) {
      const targetPath = trimmed.replace(/^cat\s+/, "").trim();
      const found = files.find((f) => f.path === targetPath || f.name === targetPath);
      onAppendHistory({
        id,
        timestamp,
        mode: "direct",
        raw_input: trimmed,
        risk_score: "Low",
        confirmed: "auto",
        stdout: found
          ? found.raw_content
          : `cat: ${targetPath}: No such document in aurafs SQLite store`,
      });
      return;
    }

    if (trimmed.startsWith("aurafs query")) {
      const whereMatch = trimmed.match(/--where\s+"([^"]+)"/);
      const clause = whereMatch ? whereMatch[1] : "";
      let matched = [...files];
      if (clause.includes("AuraOS")) {
        matched = matched.filter((f) => f.attributes.project === "AuraOS");
      }
      if (clause.includes("draft")) {
        matched = matched.filter((f) => f.attributes.status === "draft");
      }
      const out = matched
        .map(
          (f) =>
            `${f.uuid} | ${f.path.padEnd(36, " ")} | project=${f.attributes.project} | status=${f.attributes.status} | ${f.size_bytes} B`
        )
        .join("\n");
      onAppendHistory({
        id,
        timestamp,
        mode: "direct",
        raw_input: trimmed,
        risk_score: "Low",
        confirmed: "auto",
        stdout: out || "[aurafs] 0 rows matched predicate.",
        structured_json: {
          engine: "SQLite 3.46 (JSON1 + FTS5)",
          predicate: clause || "ALL",
          matched_count: matched.length,
          uuids: matched.map((m) => m.uuid),
        },
      });
      return;
    }

    if (trimmed.startsWith("aurapkg")) {
      const out = packages
        .map(
          (p) =>
            `${p.installed ? "[INSTALLED]" : "[AVAILABLE]"} ${p.package}-${p.version.padEnd(10, " ")}  ${p.hash.slice(0, 26)}...  (${p.binary_format})`
        )
        .join("\n");
      onAppendHistory({
        id,
        timestamp,
        mode: "direct",
        raw_input: trimmed,
        risk_score: "Low",
        confirmed: "auto",
        stdout: out,
      });
      return;
    }

    if (trimmed.startsWith("rm ") || trimmed.startsWith("dd ") || trimmed.startsWith("chmod ")) {
      onAppendHistory({
        id,
        timestamp,
        mode: "direct",
        raw_input: trimmed,
        translated_command: trimmed,
        intent_summary: "Direct state-altering POSIX command intercepted by aurash sandbox.",
        risk_score: "Critical",
        risk_reason: "Direct destructive syscall detected (rm/dd/chmod). Confirmation required before FUSE commit.",
        requires_confirmation: true,
        confirmed: "pending",
        stdout: "[aurash-sandbox] Execution paused awaiting user confirmation [Y/n].",
      });
      return;
    }

    onAppendHistory({
      id,
      timestamp,
      mode: "direct",
      raw_input: trimmed,
      risk_score: "Low",
      confirmed: "auto",
      stdout: `[aurash] Executed POSIX pipeline: ${trimmed}\nExit status: 0 (0.004s)`,
    });
  };

  const executeIntentQuery = async (query: string) => {
    setIsTranslating(true);
    const id = `intent-${Date.now()}`;
    const timestamp = new Date().toISOString().slice(11, 19);

    try {
      const res = await fetch("/api/aurash/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          cwd,
          files,
          installedPackages: packages.filter((p) => p.installed),
        }),
      });
      const data = await res.json();

      const riskScore: "Low" | "Medium" | "Critical" =
        data.risk_score === "Critical" || data.risk_score === "Medium" ? data.risk_score : "Low";
      const needsConfirm = Boolean(data.requires_confirmation || riskScore !== "Low");

      onAppendHistory({
        id,
        timestamp,
        mode: "intent",
        raw_input: query,
        translated_command: data.target_command,
        intent_summary: data.intent_summary,
        risk_score: riskScore,
        risk_reason: data.risk_reason,
        requires_confirmation: needsConfirm,
        confirmed: needsConfirm ? "pending" : "auto",
        matched_lora_binding: data.matched_lora_binding,
        stdout: needsConfirm
          ? `[aurash-sandbox] Command staged. Risk level: ${riskScore}. Confirm execution [Y/n] below.`
          : data.simulated_stdout || "[aurash] Command completed.",
        structured_json: data,
      });
    } catch (err: any) {
      onAppendHistory({
        id,
        timestamp,
        mode: "intent",
        raw_input: query,
        risk_score: "Low",
        confirmed: "auto",
        stdout: `[aurash] Translation error: ${err?.message || "Failed to reach local LLM service"}`,
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isTranslating) return;
    const current = inputValue;
    setInputValue("");
    if (shellMode === "direct") {
      executeDirectCommand(current);
    } else {
      executeIntentQuery(current);
    }
  };

  const handleConfirmDecision = (entry: ShellHistoryEntry, decision: "approved" | "aborted") => {
    if (decision === "aborted") {
      onUpdateHistoryStatus(
        entry.id,
        "aborted",
        "[aurash-sandbox] Aborted by user (N). Zero filesystem mutations committed to aurafs."
      );
      return;
    }

    // Apply real state changes to aurafs when user approves!
    const cmd = (entry.translated_command || entry.raw_input).toLowerCase();
    let mutationNote = entry.structured_json?.simulated_stdout || "[aurafs] Transaction committed.";

    if (cmd.includes("logs.tar.gz") || cmd.includes("tar ")) {
      const archiveFile: AuraFileEntity = {
        uuid: `c92a110e-88b1-42c9-9901-${Math.floor(100000 + Math.random() * 900000)}`,
        name: "logs.tar.gz",
        path: `${cwd}/logs.tar.gz`,
        mime_type: "application/gzip",
        size_bytes: 36096,
        created_at: new Date().toISOString(),
        modified_at: new Date().toISOString(),
        attributes: {
          author: "alice",
          project: "AuraOS",
          status: "verified",
          subsystem: "archive",
        },
        content_summary: "Compressed archive of system logs generated via aurash intent pipeline.",
        raw_content: "[GZIP Compressed Archive: kernel_boot.log, aurash_audit.log — 36,096 bytes]",
        vector_embedding: [0.145, -0.221, 0.612, 0.088, 0.319, -0.104],
      };
      onAddFile(archiveFile);
      mutationNote += `\n[aurafs-fuse] Mounted new JSON document at ${archiveFile.path} (uuid=${archiveFile.uuid})`;
    } else if (cmd.includes("mp3") || cmd.includes("ffmpeg")) {
      const audioFile: AuraFileEntity = {
        uuid: `a81f442d-19c0-411e-8b22-${Math.floor(100000 + Math.random() * 900000)}`,
        name: "demo_audio.mp3",
        path: "/media/demo_audio.mp3",
        mime_type: "audio/mpeg",
        size_bytes: 3244032,
        created_at: new Date().toISOString(),
        modified_at: new Date().toISOString(),
        attributes: {
          author: "alice",
          project: "Media",
          status: "verified",
          subsystem: "ffmpeg-lora",
        },
        content_summary: "Extracted MP3 audio track from /media/demo_session.mp4 via ffmpeg LoRA prompt binding.",
        raw_content: "[MPEG-1 Audio Layer III — 44.1kHz 192kbps Stereo | 3,244,032 bytes]",
        vector_embedding: [-0.219, 0.402, 0.118, -0.309, 0.511, 0.204],
      };
      onAddFile(audioFile);
      mutationNote += `\n[aurafs-fuse] Mounted new JSON document at ${audioFile.path} (uuid=${audioFile.uuid})`;
    } else if (cmd.includes("rm ")) {
      const count = onDeleteFileByPath("draft");
      mutationNote = `[aurash-sandbox] Approved. Unlinked ${count} draft document(s) from SQLite store.`;
    }

    onUpdateHistoryStatus(entry.id, "approved", mutationNote);
  };

  const latestJsonEntry = [...history].reverse().find((h) => h.structured_json);

  return (
    <div className="space-y-6">
      {/* Component Header & Mode Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="text-xs text-slate-400 flex items-center gap-2 mb-1">
            <span>Component 1</span>
            <span aria-hidden="true">·</span>
            <span>llama.cpp + WebGPU / WASM SIMD</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">Qwen-2.5-7B-Instruct-Q4_K_M (4.48 GB)</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            Offline LLM Natural Language Shell (aurash)
          </h1>
        </div>

        {/* Interactive Mode Switcher (Functional Segmented Buttons) */}
        <div className="flex items-center gap-2 self-start lg:self-auto">
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => setShellMode("intent")}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                shellMode === "intent"
                  ? "bg-amber-500 text-slate-950 font-semibold"
                  : "text-slate-400 hover:text-slate-100"
              }`}
            >
              Intent Execution Mode (LLM)
            </button>
            <button
              type="button"
              onClick={() => setShellMode("direct")}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                shellMode === "direct"
                  ? "bg-amber-500 text-slate-950 font-semibold"
                  : "text-slate-400 hover:text-slate-100"
              }`}
            >
              Direct Command Mode (POSIX)
            </button>
          </div>
          <button
            type="button"
            onClick={() => setShowJsonInspector(!showJsonInspector)}
            className="px-3 py-2 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
          >
            {showJsonInspector ? "Hide JSON Grammar" : "Show JSON Grammar"}
          </button>
        </div>
      </div>

      {/* Preset Quick Actions */}
      <div className="space-y-2">
        <div className="text-xs text-slate-400">
          Test deterministic safety interlocks and LoRA bindings with one click:
        </div>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_PROMPTS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setShellMode(preset.mode);
                setInputValue(preset.input);
              }}
              className="px-3 py-1.5 text-xs text-slate-300 bg-[#111827] hover:bg-slate-800 border border-slate-800 rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <span className="font-mono text-amber-400">
                {preset.mode === "intent" ? "intent:" : "posix:"}
              </span>
              <span>{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Split Terminal + Constrained JSON Decoder Inspector */}
      <div className={`grid grid-cols-1 ${showJsonInspector ? "xl:grid-cols-12" : ""} gap-6 items-stretch`}>
        {/* Left: Interactive Terminal Emulator */}
        <div
          className={`${
            showJsonInspector ? "xl:col-span-8" : "col-span-1"
          } flex flex-col bg-[#080B11] border border-slate-800 rounded-xl overflow-hidden`}
        >
          {/* Terminal Window Header */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-amber-400" />
              <span>alice@auraos:{cwd}</span>
              <span aria-hidden="true">·</span>
              <span>mode={shellMode.toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-3">
              <span>files={files.length}</span>
              <span aria-hidden="true">·</span>
              <span>sandbox=enforcing</span>
            </div>
          </div>

          {/* Terminal Scrollable Output Area */}
          <div className="p-4 space-y-4 font-mono text-xs overflow-y-auto max-h-[520px] min-h-[380px]">
            {history.map((item) => (
              <div key={item.id} className="space-y-2 pb-3 border-b border-slate-900/80 last:border-b-0">
                {/* Prompt Line */}
                <div className="flex items-start gap-2 text-slate-200">
                  <span className="text-amber-400 select-none shrink-0">
                    {item.mode === "intent" ? "aurash[intent]>" : "aurash[posix]$"}
                  </span>
                  <span className="break-all font-medium">{item.raw_input}</span>
                  <span className="ml-auto text-slate-500 text-[11px] shrink-0 tabular-nums">
                    {item.timestamp}
                  </span>
                </div>

                {/* If Intent Mode or Sandbox Intercepted: Show Translation & Risk Assessment */}
                {(item.translated_command || item.risk_score) && (
                  <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-lg space-y-2">
                    {item.intent_summary && (
                      <div className="text-slate-300 font-sans text-xs">
                        {item.intent_summary}
                      </div>
                    )}
                    {item.translated_command && (
                      <div className="flex items-center gap-2 text-emerald-300 bg-slate-950 px-3 py-2 rounded border border-slate-800/80 overflow-x-auto">
                        <ArrowRight className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                        <code className="whitespace-nowrap">{item.translated_command}</code>
                      </div>
                    )}

                    {/* Metadata line (No pills! Clean typographic separators) */}
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 pt-1">
                      <span>
                        Safety Risk Score:{" "}
                        <strong
                          className={
                            item.risk_score === "Critical"
                              ? "text-rose-400"
                              : item.risk_score === "Medium"
                              ? "text-amber-400"
                              : "text-emerald-400"
                          }
                        >
                          {item.risk_score || "Low"}
                        </strong>
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        Interlock:{" "}
                        {item.confirmed === "auto"
                          ? "Immediate Read-Only Execution"
                          : item.confirmed === "approved"
                          ? "Confirmed by User [Y]"
                          : item.confirmed === "aborted"
                          ? "Aborted by User [N]"
                          : "Awaiting Confirmation [Y/n]"}
                      </span>
                      {item.matched_lora_binding && item.matched_lora_binding !== "none" && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>LoRA Adapter: {item.matched_lora_binding}</span>
                        </>
                      )}
                    </div>

                    {item.risk_reason && (
                      <div className="text-[11px] text-slate-400 font-sans">
                        Reason: {item.risk_reason}
                      </div>
                    )}

                    {/* Interactive Confirmation Prompt [Y/n] for state-altering commands */}
                    {item.confirmed === "pending" && (
                      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800">
                        <div className="flex items-center gap-2 text-amber-300 text-xs font-sans">
                          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
                          <span>
                            State-altering operation detected. Execute command in aurafs?
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleConfirmDecision(item, "approved")}
                            className="px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Confirm [Y]</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleConfirmDecision(item, "aborted")}
                            className="px-3 py-1.5 text-xs font-medium bg-rose-600/90 hover:bg-rose-500 text-white rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Abort [n]</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Command Standard Output */}
                <pre className="text-slate-300 whitespace-pre-wrap leading-relaxed pl-2">
                  {item.stdout}
                </pre>
              </div>
            ))}

            {isTranslating && (
              <div className="text-amber-400 flex items-center gap-2 py-2">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>
                  [llama.cpp] Decoding natural language intent against aurafs schema & GBNF JSON grammar...
                </span>
              </div>
            )}
            <div ref={terminalEndRef} />
          </div>

          {/* Command Input Bar */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 p-3 bg-slate-900 border-t border-slate-800"
          >
            <span className="font-mono text-xs text-amber-400 px-2 shrink-0 select-none">
              {shellMode === "intent" ? "aurash[intent]>" : "aurash[posix]$"}
            </span>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={
                shellMode === "intent"
                  ? "Describe your task in plain English (e.g., 'compress all logs modified last week into logs.tar.gz')..."
                  : "Enter standard POSIX or aurafs/aurapkg command (e.g., 'ls', 'cat /etc/aurapkg/aura.json')..."
              }
              className="flex-1 bg-slate-950 text-slate-100 font-mono text-xs px-3.5 py-2.5 rounded-lg border border-slate-800 focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              disabled={isTranslating || !inputValue.trim()}
              className="px-4 py-2.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{shellMode === "intent" ? "Translate & Evaluate" : "Run Command"}</span>
            </button>
          </form>
        </div>

        {/* Right: Structured JSON Output & Safety Interlock Specification */}
        {showJsonInspector && (
          <div className="xl:col-span-4 flex flex-col justify-between bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-100">
                    Constrained JSON Grammar Output
                  </h2>
                  <p className="text-xs text-slate-400">
                    aurash forces GBNF JSON-mode output from the LLM for deterministic parsing
                  </p>
                </div>
              </div>

              <pre className="p-3.5 bg-[#080B11] border border-slate-800 rounded-lg text-[11px] font-mono text-emerald-300 overflow-x-auto leading-relaxed max-h-[300px]">
                {JSON.stringify(
                  latestJsonEntry?.structured_json || {
                    engine: "llama.cpp (wasm-simd / Q4_K_M)",
                    intent_summary: "Query aurafs SQLite JSON1 index for AuraOS project files",
                    target_command:
                      "aurafs query --where \"attributes.project == 'AuraOS' AND modified_at > '2026-01-01'\"",
                    risk_score: "Low",
                    risk_reason: "Read-only structured SQLite JSON1 + FTS5 query",
                    requires_confirmation: false,
                    safe_read_only: true,
                    matched_lora_binding: "aurafs:structured_query",
                  },
                  null,
                  2
                )}
              </pre>
            </div>

            {/* Determinism Check & Sandbox Rules Reference */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <h3 className="text-xs font-semibold text-slate-200">
                Determinism Check & Sandbox Interlock Matrix
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="p-2.5 bg-slate-900/70 rounded-lg border border-slate-800/80">
                  <div className="font-medium text-emerald-400">
                    Low Risk · Read-Only Immediate Execution
                  </div>
                  <div className="text-slate-400 mt-0.5 font-mono text-[11px]">
                    ls, cat, grep, aurafs query, aurapkg verify
                  </div>
                </div>
                <div className="p-2.5 bg-slate-900/70 rounded-lg border border-slate-800/80">
                  <div className="font-medium text-amber-400">
                    Medium Risk · Visual Preview & [Y/n] Gate
                  </div>
                  <div className="text-slate-400 mt-0.5 font-mono text-[11px]">
                    tar, ffmpeg, aurafs tag, aurapkg install, mv
                  </div>
                </div>
                <div className="p-2.5 bg-slate-900/70 rounded-lg border border-slate-800/80">
                  <div className="font-medium text-rose-400">
                    Critical Risk · Sandbox Lock & Explicit Confirmation
                  </div>
                  <div className="text-slate-400 mt-0.5 font-mono text-[11px]">
                    rm -rf, dd, chmod, mkfs, block device writes
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
