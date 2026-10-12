export interface AuraFileEntity {
  uuid: string;
  name: string;
  path: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
  modified_at: string;
  attributes: {
    author: string;
    project: string;
    status: "draft" | "verified" | "immutable" | "archived";
    [key: string]: string;
  };
  content_summary: string;
  raw_content: string;
  vector_embedding: number[];
}

export interface AuraPackageManifest {
  package: string;
  version: string;
  hash: string;
  store_path: string;
  binary_format: "WASM-SIMD" | "ELF-x86_64" | "Hybrid-APKX";
  size_mb: number;
  installed: boolean;
  signature_ed25519: string;
  sync_source: "ISO-Immutable" | "mDNS-Peer" | "USB-Sync";
  dependencies: string[];
  llm_prompt_bindings: Record<string, string>;
  description: string;
}

export interface ShellHistoryEntry {
  id: string;
  timestamp: string;
  mode: "direct" | "intent";
  raw_input: string;
  translated_command?: string;
  intent_summary?: string;
  risk_score?: "Low" | "Medium" | "Critical";
  risk_reason?: string;
  requires_confirmation?: boolean;
  confirmed?: "pending" | "approved" | "aborted" | "auto";
  matched_lora_binding?: string;
  stdout: string;
  structured_json?: Record<string, any>;
}

