# AuraOS — The Cinematic Multimedia Linux & WebAssembly OS

**Author:** Dr. Anil K (Kumar) Bheemaiah — **Synergy Robotics**  
**License:** MIT License

**AuraOS** is a lightweight, local-first multimedia Linux distribution and zero-server WebAssembly workstation engineered for film colorists, broadcast audio engineers, media pipeline architects, and air-gapped creative studios. Built around a deterministic offline LLM shell (`aurash`), a structured SQLite + FUSE JSON media file system (`aurafs`), and a content-addressable package store (`aurapkg`) with quantized LoRA prompt adapters for `ffmpeg` and DSP pipelines.

---

## 1. System Architecture Overview

```text
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
```

---

## 2. Why AuraOS for Multimedia & Studio Production?

- **Sub-Millisecond Low-Jitter Kernel**: Custom Linux 6.11 kernel with `PREEMPT_DYNAMIC`, `runit` stage-1/2 init (`<450ms` cold boot), and direct `DRM-KMS` framebuffer rendering without systemd daemon overhead.
- **Natural Language Media Pipelines (`aurash`)**: Express complex multi-stream `ffmpeg`, `sox`, and `zstd` transcoding jobs in plain English. `aurash` translates intent into deterministic commands via `llama.cpp` (`Q4_K_M`) and enforces a `[Y/n]` sandbox gate before touching studio master files.
- **Semantic Media Asset Management (`aurafs`)**: Every video clip, audio stem, and project file is indexed in an embedded SQLite (`JSON1` + `FTS5`) database with 384-dimensional vector embeddings while remaining 100% POSIX-compatible via a Rust FUSE daemon.
- **Reproducible Studio Toolchains (`aurapkg`)**: Content-addressable `.apkx` bundles lock exact `SHA-256` binary trees (`ffmpeg-6.1.1`, `libavcodec`, `pipewire-dsp`) and ship with quantized LoRA micro-tool prompt bindings.
- **Zero-Server Browser Workstation (`Aura-Web`)**: Boot the entire multimedia Linux environment inside any modern browser tab via CheerpX x86-to-WASM JIT, WebGPU compute shaders, and Origin Private File System (OPFS) block storage.

---

## 3. Core Component Specifications

### Component 1: Offline LLM Natural Language Shell (`aurash`)
- **Engine**: Built on `llama.cpp` with Vulkan/ROCm/CUDA GPU acceleration on native studio hardware and `wasm-simd` + WebGPU in the browser edition.
- **Default Model**: Quantized 7B instruction-tuned model (`Qwen-2.5-7B-Instruct` or `Llama-3-8B-Instruct` at `Q4_K_M` ~4.48 GB).
- **Safety Interlocks**:
  - **Low Risk (Read-Only)**: `ls`, `cat`, `aurafs query`, `aurapkg verify` execute immediately.
  - **Medium Risk (Media Transcode / Archive)**: `ffmpeg`, `tar`, `aurafs tag` preview the exact pipeline and require `[Y/n]` confirmation.
  - **Critical Risk (Destructive)**: `rm`, `dd`, `chmod` trigger a high-contrast sandbox lock.

### Component 2: Structured JSON File System (`aurafs`)
All studio assets are stored as queryable JSON documents backed by SQLite (`JSON1` + `FTS5`) and mounted via a Rust `fuser` daemon:

```bash
# Traditional POSIX syscall access for legacy DAWs and NLEs
cat /documents/work/project_proposal.pdf

# Structured JSON & metadata querying for production pipelines
aurafs query --where "attributes.project == 'AuraOS' AND modified_at > '2026-01-01'"
```

### Component 3: Content-Addressable Package Manager (`aurapkg`)
Packages live in `/aurastore/pkg/<sha256>-<name>-<version>/` and include declarative `llm_prompt_bindings` in `aura.json`:

```json
{
  "package": "ffmpeg",
  "version": "6.1.1",
  "hash": "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "dependencies": [
    "sha256:a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4",
    "sha256:d4e5f6a1b2c30718293a4b5c6d7e8f90d4e5f6a1"
  ],
  "llm_prompt_bindings": {
    "convert": "ffmpeg -i {input} {output_format}",
    "extract_audio": "ffmpeg -i {input} -vn -acodec libmp3lame {output}"
  }
}
```

### Component 4: WebAssembly Browser OS (`Aura-Web`)
- **Virtualization**: CheerpX x86-to-WebAssembly JIT compiler + WASI runtime.
- **Persistent Storage**: Mounts browser Origin Private File System (OPFS) and IndexedDB for synchronous SQLite block storage.
- **Offline PWA**: Service Worker caches WASM modules, rootfs blocks, and `.gguf` model shards after first load.

---

## 4. Quick Start (Development & Local Workbench)

```bash
# 1. Install dependencies
npm install

# 2. Start the full-stack Express + Vite workbench on port 3000
npm run dev

# 3. Build for production
npm run build
```

## 5. Authorship & License

**Authored by:** Dr. Anil K (Kumar) Bheemaiah, Synergy Robotics

```text
MIT License

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
SOFTWARE.
```

