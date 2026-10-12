import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Download,
  Check,
  Copy,
  GitBranch,
  Terminal,
  FileCode,
  AlertCircle,
  ExternalLink,
  UploadCloud,
  LogOut,
  CheckCircle2,
  RefreshCw,
  Smartphone,
} from "lucide-react";
import {
  AuraFileEntity,
  AuraPackageManifest,
  TECH_STACK_MATRIX,
  IMPLEMENTATION_ROADMAP,
} from "../data/auraData";

interface GitHubExportModalProps {
  onClose: () => void;
  files: AuraFileEntity[];
  packages: AuraPackageManifest[];
}

interface GitHubStatus {
  connected: boolean;
  user: {
    login: string;
    name: string;
    avatar_url: string;
    html_url: string;
  } | null;
  connectedAt: string | null;
  oauthConfigured: boolean;
  redirectUri: string;
}

const DEV_CALLBACK_URL =
  "https://ais-dev-7lnhlbyi4tpxhz3knyrtx7-673314398378.asia-east1.run.app/auth/callback";
const SHARED_CALLBACK_URL =
  "https://ais-pre-7lnhlbyi4tpxhz3knyrtx7-673314398378.asia-east1.run.app/auth/callback";

export const GitHubExportModal: React.FC<GitHubExportModalProps> = ({
  onClose,
  files,
  packages,
}) => {
  const [sourceFiles, setSourceFiles] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<string>("package.json");
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Auth mode: 'device' (no callback URI needed!) vs 'popup' (standard OAuth callback)
  const [authMethod, setAuthMethod] = useState<"device" | "popup">("device");

  // GitHub OAuth Connector state
  const [ghStatus, setGhStatus] = useState<GitHubStatus>({
    connected: false,
    user: null,
    connectedAt: null,
    oauthConfigured: false,
    redirectUri: DEV_CALLBACK_URL,
  });
  const [authError, setAuthError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Device flow state
  const [clientIdInput, setClientIdInput] = useState("");
  const [deviceSession, setDeviceSession] = useState<{
    device_code: string;
    user_code: string;
    verification_uri: string;
    clientId: string;
  } | null>(null);
  const [isPollingDevice, setIsPollingDevice] = useState(false);

  // Push to GitHub Repository form state
  const [repoName, setRepoName] = useState("auraos-local-first-linux-wasm");
  const [repoDescription, setRepoDescription] = useState(
    "AuraOS — Local-First Linux & WebAssembly OS Workbench (aurash, aurafs, aurapkg)"
  );
  const [isPrivate, setIsPrivate] = useState(false);
  const [commitMessage, setCommitMessage] = useState(
    "feat: initial commit of AuraOS architecture & workbench"
  );
  const [isPushing, setIsPushing] = useState(false);
  const [pushResult, setPushResult] = useState<{
    repoUrl: string;
    committedCount: number;
  } | null>(null);

  const fetchGitHubStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/github/status");
      if (res.ok) {
        const data = await res.json();
        setGhStatus(data);
      }
    } catch {
      // Ignore network error
    }
  }, []);

  useEffect(() => {
    fetchGitHubStatus();
    fetch("/api/export/project-source")
      .then((r) => r.json())
      .then((data) => {
        if (data.files) {
          setSourceFiles(data.files);
          const keys = Object.keys(data.files);
          if (keys.length > 0) setSelectedFile(keys[0]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [fetchGitHubStatus]);

  // Listen for OAUTH_AUTH_SUCCESS postMessage from the GitHub OAuth popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith(".run.app") && !origin.includes("localhost")) {
        return;
      }
      if (event.data?.type === "OAUTH_AUTH_SUCCESS") {
        setIsConnecting(false);
        setAuthError(null);
        fetchGitHubStatus();
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [fetchGitHubStatus]);

  // Poll GitHub Device Flow automatically when deviceSession is active
  useEffect(() => {
    if (!deviceSession || ghStatus.connected) return;
    setIsPollingDevice(true);

    const timer = setInterval(async () => {
      try {
        const res = await fetch("/api/auth/github/device/poll", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            device_code: deviceSession.device_code,
            clientId: deviceSession.clientId,
          }),
        });
        const data = await res.json();
        if (data.connected) {
          clearInterval(timer);
          setIsPollingDevice(false);
          setDeviceSession(null);
          fetchGitHubStatus();
        } else if (data.error && !data.pending) {
          clearInterval(timer);
          setIsPollingDevice(false);
          setAuthError(data.error_description || data.error);
        }
      } catch {
        // Keep polling
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [deviceSession, ghStatus.connected, fetchGitHubStatus]);

  const handleStartDeviceFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsConnecting(true);
    try {
      const res = await fetch("/api/auth/github/device/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: clientIdInput }),
      });
      const data = await res.json();
      if (!res.ok || !data.device_code) {
        throw new Error(
          data.error ||
            "Failed to start Device Flow. Make sure 'Enable Device Flow' is checked in your GitHub OAuth App settings."
        );
      }
      setDeviceSession({
        device_code: data.device_code,
        user_code: data.user_code,
        verification_uri: data.verification_uri,
        clientId: data.clientId,
      });
    } catch (err: any) {
      setAuthError(err?.message || "Could not start GitHub Device Flow.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConnectGitHubPopup = async () => {
    setAuthError(null);
    setIsConnecting(true);
    try {
      const originParam = encodeURIComponent(window.location.origin);
      const response = await fetch(`/api/auth/github/url?origin=${originParam}`);
      const data = await response.json();

      if (!response.ok || !data.url) {
        setAuthError(
          data.error ||
            "Configure GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in AI Studio Settings > Secrets first."
        );
        setIsConnecting(false);
        return;
      }

      const authWindow = window.open(
        data.url,
        "github_oauth_popup",
        "width=600,height=720"
      );

      if (!authWindow) {
        setAuthError(
          "Popup was blocked by your browser. Please allow popups for this site and try again."
        );
        setIsConnecting(false);
      }
    } catch (err: any) {
      setAuthError(err?.message || "Failed to initiate GitHub OAuth flow.");
      setIsConnecting(false);
    }
  };

  const handleDisconnectGitHub = async () => {
    await fetch("/api/github/disconnect", { method: "POST" });
    setPushResult(null);
    setDeviceSession(null);
    fetchGitHubStatus();
  };

  const handlePushToGitHub = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setPushResult(null);
    setIsPushing(true);

    try {
      const res = await fetch("/api/github/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoName,
          description: repoDescription,
          isPrivate,
          commitMessage,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to push repository to GitHub.");
      }
      setPushResult({
        repoUrl: data.repoUrl,
        committedCount: data.committedCount,
      });
    } catch (err: any) {
      setAuthError(err?.message || "GitHub push failed.");
    } finally {
      setIsPushing(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const generateBootstrapScript = () => {
    const payload = JSON.stringify(sourceFiles, null, 2);
    return `#!/usr/bin/env node
/**
 * AuraOS Repository Bootstrapper
 * Run: node setup-auraos-repo.mjs
 */
import fs from 'fs';
import path from 'path';

const files = ${payload};

for (const [relPath, content] of Object.entries(files)) {
  const fullPath = path.resolve(process.cwd(), relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf-8');
  console.log('Created:', relPath);
}

console.log('\\nAuraOS project files extracted! Run:');
console.log('  npm install');
console.log('  git init && git add . && git commit -m "Initial commit: AuraOS architecture & workbench"');
`;
  };

  const handleDownloadBootstrapScript = () => {
    const script = generateBootstrapScript();
    const blob = new Blob([script], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "setup-auraos-repo.mjs";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadSpecJson = () => {
    const bundle = {
      os_distribution: "AuraOS v1.0 (Local-First Linux & WebAssembly OS)",
      exported_at: new Date().toISOString(),
      aurafs_sqlite_documents: files,
      aurapkg_cas_store: packages,
      technology_stack_matrix: TECH_STACK_MATRIX,
      implementation_roadmap: IMPLEMENTATION_ROADMAP,
      source_files: sourceFiles,
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "auraos-full-project-bundle.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
      <div className="bg-[#111827] border border-slate-700 rounded-xl max-w-4xl w-full overflow-hidden shadow-2xl my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0B0F17]">
          <div className="flex items-center gap-2.5">
            <GitBranch className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-slate-100">
              GitHub OAuth Connector & Direct Repository Push
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
          {/* Explanation of why Homepage URL & Callback URI don't open directly in a browser tab */}
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1.5 text-xs text-slate-300">
            <div className="font-semibold text-amber-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Why the Homepage URL &amp; Callback URI do not open directly in a new tab:</span>
            </div>
            <p className="leading-relaxed">
              The AI Studio container URL (<code className="text-amber-300">*.run.app</code>) is strictly an{" "}
              <strong>iframe-embedded runtime</strong>—pasting it directly into a browser address bar will not load the app outside AI Studio.
              Those URLs are only meant to be pasted into your GitHub OAuth App form fields, <strong>or</strong> you can use{" "}
              <strong>GitHub Device Flow below</strong> which connects via <code className="text-emerald-300">github.com/login/device</code> with zero callback URLs!
            </p>
          </div>

          {/* Section 1: GitHub Connector */}
          <div className="p-5 bg-[#080B11] border border-slate-800 rounded-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  1. Connect Your GitHub Account
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Choose Device Code Flow (no callback URI needed) or Popup OAuth
                </p>
              </div>

              {!ghStatus.connected && (
                <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-lg self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setAuthMethod("device")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                      authMethod === "device"
                        ? "bg-amber-500 text-slate-950 font-semibold"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Device Code Flow (Recommended)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMethod("popup")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                      authMethod === "popup"
                        ? "bg-amber-500 text-slate-950 font-semibold"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Popup Redirect Flow
                  </button>
                </div>
              )}

              {ghStatus.connected && ghStatus.user && (
                <div className="flex items-center gap-3">
                  <div className="text-right text-xs">
                    <div className="font-semibold text-emerald-400">
                      Connected as @{ghStatus.user.login}
                    </div>
                    <div className="text-[11px] text-slate-400">{ghStatus.user.name}</div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDisconnectGitHub}
                    className="px-3 py-1.5 text-xs font-medium text-rose-300 bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800/60 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Disconnect</span>
                  </button>
                </div>
              )}
            </div>

            {authError && (
              <div className="p-3.5 bg-rose-950/40 border border-rose-800/70 rounded-lg flex items-start gap-2.5 text-xs text-rose-200">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-semibold">GitHub Authentication Notice</div>
                  <div>{authError}</div>
                </div>
              </div>
            )}

            {/* Connected View: Push Form */}
            {ghStatus.connected && ghStatus.user ? (
              <form onSubmit={handlePushToGitHub} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">
                      Target Repository Name ({ghStatus.user.login}/...)
                    </label>
                    <input
                      type="text"
                      value={repoName}
                      onChange={(e) => setRepoName(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Commit Message</label>
                    <input
                      type="text"
                      value={commitMessage}
                      onChange={(e) => setCommitMessage(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-amber-500"
                    />
                    <span>Create as Private Repository</span>
                  </label>

                  <button
                    type="submit"
                    disabled={isPushing}
                    className="px-4 py-2.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
                  >
                    {isPushing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Committing {Object.keys(sourceFiles).length} Files...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4" />
                        <span>
                          Create &amp; Push {Object.keys(sourceFiles).length} Files to GitHub
                        </span>
                      </>
                    )}
                  </button>
                </div>

                {pushResult && (
                  <div className="p-3.5 bg-emerald-950/40 border border-emerald-800/70 rounded-lg flex items-center justify-between gap-4 text-xs text-emerald-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        Successfully pushed <strong>{pushResult.committedCount}</strong> files to{" "}
                        <code className="font-mono text-emerald-300">{pushResult.repoUrl}</code>
                      </span>
                    </div>
                    <a
                      href={pushResult.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-md flex items-center gap-1.5 whitespace-nowrap shrink-0"
                    >
                      <span>View on GitHub</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </form>
            ) : authMethod === "device" ? (
              /* Method A: GitHub Device Flow (Works on all mobile/tablet browsers without callback URLs!) */
              <div className="space-y-4">
                <div className="text-xs text-slate-300 space-y-1.5">
                  <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4" />
                    <span>Zero-Redirect GitHub Device Activation (Best for Mobile/Tablet)</span>
                  </div>
                  <p className="text-slate-400">
                    1. In your GitHub OAuth App settings (<code className="text-slate-200">github.com/settings/developers</code>), check the box{" "}
                    <strong>&quot;Enable Device Flow&quot;</strong> and click Save. (You can set Homepage URL to{" "}
                    <code className="text-slate-200">https://github.com</code>).
                  </p>
                  <p className="text-slate-400">
                    2. Paste your GitHub OAuth App <strong>Client ID</strong> below (or set{" "}
                    <code className="text-slate-200">GITHUB_CLIENT_ID</code> in AI Studio Secrets) and click{" "}
                    <strong>Generate 8-Digit Device Code</strong>.
                  </p>
                </div>

                {!deviceSession ? (
                  <form onSubmit={handleStartDeviceFlow} className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      type="text"
                      value={clientIdInput}
                      onChange={(e) => setClientIdInput(e.target.value)}
                      placeholder="Paste GitHub OAuth Client ID (e.g. Ov23li...)"
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="submit"
                      disabled={isConnecting}
                      className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors whitespace-nowrap shrink-0"
                    >
                      {isConnecting ? "Requesting Code..." : "Generate 8-Digit Device Code"}
                    </button>
                  </form>
                ) : (
                  <div className="p-4 bg-slate-900 border border-amber-500/40 rounded-xl space-y-3 text-center">
                    <div className="text-xs text-slate-300">
                      Copy this 8-character code and enter it at{" "}
                      <a
                        href={deviceSession.verification_uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-400 underline font-semibold"
                      >
                        {deviceSession.verification_uri}
                      </a>
                    </div>
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-2xl font-mono font-bold tracking-widest text-amber-300 bg-slate-950 px-4 py-2 rounded-lg border border-slate-800">
                        {deviceSession.user_code}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(deviceSession.user_code, "user-code")}
                        className="px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg flex items-center gap-1.5"
                      >
                        {copiedKey === "user-code" ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Code</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="flex items-center justify-center gap-3 pt-1">
                      <a
                        href={deviceSession.verification_uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg inline-flex items-center gap-1.5"
                      >
                        <span>Open github.com/login/device</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <span className="text-xs text-slate-400 flex items-center gap-1.5">
                        <RefreshCw className={`w-3.5 h-3.5 ${isPollingDevice ? "animate-spin text-amber-400" : ""}`} />
                        <span>Waiting for authorization...</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Method B: Standard OAuth Callback URL Flow */
              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-slate-200">
                    Copy-only OAuth App Registration Values (do not open in browser):
                  </div>
                  <button
                    type="button"
                    onClick={handleConnectGitHubPopup}
                    disabled={isConnecting}
                    className="px-3.5 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors"
                  >
                    {isConnecting ? "Opening Popup..." : "Launch GitHub Popup"}
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-2 font-mono text-[11px]">
                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between gap-2">
                    <div className="truncate">
                      <span className="text-slate-400 font-sans">Development Callback URL: </span>
                      <span className="text-amber-300">{DEV_CALLBACK_URL}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(DEV_CALLBACK_URL, "dev-cb")}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded shrink-0 flex items-center gap-1"
                    >
                      {copiedKey === "dev-cb" ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>Copy</span>
                    </button>
                  </div>

                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between gap-2">
                    <div className="truncate">
                      <span className="text-slate-400 font-sans">Shared/Deployed Callback URL: </span>
                      <span className="text-amber-300">{SHARED_CALLBACK_URL}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(SHARED_CALLBACK_URL, "shared-cb")}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded shrink-0 flex items-center gap-1"
                    >
                      {copiedKey === "shared-cb" ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>Copy</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Zero-OAuth Offline Bundle & Self-Extracting Script */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-amber-400" />
              <span>2. Offline Alternative: Download Self-Extracting Repository Bundle</span>
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleDownloadBootstrapScript}
                disabled={loading}
                className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Download Repo Installer (setup-auraos-repo.mjs)</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadSpecJson}
                className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Download Full Architecture &amp; Source JSON</span>
              </button>
            </div>
          </div>

          {/* Section 3: Browse & Copy Individual Source Files */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  3. Inspect or Copy Individual Repository Files ({Object.keys(sourceFiles).length}{" "}
                  files)
                </span>
              </div>
              {selectedFile && sourceFiles[selectedFile] && (
                <button
                  type="button"
                  onClick={() => handleCopy(sourceFiles[selectedFile], selectedFile)}
                  className="px-2.5 py-1 text-xs font-mono text-slate-300 hover:text-white bg-slate-800 rounded flex items-center gap-1.5 transition-colors"
                >
                  {copiedKey === selectedFile ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied {selectedFile}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy {selectedFile}</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {Object.keys(sourceFiles).map((filePath) => (
                <button
                  key={filePath}
                  type="button"
                  onClick={() => setSelectedFile(filePath)}
                  className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors whitespace-nowrap ${
                    selectedFile === filePath
                      ? "bg-amber-500 text-slate-950 border-amber-500 font-semibold"
                      : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                  }`}
                >
                  {filePath}
                </button>
              ))}
            </div>

            <pre className="p-4 bg-[#080B11] border border-slate-800 rounded-lg text-[11px] font-mono text-slate-300 overflow-x-auto max-h-56 leading-relaxed">
              {loading
                ? "Loading project source tree..."
                : sourceFiles[selectedFile] || "Select a file above to view its source."}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