export const INITIAL_AURAFS_FILES: AuraFileEntity[] = [
  {
    uuid: "f81d4fae-7dec-11d0-a765-00a0c91e6bf6",
    name: "project_proposal.pdf",
    path: "/documents/work/project_proposal.pdf",
    mime_type: "application/pdf",
    size_bytes: 1048576,
    created_at: "2026-10-12T09:35:00Z",
    modified_at: "2026-10-12T09:35:00Z",
    attributes: {
      author: "Alice",
      project: "AuraOS",
      status: "draft",
      subsystem: "architecture",
    },
    content_summary:
      "Technical blueprint for next-generation Linux operating system with LLM integrated, SQLite FUSE file system, and CheerpX WebAssembly runtime.",
    raw_content: `AURAOS TECHNICAL SPECIFICATION (DRAFT v1.4)
Author: Alice | Project: AuraOS | Target: Native DRM-KMS & Browser WASM

1. Natural Language Shell (aurash):
   - Hybrid Bash/Intent shell backed by llama.cpp (Q4_K_M ~4.5GB).
   - Enforces JSON grammar decoding and sandbox risk evaluation before state-altering execution.

2. Structured File System (aurafs):
   - SQLite + JSON1 + FTS5 storage mounted via Rust FUSE daemon.
   - POSIX syscalls (open, read, write) bridge seamlessly to relational document rows.`,
    vector_embedding: [0.012, -0.043, 0.891, 0.214, -0.118, 0.642],
  },
  {
    uuid: "a49c210b-4412-4e8a-9b12-1190c91e6a01",
    name: "aurafs_fuse_daemon.rs",
    path: "/src/aurafs/aurafs_fuse_daemon.rs",
    mime_type: "text/x-rust",
    size_bytes: 48120,
    created_at: "2026-09-28T14:12:00Z",
    modified_at: "2026-10-10T18:40:00Z",
    attributes: {
      author: "Alice",
      project: "AuraOS",
      status: "verified",
      subsystem: "aurafs",
    },
    content_summary:
      "Rust FUSE daemon implementation mapping POSIX open/read/write syscalls to SQLite JSON1 virtual tables and OPFS block persistence.",
    raw_content: `use fuser::{Filesystem, Request, ReplyAttr, ReplyData, ReplyEntry, ReplyDirectory};
use rusqlite::{Connection, params};

pub struct AuraFsDaemon {
    pub db: Connection,
    pub mountpoint: String,
}

impl Filesystem for AuraFsDaemon {
    fn lookup(&mut self, _req: &Request, parent: u64, name: &std::ffi::OsStr, reply: ReplyEntry) {
        // Resolves virtual inode via SQLite JSON1 path index
        let sql = "SELECT uuid, size_bytes, json_extract(attributes, '$.status') FROM files WHERE name = ?1";
        // ...
    }
}`,
    vector_embedding: [0.341, 0.128, -0.019, 0.774, 0.095, -0.312],
  },
  {
    uuid: "b72e891c-901a-4c3f-8a55-22b0c91e6b14",
    name: "aura.json",
    path: "/etc/aurapkg/aura.json",
    mime_type: "application/json",
    size_bytes: 4096,
    created_at: "2026-08-15T11:00:00Z",
    modified_at: "2026-10-11T08:20:00Z",
    attributes: {
      author: "Bob",
      project: "AuraOS",
      status: "immutable",
      subsystem: "aurapkg",
    },
    content_summary:
      "Declarative content-addressable package manifest locking SHA-256 store hashes and quantized LoRA micro-tool prompt bindings.",
    raw_content: JSON.stringify(
      {
        package: "ffmpeg",
        version: "6.1.1",
        hash: "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        dependencies: [
          "sha256:a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4",
          "sha256:d4e5f6a1b2c30718293a4b5c6d7e8f90d4e5f6a1",
        ],
        llm_prompt_bindings: {
          convert: "ffmpeg -i {input} {output_format}",
          extract_audio: "ffmpeg -i {input} -vn -acodec libmp3lame {output}",
        },
      },
      null,
      2
    ),
    vector_embedding: [-0.112, 0.512, 0.409, -0.204, 0.731, 0.185],
  },
  {
    uuid: "d19f302e-118b-4d90-bc21-44d0c91e6c88",
    name: "kernel_boot.log",
    path: "/var/log/kernel_boot.log",
    mime_type: "text/plain",
    size_bytes: 94208,
    created_at: "2026-10-05T06:00:00Z",
    modified_at: "2026-10-11T07:15:00Z",
    attributes: {
      author: "runit",
      project: "Kernel",
      status: "verified",
      subsystem: "init",
    },
    content_summary:
      "Systemd-less runit init sequence log showing DRM-KMS framebuffer initialization, FUSE mount of /aurastore, and llama.cpp Vulkan context.",
    raw_content: `[    0.000000] Linux version 6.11.2-auraos-minimal (rustc 1.82.0) #1 SMP PREEMPT_DYNAMIC
[    0.184210] drm-kms: Direct Rendering Manager initialized on virtio-gpu0 (2560x1440@60Hz)
[    0.312004] runit: booting stage-1 /etc/runit/1 (systemd-less fast init)
[    0.490112] aurafs-fuse: mounted SQLite JSON1+FTS5 database at / (OPFS backed, 6 documents)
[    0.618440] aurapkg-cas: verified /aurastore/pkg read-only tree (ed25519 signatures OK)
[    0.842900] aurash-daemon: loaded Qwen-2.5-7B-Instruct-Q4_K_M.gguf (4.48 GiB) via wasm-simd`,
    vector_embedding: [0.601, -0.289, 0.114, 0.052, -0.491, 0.338],
  },
  {
    uuid: "e55a901f-62c3-411b-9e08-88f0c91e6d99",
    name: "aurash_audit.log",
    path: "/var/log/aurash_audit.log",
    mime_type: "text/plain",
    size_bytes: 54016,
    created_at: "2026-10-06T12:00:00Z",
    modified_at: "2026-10-11T19:45:00Z",
    attributes: {
      author: "aurash",
      project: "AuraOS",
      status: "verified",
      subsystem: "security",
    },
    content_summary:
      "Deterministic sandbox evaluation log recording natural language intent translations, risk scores, and user [Y/n] confirmations.",
    raw_content: `2026-10-11T19:12:04Z | MODE=INTENT | QUERY="list all draft AuraOS files" | CMD="aurafs query --where \\"attributes.project == 'AuraOS' AND attributes.status == 'draft'\\"" | RISK=Low | EXEC=AUTO
2026-10-11T19:30:19Z | MODE=INTENT | QUERY="wipe old core dumps" | CMD="rm -rf /var/crash/*" | RISK=Critical | USER_CONFIRM=ABORTED
2026-10-11T19:45:00Z | MODE=DIRECT | CMD="aurapkg verify ffmpeg" | RISK=Low | EXEC=AUTO`,
    vector_embedding: [0.219, -0.311, 0.518, 0.412, -0.088, 0.279],
  },
  {
    uuid: "c33b771a-89d4-4f22-a109-99a0c91e6f42",
    name: "demo_session.mp4",
    path: "/media/demo_session.mp4",
    mime_type: "video/mp4",
    size_bytes: 14680064,
    created_at: "2026-09-19T16:20:00Z",
    modified_at: "2026-10-09T11:10:00Z",
    attributes: {
      author: "Elena",
      project: "Media",
      status: "draft",
      subsystem: "demo",
    },
    content_summary:
      "Screen capture of Aura-Web booting inside Chromium via CheerpX x86-to-WASM JIT compiler with zero network connectivity.",
    raw_content: `[Binary MP4 Container — H.264 High Profile 1920x1080 @ 60fps | Audio: AAC-LC 48kHz Stereo | Duration: 00:02:14.50]`,
    vector_embedding: [-0.412, 0.089, 0.194, -0.611, 0.302, 0.519],
  },
];

