import React, { useState } from "react";
import { Package, CheckCircle2, RefreshCw, ShieldCheck, HardDrive, Share2 } from "lucide-react";
import { AuraPackageManifest } from "../data/auraData";

interface AuraPkgViewProps {
  packages: AuraPackageManifest[];
  onToggleInstall: (pkgName: string) => void;
}

export const AuraPkgView: React.FC<AuraPkgViewProps> = ({
  packages,
  onToggleInstall,
}) => {
  const [selectedPkgName, setSelectedPkgName] = useState<string>(packages[0].package);
  const [syncChannel, setSyncChannel] = useState<"ALL" | "ISO-Immutable" | "mDNS-Peer" | "USB-Sync">("ALL");
  const [verifyNotice, setVerifyNotice] = useState<string | null>(null);
  const [isSyncingPeers, setIsSyncingPeers] = useState(false);

  const filteredPackages = packages.filter((p) =>
    syncChannel === "ALL" ? true : p.sync_source === syncChannel
  );

  const selectedPkg =
    packages.find((p) => p.package === selectedPkgName) || filteredPackages[0] || packages[0];

  const handleVerifyHash = (pkg: AuraPackageManifest) => {
    setVerifyNotice(
      `Verified ${pkg.package}-${pkg.version} (${pkg.hash.slice(0, 24)}...) against ${pkg.signature_ed25519.slice(0, 28)}... — Merkle tree intact.`
    );
  };

  const handleTriggerPeerSync = () => {
    setIsSyncingPeers(true);
    setTimeout(() => {
      setIsSyncingPeers(false);
      setVerifyNotice(
        "mDNS + Wi-Fi Direct Discovery complete: Synced 5 .apkx manifests with local peer node [fe80::a1b2:c3d4] over zero-WAN link."
      );
    }, 600);
  };

  const installedSizeMb = packages
    .filter((p) => p.installed)
    .reduce((acc, p) => acc + p.size_mb, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="text-xs text-slate-400 flex items-center gap-2 mb-1">
            <span>Component 3</span>
            <span aria-hidden="true">·</span>
            <span>Nix / ostree Content-Addressable Store (/aurastore/pkg)</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              {installedSizeMb.toFixed(1)} MB mounted read-only
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            Offline Content-Addressable Package Manager (aurapkg)
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto">
          <button
            type="button"
            onClick={handleTriggerPeerSync}
            disabled={isSyncingPeers}
            className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-700 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            <Share2 className={`w-3.5 h-3.5 text-amber-400 ${isSyncingPeers ? "animate-spin" : ""}`} />
            <span>{isSyncingPeers ? "Scanning mDNS Peers..." : "Sync Offline mDNS / USB Repo"}</span>
          </button>
        </div>
      </div>

      {verifyNotice && (
        <div className="p-3.5 bg-emerald-950/40 border border-emerald-800/70 rounded-xl flex items-center justify-between gap-4 text-xs text-emerald-200 font-mono">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{verifyNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setVerifyNotice(null)}
            className="text-emerald-400 hover:text-emerald-200 shrink-0 font-sans"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Bar for Offline Distribution Channels */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-lg">
          {(["ALL", "ISO-Immutable", "mDNS-Peer", "USB-Sync"] as const).map((ch) => (
            <button
              key={ch}
              type="button"
              onClick={() => setSyncChannel(ch)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                syncChannel === ch
                  ? "bg-amber-500 text-slate-950 font-semibold"
                  : "text-slate-400 hover:text-slate-100"
              }`}
            >
              {ch === "ALL" ? "All Offline Bundles (.apkx)" : ch}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Store Mount: <span className="text-slate-200">/aurastore/pkg/&lt;sha256&gt;-&lt;name&gt;-&lt;ver&gt;/</span>
        </div>
      </div>

      {/* Main Split: Package Store List (Left 7 cols) + Reproducible aura.json Manifest (Right 5 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* Left: Content-Addressable Store Table */}
        <div className="xl:col-span-7 bg-[#111827] border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between">
          <div className="divide-y divide-slate-800">
            {filteredPackages.map((pkg) => {
              const isSelected = selectedPkg.package === pkg.package;
              return (
                <div
                  key={pkg.package}
                  onClick={() => setSelectedPkgName(pkg.package)}
                  className={`p-4 cursor-pointer transition-colors ${
                    isSelected ? "bg-amber-500/10" : "hover:bg-slate-900/70"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="font-mono font-bold text-sm text-slate-100">
                          {pkg.package}
                        </span>
                        <span className="font-mono text-xs text-slate-400">
                          v{pkg.version}
                        </span>
                        <span className="text-slate-600" aria-hidden="true">
                          ·
                        </span>
                        <span className="text-xs text-slate-400">{pkg.binary_format}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{pkg.description}</p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVerifyHash(pkg);
                        }}
                        className="px-2.5 py-1.5 text-xs font-mono text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-md transition-colors whitespace-nowrap"
                      >
                        Verify SHA-256
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleInstall(pkg.package);
                        }}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                          pkg.installed
                            ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/25"
                            : "bg-amber-500 text-slate-950 hover:bg-amber-400"
                        }`}
                      >
                        {pkg.installed ? "Mounted in /aurastore" : "Mount .apkx"}
                      </button>
                    </div>
                  </div>

                  {/* Metadata Line (Zero-Pill Unboxed Text) */}
                  <div className="mt-3 pt-2.5 border-t border-slate-800/70 flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-400">
                    <span>{pkg.store_path}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{pkg.size_mb.toFixed(1)} MB</span>
                    <span aria-hidden="true">·</span>
                    <span>Source: {pkg.sync_source}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-amber-400">
                      {Object.keys(pkg.llm_prompt_bindings).length} LoRA Prompt Binding(s)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="px-4 py-3 bg-slate-900/50 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <HardDrive className="w-3.5 h-3.5 text-slate-400" />
              <span>Immutable Content-Addressable Store</span>
            </div>
            <span className="font-mono text-[11px]">ed25519 Signature Enforcement: Strict</span>
          </div>
        </div>

        {/* Right: Reproducible Build File (aura.json) & LoRA Prompt Adapter Inspector */}
        <div className="xl:col-span-5 bg-[#111827] border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400 font-mono">
                  Reproducible Build Manifest (aura.json)
                </div>
                <h2 className="text-base font-bold text-slate-100 font-mono mt-0.5">
                  {selectedPkg.package}-{selectedPkg.version}.apkx
                </h2>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            </div>

            <pre className="p-4 bg-[#080B11] border border-slate-800 rounded-lg text-[11px] font-mono text-emerald-300 overflow-x-auto leading-relaxed">
              {JSON.stringify(
                {
                  package: selectedPkg.package,
                  version: selectedPkg.version,
                  hash: selectedPkg.hash,
                  dependencies: selectedPkg.dependencies,
                  llm_prompt_bindings: selectedPkg.llm_prompt_bindings,
                },
                null,
                2
              )}
            </pre>

            {/* Quantized LLM Micro-Tool Adapters (LoRAs) Breakdown */}
            <div className="space-y-2.5 pt-2">
              <h3 className="text-xs font-semibold text-slate-200">
                Bundled Quantized LLM Micro-Tool Adapters (LoRA Prompt Bindings)
              </h3>
              <p className="text-xs text-slate-400">
                When <code className="text-amber-300">{selectedPkg.package}</code> is mounted in{" "}
                <code className="text-slate-300">/aurastore/pkg</code>, <code className="text-amber-300">aurash</code>{" "}
                registers these deterministic command templates:
              </p>
              <div className="space-y-2">
                {Object.entries(selectedPkg.llm_prompt_bindings).map(([actionKey, template]) => (
                  <div
                    key={actionKey}
                    className="p-2.5 bg-[#080B11] border border-slate-800 rounded-lg font-mono text-xs"
                  >
                    <div className="text-amber-400 font-semibold">{actionKey}</div>
                    <div className="text-slate-300 mt-1 break-all">{template}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>Signature: {selectedPkg.signature_ed25519.slice(0, 26)}...</span>
            <span className="font-mono text-emerald-400">VERIFIED</span>
          </div>
        </div>
      </div>
    </div>
  );
};
