# Securas Inference — Architecture Walkthrough

A dependency-free, static presentation website for a guided tour of the Securas Inference platform.

## Run locally

**Windows** (Python installed):

```powershell
cd securas-inference-presentation
py -m http.server 8000
```

**Linux / macOS:**

```bash
cd securas-inference-presentation
python3 -m http.server 8000
```

Open **http://localhost:8000**.

Alternatively, opening `index.html` directly works in most browsers because the app uses no API calls or imports, but the local server better matches deployment.

## Navigation

- Overview presents the project context and architecture layers.
- Use the left sidebar for all section navigation (including Overview).
- Overview cards are informational, not links. Pages have no previous/next buttons or keyboard page shortcuts.
- Hash routes (`#/hardware`) work with static hosting such as GitHub Pages.

## Files

- `index.html`: website shell.
- `styles.css`: appearance and responsive layout.
- `app.js`: section definitions, content and navigation.
- `assets/hardware-reference/`: original reference photographs supplied for the hardware topic, preserved but intentionally not displayed yet.

## GitHub repository

Repository: https://github.com/bassem-ch007/securas-inference-presentation

The connected GitHub integration can update this repository. From your existing local clone, retrieve the latest edits:

```bash
git pull origin main
```

For local changes, commit and push them from your machine. Do not commit credentials, tokens, `.env` secrets, or private deployment configs.

## Editing the content

Update the `layers` array near the top of `app.js`: title, summary, focus topics and order. The Overview and placeholder detail sections derive from this data. Hardware content and reference images remain on hold until reviewed together.

## Visual design (V0.2)

White background, green/blue accents, larger readable typography and spacious layouts. No dependencies or build step. Hardware section remains a placeholder until reviewed.

## Hardware & Experiments photos (V0.6)

The three final machine photos already live at `assets/hardware-reference/` and are included in normal pulls.

The four newly supplied historical experiment photos have been organized into a separate image bundle, because the connected GitHub integration can edit source files but does not accept local binary photo uploads. Extract `securas-hardware-photos-ready-to-commit.zip` from the accompanying ChatGPT response directly into the project root, so these exact files exist:

- `assets/hardware/motherboard-layout.png`
- `assets/hardware/single-gpu-prototype.jpeg`
- `assets/hardware/psu-jumper.jpeg`
- `assets/hardware/psu-cabling.jpeg`

Then publish the images once:

```bash
git add assets/hardware
git commit -m "assets: add hardware experiment photos"
git push origin main
```

After this one-time upload, all seven images will be available from GitHub by `git pull`, without extra setup.

## Hardware story V0.7

The hardware page uses the original motherboard, prototype, PSU jumper, and PSU cabling images at `assets/hardware/`, and three machine photos already stored at `assets/hardware-reference/`.

Below the PCIe bandwidth experiment, the page now explains **Pipeline Parallelism (PP)** versus **Tensor Parallelism (TP)** with side-by-side two-GPU conceptual diagrams and the implications of PCIe x1 risers.

To install the four historical photos, extract the image archive into the repository root (preserving paths), then commit and push the `assets/hardware` folder. This is required once because this connector cannot directly transfer the uploaded binary files into GitHub.

## Ansible operations page (Section 07)

Open `http://localhost:8000/#/ansible` using the same static Python server.

This presentation section is implemented (no build process, dependencies or production API access):

- An execution pipeline: Admin UI → FastAPI + PostgreSQL → restricted systemd runner with locks → Ansible → GPU workers. LiteLLM gateway ordering is explained separately.
- Six selectable playbook cards: model install, copy, adopt, profile check, up and down.
- An interactive, step-by-step walkthrough for **each** operation, with previous/next, progress indicators and direct step navigation.
- Safeguards explaining preflight validation, deterministic resource locking, the privilege boundary and gateway-safe ordering, including recovery behavior on LiteLLM registration failure.
- A direct link to the standalone mocked Operations dashboard at `/dashboard/#operations`.

The five durable dashboard operations are distinct from **model adopt**, which is available through the administrative CLI, not through the web UI. All walkthroughs are explanatory and do not execute any real operations.

Source of operational truth: `bassem-ch007/securas-inference`, especially `docs/05-model-lifecycle.md`, `docs/06-profile-lifecycle.md`, `docs/07-operation-engine-and-privilege-boundary.md`, and `docs/08-ansible-automation.md`.

## Master & services page (Section 06)

Open `http://localhost:8000/#/master`.

This section explains the worker-acer control node with a guided, reading-first layout:

- One master-node overview with its real reference photograph.
- Six operational responsibilities: FastAPI/Admin UI, PostgreSQL, operation runner, Ansible controller, status collector, and LiteLLM gateway.
- Two separate private Tailscale paths: admin control (HTTPS 443) and client inference (HTTPS 8443).
- The distinction between desired state (PostgreSQL) and observed state (status collector).
- A direct continuation to `#/ansible` for the playbook lifecycle.

The page is static and uses no live API. Its architecture and service claims are based on the Securas Inference system architecture, control API, database, status-collector, LiteLLM, and Tailscale documentation.

## Benchmarks & outcomes page (Section 10)

Open `http://localhost:8000/#/results`.

This completed page contains two selected sections:

1. **Verified platform achievements** from `securas-inference/docs/reference/current-production-inventory.md`: 3 nodes (1 master + 2 inference workers), 5 RTX 3090 GPUs (120 GiB aggregate physical VRAM), 4 cataloged models and 13 runtime profiles. The master also has an auxiliary RTX 3070, not counted in the 5 inference GPUs.
2. **Illustrative benchmark comparison**, using two real profile configurations:
   - `gpt-oss-20b-lenovo-1gpu-balanced`: 1 RTX 3090, TP 1 / PP 1, configured context 16,384 tokens;
   - `qwen3.8-27b-fp8-aero-2gpu-balanced`: 2 RTX 3090, TP 1 / PP 2, configured context 10,000 tokens.

**All performance numbers are synthetic placeholders; no measured hardware benchmark is claimed.** The example TTFT, output tokens/s, VRAM consumption and concurrency are fabricated for presentation layout. The displayed test conditions are hypothetical, and configured context limits are **not** measured maximum tested contexts. Replace values with repeatable measurements before using them as benchmark evidence. The page explicitly labels simulated values.

There are no dependencies or API requests; this is a static web presentation.

## Models & profiles page (Section 04)

Open `http://localhost:8000/#/models` from the presentation site's sidebar.

This implemented, static page covers:
- Four catalog entries verified from `securas-inference/docs/reference/current-production-inventory.md`: GPT-OSS 20B, Qwen3.6 27B FP8, Qwen3.6 35B A3B FP8, and Qwen3.8 27B FP8.
- A small explanation of Dense, MoE and FP8.
- The distinction between a **model artifact**, a **configured profile**, and a **running vLLM service**.
- An interactive, filterable-by-model table of **all 13 documented profile configurations** with worker, GPU indices, TP/PP, configured max context and max sequence count.
- Qwen3.8 placement examples from the browser E2E validation: worker-aero GPUs 1/2 and worker-lenovo GPUs 0/1, both with TP 1 / PP 2.
- A transition to the vLLM runtime presentation.

The page uses repository-derived inventory examples, not live API results. Configured context and sequence limits are **not** performance measurements or guarantees. Profile definitions can share GPUs or ports and are not all active simultaneously. No external dependencies or login are needed.