export const INITIAL_AURAPKG_STORE: AuraPackageManifest[] = [
  {
    package: "ffmpeg",
    version: "6.1.1",
    hash: "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    store_path: "/aurastore/pkg/e3b0c44298fc-ffmpeg-6.1.1/",
    binary_format: "Hybrid-APKX",
    size_mb: 34.2,
    installed: true,
    signature_ed25519: "ed25519:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
    sync_source: "ISO-Immutable",
    dependencies: [
      "sha256:a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4 (libmp3lame-3.100)",
      "sha256:d4e5f6a1b2c30718293a4b5c6d7e8f90d4e5f6a1 (libavcodec-60.31)",
    ],
    llm_prompt_bindings: {
      convert: "ffmpeg -i {input} {output_format}",
      extract_audio: "ffmpeg -i {input} -vn -acodec libmp3lame {output}",
      trim_clip: "ffmpeg -ss {start} -to {end} -i {input} -c copy {output}",
    },
    description: "Complete cross-platform multimedia transcoder with quantized LoRA prompt bindings for aurash.",
  },
  {
    package: "llama-cpp-aurash",
    version: "3.4.0-q4km",
    hash: "sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
    store_path: "/aurastore/pkg/7f83b1657ff1-llama-cpp-aurash-3.4.0-q4km/",
    binary_format: "WASM-SIMD",
    size_mb: 4480.0,
    installed: true,
    signature_ed25519: "ed25519:4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a",
    sync_source: "ISO-Immutable",
    dependencies: [
      "sha256:88c9102fa311b09c4412890ab12cd34ef560192a (wasi-sdk-24.0)",
      "sha256:19f02a3b4c5d6e7f8091a2b3c4d5e6f708192a3b (webgpu-dawn-0.19)",
    ],
    llm_prompt_bindings: {
      translate_intent: "aurash --grammar json_schema.gbnf --prompt {user_intent}",
      audit_risk: "aurash --sandbox-eval {command_pipeline}",
    },
    description: "Static C++ & WebAssembly SIMD inference engine shipping Qwen-2.5-7B / Llama-3-8B Q4_K_M weights.",
  },
  {
    package: "aurafs-sqlite-fuse",
    version: "1.2.0",
    hash: "sha256:2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae",
    store_path: "/aurastore/pkg/2c26b46b68ff-aurafs-sqlite-fuse-1.2.0/",
    binary_format: "Hybrid-APKX",
    size_mb: 12.8,
    installed: true,
    signature_ed25519: "ed25519:ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d",
    sync_source: "ISO-Immutable",
    dependencies: [
      "sha256:55a66b77c88d99e00f11a22b33c44d55e66f7788 (sqlite-json1-fts5-3.46)",
      "sha256:99f88e77d66c55b44a33f22e11d00c99b88a7766 (rust-fuser-0.14)",
    ],
    llm_prompt_bindings: {
      structured_query: "aurafs query --where \"{sql_json_predicate}\"",
      fts5_search: "aurafs query --fts \"{keywords}\"",
    },
    description: "Rust FUSE daemon and SQLite JSON1/FTS5 storage engine with browser OPFS persistence adapter.",
  },
  {
    package: "ripgrep-aura",
    version: "14.1.1",
    hash: "sha256:4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce",
    store_path: "/aurastore/pkg/4e07408562be-ripgrep-aura-14.1.1/",
    binary_format: "WASM-SIMD",
    size_mb: 6.4,
    installed: true,
    signature_ed25519: "ed25519:6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b",
    sync_source: "mDNS-Peer",
    dependencies: [
      "sha256:31a42b53c64d75e86f970a1b2c3d4e5f6a7b8c9d (pcre2-jit-wasm-10.43)",
    ],
    llm_prompt_bindings: {
      regex_scan: "rg --json -e \"{pattern}\" {target_path}",
    },
    description: "SIMD-accelerated recursive regex search tool integrated with aurafs JSON document attributes.",
  },
  {
    package: "zstd-cas-sync",
    version: "1.5.6",
    hash: "sha256:d4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35",
    store_path: "/aurastore/pkg/d4735e3a265e-zstd-cas-sync-1.5.6/",
    binary_format: "ELF-x86_64",
    size_mb: 4.9,
    installed: false,
    signature_ed25519: "ed25519:d4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35",
    sync_source: "USB-Sync",
    dependencies: [
      "sha256:88c9102fa311b09c4412890ab12cd34ef560192a (wasi-sdk-24.0)",
    ],
    llm_prompt_bindings: {
      archive_logs: "tar --zstd -cf {archive_name}.tar.zst {source_glob}",
      decompress_bundle: "zstd -d {bundle_file} -o {output_path}",
    },
    description: "Fast content-addressable delta compressor for offline USB and peer-to-peer mDNS repository sync.",
  },
];

