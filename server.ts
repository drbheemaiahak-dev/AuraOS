import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "2mb" }));

  // In-memory store for the active GitHub OAuth session token & user profile
  let githubSession: {
    accessToken: string;
    user: { login: string; name: string | null; avatar_url: string; html_url: string };
    connectedAt: string;
  } | null = null;

  const PROJECT_SOURCE_FILES = [
    "README.md",
    "LICENSE",
    "package.json",
    "tsconfig.json",
    "vite.config.ts",
    "index.html",
    "metadata.json",
    ".env.example",
    ".gitignore",
    "server.ts",
    "src/main.tsx",
    "src/index.css",
    "src/App.tsx",
    "src/data/auraData.ts",
    "src/components/AuraLandingView.tsx",
    "src/components/AuraShellView.tsx",
    "src/components/AuraFsView.tsx",
    "src/components/AuraPkgView.tsx",
    "src/components/AuraArchitectureView.tsx",
    "src/components/GitHubExportModal.tsx",
  ];

  async function readAllProjectFiles(): Promise<Record<string, string>> {
    const fs = await import("fs/promises");
    const projectFiles: Record<string, string> = {};
    for (const relPath of PROJECT_SOURCE_FILES) {
      try {
        const fullPath = path.join(__dirname, relPath);
        projectFiles[relPath] = await fs.readFile(fullPath, "utf-8");
      } catch {
        // Skip if file does not exist
      }
    }
    return projectFiles;
  }

  function getRedirectUri(req: express.Request): string {
    const queryOrigin = typeof req.query.origin === "string" ? req.query.origin : "";
    const baseUrl = (
      process.env.APP_URL && process.env.APP_URL !== "MY_APP_URL"
        ? process.env.APP_URL
        : queryOrigin || `${req.protocol}://${req.get("host")}`
    ).replace(/\/$/, "");
    return `${baseUrl}/auth/callback`;
  }

  // 1. Construct GitHub OAuth Authorization URL (Popup opens GitHub directly)
  app.get("/api/auth/github/url", (req, res) => {
    const clientId = process.env.GITHUB_CLIENT_ID || process.env.CLIENT_ID || "";
    const redirectUri = getRedirectUri(req);

    if (!clientId) {
      return res.status(400).json({
        error: "GITHUB_CLIENT_ID is not configured in AI Studio Secrets.",
        configured: false,
        redirectUri,
      });
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: "repo read:user",
    });

    const authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
    res.json({ url: authUrl, configured: true, redirectUri });
  });

  // 1b. GitHub OAuth Device Flow (Zero Callback URL required — user enters 8-digit code at github.com/login/device)
  app.post("/api/auth/github/device/start", async (req, res) => {
    const clientId =
      req.body?.clientId?.trim() ||
      process.env.GITHUB_CLIENT_ID ||
      process.env.CLIENT_ID ||
      "";

    if (!clientId) {
      return res.status(400).json({
        error: "Please provide your GitHub OAuth App Client ID (or set GITHUB_CLIENT_ID in Secrets).",
      });
    }

    try {
      const deviceRes = await fetch("https://github.com/login/device/code", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          scope: "repo read:user",
        }),
      });

      const deviceData: any = await deviceRes.json();
      if (!deviceRes.ok || !deviceData.device_code) {
        throw new Error(
          deviceData.error_description ||
            deviceData.error ||
            "Failed to initiate GitHub Device Flow. Ensure 'Enable Device Flow' is checked in your GitHub OAuth App settings."
        );
      }

      res.json({
        clientId,
        device_code: deviceData.device_code,
        user_code: deviceData.user_code,
        verification_uri: deviceData.verification_uri || "https://github.com/login/device",
        expires_in: deviceData.expires_in,
        interval: deviceData.interval || 5,
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to start GitHub Device Flow" });
    }
  });

  app.post("/api/auth/github/device/poll", async (req, res) => {
    const { device_code, clientId: bodyClientId } = req.body || {};
    const clientId =
      bodyClientId?.trim() ||
      process.env.GITHUB_CLIENT_ID ||
      process.env.CLIENT_ID ||
      "";

    if (!device_code || !clientId) {
      return res.status(400).json({ error: "Missing device_code or clientId" });
    }

    try {
      const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          device_code,
          grant_type: "urn:ietf:params:oauth:grant-type:device_code",
        }),
      });

      const tokenData: any = await tokenRes.json();
      if (tokenData.error) {
        // 'authorization_pending' or 'slow_down' are normal while waiting for user
        return res.json({
          pending: tokenData.error === "authorization_pending" || tokenData.error === "slow_down",
          error: tokenData.error,
          error_description: tokenData.error_description,
        });
      }

      if (!tokenData.access_token) {
        return res.status(400).json({ error: "No access_token returned from GitHub" });
      }

      const userRes = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "AuraOS-GitHub-Connector",
        },
      });

      if (!userRes.ok) {
        throw new Error("Failed to fetch GitHub user profile");
      }

      const userData: any = await userRes.json();
      githubSession = {
        accessToken: tokenData.access_token,
        user: {
          login: userData.login,
          name: userData.name || userData.login,
          avatar_url: userData.avatar_url,
          html_url: userData.html_url,
        },
        connectedAt: new Date().toISOString(),
      };

      res.json({
        connected: true,
        user: githubSession.user,
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to poll GitHub Device Flow" });
    }
  });

  // 2. GitHub OAuth Callback Handler (Exchanges code for token & posts message to opener)
  const githubCallbackHandler = async (req: express.Request, res: express.Response) => {
    const code = typeof req.query.code === "string" ? req.query.code : "";
    const clientId = process.env.GITHUB_CLIENT_ID || process.env.CLIENT_ID || "";
    const clientSecret = process.env.GITHUB_CLIENT_SECRET || process.env.CLIENT_SECRET || "";

    if (!code || !clientId || !clientSecret) {
      return res.status(400).send(`
        <html>
          <body style="font-family: system-ui, sans-serif; background: #0B0F17; color: #f1f5f9; padding: 2rem;">
            <h3>GitHub OAuth Configuration Incomplete</h3>
            <p>Missing authorization code or GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET in environment variables.</p>
          </body>
        </html>
      `);
    }

    try {
      const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
        }),
      });

      const tokenData: any = await tokenRes.json();
      if (!tokenData.access_token) {
        throw new Error(tokenData.error_description || tokenData.error || "Failed to obtain access_token");
      }

      const userRes = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "AuraOS-GitHub-Connector",
        },
      });

      if (!userRes.ok) {
        throw new Error("Failed to fetch authenticated GitHub user profile");
      }

      const userData: any = await userRes.json();
      githubSession = {
        accessToken: tokenData.access_token,
        user: {
          login: userData.login,
          name: userData.name || userData.login,
          avatar_url: userData.avatar_url,
          html_url: userData.html_url,
        },
        connectedAt: new Date().toISOString(),
      };

      res.send(`
        <html>
          <body style="font-family: system-ui, sans-serif; background: #0B0F17; color: #f1f5f9; padding: 2rem; text-align: center;">
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', provider: 'github' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>GitHub authentication successful (@${userData.login}). This window will close automatically.</p>
          </body>
        </html>
      `);
    } catch (err: any) {
      res.status(500).send(`
        <html>
          <body style="font-family: system-ui, sans-serif; background: #0B0F17; color: #f1f5f9; padding: 2rem;">
            <h3>GitHub Authentication Error</h3>
            <p>${err?.message || "Failed to complete OAuth token exchange."}</p>
          </body>
        </html>
      `);
    }
  };

  app.get(["/auth/callback", "/auth/callback/"], githubCallbackHandler);

  // 3. Check GitHub Connection Status
  app.get("/api/github/status", (req, res) => {
    const clientIdConfigured = Boolean(process.env.GITHUB_CLIENT_ID || process.env.CLIENT_ID);
    const clientSecretConfigured = Boolean(
      process.env.GITHUB_CLIENT_SECRET || process.env.CLIENT_SECRET
    );
    res.json({
      connected: Boolean(githubSession),
      user: githubSession?.user || null,
      connectedAt: githubSession?.connectedAt || null,
      oauthConfigured: clientIdConfigured && clientSecretConfigured,
      redirectUri: getRedirectUri(req),
    });
  });

  // 4. Disconnect GitHub Account
  app.post("/api/github/disconnect", (_req, res) => {
    githubSession = null;
    res.json({ connected: false });
  });

  // 5. Create Repository & Push All AuraOS Project Files via GitHub REST API
  app.post("/api/github/push", async (req, res) => {
    if (!githubSession?.accessToken) {
      return res.status(401).json({ error: "Not connected to GitHub. Please connect your GitHub account first." });
    }

    const {
      repoName = "auraos-local-first-linux-wasm",
      description = "AuraOS — Local-First Linux & WebAssembly OS Workbench (aurash, aurafs, aurapkg)",
      isPrivate = false,
      commitMessage = "feat: initial commit of AuraOS architecture & workbench",
    } = req.body || {};

    const cleanRepoName = String(repoName).trim().replace(/[^a-zA-Z0-9._-]/g, "-");
    const token = githubSession.accessToken;
    const owner = githubSession.user.login;
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "AuraOS-GitHub-Connector",
    };

    try {
      // Check if repository already exists, otherwise create it cleanly with auto_init: true
      let repoUrl = `https://github.com/${owner}/${cleanRepoName}`;
      const checkRes = await fetch(`https://api.github.com/repos/${owner}/${cleanRepoName}`, {
        headers,
      });

      if (checkRes.status === 404) {
        const createRes = await fetch("https://api.github.com/user/repos", {
          method: "POST",
          headers,
          body: JSON.stringify({
            name: cleanRepoName,
            description,
            private: Boolean(isPrivate),
            auto_init: true,
          }),
        });
        const createdData: any = await createRes.json();
        if (!createRes.ok) {
          throw new Error(createdData.message || "Failed to create GitHub repository");
        }
        repoUrl = createdData.html_url || repoUrl;
      }

      // Read all project files and commit them to the repository
      const projectFiles = await readAllProjectFiles();
      const committedFiles: string[] = [];

      for (const [filePath, content] of Object.entries(projectFiles)) {
        // Check if file already exists in repo to get its sha
        let existingSha: string | undefined;
        const fileCheck = await fetch(
          `https://api.github.com/repos/${owner}/${cleanRepoName}/contents/${filePath}`,
          { headers }
        );
        if (fileCheck.ok) {
          const fileMeta: any = await fileCheck.json();
          existingSha = fileMeta.sha;
        }

        const putRes = await fetch(
          `https://api.github.com/repos/${owner}/${cleanRepoName}/contents/${filePath}`,
          {
            method: "PUT",
            headers,
            body: JSON.stringify({
              message: commitMessage,
              content: Buffer.from(content, "utf-8").toString("base64"),
              ...(existingSha ? { sha: existingSha } : {}),
            }),
          }
        );

        if (putRes.ok) {
          committedFiles.push(filePath);
        }
      }

      res.json({
        success: true,
        repoUrl,
        owner,
        repoName: cleanRepoName,
        committedCount: committedFiles.length,
        committedFiles,
      });
    } catch (err: any) {
      res.status(500).json({
        error: err?.message || "Failed to push project files to GitHub repository.",
      });
    }
  });

  // Export full project source files for GitHub / local repository initialization
  app.get("/api/export/project-source", async (_req, res) => {
    try {
      const projectFiles = await readAllProjectFiles();
      res.json({
        repository_name: "auraos-local-first-linux-wasm",
        files: projectFiles,
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to read project source files" });
    }
  });

  // AuraShell (aurash) Intent Execution Endpoint using server-side Gemini API
  app.post("/api/aurash/translate", async (req, res) => {
    const { query, cwd, files, installedPackages } = req.body;

    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Missing natural language query." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      // Deterministic local heuristic fallback if API key is not configured
      return res.json(buildFallbackTranslation(query, cwd, files, installedPackages));
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const systemPrompt = `You are aurash, the offline-first LLM Natural Language Shell for AuraOS (running quantized Llama-3-8B-Instruct / Qwen-2.5-7B Q4_K_M engine).
Translate the user's plain English intent into a deterministic AuraOS shell command pipeline.

Current System Context:
- Current Working Directory: ${cwd || "/documents/work"}
- Files in aurafs (SQLite JSON1 + FTS5 store): ${JSON.stringify(
        (files || []).map((f: any) => ({
          path: f.path,
          mime_type: f.mime_type,
          size_bytes: f.size_bytes,
          modified_at: f.modified_at,
          attributes: f.attributes,
        }))
      )}
- Installed aurapkg content-addressable packages: ${JSON.stringify(
        (installedPackages || []).map((p: any) => ({
          package: p.package,
          version: p.version,
          llm_prompt_bindings: p.llm_prompt_bindings,
        }))
      )}

Supported AuraOS CLI tools & POSIX utilities:
1. aurafs query --where "<condition>" (e.g. attributes.project == 'AuraOS' AND modified_at > '2026-01-01')
2. aurafs inspect <path>
3. aurafs tag <path> <key>=<value>
4. aurapkg install <pkg> | aurapkg verify <pkg> | aurapkg list
5. Standard POSIX utilities: ls, cat, grep, tar, find, rm, chmod, dd, ffmpeg, sqlite3, zstd, git, ripgrep.

Safety Interlock Rules:
- Read-only actions (ls, cat, grep, find, aurafs query, aurafs inspect, aurapkg list, aurapkg verify):
  risk_score = "Low", requires_confirmation = false, safe_read_only = true.
- State-altering or write operations (tar, ffmpeg, aurafs tag, aurapkg install, cp, mv):
  risk_score = "Medium", requires_confirmation = true, safe_read_only = false.
- Destructive or system-critical operations (rm, dd, chmod, mkfs, wipe):
  risk_score = "Critical", requires_confirmation = true, safe_read_only = false.

Return strict JSON matching the requested schema.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: `Translate this user intent into an AuraOS command: "${query}"`,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              intent_summary: {
                type: Type.STRING,
                description: "Concise 1-sentence technical explanation of what the command pipeline does.",
              },
              target_command: {
                type: Type.STRING,
                description: "The exact shell command or pipeline to execute in AuraOS.",
              },
              risk_score: {
                type: Type.STRING,
                description: "Safety risk level: 'Low', 'Medium', or 'Critical'.",
              },
              risk_reason: {
                type: Type.STRING,
                description: "Why this risk score was assigned by the determinism check & sandbox evaluator.",
              },
              requires_confirmation: {
                type: Type.BOOLEAN,
                description: "True if state-altering or destructive ([Y/n] prompt required), false if safe read-only.",
              },
              safe_read_only: {
                type: Type.BOOLEAN,
                description: "True if command only reads state and can execute immediately.",
              },
              matched_lora_binding: {
                type: Type.STRING,
                description: "If an aurapkg llm_prompt_binding was used (e.g. ffmpeg:convert), specify it, or 'none'.",
              },
              simulated_stdout: {
                type: Type.STRING,
                description: "Realistic terminal output when this command executes against the provided aurafs files.",
              },
            },
            required: [
              "intent_summary",
              "target_command",
              "risk_score",
              "risk_reason",
              "requires_confirmation",
              "safe_read_only",
              "matched_lora_binding",
              "simulated_stdout",
            ],
          },
        },
      });

      const text = response.text;
      if (!text) {
        return res.json(buildFallbackTranslation(query, cwd, files, installedPackages));
      }
      const parsed = JSON.parse(text.trim());
      return res.json({
        ...parsed,
        engine: "llama.cpp (wasm-simd / Q4_K_M)",
      });
    } catch (error: any) {
      console.error("AuraShell translation error:", error?.message || error);
      // Propagate fallback with error note if API call fails
      const fallback = buildFallbackTranslation(query, cwd, files, installedPackages);
      return res.json({
        ...fallback,
        warning: error?.message || "LLM translation fallback triggered",
      });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AuraOS Server running on http://0.0.0.0:${PORT}`);
  });
}

