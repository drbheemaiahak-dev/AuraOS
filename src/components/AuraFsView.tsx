import React, { useState, useMemo } from "react";
import { Database, Search, Plus, FileText, Code, Trash2 } from "lucide-react";
import { AuraFileEntity } from "../data/auraData";

interface AuraFsViewProps {
  files: AuraFileEntity[];
  onAddFile: (file: AuraFileEntity) => void;
  onDeleteFile: (uuid: string) => void;
}

const PRESET_QUERIES = [
  {
    label: "All Documents",
    clause: "",
  },
  {
    label: "project == 'AuraOS' AND modified > 2026-01-01",
    clause: "attributes.project == 'AuraOS' AND modified_at > '2026-01-01'",
  },
  {
    label: "status == 'draft'",
    clause: "attributes.status == 'draft'",
  },
  {
    label: "author == 'Alice'",
    clause: "attributes.author == 'Alice'",
  },
  {
    label: "size_bytes > 50000",
    clause: "size_bytes > 50000",
  },
];

export const AuraFsView: React.FC<AuraFsViewProps> = ({
  files,
  onAddFile,
  onDeleteFile,
}) => {
  const [whereClause, setWhereClause] = useState(
    "attributes.project == 'AuraOS' AND modified_at > '2026-01-01'"
  );
  const [ftsKeyword, setFtsKeyword] = useState("");
  const [selectedUuid, setSelectedUuid] = useState<string>(files[0]?.uuid || "");
  const [inspectorTab, setInspectorTab] = useState<"json" | "posix" | "fuse">("json");
  const [showNewModal, setShowNewModal] = useState(false);

  // New document state
  const [newName, setNewName] = useState("network_sync_spec.md");
  const [newPath, setNewPath] = useState("/documents/work/network_sync_spec.md");
  const [newAuthor, setNewAuthor] = useState("Alice");
  const [newProject, setNewProject] = useState("AuraOS");
  const [newStatus, setNewStatus] = useState<"draft" | "verified" | "immutable">("draft");
  const [newSummary, setNewSummary] = useState(
    "Specification for mDNS + Wi-Fi Direct offline peer-to-peer package synchronization."
  );

  // Evaluate structured query + FTS5 filter
  const filteredFiles = useMemo(() => {
    return files.filter((file) => {
      // Check FTS5 keyword
      if (ftsKeyword.trim()) {
        const kw = ftsKeyword.toLowerCase();
        const matchFts =
          file.name.toLowerCase().includes(kw) ||
          file.path.toLowerCase().includes(kw) ||
          file.content_summary.toLowerCase().includes(kw) ||
          file.raw_content.toLowerCase().includes(kw) ||
          Object.values(file.attributes).some((v) => v.toLowerCase().includes(kw));
        if (!matchFts) return false;
      }

      // Check structured WHERE clause predicates
      const q = whereClause.trim();
      if (!q) return true;

      const conditions = q.split(/\s+AND\s+/i);
      return conditions.every((cond) => {
        const eqMatch = cond.match(/([\w.]+)\s*==\s*'([^']+)'/);
        if (eqMatch) {
          const [, field, val] = eqMatch;
          if (field.startsWith("attributes.")) {
            const attrKey = field.replace("attributes.", "");
            return file.attributes[attrKey]?.toLowerCase() === val.toLowerCase();
          }
          return String((file as any)[field] || "").toLowerCase() === val.toLowerCase();
        }

        const gtNumMatch = cond.match(/([\w.]+)\s*>\s*(\d+)/);
        if (gtNumMatch) {
          const [, field, numStr] = gtNumMatch;
          return Number((file as any)[field] || 0) > Number(numStr);
        }

        const gtDateMatch = cond.match(/([\w.]+)\s*>\s*'([^']+)'/);
        if (gtDateMatch) {
          const [, field, dateStr] = gtDateMatch;
          return String((file as any)[field] || "") > dateStr;
        }

        // Fallback substring check
        return JSON.stringify(file).toLowerCase().includes(cond.replace(/['"]/g, "").toLowerCase());
      });
    });
  }, [files, whereClause, ftsKeyword]);

  const selectedFile =
    files.find((f) => f.uuid === selectedUuid) || filteredFiles[0] || files[0];

  const handleCreateDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPath.trim()) return;
    const created: AuraFileEntity = {
      uuid: `${Math.random().toString(16).slice(2, 10)}-7dec-11d0-a765-00a0c91e6bf6`,
      name: newName.trim(),
      path: newPath.trim().startsWith("/") ? newPath.trim() : `/${newPath.trim()}`,
      mime_type: newName.endsWith(".pdf")
        ? "application/pdf"
        : newName.endsWith(".json")
        ? "application/json"
        : "text/markdown",
      size_bytes: Math.floor(4096 + Math.random() * 98304),
      created_at: new Date().toISOString(),
      modified_at: new Date().toISOString(),
      attributes: {
        author: newAuthor || "Alice",
        project: newProject || "AuraOS",
        status: newStatus,
      },
      content_summary: newSummary,
      raw_content: `# ${newName}\nAuthor: ${newAuthor} | Project: ${newProject} | Status: ${newStatus}\n\n${newSummary}`,
      vector_embedding: [
        Number((Math.random() * 2 - 1).toFixed(3)),
        Number((Math.random() * 2 - 1).toFixed(3)),
        Number((Math.random() * 2 - 1).toFixed(3)),
        Number((Math.random() * 2 - 1).toFixed(3)),
        Number((Math.random() * 2 - 1).toFixed(3)),
      ],
    };
    onAddFile(created);
    setSelectedUuid(created.uuid);
    setShowNewModal(false);
  };

  const totalBytes = files.reduce((acc, f) => acc + f.size_bytes, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="text-xs text-slate-400 flex items-center gap-2 mb-1">
            <span>Component 2</span>
            <span aria-hidden="true">·</span>
            <span>SQLite (JSON1 + FTS5) + Rust FUSE Daemon</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              {files.length} documents ({(totalBytes / (1024 * 1024)).toFixed(2)} MiB mounted)
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            Structured JSON File System (aurafs)
          </h1>
        </div>

        <div className="flex items-center gap-3 self-start lg:self-auto">
          <button
            type="button"
            onClick={() => setShowNewModal(!showNewModal)}
            className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Index New JSON Document</span>
          </button>
        </div>
      </div>

      {/* Optional Modal / Inline Drawer to Index a New JSON Document */}
      {showNewModal && (
        <form
          onSubmit={handleCreateDocument}
          className="p-5 bg-[#111827] border border-slate-700 rounded-xl space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-semibold text-slate-100">
              Write New Document to SQLite JSON1 + FUSE Store
            </h2>
            <button
              type="button"
              onClick={() => setShowNewModal(false)}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">File Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  setNewPath(`/documents/work/${e.target.value}`);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">POSIX FUSE Mount Path</label>
              <input
                type="text"
                value={newPath}
                onChange={(e) => setNewPath(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-slate-400 mb-1">Author</label>
                <input
                  type="text"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Project</label>
                <input
                  type="text"
                  value={newProject}
                  onChange={(e) => setNewProject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-slate-100"
                >
                  <option value="draft">draft</option>
                  <option value="verified">verified</option>
                  <option value="immutable">immutable</option>
                </select>
              </div>
            </div>
          </div>
          <div className="text-xs">
            <label className="block text-slate-400 mb-1">
              Content Summary (Indexed in SQLite FTS5 & 384-d Vector Embedding)
            </label>
            <input
              type="text"
              value={newSummary}
              onChange={(e) => setNewSummary(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
            >
              Commit Document & Generate Embedding
            </button>
          </div>
        </form>
      )}

      {/* Structured CLI Query Bar */}
      <div className="p-4 bg-[#111827] border border-slate-800 rounded-xl space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 flex items-center bg-[#080B11] border border-slate-800 rounded-lg px-3 py-2 font-mono text-xs">
            <span className="text-amber-400 shrink-0 mr-2">aurafs query --where &quot;</span>
            <input
              type="text"
              value={whereClause}
              onChange={(e) => setWhereClause(e.target.value)}
              placeholder="attributes.project == 'AuraOS' AND modified_at > '2026-01-01'"
              className="flex-1 bg-transparent text-slate-100 focus:outline-none"
            />
            <span className="text-amber-400 shrink-0 ml-1">&quot;</span>
          </div>

          <div className="w-full lg:w-72 flex items-center bg-[#080B11] border border-slate-800 rounded-lg px-3 py-2 text-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
            <input
              type="text"
              value={ftsKeyword}
              onChange={(e) => setFtsKeyword(e.target.value)}
              placeholder="FTS5 full-text search..."
              className="flex-1 bg-transparent text-slate-100 focus:outline-none"
            />
          </div>
        </div>

        {/* Preset Query Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 mr-1">Saved Predicates:</span>
          {PRESET_QUERIES.map((q, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setWhereClause(q.clause)}
              className={`px-2.5 py-1 text-xs font-mono rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                whereClause === q.clause
                  ? "bg-amber-500/15 border-amber-500/50 text-amber-300"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split: SQLite Document Table (Left 7 cols) + JSON/POSIX Inspector (Right 5 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* Left: High-Density Relational JSON Table */}
        <div className="xl:col-span-7 bg-[#111827] border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-medium text-slate-400 bg-slate-900/60">
                  <th className="py-3 px-4">POSIX Path (FUSE)</th>
                  <th className="py-3 px-3">Project · Author</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Size (Bytes)</th>
                  <th className="py-3 px-4 text-right">Modified (UTC)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-xs">
                {filteredFiles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-400">
                      <div className="space-y-2">
                        <div>No JSON documents matched the current SQLite JSON1 predicate.</div>
                        <button
                          type="button"
                          onClick={() => {
                            setWhereClause("");
                            setFtsKeyword("");
                          }}
                          className="px-3 py-1.5 text-xs font-medium bg-slate-800 text-slate-200 rounded-md hover:bg-slate-700"
                        >
                          Reset Query Predicate
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredFiles.map((doc) => {
                    const isSelected = selectedFile?.uuid === doc.uuid;
                    return (
                      <tr
                        key={doc.uuid}
                        onClick={() => setSelectedUuid(doc.uuid)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-amber-500/10 text-slate-100"
                            : "hover:bg-slate-900/70 text-slate-300"
                        }`}
                      >
                        <td className="py-3 px-4 font-mono text-xs">
                          <div className="font-medium text-slate-100 truncate max-w-[240px]">
                            {doc.path}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            uuid: {doc.uuid.slice(0, 13)}...
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                          <span>{doc.attributes.project}</span>
                          <span className="mx-1.5 text-slate-600" aria-hidden="true">
                            ·
                          </span>
                          <span className="text-slate-400">{doc.attributes.author}</span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`font-mono text-xs ${
                              doc.attributes.status === "verified"
                                ? "text-emerald-400"
                                : doc.attributes.status === "immutable"
                                ? "text-sky-400"
                                : "text-amber-400"
                            }`}
                          >
                            {doc.attributes.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-300 whitespace-nowrap">
                          {doc.size_bytes.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-400 whitespace-nowrap">
                          {doc.modified_at.slice(0, 10)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 bg-slate-900/50 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing <strong className="text-slate-200 tabular-nums">{filteredFiles.length}</strong> of{" "}
              <strong className="text-slate-200 tabular-nums">{files.length}</strong> SQLite JSON1 documents
            </span>
            <span className="font-mono text-[11px]">OPFS Block Persistence: Active</span>
          </div>
        </div>

        {/* Right: Document Metadata, Vector Embedding & FUSE Syscall Inspector */}
        {selectedFile && (
          <div className="xl:col-span-5 bg-[#111827] border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <div className="text-xs text-slate-400 font-mono">{selectedFile.uuid}</div>
                  <h2 className="text-base font-bold text-slate-100 font-mono mt-0.5">
                    {selectedFile.path}
                  </h2>
                </div>
                {selectedFile.attributes.status !== "immutable" && (
                  <button
                    type="button"
                    onClick={() => onDeleteFile(selectedFile.uuid)}
                    title="Unlink document from aurafs"
                    className="px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 border border-slate-800 rounded-md flex items-center gap-1 transition-colors shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Unlink</span>
                  </button>
                )}
              </div>

              {/* Inspector Mode Tabs */}
              <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-lg">
                <button
                  type="button"
                  onClick={() => setInspectorTab("json")}
                  className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
                    inspectorTab === "json"
                      ? "bg-slate-800 text-amber-400 shadow-xs"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>JSON Entity Schema</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInspectorTab("posix")}
                  className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
                    inspectorTab === "posix"
                      ? "bg-slate-800 text-amber-400 shadow-xs"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>POSIX Stream (cat)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInspectorTab("fuse")}
                  className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
                    inspectorTab === "fuse"
                      ? "bg-slate-800 text-amber-400 shadow-xs"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>FUSE Syscall Trace</span>
                </button>
              </div>

              {inspectorTab === "json" && (
                <pre className="p-4 bg-[#080B11] border border-slate-800 rounded-lg text-[11px] font-mono text-emerald-300 overflow-x-auto leading-relaxed max-h-[340px]">
                  {JSON.stringify(
                    {
                      uuid: selectedFile.uuid,
                      name: selectedFile.name,
                      path: selectedFile.path,
                      mime_type: selectedFile.mime_type,
                      size_bytes: selectedFile.size_bytes,
                      created_at: selectedFile.created_at,
                      modified_at: selectedFile.modified_at,
                      attributes: selectedFile.attributes,
                      content_summary: selectedFile.content_summary,
                      vector_embedding: [...selectedFile.vector_embedding, "... (384-d float32)"],
                    },
                    null,
                    2
                  )}
                </pre>
              )}

              {inspectorTab === "posix" && (
                <div className="space-y-2">
                  <div className="text-xs font-mono text-slate-400">
                    $ cat {selectedFile.path}
                  </div>
                  <pre className="p-4 bg-[#080B11] border border-slate-800 rounded-lg text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed max-h-[310px] overflow-y-auto">
                    {selectedFile.raw_content}
                  </pre>
                </div>
              )}

              {inspectorTab === "fuse" && (
                <div className="space-y-2 text-xs font-mono">
                  <div className="p-3 bg-[#080B11] border border-slate-800 rounded-lg space-y-2 text-slate-300">
                    <div className="text-amber-400">
                      1. POSIX Syscall Intercept (Rust fuser v0.14)
                    </div>
                    <div>
                      open(&quot;{selectedFile.path}&quot;, O_RDONLY) → FUSE opcode=FUSE_OPEN (inode=0x
                      {selectedFile.uuid.slice(0, 6)})
                    </div>
                    <div className="text-amber-400 pt-2">
                      2. SQLite JSON1 Virtual Table Resolution
                    </div>
                    <div className="text-emerald-300">
                      SELECT raw_blob, json_extract(attributes, &apos;$.status&apos;) FROM aurafs_nodes WHERE path = &apos;
                      {selectedFile.path}&apos;;
                    </div>
                    <div className="text-amber-400 pt-2">
                      3. Browser OPFS / Kernel Page Cache Return
                    </div>
                    <div>
                      read(fd=4, buf, {selectedFile.size_bytes}) → {selectedFile.size_bytes} bytes returned in 0.18ms
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>MIME: {selectedFile.mime_type}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                Embedding Norm: L2=1.000 (Cosine Ready)
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