export const TECH_STACK_MATRIX = [
  {
    subsystem: "Kernel / System",
    technologies: "Minimal Linux Kernel + systemd-less init (runit)",
    language: "C / Rust",
    storageFormat: "Custom ISO / SquashFS",
    details: "Boots in <450ms via runit stage-1 scripts directly into DRM-KMS framebuffer or headless WASM JIT.",
  },
  {
    subsystem: "LLM Shell (aurash)",
    technologies: "llama.cpp, WebGPU (Native/Web), xterm.js",
    language: "C++ / Rust / TS",
    storageFormat: "GGUF model formats (Q4_K_M ~4.5 GB)",
    details: "Enforces GBNF grammar-constrained JSON output and deterministic sandbox risk scoring before execution.",
  },
  {
    subsystem: "JSON File System (aurafs)",
    technologies: "FUSE, SQLite (JSON1 + FTS5), OPFS",
    language: "Rust",
    storageFormat: "SQLite database + JSON + Vector Embeddings",
    details: "Bridges standard POSIX open/read/write syscalls with relational JSON queries and 384-d semantic vectors.",
  },
  {
    subsystem: "Package Manager (aurapkg)",
    technologies: "Content-Addressable Storage (CAS), ed25519 signatures",
    language: "Rust",
    storageFormat: ".apkx bundles / JSON manifests",
    details: "Immutable /aurastore/pkg/<hash>-<name>-<ver>/ layout with bundled LLM micro-tool LoRA prompt adapters.",
  },
  {
    subsystem: "Browser Virtualization",
    technologies: "WebAssembly, WASI, CheerpX JIT",
    language: "Rust / WASM / C",
    storageFormat: "IndexedDB / OPFS storage",
    details: "Zero-server x86-to-WASM JIT execution with dedicated WebWorkers for LLM inference and SQLite OPFS.",
  },
];