function buildFallbackTranslation(
  query: string,
  cwd = "/documents/work",
  files: any[] = [],
  _installedPackages: any[] = []
) {
  const q = query.toLowerCase();
  if (q.includes("compress") && q.includes("log")) {
    return {
      intent_summary: "Archive and compress all system log files modified in the last 7 days into logs.tar.gz.",
      target_command: "aurafs query --where \"mime_type == 'text/plain' AND path LIKE '/var/log/%'\" --exec \"tar -czf logs.tar.gz\"",
      risk_score: "Medium",
      risk_reason: "Creates a new archive file (logs.tar.gz) in the current working directory.",
      requires_confirmation: true,
      safe_read_only: false,
      matched_lora_binding: "zstd:archive_logs",
      simulated_stdout: `[aurafs-fuse] Matched 2 log documents (/var/log/kernel_boot.log, /var/log/aurash_audit.log)\n[tar] Compressing 148,224 bytes -> /documents/work/logs.tar.gz (ratio 4.1x)\n[aurafs] Indexed new document uuid=c92a110e-88b1-42c9-9901-00a0c91e6bf6`,
      engine: "llama.cpp (wasm-simd / Q4_K_M)",
    };
  }
  if (q.includes("rm") || q.includes("delete") || q.includes("remove") || q.includes("wipe") || q.includes("dd")) {
    return {
      intent_summary: "Permanently remove matching documents from the aurafs SQLite store and unlink FUSE nodes.",
      target_command: `rm -rf ${cwd}/temp_drafts/*`,
      risk_score: "Critical",
      risk_reason: "Destructive state-altering operation (rm -rf) unlinks blocks from SQLite JSON1 store.",
      requires_confirmation: true,
      safe_read_only: false,
      matched_lora_binding: "none",
      simulated_stdout: `[sandbox] Unlinked target nodes from /documents/work/temp_drafts/\n[aurafs] Vacuumed 524,288 bytes from SQLite OPFS block store.`,
      engine: "llama.cpp (wasm-simd / Q4_K_M)",
    };
  }
  if (q.includes("audio") || q.includes("mp3") || q.includes("ffmpeg") || q.includes("convert")) {
    return {
      intent_summary: "Extract audio stream from video recording using ffmpeg LoRA prompt binding.",
      target_command: "ffmpeg -i /media/demo_session.mp4 -vn -acodec libmp3lame /media/demo_audio.mp3",
      risk_score: "Medium",
      risk_reason: "Writes transcoded audio stream to /media/demo_audio.mp3.",
      requires_confirmation: true,
      safe_read_only: false,
      matched_lora_binding: "ffmpeg:extract_audio",
      simulated_stdout: `Input #0, mov,mp4,m4a, from '/media/demo_session.mp4':\n  Duration: 00:02:14.50, bitrate: 1840 kb/s\nOutput #0, mp3, to '/media/demo_audio.mp3':\n  Stream #0:0: Audio: mp3 (libmp3lame), 44100 Hz, stereo, 192 kb/s\n[aurafs] Created document /media/demo_audio.mp3 (3,244,032 bytes)`,
      engine: "llama.cpp (wasm-simd / Q4_K_M)",
    };
  }
  if (q.includes("auraos") || q.includes("project") || q.includes("draft") || q.includes("find") || q.includes("search")) {
    const matched = files.filter((f) => f.attributes?.project === "AuraOS");
    return {
      intent_summary: "Query aurafs SQLite JSON1 index for documents where attributes.project equals 'AuraOS'.",
      target_command: `aurafs query --where "attributes.project == 'AuraOS' AND modified_at > '2026-01-01'"`,
      risk_score: "Low",
      risk_reason: "Read-only structured SQLite JSON1 + FTS5 query with zero filesystem mutation.",
      requires_confirmation: false,
      safe_read_only: true,
      matched_lora_binding: "aurafs:structured_query",
      simulated_stdout: matched.length
        ? matched.map((f) => `${f.uuid}  ${f.size_bytes.toString().padStart(9, " ")} B  ${f.path}  [status=${f.attributes?.status || "active"}]`).join("\n")
        : `f81d4fae-7dec-11d0-a765-00a0c91e6bf6  1048576 B  /documents/work/project_proposal.pdf  [status=draft]`,
      engine: "llama.cpp (wasm-simd / Q4_K_M)",
    };
  }

  return {
    intent_summary: `Execute read-only inspection for "${query}" across ${cwd}.`,
    target_command: `aurafs query --where "content_summary MATCH '${query.replace(/'/g, "")}'"`,
    risk_score: "Low",
    risk_reason: "Safe read-only FTS5 virtual table query.",
    requires_confirmation: false,
    safe_read_only: true,
    matched_lora_binding: "aurafs:fts5_search",
    simulated_stdout: files
      .slice(0, 4)
      .map((f) => `${f.uuid.slice(0, 8)}..  ${f.mime_type.padEnd(18, " ")}  ${f.path}`)
      .join("\n"),
    engine: "llama.cpp (wasm-simd / Q4_K_M)",
  };
}

startServer();