export const IMPLEMENTATION_ROADMAP = [
  {
    phase: "Phase 1: Core Engine",
    targetWindow: "Q1 — Foundation",
    tasks: [
      {
        id: "p1-t1",
        title: "Compile SQLite FUSE filesystem daemon (aurafs MVP)",
        subsystem: "aurafs",
        completed: true,
        deliverable: "aurafs-fuse binary with JSON1 + FTS5 virtual table schema",
      },
      {
        id: "p1-t2",
        title: "Build basic Rust CLI wrapper around llama.cpp for system calls",
        subsystem: "aurash",
        completed: true,
        deliverable: "Static C++/Rust FFI bindings with Vulkan & WASM SIMD targets",
      },
      {
        id: "p1-t3",
        title: "Establish JSON package spec (.apkx)",
        subsystem: "aurapkg",
        completed: true,
        deliverable: "aura.json schema with SHA-256 DAG & llm_prompt_bindings",
      },
    ],
  },
  {
    phase: "Phase 2: Shell & System Integration",
    targetWindow: "Q2 — Native OS",
    tasks: [
      {
        id: "p2-t1",
        title: "Develop aurash with constrained JSON decoding and safe execution hooks",
        subsystem: "aurash",
        completed: true,
        deliverable: "Low/Medium/Critical determinism check & [Y/n] sandbox gate",
      },
      {
        id: "p2-t2",
        title: "Create offline package store and dependency resolution pipeline",
        subsystem: "aurapkg",
        completed: true,
        deliverable: "Read-only /aurastore/pkg CAS mount with ed25519 verification",
      },
      {
        id: "p2-t3",
        title: "Assemble minimal headless Linux kernel + busybox image",
        subsystem: "kernel",
        completed: true,
        deliverable: "6.11-auraos kernel + runit stage-1/2/3 init scripts",
      },
    ],
  },
  {
    phase: "Phase 3: WebAssembly Port",
    targetWindow: "Q3 — Aura-Web",
    tasks: [
      {
        id: "p3-t1",
        title: "Target Linux rootfs image to CheerpX/WASM execution runtime",
        subsystem: "aura-web",
        completed: true,
        deliverable: "x86-to-WASM JIT block streaming image in browser tab",
      },
      {
        id: "p3-t2",
        title: "Bind aurafs to IndexedDB/OPFS browser storage",
        subsystem: "aurafs",
        completed: true,
        deliverable: "WebWorker 2 synchronous OPFS VFS for SQLite WASM",
      },
      {
        id: "p3-t3",
        title: "Load quantized LLM into browser WebGPU/WASM thread",
        subsystem: "aurash",
        completed: false,
        deliverable: "WebWorker 1 chunked GGUF loader with WebGPU compute shaders",
      },
    ],
  },
  {
    phase: "Phase 4: Optimization & Offline Packaging",
    targetWindow: "Q4 — Air-Gapped Distribution",
    tasks: [
      {
        id: "p4-t1",
        title: "Implement PWA offline caching via Service Workers",
        subsystem: "aura-web",
        completed: false,
        deliverable: "Cache-first Service Worker for WASM kernel & GGUF shards",
      },
      {
        id: "p4-t2",
        title: "Build USB/Local Network syncing for aurapkg offline repositories",
        subsystem: "aurapkg",
        completed: false,
        deliverable: "mDNS + Wi-Fi Direct peer-to-peer CAS delta exchange",
      },
      {
        id: "p4-t3",
        title: "Establish multi-modal local indexing for natural language file searches",
        subsystem: "aurafs",
        completed: false,
        deliverable: "Automated background vector_embedding generator on file write",
      },
    ],
  },
];
